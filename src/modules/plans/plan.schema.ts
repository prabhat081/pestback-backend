import { z } from "zod";

import {
  PLAN_FEATURE_TYPES,
  PLAN_STATUSES,
} from "../../database/schema/index.js";

/* -------------------------------------------------------------------------- */
/*                                  PLANS                                     */
/* -------------------------------------------------------------------------- */

export const createPlanSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Plan name must be at least 2 characters")
    .max(100, "Plan name must not exceed 100 characters"),

  slug: z
    .string()
    .trim()
    .min(2, "Plan slug must be at least 2 characters")
    .max(100, "Plan slug must not exceed 100 characters")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug can contain lowercase letters, numbers and hyphens only",
    ),

  description: z
    .string()
    .trim()
    .max(5000, "Description must not exceed 5000 characters")
    .nullable()
    .optional(),

  monthlyPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid monthly price"),

  yearlyPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid yearly price"),

  currency: z
    .string()
    .trim()
    .length(3, "Currency must be 3 characters")
    .transform((value) => value.toUpperCase())
    .default("INR"),

  trialDays: z
    .number()
    .int()
    .min(0, "Trial days cannot be negative")
    .default(0),

  status: z.enum(PLAN_STATUSES).default("active"),

  displayOrder: z
    .number()
    .int()
    .min(0, "Display order cannot be negative")
    .default(0),

  isPopular: z.boolean().default(false),

  isPublic: z.boolean().default(true),
});

export type CreatePlanSchema = z.infer<typeof createPlanSchema>;

export const updatePlanSchema = createPlanSchema.partial();

export type UpdatePlanSchema = z.infer<typeof updatePlanSchema>;

export const updatePlanStatusSchema = z.object({
  status: z.enum(PLAN_STATUSES),
});

export type UpdatePlanStatusSchema = z.infer<typeof updatePlanStatusSchema>;

/* -------------------------------------------------------------------------- */
/*                              PLAN QUERY                                    */
/* -------------------------------------------------------------------------- */

export const planQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, "Search must not exceed 100 characters")
    .optional(),

  status: z.union([z.enum(PLAN_STATUSES), z.literal("all")]).default("all"),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PlanQuery = z.infer<typeof planQuerySchema>;

/* -------------------------------------------------------------------------- */
/*                              PLAN PARAMS                                   */
/* -------------------------------------------------------------------------- */

export const planIdSchema = z.object({
  planId: z.string().uuid("Invalid plan ID"),
});

export type PlanIdParams = z.infer<typeof planIdSchema>;

/* -------------------------------------------------------------------------- */
/*                            PLAN FEATURES                                   */
/* -------------------------------------------------------------------------- */

export const createPlanFeatureSchema = z
  .object({
    featureKey: z
      .string()
      .trim()
      .min(2, "Feature key must be at least 2 characters")
      .max(100, "Feature key must not exceed 100 characters")
      .regex(
        /^[a-z0-9_]+$/,
        "Feature key can contain lowercase letters, numbers and underscores only",
      ),

    name: z
      .string()
      .trim()
      .min(2, "Feature name must be at least 2 characters")
      .max(150, "Feature name must not exceed 150 characters"),

    type: z.enum(PLAN_FEATURE_TYPES),

    limit: z
      .number()
      .int()
      .min(0, "Feature limit cannot be negative")
      .nullable()
      .optional(),

    enabled: z.boolean().default(false),

    unit: z
      .string()
      .trim()
      .max(30, "Unit must not exceed 30 characters")
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "limit" && data.limit === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["limit"],
        message: "Limit is required for limit-type features",
      });
    }

    if (
      data.type === "boolean" &&
      data.limit !== undefined &&
      data.limit !== null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["limit"],
        message: "Limit must be empty for boolean-type features",
      });
    }
  });

export type CreatePlanFeatureSchema = z.infer<typeof createPlanFeatureSchema>;

export const updatePlanFeatureSchema = z
  .object({
    featureKey: z
      .string()
      .trim()
      .min(2, "Feature key must be at least 2 characters")
      .max(100, "Feature key must not exceed 100 characters")
      .regex(
        /^[a-z0-9_]+$/,
        "Feature key can contain lowercase letters, numbers and underscores only",
      )
      .optional(),

    name: z
      .string()
      .trim()
      .min(2, "Feature name must be at least 2 characters")
      .max(150, "Feature name must not exceed 150 characters")
      .optional(),

    type: z.enum(PLAN_FEATURE_TYPES).optional(),

    limit: z
      .number()
      .int()
      .min(0, "Feature limit cannot be negative")
      .nullable()
      .optional(),

    enabled: z.boolean().optional(),

    unit: z
      .string()
      .trim()
      .max(30, "Unit must not exceed 30 characters")
      .nullable()
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "limit" && data.limit === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["limit"],
        message: "Limit is required when changing type to limit",
      });
    }

    if (
      data.type === "boolean" &&
      data.limit !== undefined &&
      data.limit !== null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["limit"],
        message: "Limit must be empty for boolean-type features",
      });
    }
  });

export type UpdatePlanFeatureSchema = z.infer<typeof updatePlanFeatureSchema>;

/* -------------------------------------------------------------------------- */
/*                         PLAN FEATURE PARAMS                                */
/* -------------------------------------------------------------------------- */

export const planFeatureIdSchema = z.object({
  featureId: z.string().uuid("Invalid plan feature ID"),
});

export type PlanFeatureIdParams = z.infer<typeof planFeatureIdSchema>;
