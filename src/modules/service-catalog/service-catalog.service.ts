import { ApiError } from "../../utils/api-error.js";

import {
  createServiceCatalog,
  deleteServiceCatalog,
  findServiceCatalog,
  findServiceCatalogById,
  findServiceCatalogBySlug,
  updateServiceCatalog,
  updateServiceCatalogStatus,
} from "./service-catalog.repository.js";

import type {
  CreateServiceCatalogInput,
  ServiceCatalogQuery,
  UpdateServiceCatalogInput,
} from "./service-catalog.schema.js";

export async function createCatalogService(
  companyId: string,
  data: CreateServiceCatalogInput,
) {
  const existing = await findServiceCatalogBySlug(
    companyId,
    data.slug,
  );

  if (existing) {
    throw new ApiError(
      409,
      "SERVICE_CATALOG_SLUG_EXISTS",
      "A service with this slug already exists.",
    );
  }

  return createServiceCatalog(companyId, data);
}

export async function getCatalogServices(
  companyId: string,
  query: ServiceCatalogQuery,
) {
  return findServiceCatalog(companyId, query);
}

export async function getCatalogService(
  companyId: string,
  id: string,
) {
  const service = await findServiceCatalogById(
    companyId,
    id,
  );

  if (!service) {
    throw new ApiError(
      404,
      "SERVICE_CATALOG_NOT_FOUND",
      "Service catalog item not found.",
    );
  }

  return service;
}

export async function updateCatalogService(
  companyId: string,
  id: string,
  data: UpdateServiceCatalogInput,
) {
  const existing = await findServiceCatalogById(
    companyId,
    id,
  );

  if (!existing) {
    throw new ApiError(
      404,
      "SERVICE_CATALOG_NOT_FOUND",
      "Service catalog item not found.",
    );
  }

  if (
    data.slug &&
    data.slug !== existing.slug
  ) {
    const slugExists =
      await findServiceCatalogBySlug(
        companyId,
        data.slug,
      );

    if (slugExists) {
      throw new ApiError(
        409,
        "SERVICE_CATALOG_SLUG_EXISTS",
        "A service with this slug already exists.",
      );
    }
  }

  return updateServiceCatalog(
    companyId,
    id,
    data,
  );
}

export async function toggleCatalogServiceStatus(
  companyId: string,
  id: string,
  isActive: boolean,
) {
  const existing = await findServiceCatalogById(
    companyId,
    id,
  );

  if (!existing) {
    throw new ApiError(
      404,
      "SERVICE_CATALOG_NOT_FOUND",
      "Service catalog item not found.",
    );
  }

  return updateServiceCatalogStatus(
    companyId,
    id,
    isActive,
  );
}

export async function removeCatalogService(
  companyId: string,
  id: string,
) {
  const existing = await findServiceCatalogById(
    companyId,
    id,
  );

  if (!existing) {
    throw new ApiError(
      404,
      "SERVICE_CATALOG_NOT_FOUND",
      "Service catalog item not found.",
    );
  }

  return deleteServiceCatalog(
    companyId,
    id,
  );
}