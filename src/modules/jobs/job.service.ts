import { ApiError } from "../../utils/api-error.js";

import type { JobStatus } from "../../database/schema/jobs.js";

import { db } from "../../database/client.js";

import type {
  JobListQuery,
  CreateJobInput,
  UpdateJobInput,
  UpdateJobStatusInput,
  AssignTechnicianInput,
  CompleteJobInput,
} from "./job.types.js";

import {
  findCustomer,
  findProperty,
  findService,
  findTechnician,
  findTechnicianServiceCapability,
  findJobByNumber,
  insertJob,
  findJobs,
  findJobById,
  updateJob,
  updateJobStatus,
  assignTechnician,
  completeJobInDb,
  deleteJob,
} from "./job.repository.js";

/* -------------------------------------------------------------------------- */
/*                              JOB NUMBER                                    */
/* -------------------------------------------------------------------------- */

function generateJobNumber(): string {
  const timestamp = Date.now().toString().slice(-8);

  const random = Math.floor(100 + Math.random() * 900);

  return `JOB-${timestamp}-${random}`;
}

/* -------------------------------------------------------------------------- */
/*                              STATUS RULES                                  */
/* -------------------------------------------------------------------------- */

const allowedStatusTransitions: Record<JobStatus, JobStatus[]> = {
  pending: ["pending", "scheduled", "cancelled"],

  scheduled: ["scheduled", "in-progress", "cancelled"],

  "in-progress": ["in-progress", "completed", "cancelled"],

  completed: ["completed"],

  cancelled: ["cancelled"],
};

