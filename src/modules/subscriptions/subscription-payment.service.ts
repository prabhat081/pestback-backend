import { ApiError } from "../../utils/api-error.js";

import {
  findSubscriptionPaymentById,
  findSubscriptionPayments,
} from "./subscription-payment.repository.js";

import type { SubscriptionPaymentListQuery } from "./subscription-payment.types.js";

export async function getSubscriptionPayments(
  companyId: string,
  query: SubscriptionPaymentListQuery,
) {
  return findSubscriptionPayments({
    ...query,
    companyId,
  });
}

export async function getSubscriptionPayment(
  companyId: string,
  paymentId: string,
) {
  const payment = await findSubscriptionPaymentById(paymentId);

  if (!payment) {
    throw new ApiError(
      404,
      "Subscription payment not found",
      "SUBSCRIPTION_PAYMENT_NOT_FOUND",
    );
  }

  if (payment.company?.id !== companyId) {
    throw new ApiError(
      403,
      "You do not have access to this payment",
      "SUBSCRIPTION_PAYMENT_ACCESS_DENIED",
    );
  }

  return payment;
}
