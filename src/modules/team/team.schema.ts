// src/modules/team/team.schema.ts

import { z } from "zod";

export const teamQuerySchema = z.object({
  search: z
    .string()
    .trim()
    .max(100)
    .optional(),

  role: z
    .string()
    .trim()
    .max(100)
    .optional(),

  status: z
    .enum([
      "all",
      "active",
      "inactive",
    ])
    .default("all"),

  page: z.coerce
    .number()
    .int()
    .positive()
    .default(1),

  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(100)
    .default(20),
});

export const inviteMemberSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(255),

  roleId: z.string().uuid(),
});

export const updateMemberRoleSchema = z.object({
  roleId: z.string().uuid(),
});

export const updateMemberStatusSchema = z.object({
  isActive: z.boolean(),
});

export const acceptInvitationSchema = z.object({
  token: z
    .string()
    .trim()
    .min(1, "Invitation token is required"),

  firstName: z
    .string()
    .trim()
    .min(2, "First name is required")
    .max(100),

  lastName: z
    .string()
    .trim()
    .min(2, "Last name is required")
    .max(100),

  phone: z
    .string()
    .trim()
    .max(30)
    .optional(),

  password: z
    .string()
    .min(
      8,
      "Password must be at least 8 characters",
    )
    .max(128),
});