import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env.js";
import { ApiError } from "../utils/api-error.js";
import { ACCESS_TOKEN_COOKIE } from "../modules/auth/auth.cookie.js";

import type { AccessTokenPayload } from "../modules/auth/auth.types.js";

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  // 1. First try HttpOnly cookie
  const cookieToken = req.cookies?.[ACCESS_TOKEN_COOKIE];

  // 2. Bearer token fallback
  // Useful for Postman/API testing
  const authorization = req.headers.authorization;

  const bearerToken = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  // Cookie has priority
  const token = cookieToken ?? bearerToken;

  if (!token) {
    return next(new ApiError(401, "Authentication required", "UNAUTHORIZED"));
  }

  try {
    const payload = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET,
    ) as AccessTokenPayload;

    if (payload.type !== "access" || !payload.sub) {
      throw new Error("Invalid access token");
    }

    req.user = {
      id: payload.sub,
    };

    next();
  } catch {
    next(
      new ApiError(
        401,
        "Invalid or expired access token",
        "INVALID_ACCESS_TOKEN",
      ),
    );
  }
}
