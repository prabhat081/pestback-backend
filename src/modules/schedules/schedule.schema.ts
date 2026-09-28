import { z } from "zod";

import { SCHEDULE_STATUSES } from "../../database/schema/schedules.js";

export const scheduleIdParamSchema = z.object({
  id: z.string().uuid("Invalid schedule ID"),
});

export const scheduleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),

  limit: z.coerce.number().int().min(1).max(100).default(10),

  search: z
    .string()
    .trim()
    .max(100, "Search cannot exceed 100 characters")
    .optional(),

  status: z
    .enum([
      "scheduled",
      "confirmed",
      "in-progress",
      "completed",
      "cancelled",
      "rescheduled",
      "all",
    ])
    .optional()
    .default("all"),

  technicianId: z.string().uuid("Invalid technician ID").optional(),

  jobId: z.string().uuid("Invalid job ID").optional(),

  scheduledDate: z.string().date("Invalid scheduled date").optional(),
});

export const createScheduleSchema = z
  .object({
    jobId: z.string().uuid("Invalid job ID"),

    technicianId: z.string().uuid("Invalid technician ID"),

    scheduledDate: z.string().date("Invalid scheduled date"),

    startTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Invalid start time. Use HH:mm format",
      ),

    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid end time. Use HH:mm format"),

    notes: z
      .string()
      .trim()
      .max(5000, "Notes cannot exceed 5000 characters")
      .optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const updateScheduleSchema = z
  .object({
    scheduledDate: z.string().date("Invalid scheduled date").optional(),

    startTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Invalid start time. Use HH:mm format",
      )
      .optional(),

    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid end time. Use HH:mm format")
      .optional(),

    notes: z.union([z.string().trim().max(5000), z.null()]).optional(),
  })
  .refine(
    (data) => {
      if (data.startTime !== undefined && data.endTime !== undefined) {
        return data.startTime < data.endTime;
      }

      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    },
  );

export const updateScheduleStatusSchema = z.object({
  status: z.enum(SCHEDULE_STATUSES),
});

export const rescheduleSchema = z
  .object({
    scheduledDate: z.string().date("Invalid scheduled date"),

    startTime: z
      .string()
      .regex(
        /^([01]\d|2[0-3]):[0-5]\d$/,
        "Invalid start time. Use HH:mm format",
      ),

    endTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Invalid end time. Use HH:mm format"),

    notes: z.union([z.string().trim().max(5000), z.null()]).optional(),
  })
  .refine((data) => data.startTime < data.endTime, {
    message: "End time must be after start time",
    path: ["endTime"],
  });

export const reassignTechnicianSchema = z.object({
  technicianId: z.string().uuid("Invalid technician ID"),
});

export type ScheduleIdParam = z.infer<typeof scheduleIdParamSchema>;

export type ScheduleListQueryInput = z.infer<typeof scheduleListQuerySchema>;

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>;

export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>;

export type UpdateScheduleStatusInput = z.infer<
  typeof updateScheduleStatusSchema
>;

export type RescheduleInput = z.infer<typeof rescheduleSchema>;

export type ReassignTechnicianInput = z.infer<typeof reassignTechnicianSchema>;
