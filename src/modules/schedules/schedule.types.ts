import type { ScheduleStatus } from "../../database/schema/schedules.js";

export type { ScheduleStatus };

export interface ScheduleListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: ScheduleStatus | "all";
  technicianId?: string;
  jobId?: string;
  scheduledDate?: string;
}

export interface CreateScheduleInput {
  jobId: string;
  technicianId: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export interface UpdateScheduleInput {
  scheduledDate?: string;
  startTime?: string;
  endTime?: string;
  notes?: string | null;
}

export interface UpdateScheduleStatusInput {
  status: ScheduleStatus;
}

export interface RescheduleInput {
  scheduledDate: string;
  startTime: string;
  endTime: string;
  notes?: string | null;
}

export interface ReassignTechnicianInput {
  technicianId: string;
}