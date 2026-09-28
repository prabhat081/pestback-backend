import type { Request, Response } from "express";

import { ApiError } from "../../utils/api-error.js";

import {
  createServiceCatalogSchema,
  serviceCatalogQuerySchema,
  serviceCatalogStatusSchema,
  updateServiceCatalogSchema,
} from "./service-catalog.schema.js";

import {
  createCatalogService,
  getCatalogServices,
  getCatalogService,
  removeCatalogService,
  toggleCatalogServiceStatus,
  updateCatalogService,
} from "./service-catalog.service.js";

function getCompanyId(req: Request) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(
      401,
      "COMPANY_CONTEXT_REQUIRED",
      "Company context is required.",
    );
  }

  return companyId;
}

function getCatalogId(req: Request) {
  const id = req.params.id;

  if (!id || Array.isArray(id)) {
    throw new ApiError(
      400,
      "INVALID_SERVICE_CATALOG_ID",
      "Invalid service catalog ID.",
    );
  }

  return id;
}

export async function createCatalog(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const data =
    createServiceCatalogSchema.parse(req.body);

  const service = await createCatalogService(
    companyId,
    data,
  );

  res.status(201).json({
    success: true,
    message: "Service catalog item created successfully.",
    data: service,
  });
}

export async function getCatalogList(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const query =
    serviceCatalogQuerySchema.parse(req.query);

  const result = await getCatalogServices(
    companyId,
    query,
  );

  res.status(200).json({
    success: true,
    data: result.items,
    pagination: result.pagination,
  });
}

export async function getCatalog(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);
  const id = getCatalogId(req);

  const service = await getCatalogService(
    companyId,
    id,
  );

  res.status(200).json({
    success: true,
    data: service,
  });
}

export async function updateCatalog(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);
  const id = getCatalogId(req);

  const data =
    updateServiceCatalogSchema.parse(req.body);

  const service = await updateCatalogService(
    companyId,
    id,
    data,
  );

  res.status(200).json({
    success: true,
    message: "Service catalog item updated successfully.",
    data: service,
  });
}

export async function toggleCatalogStatus(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);
  const id = getCatalogId(req);

  const { isActive } =
    serviceCatalogStatusSchema.parse(req.body);

  const service =
    await toggleCatalogServiceStatus(
      companyId,
      id,
      isActive,
    );

  res.status(200).json({
    success: true,
    message: `Service catalog item ${
      isActive ? "activated" : "deactivated"
    } successfully.`,
    data: service,
  });
}

export async function deleteCatalog(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);
  const id = getCatalogId(req);

  await removeCatalogService(
    companyId,
    id,
  );

  res.status(200).json({
    success: true,
    message: "Service catalog item deleted successfully.",
  });
}