import { z } from "zod";

import { TECHNICIAN_STATUSES } from "../../database/schema/technicians.js";

/**
 * ---------------------------------------------------------
 * TECHNICIAN ID PARAM
 * ---------------------------------------------------------
 */

export const technicianIdParamSchema = z.object({
  id: z.string().uuid("Invalid technician ID"),
});

/**
 * ---------------------------------------------------------
 * TECHNICIAN LIST QUERY
 * ---------------------------------------------------------
 */

export const technicianListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z
    .string()
    .trim()
    .max(100, "Search cannot exceed 100 characters")
    .optional(),

  status: z
    .enum(["active", "inactive", "on-leave", "all"])
    .optional()
    .default("all"),
});

/**
 * ---------------------------------------------------------
 * CREATE TECHNICIAN
 * ---------------------------------------------------------
 */

export const createTechnicianSchema = z.object({
  companyUserId: z.string().uuid("Invalid company user ID"),

  employeeCode: z
    .string()
    .trim()
    .min(1, "Employee code is required")
    .max(50, "Employee code cannot exceed 50 characters"),

  status: z.enum(TECHNICIAN_STATUSES).default("active"),

  joiningDate: z.string().date("Invalid joining date").optional(),

  notes: z
    .string()
    .trim()
    .max(5000, "Notes cannot exceed 5000 characters")
    .optional(),

  serviceCatalogIds: z
    .array(z.string().uuid("Invalid service catalog ID"))
    .max(100, "Maximum 100 services can be assigned")
    .optional()
    .default([]),
});

/**
 * ---------------------------------------------------------
 * UPDATE TECHNICIAN
 * ---------------------------------------------------------
 */

export const updateTechnicianSchema = z.object({
  employeeCode: z
    .string()
    .trim()
    .min(1, "Employee code is required")
    .max(50, "Employee code cannot exceed 50 characters")
    .optional(),

  status: z.enum(TECHNICIAN_STATUSES).optional(),

  joiningDate: z
    .union([z.string().date("Invalid joining date"), z.null()])
    .optional(),

  notes: z
    .union([
      z.string().trim().max(5000, "Notes cannot exceed 5000 characters"),
      z.null(),
    ])
    .optional(),
});

/**
 * ---------------------------------------------------------
 * UPDATE TECHNICIAN STATUS
 * ---------------------------------------------------------
 */

export const updateTechnicianStatusSchema = z.object({
  status: z.enum(TECHNICIAN_STATUSES),
});

/**
 * ---------------------------------------------------------
 * UPDATE TECHNICIAN SERVICES
 * ---------------------------------------------------------
 */

export const updateTechnicianServicesSchema = z.object({
  serviceCatalogIds: z
    .array(z.string().uuid("Invalid service catalog ID"))
    .max(100, "Maximum 100 services can be assigned"),
});

/**
 * ---------------------------------------------------------
 * INFERRED TYPES
 * ---------------------------------------------------------
 */

export type TechnicianIdParam = z.infer<typeof technicianIdParamSchema>;

export type TechnicianListQueryInput = z.infer<
  typeof technicianListQuerySchema
>;

export type CreateTechnicianInput = z.infer<typeof createTechnicianSchema>;

export type UpdateTechnicianInput = z.infer<typeof updateTechnicianSchema>;

export type UpdateTechnicianStatusInput = z.infer<
  typeof updateTechnicianStatusSchema
>;

export type UpdateTechnicianServicesInput = z.infer<
  typeof updateTechnicianServicesSchema
>;
