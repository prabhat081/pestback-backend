import { z } from "zod";

import {
  BILLING_PLAN_INTERVALS,
  BILLING_PLAN_PROVIDERS,
  BILLING_PLAN_STATUSES,
} from "../../database/schema/index.js";

export const createSubscriptionBillingPlanSchema = z.object({
  planId: z.string().uuid("Invalid plan ID"),

  provider: z.enum(BILLING_PLAN_PROVIDERS).default("razorpay"),

  billingInterval: z.enum(BILLING_PLAN_INTERVALS),
});

export const updateSubscriptionBillingPlanSchema = z.object({
  amount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid decimal number")
    .optional(),

  currency: z
    .string()
    .length(3, "Currency must be 3 characters")
    .toUpperCase()
    .optional(),

  status: z.enum(BILLING_PLAN_STATUSES).optional(),

  isCurrent: z.boolean().optional(),
});

export const subscriptionBillingPlanQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  planId: z.string().uuid("Invalid plan ID").optional(),

  provider: z.enum(BILLING_PLAN_PROVIDERS).optional(),

  billingInterval: z.enum(BILLING_PLAN_INTERVALS).optional(),

  status: z.enum(["all", ...BILLING_PLAN_STATUSES]).default("all"),
});

export const subscriptionBillingPlanIdSchema = z.object({
  billingPlanId: z.string().uuid("Invalid billing plan ID"),
});
