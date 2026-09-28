import type { NextFunction, Request, Response } from "express";
import { eq, and } from "drizzle-orm";

import { db } from "../database/index.js";
import { companyUsers } from "../database/schema/company-users.js";
import { companies } from "../database/schema/companies.js";

import { ApiError } from "../utils/api-error.js";

export async function requireCompany(
  req: Request,
  _res: Response,
  next: NextFunction,
) {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new ApiError(401, "UNAUTHORIZED", "Authentication required.");
    }

    const [membership] = await db
      .select({
        companyId: companies.id,
      })
      .from(companyUsers)
      .innerJoin(companies, eq(companyUsers.companyId, companies.id))
      .where(
        and(
          eq(companyUsers.userId, userId),
          eq(companyUsers.isActive, true),
          eq(companies.isActive, true),
        ),
      )
      .limit(1);

    if (!membership) {
      throw new ApiError(403, "COMPANY_REQUIRED", "No active company found.");
    }

    req.company = {
      id: membership.companyId,
    };

    next();
  } catch (error) {
    next(error);
  }
}
