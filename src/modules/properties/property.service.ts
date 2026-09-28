import { ApiError } from "../../utils/api-error.js";

import {
  createProperty,
  deleteProperty,
  findCustomerForCompany,
  findProperties,
  findPropertyById,
  updateProperty,
  updatePropertyStatus,
} from "./property.repository.js";

import type {
  CreatePropertyInput,
  PropertyQuery,
  UpdatePropertyInput,
} from "./property.schema.js";

export async function create(companyId: string, data: CreatePropertyInput) {
  const customer = await findCustomerForCompany(companyId, data.customerId);

  if (!customer) {
    throw new ApiError(404, "CUSTOMER_NOT_FOUND", "Customer not found.");
  }

  return createProperty(companyId, data);
}

export async function list(companyId: string, query: PropertyQuery) {
  return findProperties(companyId, query);
}

export async function getById(companyId: string, propertyId: string) {
  return findPropertyById(companyId, propertyId);
}

export async function update(
  companyId: string,
  propertyId: string,
  data: UpdatePropertyInput,
) {
  const property = await findPropertyById(companyId, propertyId);

  if (!property) {
    return null;
  }

  return updateProperty(companyId, propertyId, data);
}

export async function toggleStatus(
  companyId: string,
  propertyId: string,
  isActive: boolean,
) {
  return updatePropertyStatus(companyId, propertyId, isActive);
}

export async function remove(companyId: string, propertyId: string) {
  return deleteProperty(companyId, propertyId);
}
