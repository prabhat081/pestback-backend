import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";

import {
  getSubscriptionPaymentController,
  getSubscriptionPaymentsController,
} from "./subscription-payment.controller.js";

const router = Router();

router.use(authenticate);
router.use(requireCompany);

router.get("/", getSubscriptionPaymentsController);

router.get("/:paymentId", getSubscriptionPaymentController);

export default router;
