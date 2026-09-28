import { ApiError } from "../../utils/api-error.js";

import type { ScheduleStatus } from "../../database/schema/schedules.js";

import {
  createSchedule as createScheduleRepository,
  deleteSchedule as deleteScheduleRepository,
  findJobById,
  findScheduleById,
  findScheduleConflict,
  findSchedules,
  findTechnicianById,
  findTechnicianServiceCapability,
  reassignScheduleTechnician as reassignScheduleTechnicianRepository,
  updateJobStatus,
  updateSchedule as updateScheduleRepository,
  updateScheduleStatus as updateScheduleStatusRepository,
} from "./schedule.repository.js";

// ─────────────────────────────────────────────
// Status Transitions
// ─────────────────────────────────────────────

const ALLOWED_STATUS_TRANSITIONS: Record<ScheduleStatus, ScheduleStatus[]> = {
  scheduled: ["confirmed", "cancelled", "rescheduled"],

  confirmed: ["in-progress", "cancelled", "rescheduled"],

  "in-progress": ["completed", "cancelled"],

  completed: [],

  cancelled: [],

  rescheduled: ["scheduled"],
};

// ─────────────────────────────────────────────
// Get Schedule
// ─────────────────────────────────────────────

export async function getSchedule(companyId: string, scheduleId: string) {
  const schedule = await findScheduleById(companyId, scheduleId);

  if (!schedule) {
    throw new ApiError(404, "Schedule not found", "SCHEDULE_NOT_FOUND");
  }

  return schedule;
}

// ─────────────────────────────────────────────
// List
// ─────────────────────────────────────────────

export async function getSchedules(params: {
  companyId: string;
  page: number;
  limit: number;
  search?: string;
  status?: ScheduleStatus | "all";
  technicianId?: string;
  jobId?: string;
  scheduledDate?: string;
}) {
  const offset = (params.page - 1) * params.limit;

  return findSchedules({
    companyId: params.companyId,
    offset,
    limit: params.limit,
    search: params.search,
    status: params.status,
    technicianId: params.technicianId,
    jobId: params.jobId,
    scheduledDate: params.scheduledDate,
  });
}

// ─────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────

export async function createSchedule(
  companyId: string,
  data: {
    jobId: string;
    technicianId: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    notes?: string;
  },
) {
  // 1. Find Job
  const job = await findJobById(companyId, data.jobId);

  if (!job) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  // 2. Validate Job status
  if (job.status !== "pending" && job.status !== "scheduled") {
    throw new ApiError(
      409,
      `Job cannot be scheduled when status is ${job.status}`,
      "JOB_NOT_SCHEDULABLE",
    );
  }

  // 3. Find Technician
  const technician = await findTechnicianById(companyId, data.technicianId);

  if (!technician) {
    throw new ApiError(404, "Technician not found", "TECHNICIAN_NOT_FOUND");
  }

  // 4. Technician must be active
  if (technician.status !== "active") {
    throw new ApiError(
      409,
      "Technician is not active",
      "TECHNICIAN_NOT_ACTIVE",
    );
  }

  // 5. Check schedule conflict
  const conflict = await findScheduleConflict(
    companyId,
    data.technicianId,
    data.scheduledDate,
    data.startTime,
    data.endTime,
  );

  if (conflict) {
    throw new ApiError(
      409,
      "Technician already has a schedule during this time",
      "TECHNICIAN_SCHEDULE_CONFLICT",
    );
  }

  // 6. Create Schedule
  const schedule = await createScheduleRepository(companyId, data);

  if (!schedule) {
    throw new ApiError(
      500,
      "Failed to create schedule",
      "SCHEDULE_CREATE_FAILED",
    );
  }

  // 7. Pending Job → Scheduled
  if (job.status === "pending") {
    await updateJobStatus(companyId, data.jobId, "scheduled");
  }

  return schedule;
}
// ─────────────────────────────────────────────
// Update
// ─────────────────────────────────────────────

export async function editSchedule(
  companyId: string,
  scheduleId: string,
  data: {
    scheduledDate?: string;
    startTime?: string;
    endTime?: string;
    notes?: string | null;
  },
) {
  const schedule = await findScheduleById(companyId, scheduleId);

  if (!schedule) {
    throw new ApiError(404, "Schedule not found", "SCHEDULE_NOT_FOUND");
  }

  if (
    schedule.status === "completed" ||
    schedule.status === "cancelled" ||
    schedule.status === "rescheduled"
  ) {
    throw new ApiError(
      409,
      "This schedule cannot be edited",
      "SCHEDULE_NOT_EDITABLE",
    );
  }

  const scheduledDate = data.scheduledDate ?? schedule.scheduledDate;

  const startTime = data.startTime ?? schedule.startTime;

  const endTime = data.endTime ?? schedule.endTime;

  const conflict = await findScheduleConflict(
    companyId,
    schedule.technicianId,
    scheduledDate,
    startTime,
    endTime,
    schedule.id,
  );

  if (conflict) {
    throw new ApiError(
      409,
      "Technician already has a schedule during this time",
      "TECHNICIAN_SCHEDULE_CONFLICT",
    );
  }

  const updated = await updateScheduleRepository(companyId, scheduleId, data);

  return getSchedule(companyId, updated!.id);
}

// ─────────────────────────────────────────────
// Change Status
// ─────────────────────────────────────────────

