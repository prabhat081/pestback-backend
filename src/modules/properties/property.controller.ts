import type { Request, Response } from "express";

import { ApiError } from "../../utils/api-error.js";

import * as propertyService from "./property.service.js";

import {
  createPropertySchema,
  propertyQuerySchema,
  updatePropertySchema,
} from "./property.schema.js";

function getPropertyId(req: Request): string {
  const propertyId = req.params.id;

  if (!propertyId || Array.isArray(propertyId)) {
    throw new ApiError(400, "INVALID_PROPERTY_ID", "Invalid property ID.");
  }

  return propertyId;
}

/**
 * Create Property
 */
export async function createProperty(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const data = createPropertySchema.parse(req.body);

  const property = await propertyService.create(companyId, data);

  return res.status(201).json({
    success: true,
    data: property,
  });
}

/**
 * Get Properties
 */
export async function getProperties(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const query = propertyQuerySchema.parse(req.query);

  const result = await propertyService.list(companyId, query);

  return res.json({
    success: true,
    data: result,
  });
}

/**
 * Get Property
 */
export async function getProperty(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const propertyId = getPropertyId(req);

  const property = await propertyService.getById(companyId, propertyId);

  if (!property) {
    throw new ApiError(404, "PROPERTY_NOT_FOUND", "Property not found.");
  }

  return res.json({
    success: true,
    data: property,
  });
}

/**
 * Update Property
 */
export async function updateProperty(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const propertyId = getPropertyId(req);

  const data = updatePropertySchema.parse(req.body);

  const property = await propertyService.update(companyId, propertyId, data);

  if (!property) {
    throw new ApiError(404, "PROPERTY_NOT_FOUND", "Property not found.");
  }

  return res.json({
    success: true,
    data: property,
  });
}

/**
 * Toggle Property Status
 */
export async function togglePropertyStatus(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const propertyId = getPropertyId(req);

  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "VALIDATION_ERROR", "isActive must be a boolean.");
  }

  const property = await propertyService.toggleStatus(
    companyId,
    propertyId,
    isActive,
  );

  if (!property) {
    throw new ApiError(404, "PROPERTY_NOT_FOUND", "Property not found.");
  }

  return res.json({
    success: true,
    data: property,
  });
}

/**
 * Delete Property
 */
export async function deleteProperty(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const propertyId = getPropertyId(req);

  const property = await propertyService.remove(companyId, propertyId);

  if (!property) {
    throw new ApiError(404, "PROPERTY_NOT_FOUND", "Property not found.");
  }

  return res.json({
    success: true,
    message: "Property deleted successfully.",
  });
}
