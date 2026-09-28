import type { Request, Response } from "express";

import { asyncHandler } from "../../middlewares/async-handler.js";
import { ApiError } from "../../utils/api-error.js";

import {
  loginSchema,
  registerSchema,
  resendVerificationSchema,
} from "./auth.schema.js";
import {
  registerUser,
  verifyEmail,
  resendVerificationEmail,
  loginUser,
  refreshUserToken,
  logoutUser,
  getCurrentUser,
  getAuthUserContext,
} from "./auth.service.js";

import {
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from "./auth.cookie.js";

export const register = asyncHandler(async (req: Request, res: Response) => {
  const input = registerSchema.parse(req.body);

  const result = await registerUser(input);

  return res.status(201).json({
    success: true,
    message:
      "Registration successful. Please check your email to verify your account.",
    data: {
      expiresIn: result.expiresIn,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const input = loginSchema.parse(req.body);

  const result = await loginUser(input, {
    userAgent: req.get("user-agent"),
    ipAddress: req.ip,
  });

  setAuthCookies(
    res,
    result.accessToken,
    result.refreshToken,
  );

  return res.status(200).json({
    success: true,
    message: "Login successful",
    data: {
      user: result.user,
      company: result.company,
      role: result.role,
    },
  });
});
export const verifyEmailController = asyncHandler(
  async (req: Request, res: Response) => {
    const token = String(req.body.token ?? "").trim();
    if (!token) {
      throw new ApiError(
        400,
        "Verification token is required",
        "VERIFICATION_TOKEN_REQUIRED",
      );
    }

    const user = await verifyEmail(token);

    return res.status(200).json({
      success: true,
      message: "Email verified successfully",
      data: {
        user,
        onboardingRequired: true,
      },
    });
  },
);

export const resendVerification = asyncHandler(
  async (req: Request, res: Response) => {
    const input = resendVerificationSchema.parse(req.body);

    const result = await resendVerificationEmail(input.email);

    return res.status(200).json({
      success: true,
      message: "A new verification email has been sent.",
      data: {
        expiresIn: result.expiresIn,
      },
    });
  },
);

export const refresh = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    throw new ApiError(
      401,
      "Refresh token is required",
      "REFRESH_TOKEN_REQUIRED",
    );
  }

  const result = await refreshUserToken(refreshToken);

  setAuthCookies(res, result.accessToken, result.refreshToken);

  return res.status(200).json({
    success: true,
    message: "Token refreshed successfully",
    data: {},
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (refreshToken) {
    await logoutUser(refreshToken);
  }

  clearAuthCookies(res);

  return res.status(200).json({
    success: true,
    message: "Logout successful",
  });
});

export const me = asyncHandler(async (req, res) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(
      401,
      "Authentication required",
      "UNAUTHORIZED",
    );
  }

  const result = await getAuthUserContext(userId);

  return res.status(200).json({
    success: true,
    message: "User fetched successfully",
    data: result,
  });
});