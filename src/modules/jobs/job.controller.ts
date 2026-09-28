import type { Request, Response } from "express";

import {
  jobIdParamSchema,
  jobListQuerySchema,
  createJobSchema,
  updateJobSchema,
  updateJobStatusSchema,
  assignTechnicianSchema,
  completeJobSchema,
} from "./job.schema.js";

import {
  listJobs,
  getJob,
  createJob,
  editJob,
  changeJobStatus,
  assignJobTechnician,
  completeJob,
  cancelJob,
  removeJob,
} from "./job.service.js";

import { ApiError } from "../../utils/api-error.js";

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

function getCompanyId(req: Request): string {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(
      401,
      "Company context is required",
      "COMPANY_CONTEXT_REQUIRED",
    );
  }

  return companyId;
}

/* -------------------------------------------------------------------------- */
/*                                    LIST                                    */
/* -------------------------------------------------------------------------- */

export async function listJobsController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const query = jobListQuerySchema.parse(req.query);

  const result = await listJobs(companyId, query);

  return res.status(200).json({
    success: true,
    data: result,
  });
}

/* -------------------------------------------------------------------------- */
/*                                   CREATE                                   */
/* -------------------------------------------------------------------------- */

export async function createJobController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const input = createJobSchema.parse(req.body);

  const job = await createJob(companyId, input);

  return res.status(201).json({
    success: true,
    message: "Job created successfully",
    data: job,
  });
}

/* -------------------------------------------------------------------------- */
/*                                  GET ONE                                   */
/* -------------------------------------------------------------------------- */

export async function getJobController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = jobIdParamSchema.parse(req.params);

  const job = await getJob(companyId, id);

  return res.status(200).json({
    success: true,
    data: job,
  });
}

/* -------------------------------------------------------------------------- */
/*                                  UPDATE                                    */
/* -------------------------------------------------------------------------- */

export async function updateJobController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = jobIdParamSchema.parse(req.params);

  const input = updateJobSchema.parse(req.body);

  const job = await editJob(companyId, id, input);

  return res.status(200).json({
    success: true,
    message: "Job updated successfully",
    data: job,
  });
}

/* -------------------------------------------------------------------------- */
/*                              UPDATE STATUS                                 */
/* -------------------------------------------------------------------------- */

export async function updateJobStatusController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = jobIdParamSchema.parse(req.params);

  const input = updateJobStatusSchema.parse(req.body);

  const job = await changeJobStatus(companyId, id, input);

  return res.status(200).json({
    success: true,
    message: "Job status updated successfully",
    data: job,
  });
}

/* -------------------------------------------------------------------------- */
/*                           ASSIGN TECHNICIAN                                */
/* -------------------------------------------------------------------------- */

export async function assignTechnicianController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = jobIdParamSchema.parse(req.params);

  const input = assignTechnicianSchema.parse(req.body);

  const job = await assignJobTechnician(companyId, id, input);

  return res.status(200).json({
    success: true,
    message: input.technicianId
      ? "Technician assigned successfully"
      : "Technician unassigned successfully",
    data: job,
  });
}

/* -------------------------------------------------------------------------- */
/*                                COMPLETE                                    */
/* -------------------------------------------------------------------------- */

export async function completeJobController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = jobIdParamSchema.parse(req.params);

  const input = completeJobSchema.parse(req.body);

  const job = await completeJob(companyId, id, input);

  return res.status(200).json({
    success: true,
    message: "Job completed successfully",
    data: job,
  });
}

/* -------------------------------------------------------------------------- */
/*                                  CANCEL                                    */
/* -------------------------------------------------------------------------- */

export async function cancelJobController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = jobIdParamSchema.parse(req.params);

  const job = await cancelJob(companyId, id);

  return res.status(200).json({
    success: true,
    message: "Job cancelled successfully",
    data: job,
  });
}

/* -------------------------------------------------------------------------- */
/*                                  DELETE                                    */
/* -------------------------------------------------------------------------- */

export async function deleteJobController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = jobIdParamSchema.parse(req.params);

  await removeJob(companyId, id);

  return res.status(204).send();
}
