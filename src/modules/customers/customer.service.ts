import {
  createCustomer,
  deleteCustomer,
  findCustomerById,
  findCustomers,
  updateCustomer,
  updateCustomerStatus,
} from "./customer.repository.js";

import type {
  CreateCustomerInput,
  CustomerQuery,
  UpdateCustomerInput,
} from "./customer.schema.js";

export async function create(companyId: string, data: CreateCustomerInput) {
  return createCustomer(companyId, data);
}

export async function list(companyId: string, query: CustomerQuery) {
  return findCustomers(companyId, query);
}

export async function getById(companyId: string, customerId: string) {
  return findCustomerById(companyId, customerId);
}

export async function update(
  companyId: string,
  customerId: string,
  data: UpdateCustomerInput,
) {
  return updateCustomer(companyId, customerId, data);
}

export async function toggleStatus(
  companyId: string,
  customerId: string,
  isActive: boolean,
) {
  return updateCustomerStatus(companyId, customerId, isActive);
}

export async function remove(companyId: string, customerId: string) {
  return deleteCustomer(companyId, customerId);
}
