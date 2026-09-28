import { z } from "zod";

import { JOB_PRIORITIES, JOB_STATUSES } from "../../database/schema/jobs.js";

export const jobIdParamSchema = z.object({
  id: z.string().uuid("Invalid job ID"),
});

export const jobListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z
    .string()
    .trim()
    .max(100, "Search cannot exceed 100 characters")
    .optional(),

  status: z
    .enum([
      "pending",
      "scheduled",
      "in-progress",
      "completed",
      "cancelled",
      "all",
    ])
    .optional()
    .default("all"),

  priority: z
    .enum(["low", "medium", "high", "urgent", "all"])
    .optional()
    .default("all"),

  technicianId: z.string().uuid("Invalid technician ID").optional(),

  customerId: z.string().uuid("Invalid customer ID").optional(),

});

export const createJobSchema = z.object({
  customerId: z.string().uuid("Invalid customer ID"),

  propertyId: z.string().uuid("Invalid property ID"),

  serviceId: z.string().uuid("Invalid service ID"),

  technicianId: z.string().uuid("Invalid technician ID").optional(),

  priority: z.enum(JOB_PRIORITIES).default("medium"),

  notes: z
    .string()
    .trim()
    .max(5000, "Notes cannot exceed 5000 characters")
    .optional(),
});

export const updateJobSchema = z.object({
  priority: z.enum(JOB_PRIORITIES).optional(),

  notes: z.union([z.string().trim().max(5000), z.null()]).optional(),
});

export const updateJobStatusSchema = z.object({
  status: z.enum(JOB_STATUSES),
});

export const assignTechnicianSchema = z.object({
  technicianId: z.string().uuid("Invalid technician ID").nullable(),
});

export const completeJobSchema = z.object({
  completionNotes: z.union([z.string().trim().max(5000), z.null()]).optional(),
});

export type JobIdParam = z.infer<typeof jobIdParamSchema>;

export type JobListQueryInput = z.infer<typeof jobListQuerySchema>;

export type CreateJobInput = z.infer<typeof createJobSchema>;

export type UpdateJobInput = z.infer<typeof updateJobSchema>;

export type UpdateJobStatusInput = z.infer<typeof updateJobStatusSchema>;

export type AssignTechnicianInput = z.infer<typeof assignTechnicianSchema>;

export type CompleteJobInput = z.infer<typeof completeJobSchema>;
