import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";

import type { AccessTokenPayload, RefreshTokenPayload } from "./auth.types.js";

export function generateVerificationToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export function hashVerificationToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function generateAccessToken(userId: string): string {
  return jwt.sign(
    {
      sub: userId,
      type: "access",
    } satisfies AccessTokenPayload,
    env.JWT_ACCESS_SECRET,
    {
      expiresIn: "15m",
    },
  );
}

export function generateRefreshToken(userId: string): string {
  const jti = crypto.randomUUID();

  return jwt.sign(
    {
      sub: userId,
      type: "refresh",
      jti,
    } satisfies RefreshTokenPayload,
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: "30d",
    },
  );
}

export function hashRefreshToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
