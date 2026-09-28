import type { Request, Response } from "express";

import {
  createTechnicianSchema,
  technicianIdParamSchema,
  technicianListQuerySchema,
  updateTechnicianSchema,
  updateTechnicianServicesSchema,
  updateTechnicianStatusSchema,
} from "./technician.schema.js";

import {
  changeTechnicianStatus,
  createTechnician,
  editTechnician,
  getTechnician,
  listTechnicianServices,
  listTechnicians,
  removeTechnician,
  updateTechnicianServices,
} from "./technician.service.js";

/**
 * ---------------------------------------------------------
 * Company ID helper
 * ---------------------------------------------------------
 *
 * `requireCompany` should attach company information
 * to the request.
 *
 * Adjust this helper only if your existing
 * company middleware uses a different property.
 */
function getCompanyId(req: Request): string {
  const companyId = (
    req as Request & {
      companyId?: string;
      company?: {
        id?: string;
      };
    }
  ).companyId;

  if (companyId) {
    return companyId;
  }

  const company = (
    req as Request & {
      company?: {
        id?: string;
      };
    }
  ).company;

  if (company?.id) {
    return company.id;
  }

  throw new Error(
    "Company context is missing",
  );
}

/**
 * ---------------------------------------------------------
 * GET /technicians
 * ---------------------------------------------------------
 */
export async function getTechnicianList(
  req: Request,
  res: Response,
) {
  const companyId =
    getCompanyId(req);

  const query =
    technicianListQuerySchema.parse(
      req.query,
    );

  const result =
    await listTechnicians(
      companyId,
      query,
    );

  return res.status(200).json({
    success: true,
    data: result.data,
    pagination: result.pagination,
  });
}

/**
 * ---------------------------------------------------------
 * POST /technicians
 * ---------------------------------------------------------
 */
export async function createTechnicianController(
  req: Request,
  res: Response,
) {
  const companyId =
    getCompanyId(req);

  const input =
    createTechnicianSchema.parse(
      req.body,
    );

  const technician =
    await createTechnician(
      companyId,
      input,
    );

  return res.status(201).json({
    success: true,
    message:
      "Technician created successfully",
    data: technician,
  });
}

/**
 * ---------------------------------------------------------
 * GET /technicians/:id
 * ---------------------------------------------------------
 */
export async function getTechnicianController(
  req: Request,
  res: Response,
) {
  const companyId =
    getCompanyId(req);

  const { id } =
    technicianIdParamSchema.parse(
      req.params,
    );

  const technician =
    await getTechnician(
      companyId,
      id,
    );

  return res.status(200).json({
    success: true,
    data: technician,
  });
}

/**
 * ---------------------------------------------------------
 * PATCH /technicians/:id
 * ---------------------------------------------------------
 */
export async function updateTechnicianController(
  req: Request,
  res: Response,
) {
  const companyId =
    getCompanyId(req);

  const { id } =
    technicianIdParamSchema.parse(
      req.params,
    );

  const input =
    updateTechnicianSchema.parse(
      req.body,
    );

  const technician =
    await editTechnician(
      companyId,
      id,
      input,
    );

  return res.status(200).json({
    success: true,
    message:
      "Technician updated successfully",
    data: technician,
  });
}

/**
 * ---------------------------------------------------------
 * PATCH /technicians/:id/status
 * ---------------------------------------------------------
 */
export async function updateTechnicianStatusController(
  req: Request,
  res: Response,
) {
  const companyId =
    getCompanyId(req);

  const { id } =
    technicianIdParamSchema.parse(
      req.params,
    );

  const input =
    updateTechnicianStatusSchema.parse(
      req.body,
    );

  const technician =
    await changeTechnicianStatus(
      companyId,
      id,
      input,
    );

  return res.status(200).json({
    success: true,
    message:
      "Technician status updated successfully",
    data: technician,
  });
}

/**
 * ---------------------------------------------------------
 * DELETE /technicians/:id
 * ---------------------------------------------------------
 */
export async function deleteTechnicianController(
  req: Request,
  res: Response,
) {
  const companyId =
    getCompanyId(req);

  const { id } =
    technicianIdParamSchema.parse(
      req.params,
    );

  await removeTechnician(
    companyId,
    id,
  );

  return res.status(200).json({
    success: true,
    message:
      "Technician deleted successfully",
  });
}

/**
 * ---------------------------------------------------------
 * GET /technicians/:id/services
 * ---------------------------------------------------------
 */
export async function getTechnicianServicesController(
  req: Request,
  res: Response,
) {
  const companyId =
    getCompanyId(req);

  const { id } =
    technicianIdParamSchema.parse(
      req.params,
    );

  const services =
    await listTechnicianServices(
      companyId,
      id,
    );

  return res.status(200).json({
    success: true,
    data: services,
  });
}

/**
 * ---------------------------------------------------------
 * PUT /technicians/:id/services
 * ---------------------------------------------------------
 */
export async function updateTechnicianServicesController(
  req: Request,
  res: Response,
) {
  const companyId =
    getCompanyId(req);

  const { id } =
    technicianIdParamSchema.parse(
      req.params,
    );

  const input =
    updateTechnicianServicesSchema.parse(
      req.body,
    );

  const services =
    await updateTechnicianServices(
      companyId,
      id,
      input,
    );

  return res.status(200).json({
    success: true,
    message:
      "Technician services updated successfully",
    data: services,
  });
}