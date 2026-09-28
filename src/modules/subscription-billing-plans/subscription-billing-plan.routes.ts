import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";

import {
  createSubscriptionBillingPlanController,
  deleteSubscriptionBillingPlanController,
  getSubscriptionBillingPlanController,
  getSubscriptionBillingPlansController,
  updateSubscriptionBillingPlanController,
  verifyRazorpayBillingPlanController,
} from "./subscription-billing-plan.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get("/", getSubscriptionBillingPlansController);

router.get("/:billingPlanId", getSubscriptionBillingPlanController);

router.get("/:billingPlanId/verify", verifyRazorpayBillingPlanController);

router.post("/", createSubscriptionBillingPlanController);

router.patch("/:billingPlanId", updateSubscriptionBillingPlanController);

router.delete("/:billingPlanId", deleteSubscriptionBillingPlanController);

export default router;
