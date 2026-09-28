import type { Request, Response } from "express";

import { ApiError } from "../../utils/api-error.js";

import {
  subscriptionPaymentIdSchema,
  subscriptionPaymentQuerySchema,
} from "./subscription-payment.schema.js";

import {
  getSubscriptionPayment,
  getSubscriptionPayments,
} from "./subscription-payment.service.js";

export async function getSubscriptionPaymentsController(
  req: Request,
  res: Response,
) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(
      400,
      "Company context is required",
      "COMPANY_CONTEXT_REQUIRED",
    );
  }

  const query = subscriptionPaymentQuerySchema.parse(req.query);

  const result = await getSubscriptionPayments(companyId, query);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getSubscriptionPaymentController(
  req: Request,
  res: Response,
) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(
      400,
      "Company context is required",
      "COMPANY_CONTEXT_REQUIRED",
    );
  }

  const { paymentId } = subscriptionPaymentIdSchema.parse(req.params);

  const payment = await getSubscriptionPayment(companyId, paymentId);

  res.status(200).json({
    success: true,
    data: payment,
  });
}
