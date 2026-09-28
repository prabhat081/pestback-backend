// src/modules/payments/payment.routes.ts

import { Router } from "express";

import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireCompany } from "../../middlewares/company.middleware.js";
import {
    listPaymentsController,
    createPaymentController,
    getPaymentController,
    updatePaymentController,
    updatePaymentStatusController,
    deletePaymentController,
    listPaymentOrdersController,
    createPaymentOrderController,
    getPaymentOrderController,
    updatePaymentOrderController,
    cancelPaymentOrderController,
    getPublicPaymentOrderController,
    listPaymentAttemptsController,
} from "./payment.controller.js";

import { razorpayWebhookController } from "./payment.webhook.controller.js";
const router = Router();

router.post("/payments/webhooks/razorpay", razorpayWebhookController);

/* -------------------------------------------------------------------------- */
/*                              PAYMENTS                                      */
/* -------------------------------------------------------------------------- */

router.get("/payments", authenticate, requireCompany, listPaymentsController);

router.post("/payments", authenticate, requireCompany, createPaymentController);

router.get("/payments/:id", authenticate, requireCompany, getPaymentController);

router.patch("/payments/:id", authenticate, requireCompany, updatePaymentController);

router.patch("/payments/:id/status", authenticate, requireCompany, updatePaymentStatusController);

router.delete("/payments/:id", authenticate, requireCompany, deletePaymentController);

/* -------------------------------------------------------------------------- */
/*                           PAYMENT ORDERS                                   */
/* -------------------------------------------------------------------------- */

router.get("/payment-orders", authenticate, requireCompany, listPaymentOrdersController);

router.post("/payment-orders", authenticate, requireCompany, createPaymentOrderController);

router.get("/payment-orders/:id", authenticate, requireCompany, getPaymentOrderController);

router.patch("/payment-orders/:id", authenticate, requireCompany, updatePaymentOrderController);

router.post("/payment-orders/:id/cancel", authenticate, requireCompany, cancelPaymentOrderController);

router.get("/payment-orders/:id/attempts", authenticate, requireCompany, listPaymentAttemptsController);

/* -------------------------------------------------------------------------- */
/*                         PUBLIC PAYMENT LINK                                */
/* -------------------------------------------------------------------------- */

router.get("/pay/payment-link/:token", getPublicPaymentOrderController);

export default router;
