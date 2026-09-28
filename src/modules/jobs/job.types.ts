import type { JobPriority, JobStatus } from "../../database/schema/jobs.js";

export type { JobPriority, JobStatus };

export interface JobListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: JobStatus | "all";
  priority?: JobPriority | "all";
  technicianId?: string;
  customerId?: string;
}

export interface CreateJobInput {
  customerId: string;
  propertyId: string;
  serviceId: string;
  technicianId?: string;
  priority?: JobPriority;
  notes?: string;
}

export interface UpdateJobInput {
  priority?: JobPriority;
  notes?: string | null;
}

export interface UpdateJobStatusInput {
  status: JobStatus;
}

export interface AssignTechnicianInput {
  technicianId: string | null;
}

export interface CompleteJobInput {
  completionNotes?: string | null;
}