export async function changeScheduleStatus(
  companyId: string,
  scheduleId: string,
  status: ScheduleStatus,
) {
  const schedule = await findScheduleById(companyId, scheduleId);

  if (!schedule) {
    throw new ApiError(404, "Schedule not found", "SCHEDULE_NOT_FOUND");
  }

  const allowed = ALLOWED_STATUS_TRANSITIONS[schedule.status];

  if (!allowed?.includes(status)) {
    throw new ApiError(
      409,
      `Cannot change schedule status from "${schedule.status}" to "${status}"`,
      "INVALID_STATUS_TRANSITION",
    );
  }

  const updated = await updateScheduleStatusRepository(
    companyId,
    scheduleId,
    status,
  );

  if (!updated) {
    throw new ApiError(404, "Schedule not found", "SCHEDULE_NOT_FOUND");
  }

  return getSchedule(companyId, scheduleId);
}

// ─────────────────────────────────────────────
// Reassign Technician
// ─────────────────────────────────────────────

export async function reassignScheduleTechnician(
  companyId: string,
  scheduleId: string,
  technicianId: string,
) {
  const schedule = await findScheduleById(companyId, scheduleId);

  if (!schedule) {
    throw new ApiError(404, "Schedule not found", "SCHEDULE_NOT_FOUND");
  }

  if (
    schedule.status === "in-progress" ||
    schedule.status === "completed" ||
    schedule.status === "cancelled" ||
    schedule.status === "rescheduled"
  ) {
    throw new ApiError(
      409,
      "Technician cannot be reassigned for this schedule",
      "SCHEDULE_NOT_REASSIGNABLE",
    );
  }

  const technician = await findTechnicianById(companyId, technicianId);

  if (!technician) {
    throw new ApiError(404, "Technician not found", "TECHNICIAN_NOT_FOUND");
  }

  if (technician.status !== "active") {
    throw new ApiError(
      409,
      "Technician is not active",
      "TECHNICIAN_NOT_ACTIVE",
    );
  }

  const serviceCatalogId = schedule.job?.service?.serviceCatalogId;

  if (serviceCatalogId) {
    const capability = await findTechnicianServiceCapability(
      technicianId,
      serviceCatalogId,
    );

    if (!capability) {
      throw new ApiError(
        409,
        "Technician is not assigned to this service",
        "TECHNICIAN_SERVICE_NOT_ASSIGNED",
      );
    }
  }

  const conflict = await findScheduleConflict(
    companyId,
    technicianId,
    schedule.scheduledDate,
    schedule.startTime,
    schedule.endTime,
    schedule.id,
  );

  if (conflict) {
    throw new ApiError(
      409,
      "Technician already has a schedule during this time",
      "TECHNICIAN_SCHEDULE_CONFLICT",
    );
  }

  const updated = await reassignScheduleTechnicianRepository(
    companyId,
    scheduleId,
    technicianId,
  );

  if (!updated) {
    throw new ApiError(404, "Schedule not found", "SCHEDULE_NOT_FOUND");
  }

  return getSchedule(companyId, scheduleId);
}

// ─────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────

export async function removeSchedule(companyId: string, scheduleId: string) {
  const schedule = await findScheduleById(companyId, scheduleId);

  if (!schedule) {
    throw new ApiError(404, "Schedule not found", "SCHEDULE_NOT_FOUND");
  }

  if (
    schedule.status === "in-progress" ||
    schedule.status === "completed" ||
    schedule.status === "cancelled" ||
    schedule.status === "rescheduled"
  ) {
    throw new ApiError(
      409,
      "This schedule cannot be deleted",
      "SCHEDULE_NOT_DELETABLE",
    );
  }

  return deleteScheduleRepository(companyId, scheduleId);
}

// ─────────────────────────────────────────────
// Reschedule Schedule
// ─────────────────────────────────────────────

export async function rescheduleSchedule(
  companyId: string,
  scheduleId: string,
  data: {
    scheduledDate: string;
    startTime: string;
    endTime: string;
    notes?: string | null;
  },
) {
  const schedule = await findScheduleById(companyId, scheduleId);

  if (!schedule) {
    throw new ApiError(404, "Schedule not found", "SCHEDULE_NOT_FOUND");
  }

  // Completed / cancelled schedule ko reschedule nahi kar sakte
  if (schedule.status === "completed" || schedule.status === "cancelled") {
    throw new ApiError(
      409,
      "This schedule cannot be rescheduled",
      "SCHEDULE_NOT_RESCHEDULABLE",
    );
  }

  // Check technician availability
  const conflict = await findScheduleConflict(
    companyId,
    schedule.technicianId,
    data.scheduledDate,
    data.startTime,
    data.endTime,
    schedule.id,
  );

  if (conflict) {
    throw new ApiError(
      409,
      "Technician already has a schedule during this time",
      "TECHNICIAN_SCHEDULE_CONFLICT",
    );
  }

  // Existing schedule ko rescheduled mark karo
  await updateScheduleStatusRepository(companyId, schedule.id, "rescheduled");

  // New schedule create karo
  const newSchedule = await createScheduleRepository(companyId, {
    jobId: schedule.jobId,
    technicianId: schedule.technicianId,
    scheduledDate: data.scheduledDate,
    startTime: data.startTime,
    endTime: data.endTime,
    notes:
      data.notes !== undefined
        ? (data.notes ?? undefined)
        : (schedule.notes ?? undefined),
  });

  if (!newSchedule) {
    throw new ApiError(
      500,
      "Failed to create rescheduled schedule",
      "RESCHEDULE_FAILED",
    );
  }

  // Fresh nested response return karo
  return getSchedule(companyId, newSchedule.id);
}