function validateStatusTransition(
  currentStatus: JobStatus,
  nextStatus: JobStatus,
) {
  const allowed = allowedStatusTransitions[currentStatus];

  if (!allowed.includes(nextStatus)) {
    throw new ApiError(
      409,
      `Cannot change job status from ${currentStatus} to ${nextStatus}`,
      "INVALID_STATUS_TRANSITION",
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                                  LIST                                      */
/* -------------------------------------------------------------------------- */

export async function listJobs(companyId: string, query: JobListQuery) {
  return findJobs(companyId, query);
}

/* -------------------------------------------------------------------------- */
/*                                GET ONE                                     */
/* -------------------------------------------------------------------------- */

export async function getJob(companyId: string, jobId: string) {
  const job = await findJobById(companyId, jobId);

  if (!job) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  return job;
}

/* -------------------------------------------------------------------------- */
/*                                  CREATE                                    */
/* -------------------------------------------------------------------------- */

export async function createJob(companyId: string, input: CreateJobInput) {
  /* ----------------------------- Customer -------------------------------- */

  const customer = await findCustomer(companyId, input.customerId);

  if (!customer) {
    throw new ApiError(404, "Customer not found", "CUSTOMER_NOT_FOUND");
  }

  /* ----------------------------- Property -------------------------------- */

  const property = await findProperty(
    companyId,
    input.customerId,
    input.propertyId,
  );

  if (!property) {
    throw new ApiError(
      404,
      "Property not found for this customer",
      "PROPERTY_NOT_FOUND",
    );
  }

  /* ------------------------------ Service -------------------------------- */

  const service = await findService(
    companyId,
    input.customerId,
    input.propertyId,
    input.serviceId,
  );

  if (!service) {
    throw new ApiError(
      404,
      "Service not found for this customer and property",
      "SERVICE_NOT_FOUND",
    );
  }

  if (!service.isActive) {
    throw new ApiError(
      409,
      "Cannot create a job for an inactive service",
      "SERVICE_INACTIVE",
    );
  }

  /* ---------------------------- Technician ------------------------------- */

  if (input.technicianId) {
    const technician = await findTechnician(companyId, input.technicianId);

    if (!technician) {
      throw new ApiError(404, "Technician not found", "TECHNICIAN_NOT_FOUND");
    }

    if (technician.status !== "active") {
      throw new ApiError(
        409,
        "Only active technicians can be assigned",
        "TECHNICIAN_NOT_ACTIVE",
      );
    }

    const capability = await findTechnicianServiceCapability(
      input.technicianId,
      service.serviceCatalogId,
    );

    if (!capability) {
      throw new ApiError(
        409,
        "Technician is not assigned to this service",
        "TECHNICIAN_SERVICE_NOT_ASSIGNED",
      );
    }
  }

  /* --------------------------- Job Number -------------------------------- */

  let jobNumber = generateJobNumber();

  let existingJob = await findJobByNumber(companyId, jobNumber);

  while (existingJob) {
    jobNumber = generateJobNumber();

    existingJob = await findJobByNumber(companyId, jobNumber);
  }

  /* ------------------------------ Create --------------------------------- */

  const job = await db.transaction(async (tx) => {
    return insertJob(tx, {
      companyId,

      customerId: input.customerId,

      propertyId: input.propertyId,

      serviceId: input.serviceId,

      technicianId: input.technicianId,

      jobNumber,

      status: "pending",


      priority: input.priority ?? "medium",

      notes: input.notes,
    });
  });

  return job;
}

/* -------------------------------------------------------------------------- */
/*                                  UPDATE                                    */
/* -------------------------------------------------------------------------- */

export async function editJob(
  companyId: string,
  jobId: string,
  input: UpdateJobInput,
) {
  const existingJob = await findJobById(companyId, jobId);

  if (!existingJob) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  if (
    existingJob.status === "completed" ||
    existingJob.status === "cancelled"
  ) {
    throw new ApiError(
      409,
      `Cannot edit a ${existingJob.status} job`,
      "JOB_NOT_EDITABLE",
    );
  }

  const job = await updateJob(companyId, jobId, input);

  if (!job) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  return job;
}

/* -------------------------------------------------------------------------- */
/*                              UPDATE STATUS                                 */
/* -------------------------------------------------------------------------- */

export async function changeJobStatus(
  companyId: string,
  jobId: string,
  input: UpdateJobStatusInput,
) {
  const job = await findJobById(companyId, jobId);

  if (!job) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  validateStatusTransition(job.status, input.status);

  const updated = await updateJobStatus(companyId, jobId, input.status);

  if (!updated) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  return updated;
}

/* -------------------------------------------------------------------------- */
/*                           ASSIGN TECHNICIAN                                */
/* -------------------------------------------------------------------------- */

export async function assignJobTechnician(
  companyId: string,
  jobId: string,
  input: AssignTechnicianInput,
) {
  const job = await findJobById(companyId, jobId);

  if (!job) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  if (job.status === "completed" || job.status === "cancelled") {
    throw new ApiError(
      409,
      `Cannot assign technician to a ${job.status} job`,
      "JOB_NOT_ASSIGNABLE",
    );
  }

  /* ------------------------ Remove assignment --------------------------- */

  if (!input.technicianId) {
    return assignTechnician(companyId, jobId, null);
  }

  /* -------------------------- Technician -------------------------------- */

  const technician = await findTechnician(companyId, input.technicianId);

  if (!technician) {
    throw new ApiError(404, "Technician not found", "TECHNICIAN_NOT_FOUND");
  }

  if (technician.status !== "active") {
    throw new ApiError(
      409,
      "Only active technicians can be assigned",
      "TECHNICIAN_NOT_ACTIVE",
    );
  }

  /* ----------------------------- Service -------------------------------- */

  const service = await findService(
    companyId,
    job.customerId,
    job.propertyId,
    job.serviceId,
  );

  if (!service) {
    throw new ApiError(404, "Job service not found", "SERVICE_NOT_FOUND");
  }

  /* ------------------------- Capability --------------------------------- */

  const capability = await findTechnicianServiceCapability(
    input.technicianId,
    service.serviceCatalogId,
  );

  if (!capability) {
    throw new ApiError(
      409,
      "Technician is not assigned to this service",
      "TECHNICIAN_SERVICE_NOT_ASSIGNED",
    );
  }

  return assignTechnician(companyId, jobId, input.technicianId);
}

/* -------------------------------------------------------------------------- */
/*                                COMPLETE                                    */
/* -------------------------------------------------------------------------- */

export async function completeJob(
  companyId: string,
  jobId: string,
  input: CompleteJobInput,
) {
  const job = await findJobById(companyId, jobId);

  if (!job) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  validateStatusTransition(job.status, "completed");

  if (!job.technicianId) {
    throw new ApiError(
      409,
      "A technician must be assigned before completing the job",
      "TECHNICIAN_REQUIRED",
    );
  }

  return completeJobInDb(companyId, jobId, input.completionNotes);
}

/* -------------------------------------------------------------------------- */
/*                                  CANCEL                                    */
/* -------------------------------------------------------------------------- */

export async function cancelJob(companyId: string, jobId: string) {
  const job = await findJobById(companyId, jobId);

  if (!job) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  validateStatusTransition(job.status, "cancelled");

  const updated = await updateJobStatus(companyId, jobId, "cancelled");

  if (!updated) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  return updated;
}

/* -------------------------------------------------------------------------- */
/*                                  DELETE                                    */
/* -------------------------------------------------------------------------- */

export async function removeJob(companyId: string, jobId: string) {
  const job = await findJobById(companyId, jobId);

  if (!job) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  if (job.status === "completed") {
    throw new ApiError(
      409,
      "Completed jobs cannot be deleted",
      "JOB_NOT_DELETABLE",
    );
  }

  const deleted = await deleteJob(companyId, jobId);

  if (!deleted) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  return deleted;
}
