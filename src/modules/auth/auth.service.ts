import argon2 from "argon2";
import { and, eq, isNull } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";

import { db } from "../../database/index.js";
import { users } from "../../database/schema/users.js";
import { ApiError } from "../../utils/api-error.js";
import { refreshTokens } from "../../database/schema/refresh-tokens.js";
import type { RefreshTokenPayload } from "./auth.types.js";

import {
  emailQueue,
  queueVerificationEmail,
} from "../../queues/email.queue.js";

import {
  generateAccessToken,
  generateRefreshToken,
  hashRefreshToken,
  generateVerificationToken,
  hashVerificationToken,
} from "./auth.utils.js";

import {
  getPendingRegistrationTokenHash,
  getPendingRegistration,
  deletePendingRegistration,
  savePendingRegistration,
} from "./auth.redis.js";

import {
  canResendVerification,
  markVerificationResend,
} from "./auth.rate-limit.js";

import type { RegisterInput, LoginInput } from "./auth.schema.js";
import { getCurrentCompany } from "../companies/company.service.js";

export async function registerUser(input: RegisterInput) {
  const email = input.email.trim().toLowerCase();

  /**
   * Check if user already exists
   */
  const existingUser = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser.length > 0) {
    throw new ApiError(
      409,
      "Email is already registered",
      "EMAIL_ALREADY_EXISTS",
    );
  }

  /**
   * Hash password using Argon2id
   */
  const passwordHash = await argon2.hash(input.password, {
    type: argon2.argon2id,
  });

  /**
   * Generate secure verification token
   */
  const verificationToken = generateVerificationToken();

  /**
   * Store only token hash in Redis
   */
  const tokenHash = hashVerificationToken(verificationToken);

  /**
   * Store temporary registration data
   *
   * Password is already hashed.
   * Raw password is NEVER stored in Redis.
   */
  await savePendingRegistration(tokenHash, {
    firstName: input.firstName,
    lastName: input.lastName,
    email,
    phone: input.phone,
    passwordHash,
  });

  await emailQueue.add("verification-email", {
    type: "verification",
    email,
    firstName: input.firstName,
    verificationToken,
  });

  return {
    expiresIn: 30 * 60,
  };
}

export async function loginUser(
  input: LoginInput,
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
  },
) {
  const email = input.email.trim().toLowerCase();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    throw new ApiError(
      401,
      "Invalid email or password",
      "INVALID_CREDENTIALS",
    );
  }

  if (!user.isActive) {
    throw new ApiError(
      403,
      "Your account is inactive",
      "ACCOUNT_INACTIVE",
    );
  }

  if (!user.isEmailVerified) {
    throw new ApiError(
      403,
      "Please verify your email first",
      "EMAIL_NOT_VERIFIED",
    );
  }

  const passwordValid = await argon2.verify(
    user.passwordHash,
    input.password,
  );

  if (!passwordValid) {
    throw new ApiError(
      401,
      "Invalid email or password",
      "INVALID_CREDENTIALS",
    );
  }

  const accessToken = generateAccessToken(user.id);

  const refreshToken = generateRefreshToken(user.id);

  const refreshTokenHash =
    hashRefreshToken(refreshToken);

  await db.insert(refreshTokens).values({
    userId: user.id,
    tokenHash: refreshTokenHash,
    expiresAt: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    ),
    userAgent: metadata?.userAgent,
    ipAddress: metadata?.ipAddress,
  });

  await db
    .update(users)
    .set({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(users.id, user.id));

  // Get user's current company and role
  const companyContext =
    await getCurrentCompany(user.id);

  return {
    accessToken,
    refreshToken,

    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },

    company: companyContext?.company ?? null,
    role: companyContext?.role ?? null,
  };
}

export async function verifyEmail(verificationToken: string) {
  /**
   * Hash token received from client
   */
  const tokenHash = hashVerificationToken(verificationToken);

  /**
   * Get temporary registration from Redis
   */
  const registration = await getPendingRegistration(tokenHash);

  if (!registration) {
    throw new ApiError(
      400,
      "Verification link is invalid or expired",
      "INVALID_VERIFICATION_TOKEN",
    );
  }

  /**
   * Extra protection:
   * Check whether this email was already registered.
   */
  const existingUser = await db
    .select({
      id: users.id,
    })
    .from(users)
    .where(eq(users.email, registration.email))
    .limit(1);

  if (existingUser.length > 0) {
    await deletePendingRegistration(tokenHash);

    throw new ApiError(
      409,
      "Email is already registered",
      "EMAIL_ALREADY_EXISTS",
    );
  }

  /**
   * Create verified user
   */
  const [user] = await db
    .insert(users)
    .values({
      firstName: registration.firstName,
      lastName: registration.lastName,
      email: registration.email,
      phone: registration.phone,
      passwordHash: registration.passwordHash,
      isEmailVerified: true,
      isActive: true,
    })
    .returning({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
    });

  if (!user) {
    throw new ApiError(500, "Unable to create user", "USER_CREATION_FAILED");
  }

  /**
   * Registration completed.
   * Remove temporary Redis data.
   */
  await deletePendingRegistration(tokenHash);

  return user;
}

