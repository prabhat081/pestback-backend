import { z } from "zod";

import {
  SUBSCRIPTION_BILLING_INTERVALS,
  SUBSCRIPTION_STATUSES,
} from "../../database/schema/subscriptions.js";

export const subscriptionIdSchema = z.object({
  subscriptionId: z.string().uuid("Invalid subscription ID"),
});

export const createSubscriptionSchema = z.object({
  planId: z.string().uuid("Invalid plan ID"),

  billingInterval: z.enum(SUBSCRIPTION_BILLING_INTERVALS),
});

export const updateSubscriptionSchema = z
  .object({
    planId: z.string().uuid("Invalid plan ID").optional(),

    billingInterval: z.enum(SUBSCRIPTION_BILLING_INTERVALS).optional(),

    cancelAtPeriodEnd: z.boolean().optional(),

    cancelledAt: z.string().datetime().nullable().optional(),

    endedAt: z.string().datetime().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const updateSubscriptionStatusSchema = z.object({
  status: z.enum(SUBSCRIPTION_STATUSES),
});

export const cancelSubscriptionSchema = z.object({
  cancelAtPeriodEnd: z.boolean().default(true),
});

export const subscriptionListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),

  status: z.enum(["all", ...SUBSCRIPTION_STATUSES]).default("all"),

  companyId: z.string().uuid("Invalid company ID").optional(),

  planId: z.string().uuid("Invalid plan ID").optional(),
});
