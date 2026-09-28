import { z } from "zod";

export const propertyTypeSchema = z.enum([
  "residential",
  "commercial",
  "industrial",
]);

export const createPropertySchema = z.object({
  customerId: z.string().uuid("Invalid customer ID."),

  name: z
    .string()
    .trim()
    .min(2, "Property name is required.")
    .max(150, "Property name is too long."),

  propertyType: propertyTypeSchema,

  address: z
    .string()
    .trim()
    .min(5, "Address is required.")
    .max(1000, "Address is too long."),

  city: z
    .string()
    .trim()
    .min(2, "City is required.")
    .max(100, "City is too long."),

  state: z.string().trim().max(100, "State is too long.").optional(),

  postalCode: z.string().trim().max(20, "Postal code is too long.").optional(),

  notes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters.")
    .optional(),
});

export const updatePropertySchema = createPropertySchema
  .omit({
    customerId: true,
  })
  .partial();

export const propertyQuerySchema = z.object({
  customerId: z.string().uuid("Invalid customer ID.").optional(),

  search: z.string().trim().max(100).optional(),

  propertyType: propertyTypeSchema.or(z.literal("all")).default("all"),

  status: z.enum(["active", "inactive", "all"]).default("active"),

  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type CreatePropertyInput = z.infer<typeof createPropertySchema>;

export type UpdatePropertyInput = z.infer<typeof updatePropertySchema>;

export type PropertyQuery = z.infer<typeof propertyQuerySchema>;
