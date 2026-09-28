import type { Request, Response } from "express";

import { ApiError } from "../../utils/api-error.js";

import {
  createSchedule,
  changeScheduleStatus,
  editSchedule,
  getSchedule,
  getSchedules,
  removeSchedule,
  reassignScheduleTechnician,
  rescheduleSchedule,
} from "./schedule.service.js";

import {
  createScheduleSchema,
  reassignTechnicianSchema,
  rescheduleSchema,
  scheduleIdParamSchema,
  scheduleListQuerySchema,
  updateScheduleSchema,
  updateScheduleStatusSchema,
} from "./schedule.schema.js";

// ─────────────────────────────────────────────
// Company Helper
// ─────────────────────────────────────────────

function getCompanyId(req: Request): string {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(
      401,
      "Company context not found",
      "COMPANY_CONTEXT_MISSING",
    );
  }

  return companyId;
}

// ─────────────────────────────────────────────
// List Schedules
// ─────────────────────────────────────────────

export async function listSchedulesController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const query = scheduleListQuerySchema.parse(req.query);

  const result = await getSchedules({
    companyId,
    page: query.page,
    limit: query.limit,
    search: query.search,
    status: query.status,
    technicianId: query.technicianId,
    jobId: query.jobId,
    scheduledDate: query.scheduledDate,
  });

  return res.status(200).json({
    success: true,
    message: "Schedules fetched successfully",
    data: result.data,
    pagination: {
      page: query.page,
      limit: query.limit,
      total: result.total,
      totalPages: Math.ceil(
        result.total / query.limit,
      ),
    },
  });
}

// ─────────────────────────────────────────────
// Create Schedule
// ─────────────────────────────────────────────

export async function createScheduleController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const body = createScheduleSchema.parse(req.body);

  const schedule = await createSchedule(
    companyId,
    body,
  );

  return res.status(201).json({
    success: true,
    message: "Schedule created successfully",
    data: schedule,
  });
}

// ─────────────────────────────────────────────
// Get Schedule
// ─────────────────────────────────────────────

export async function getScheduleController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const { id } = scheduleIdParamSchema.parse(
    req.params,
  );

  const schedule = await getSchedule(
    companyId,
    id,
  );

  return res.status(200).json({
    success: true,
    message: "Schedule fetched successfully",
    data: schedule,
  });
}

// ─────────────────────────────────────────────
// Update Schedule
// ─────────────────────────────────────────────

export async function updateScheduleController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const { id } = scheduleIdParamSchema.parse(
    req.params,
  );

  const body = updateScheduleSchema.parse(
    req.body,
  );

  const schedule = await editSchedule(
    companyId,
    id,
    body,
  );

  return res.status(200).json({
    success: true,
    message: "Schedule updated successfully",
    data: schedule,
  });
}

// ─────────────────────────────────────────────
// Update Schedule Status
// ─────────────────────────────────────────────

export async function updateScheduleStatusController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const { id } = scheduleIdParamSchema.parse(
    req.params,
  );

  const { status } =
    updateScheduleStatusSchema.parse(req.body);

  const schedule = await changeScheduleStatus(
    companyId,
    id,
    status,
  );

  return res.status(200).json({
    success: true,
    message: "Schedule status updated successfully",
    data: schedule,
  });
}

// ─────────────────────────────────────────────
// Reschedule
// ─────────────────────────────────────────────

export async function rescheduleScheduleController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const { id } = scheduleIdParamSchema.parse(
    req.params,
  );

  const body = rescheduleSchema.parse(
    req.body,
  );

  const schedule = await rescheduleSchedule(
    companyId,
    id,
    body,
  );

  return res.status(200).json({
    success: true,
    message: "Schedule rescheduled successfully",
    data: schedule,
  });
}

// ─────────────────────────────────────────────
// Reassign Technician
// ─────────────────────────────────────────────

export async function reassignScheduleTechnicianController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const { id } = scheduleIdParamSchema.parse(
    req.params,
  );

  const { technicianId } =
    reassignTechnicianSchema.parse(req.body);

  const schedule =
    await reassignScheduleTechnician(
      companyId,
      id,
      technicianId,
    );

  return res.status(200).json({
    success: true,
    message:
      "Schedule technician reassigned successfully",
    data: schedule,
  });
}

// ─────────────────────────────────────────────
// Delete Schedule
// ─────────────────────────────────────────────

export async function deleteScheduleController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const { id } = scheduleIdParamSchema.parse(
    req.params,
  );

  await removeSchedule(
    companyId,
    id,
  );

  return res.status(200).json({
    success: true,
    message: "Schedule deleted successfully",
  });
}