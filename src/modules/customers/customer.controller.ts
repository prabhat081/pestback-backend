import type { Request, Response } from "express";

import * as customerService from "./customer.service.js";

import {
  createCustomerSchema,
  customerQuerySchema,
  updateCustomerSchema,
} from "./customer.schema.js";

import { ApiError } from "../../utils/api-error.js";

/**
 * Get and validate customer ID from route params.
 *
 * Express can type req.params.id as:
 * string | string[] | undefined
 *
 * Customer IDs are UUID strings, so we make sure
 * we always pass a valid string to the service layer.
 */
function getCustomerId(req: Request): string {
  const customerId = req.params.id;

  if (!customerId || Array.isArray(customerId)) {
    throw new ApiError(400, "INVALID_CUSTOMER_ID", "Invalid customer ID.");
  }

  return customerId;
}

/**
 * Create Customer
 */
export async function createCustomer(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const data = createCustomerSchema.parse(req.body);

  const customer = await customerService.create(companyId, data);

  return res.status(201).json({
    success: true,
    data: customer,
  });
}

/**
 * Get Customers
 */
export async function getCustomers(req: Request, res: Response) {
    console.log(req.company,'req.company')
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const query = customerQuerySchema.parse(req.query);

  const result = await customerService.list(companyId, query);

  return res.json({
    success: true,
    data: result,
  });
}

/**
 * Get Customer By ID
 */
export async function getCustomer(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const customerId = getCustomerId(req);

  const customer = await customerService.getById(companyId, customerId);

  if (!customer) {
    throw new ApiError(404, "CUSTOMER_NOT_FOUND", "Customer not found.");
  }

  return res.json({
    success: true,
    data: customer,
  });
}

/**
 * Update Customer
 */
export async function updateCustomer(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const customerId = getCustomerId(req);

  const data = updateCustomerSchema.parse(req.body);

  const customer = await customerService.update(companyId, customerId, data);

  if (!customer) {
    throw new ApiError(404, "CUSTOMER_NOT_FOUND", "Customer not found.");
  }

  return res.json({
    success: true,
    data: customer,
  });
}

/**
 * Toggle Customer Status
 */
export async function toggleCustomerStatus(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const customerId = getCustomerId(req);

  const isActive = req.body.isActive;

  if (typeof isActive !== "boolean") {
    throw new ApiError(400, "VALIDATION_ERROR", "isActive must be a boolean.");
  }

  const customer = await customerService.toggleStatus(
    companyId,
    customerId,
    isActive,
  );

  if (!customer) {
    throw new ApiError(404, "CUSTOMER_NOT_FOUND", "Customer not found.");
  }

  return res.json({
    success: true,
    data: customer,
  });
}

/**
 * Delete Customer
 */
export async function deleteCustomer(req: Request, res: Response) {
  const companyId = req.company?.id;

  if (!companyId) {
    throw new ApiError(403, "COMPANY_REQUIRED", "Company is required.");
  }

  const customerId = getCustomerId(req);

  const customer = await customerService.remove(companyId, customerId);

  if (!customer) {
    throw new ApiError(404, "CUSTOMER_NOT_FOUND", "Customer not found.");
  }

  return res.json({
    success: true,
    message: "Customer deleted successfully.",
  });
}
