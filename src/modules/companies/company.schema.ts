import { z } from "zod";

export const createCompanySchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Business name must be at least 2 characters")
    .max(150, "Business name cannot exceed 150 characters"),

  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid business email")
    .max(255)
    .optional(),

  phone: z
    .string()
    .trim()
    .max(30, "Phone number cannot exceed 30 characters")
    .optional(),

  website: z.string().trim().url("Invalid website URL").max(255).optional(),

  address: z.string().trim().max(1000).optional(),

  city: z.string().trim().max(100).optional(),

  state: z.string().trim().max(100).optional(),

  country: z.string().trim().max(100).default("India"),

  timezone: z.string().trim().max(100).default("Asia/Kolkata"),

  currency: z.string().trim().max(10).default("INR"),
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
