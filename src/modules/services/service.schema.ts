import { z } from "zod";

export const serviceTypeSchema = z.enum([
  "general_pest_control",
  "cockroach_control",
  "termite_control",
  "rodent_control",
  "mosquito_control",
  "bed_bug_control",
  "other",
]);

export const frequencySchema = z.enum([
  "one_time",
  "monthly",
  "quarterly",
  "half_yearly",
  "yearly",
]);

export const createServiceSchema = z.object({
  serviceCatalogId: z
    .string()
    .uuid("Invalid service catalog ID."),

  customerId: z
    .string()
    .uuid("Invalid customer ID."),

  propertyId: z
    .string()
    .uuid("Invalid property ID."),

  description: z
    .string()
    .trim()
    .max(2000, "Description is too long.")
    .optional(),

  price: z.coerce
    .number()
    .positive("Price must be greater than 0.")
    .max(999999999, "Price is too large."),

  frequency: frequencySchema.optional(),

  startDate: z.coerce.date(),

  endDate: z.coerce.date().optional(),
});

export const updateServiceSchema = z.object({
  description: z
    .string()
    .trim()
    .max(2000, "Description is too long.")
    .optional(),

  price: z.coerce
    .number()
    .positive("Price must be greater than 0.")
    .max(999999999, "Price is too large.")
    .optional(),

  frequency: frequencySchema.optional(),

  startDate: z.coerce.date().optional(),

  endDate: z.coerce.date().optional(),
});

export const serviceQuerySchema = z.object({
  customerId: z
    .string()
    .uuid("Invalid customer ID.")
    .optional(),

  propertyId: z
    .string()
    .uuid("Invalid property ID.")
    .optional(),

  serviceType: serviceTypeSchema
    .or(z.literal("all"))
    .default("all"),

  frequency: frequencySchema
    .or(z.literal("all"))
    .default("all"),

  status: z
    .enum(["active", "inactive", "all"])
    .default("active"),

  search: z
    .string()
    .trim()
    .max(100)
    .optional(),

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

export type CreateServiceInput =
  z.infer<typeof createServiceSchema>;

export type UpdateServiceInput =
  z.infer<typeof updateServiceSchema>;

export type ServiceQuery =
  z.infer<typeof serviceQuerySchema>;