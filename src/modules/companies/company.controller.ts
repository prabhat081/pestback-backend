import type { Request, Response } from "express";

import { asyncHandler } from "../../middlewares/async-handler.js";
import { ApiError } from "../../utils/api-error.js";

import { createCompanySchema } from "./company.schema.js";
import { completeOnboarding, createCompany, getCurrentCompany } from "./company.service.js";

export const createCompanyController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
    }

    const input = createCompanySchema.parse(req.body);

    const company = await createCompany(req.user.id, input);

    return res.status(201).json({
      success: true,
      message: "Company created successfully",
      data: {
        company,
        onboardingCompleted: company.onboardingCompleted,
      },
    });
  },
);

export const getCurrentCompanyController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new ApiError(401, "Authentication required", "UNAUTHORIZED");
    }

    const result = await getCurrentCompany(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Current company fetched successfully",
      data: result,
    });
  },
);

export const completeOnboardingController = asyncHandler(
  async (req: Request, res: Response) => {
    if (!req.user?.id) {
      throw new ApiError(
        401,
        "Authentication required",
        "UNAUTHORIZED",
      );
    }

    const result = await completeOnboarding(req.user.id);

    return res.status(200).json({
      success: true,
      message: "Onboarding completed successfully",
      data: result,
    });
  },
);
