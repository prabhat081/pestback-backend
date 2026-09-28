import type { Request, Response, NextFunction, RequestHandler } from "express";

import { ApiError } from "../utils/api-error.js";
import { hasPermission } from "../modules/permissions/permission.service.js";

export function requirePermission(permissionName: string): RequestHandler {
  return async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user?.id) {
      return next(new ApiError(401, "Authentication required", "UNAUTHORIZED"));
    }

    const companyId = req.headers["x-company-id"];

    if (typeof companyId !== "string" || !companyId) {
      return next(
        new ApiError(400, "Company ID is required", "COMPANY_ID_REQUIRED"),
      );
    }

    try {
      const allowed = await hasPermission(
        req.user.id,
        companyId,
        permissionName,
      );

      if (!allowed) {
        return next(
          new ApiError(
            403,
            "You do not have permission to perform this action",
            "FORBIDDEN",
          ),
        );
      }

      req.company = {
        id: companyId,
      };

      next();
    } catch (error) {
      next(error);
    }
  };
}
