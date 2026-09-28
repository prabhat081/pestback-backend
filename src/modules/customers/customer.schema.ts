import { z } from "zod";

export const createCustomerSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, "First name is required")
    .max(100, "First name is too long"),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name is required")
    .max(100, "Last name is too long"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email")
    .max(255)
    .optional()
    .or(z.literal("")),

  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .max(30, "Phone number is too long"),

  notes: z
    .string()
    .trim()
    .max(1000, "Notes cannot exceed 1000 characters")
    .optional(),
});

export const updateCustomerSchema =
  createCustomerSchema.partial();

export const customerQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100)
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

export type CreateCustomerInput = z.infer<
  typeof createCustomerSchema
>;

export type UpdateCustomerInput = z.infer<
  typeof updateCustomerSchema
>;

export type CustomerQuery = z.infer<
  typeof customerQuerySchema
>;