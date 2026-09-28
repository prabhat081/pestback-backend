import { Router } from "express";

import {
  completeOnboardingController,
  createCompanyController,
  getCurrentCompanyController,
} from "./company.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const router = Router();

router.post("/", authenticate, createCompanyController);
router.get("/current", authenticate, getCurrentCompanyController);
router.post("/onboarding/complete", authenticate, completeOnboardingController);
export default router;