export async function resendVerificationEmail(email: string) {
  const normalizedEmail = email.trim().toLowerCase();

  /**
   * Check if email is already verified
   */
  const existingUser = await db
    .select({
      id: users.id,
      isEmailVerified: users.isEmailVerified,
    })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);

  if (existingUser.length > 0) {
    throw new ApiError(
      409,
      "Email is already registered",
      "EMAIL_ALREADY_EXISTS",
    );
  }

  /**
   * Rate limit
   */
  const allowed = await canResendVerification(normalizedEmail);

  if (!allowed) {
    throw new ApiError(
      429,
      "Please wait before requesting another verification email",
      "VERIFICATION_RESEND_COOLDOWN",
    );
  }

  /**
   * Find pending registration
   */
  const oldTokenHash = await getPendingRegistrationTokenHash(normalizedEmail);

  if (!oldTokenHash) {
    throw new ApiError(
      404,
      "No pending registration found for this email",
      "PENDING_REGISTRATION_NOT_FOUND",
    );
  }

  const registration = await getPendingRegistration(oldTokenHash);

  if (!registration) {
    throw new ApiError(
      404,
      "Registration has expired. Please register again.",
      "REGISTRATION_EXPIRED",
    );
  }

  /**
   * Remove old token
   */
  await deletePendingRegistration(oldTokenHash, normalizedEmail);

  /**
   * Generate new token
   */
  const verificationToken = generateVerificationToken();

  const tokenHash = hashVerificationToken(verificationToken);

  /**
   * Save new registration token
   */
  await savePendingRegistration(tokenHash, registration);

  /**
   * Apply cooldown
   */
  await markVerificationResend(normalizedEmail);

  /**
   * Queue email
   */
  await queueVerificationEmail({
    email: normalizedEmail,
    firstName: registration.firstName,
    verificationToken,
  });

  return {
    expiresIn: 30 * 60,
  };
}

export async function refreshUserToken(refreshToken: string) {
  let payload: RefreshTokenPayload;

  try {
    payload = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET,
    ) as RefreshTokenPayload;
  } catch {
    throw new ApiError(
      401,
      "Invalid or expired refresh token",
      "INVALID_REFRESH_TOKEN",
    );
  }

  if (payload.type !== "refresh" || !payload.sub) {
    throw new ApiError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }

  const tokenHash = hashRefreshToken(refreshToken);

  const storedToken = await db
    .select({
      id: refreshTokens.id,
      userId: refreshTokens.userId,
      expiresAt: refreshTokens.expiresAt,
      revokedAt: refreshTokens.revokedAt,
    })
    .from(refreshTokens)
    .where(eq(refreshTokens.tokenHash, tokenHash))
    .limit(1);

  const stored = storedToken[0];

  if (!stored) {
    throw new ApiError(401, "Refresh token not found", "INVALID_REFRESH_TOKEN");
  }

  // Token was already used/revoked
  if (stored.revokedAt) {
    throw new ApiError(
      401,
      "Refresh token has been revoked",
      "REFRESH_TOKEN_REVOKED",
    );
  }

  // Database expiry check
  if (stored.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(
      401,
      "Refresh token has expired",
      "REFRESH_TOKEN_EXPIRED",
    );
  }

  // Make sure JWT user and DB token belong together
  if (stored.userId !== payload.sub) {
    throw new ApiError(401, "Invalid refresh token", "INVALID_REFRESH_TOKEN");
  }

  const userResult = await db
    .select({
      id: users.id,
      email: users.email,
      firstName: users.firstName,
      lastName: users.lastName,
      isActive: users.isActive,
      isEmailVerified: users.isEmailVerified,
    })
    .from(users)
    .where(eq(users.id, stored.userId))
    .limit(1);

  const user = userResult[0];

  if (!user || !user.isActive || !user.isEmailVerified) {
    throw new ApiError(
      401,
      "User account is not available",
      "USER_NOT_AVAILABLE",
    );
  }

  // Generate new token pair
  const newAccessToken = generateAccessToken(user.id);
  const newRefreshToken = generateRefreshToken(user.id);

  const newRefreshTokenHash = hashRefreshToken(newRefreshToken);

  // Rotation:
  // old refresh token -> revoked
  // new refresh token -> stored
  await db.transaction(async (tx) => {
    await tx
      .update(refreshTokens)
      .set({
        revokedAt: new Date(),
      })
      .where(eq(refreshTokens.id, stored.id));

    await tx.insert(refreshTokens).values({
      userId: user.id,
      tokenHash: newRefreshTokenHash,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
  });

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

export async function logoutUser(refreshToken: string) {
  const tokenHash = hashRefreshToken(refreshToken);

  await db
    .update(refreshTokens)
    .set({
      revokedAt: new Date(),
    })
    .where(
      and(
        eq(refreshTokens.tokenHash, tokenHash),
        isNull(refreshTokens.revokedAt),
      ),
    );
}

export async function getCurrentUser(userId: string) {
  const [user] = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      isEmailVerified: users.isEmailVerified,
      isActive: users.isActive,
      createdAt: users.createdAt,
      updatedAt: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) {
    throw new ApiError(404, "User not found", "USER_NOT_FOUND");
  }

  return user;
}

export async function getAuthUserContext(userId: string) {
  const user = await getCurrentUser(userId);

  const companyContext = await getCurrentCompany(userId);

  return {
    user,
    company: companyContext?.company ?? null,
    role: companyContext?.role ?? null,
  };
}