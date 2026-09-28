import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";

import {
  cancelSubscriptionController,
  createSubscriptionController,
  getCurrentSubscriptionController,
  getSubscriptionController,
  getSubscriptionsController,
} from "./subscription.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireCompany);

// Subscription listing
router.get("/", getSubscriptionsController);

// Current company subscription
router.get("/current", getCurrentSubscriptionController);

// Create subscription
router.post("/", createSubscriptionController);

// Cancel subscription
router.post("/:subscriptionId/cancel", cancelSubscriptionController);

// Subscription details
router.get("/:subscriptionId", getSubscriptionController);

export default router;
