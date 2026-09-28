import type { Request, Response } from "express";

import { ApiError } from "../../utils/api-error.js";

import * as serviceService from "./service.service.js";

import {
  createServiceSchema,
  serviceQuerySchema,
  updateServiceSchema,
} from "./service.schema.js";

function getServiceId(req: Request): string {
  const serviceId = req.params.id;

  if (!serviceId || Array.isArray(serviceId)) {
    throw new ApiError(400, "INVALID_SERVICE_ID", "Invalid service ID.");
  }

  return serviceId;
}

/**
 * Create Customer Service
 */
export async function createService(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const data = createServiceSchema.parse(req.body);

  const service = await serviceService.create(companyId, data);

  return res.status(201).json({
    success: true,
    message: "Customer service created successfully.",
    data: service,
  });
}

/**
 * Get Services
 */
export async function getServices(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const query = serviceQuerySchema.parse(req.query);

  const result = await serviceService.list(companyId, query);

  return res.json({
    success: true,
    data: result,
  });
}

/**
 * Get Service
 */
export async function getService(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const serviceId = getServiceId(req);

  const service = await serviceService.getById(companyId, serviceId);

  if (!service) {
    throw new ApiError(404, "SERVICE_NOT_FOUND", "Service not found.");
  }

  return res.json({
    success: true,
    data: service,
  });
}

/**
 * Update Customer Service
 *
 * serviceCatalogId cannot be changed.
 */
export async function updateService(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const serviceId = getServiceId(req);

  const data = updateServiceSchema.parse(req.body);

  const service = await serviceService.update(companyId, serviceId, data);

  if (!service) {
    throw new ApiError(404, "SERVICE_NOT_FOUND", "Service not found.");
  }

  return res.json({
    success: true,
    message: "Customer service updated successfully.",
    data: service,
  });
}

/**
 * Toggle Service Status
 */
export async function toggleServiceStatus(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const serviceId = getServiceId(req);

  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "VALIDATION_ERROR", "isActive must be a boolean.");
  }

  const service = await serviceService.toggleStatus(
    companyId,
    serviceId,
    isActive,
  );

  if (!service) {
    throw new ApiError(404, "SERVICE_NOT_FOUND", "Service not found.");
  }

  return res.json({
    success: true,
    message: `Service ${isActive ? "activated" : "deactivated"} successfully.`,
    data: service,
  });
}

/**
 * Delete Service
 */
export async function deleteService(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const serviceId = getServiceId(req);

  const service = await serviceService.remove(companyId, serviceId);

  if (!service) {
    throw new ApiError(404, "SERVICE_NOT_FOUND", "Service not found.");
  }

  return res.json({
    success: true,
    message: "Service deleted successfully.",
  });
}
