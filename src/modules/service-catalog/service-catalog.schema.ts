import { z } from "zod";

const serviceTypeSchema = z.enum([
  "general_pest_control",
  "cockroach_control",
  "termite_control",
  "rodent_control",
  "mosquito_control",
  "bed_bug_control",
  "other",
]);

const frequencySchema = z.enum([
  "one_time",
  "monthly",
  "quarterly",
  "half_yearly",
  "yearly",
]);

export const createServiceCatalogSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Service name is required")
    .max(150, "Service name is too long"),

  slug: z
    .string()
    .trim()
    .min(2, "Slug is required")
    .max(150, "Slug is too long")
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      "Slug must contain lowercase letters, numbers and hyphens only",
    ),

  serviceType: serviceTypeSchema,

  description: z
    .string()
    .trim()
    .max(2000, "Description cannot exceed 2000 characters")
    .optional(),

  defaultPrice: z.coerce
    .number()
    .min(0, "Price cannot be negative")
    .max(999999999, "Price is too large"),

  defaultFrequency: frequencySchema.optional(),

  warrantyDays: z.coerce
    .number()
    .int("Warranty days must be a whole number")
    .min(0, "Warranty days cannot be negative")
    .max(3650, "Warranty days is too large")
    .default(0),
});

export const updateServiceCatalogSchema =
  createServiceCatalogSchema.partial();

export const serviceCatalogQuerySchema = z.object({
  search: z.string().trim().optional(),

  serviceType: serviceTypeSchema
    .or(z.literal("all"))
    .optional(),

  status: z
    .enum(["active", "inactive", "all"])
    .default("active"),

  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20),
});

export const serviceCatalogStatusSchema = z.object({
  isActive: z.boolean(),
});

export type CreateServiceCatalogInput = z.infer<
  typeof createServiceCatalogSchema
>;

export type UpdateServiceCatalogInput = z.infer<
  typeof updateServiceCatalogSchema
>;

export type ServiceCatalogQuery = z.infer<
  typeof serviceCatalogQuerySchema
>;