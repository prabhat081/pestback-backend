import { ApiError } from "../../utils/api-error.js";

import {
  createService,
  deleteService,
  findCustomerForCompany,
  findPropertyForCustomer,
  findServiceById,
  findServiceCatalogForCompany,
  findServices,
  updateService,
  updateServiceStatus,
} from "./service.repository.js";

import type {
  CreateServiceInput,
  ServiceQuery,
  UpdateServiceInput,
} from "./service.schema.js";

export async function create(
  companyId: string,
  data: CreateServiceInput,
) {
  /**
   * 1. Validate customer
   */
  const customer =
    await findCustomerForCompany(
      companyId,
      data.customerId,
    );

  if (!customer) {
    throw new ApiError(
      404,
      "CUSTOMER_NOT_FOUND",
      "Customer not found.",
    );
  }

  /**
   * 2. Validate property
   */
  const property =
    await findPropertyForCustomer(
      companyId,
      data.customerId,
      data.propertyId,
    );

  if (!property) {
    throw new ApiError(
      404,
      "PROPERTY_NOT_FOUND",
      "Property not found for this customer.",
    );
  }

  /**
   * 3. Validate service catalog
   */
  const catalog =
    await findServiceCatalogForCompany(
      companyId,
      data.serviceCatalogId,
    );

  if (!catalog) {
    throw new ApiError(
      404,
      "SERVICE_CATALOG_NOT_FOUND",
      "Active service catalog item not found.",
    );
  }

  /**
   * 4. Validate dates
   */
  if (
    data.endDate &&
    data.endDate < data.startDate
  ) {
    throw new ApiError(
      400,
      "INVALID_DATE_RANGE",
      "End date cannot be before start date.",
    );
  }

  /**
   * 5. Create actual customer service
   *
   * name + serviceType come from catalog.
   * price + frequency are actual customer values.
   */
  return createService(
    companyId,
    data,
    catalog,
  );
}

export async function list(
  companyId: string,
  query: ServiceQuery,
) {
  return findServices(
    companyId,
    query,
  );
}

export async function getById(
  companyId: string,
  serviceId: string,
) {
  return findServiceById(
    companyId,
    serviceId,
  );
}

export async function update(
  companyId: string,
  serviceId: string,
  data: UpdateServiceInput,
) {
  const service =
    await findServiceById(
      companyId,
      serviceId,
    );

  if (!service) {
    return null;
  }

  /**
   * Validate complete date range
   * using existing values when only
   * one date is updated.
   */
  const startDate =
    data.startDate ??
    service.startDate;

  const endDate =
    data.endDate ??
    service.endDate;

  if (
    endDate &&
    endDate < startDate
  ) {
    throw new ApiError(
      400,
      "INVALID_DATE_RANGE",
      "End date cannot be before start date.",
    );
  }

  return updateService(
    companyId,
    serviceId,
    data,
  );
}

export async function toggleStatus(
  companyId: string,
  serviceId: string,
  isActive: boolean,
) {
  return updateServiceStatus(
    companyId,
    serviceId,
    isActive,
  );
}

export async function remove(
  companyId: string,
  serviceId: string,
) {
  return deleteService(
    companyId,
    serviceId,
  );
}