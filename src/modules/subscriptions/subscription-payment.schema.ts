import { z } from "zod";

import {
  SUBSCRIPTION_PAYMENT_PROVIDERS,
  SUBSCRIPTION_PAYMENT_STATUSES,
} from "../../database/schema/subscription-payments.js";

export const subscriptionPaymentIdSchema = z.object({
  paymentId: z.string().uuid("Invalid payment ID"),
});

export const subscriptionPaymentQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  status: z.enum(["all", ...SUBSCRIPTION_PAYMENT_STATUSES]).default("all"),

  subscriptionId: z.string().uuid("Invalid subscription ID").optional(),
});

/**
 * Public payment creation should NOT accept:
 * - paid/failed/refunded status
 * - Razorpay payment ID
 * - Razorpay order ID
 * - Razorpay subscription ID
 * - paid/refunded timestamps
 *
 * Those values are controlled by Razorpay/webhook flow.
 */
export const createSubscriptionPaymentSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
});

/**
 * Payment records are financial audit records.
 *
 * Public API should not allow changing:
 * - amount
 * - currency
 * - provider IDs
 * - payment timestamps
 */
export const updateSubscriptionPaymentSchema = z.object({}).strict();

export const updateSubscriptionPaymentStatusSchema = z.object({}).strict();

/**
 * Provider validation is kept available for internal
 * service/webhook usage.
 */
export const subscriptionPaymentProviderSchema = z.enum(
  SUBSCRIPTION_PAYMENT_PROVIDERS,
);
