// src/modules/payments/payment.controller.ts

import type { Request, Response } from "express";

import {
  paymentIdParamSchema,
  paymentLinkTokenParamSchema,
  paymentListQuerySchema,
  paymentOrderIdParamSchema,
  paymentOrderListQuerySchema,
  createPaymentSchema,
  createPaymentOrderSchema,
  updatePaymentSchema,
  updatePaymentOrderSchema,
  updatePaymentStatusSchema,
} from "./payment.schema.js";

import {
  listPayments,
  getPayment,
  createPayment,
  editPayment,
  changePaymentStatus,
  removePayment,
  listPaymentOrders,
  getPaymentOrder,
  getPublicPaymentOrder,
  createPaymentOrder,
  editPaymentOrder,
  cancelPaymentOrder,
  listPaymentAttempts,
} from "./payment.service.js";

import { ApiError } from "../../utils/api-error.js";

/* -------------------------------------------------------------------------- */
/*                                  HELPER                                    */
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
/*                              PAYMENTS                                      */
/* -------------------------------------------------------------------------- */

export async function listPaymentsController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const query = paymentListQuerySchema.parse(req.query);

  const result = await listPayments(companyId, query);

  return res.status(200).json({
    success: true,
    data: result,
  });
}

export async function createPaymentController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const input = createPaymentSchema.parse(req.body);

  const payment = await createPayment(companyId, input);

  return res.status(201).json({
    success: true,
    message: "Payment created successfully",
    data: payment,
  });
}

export async function getPaymentController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = paymentIdParamSchema.parse(req.params);

  const payment = await getPayment(companyId, id);

  return res.status(200).json({
    success: true,
    data: payment,
  });
}

export async function updatePaymentController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = paymentIdParamSchema.parse(req.params);

  const input = updatePaymentSchema.parse(req.body);

  const payment = await editPayment(companyId, id, input);

  return res.status(200).json({
    success: true,
    message: "Payment updated successfully",
    data: payment,
  });
}

export async function updatePaymentStatusController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const { id } = paymentIdParamSchema.parse(req.params);

  const input = updatePaymentStatusSchema.parse(req.body);

  const payment = await changePaymentStatus(companyId, id, input.status);

  return res.status(200).json({
    success: true,
    message: "Payment status updated successfully",
    data: payment,
  });
}

export async function deletePaymentController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = paymentIdParamSchema.parse(req.params);

  await removePayment(companyId, id);

  return res.status(204).send();
}

/* -------------------------------------------------------------------------- */
/*                           PAYMENT ORDERS                                   */
/* -------------------------------------------------------------------------- */

export async function listPaymentOrdersController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const query = paymentOrderListQuerySchema.parse(req.query);

  const result = await listPaymentOrders(companyId, query);

  return res.status(200).json({
    success: true,
    data: result,
  });
}

export async function createPaymentOrderController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const input = createPaymentOrderSchema.parse(req.body);

  const order = await createPaymentOrder(companyId, input);

  return res.status(201).json({
    success: true,
    message: "Payment order created successfully",
    data: order,
  });
}

export async function getPaymentOrderController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = paymentOrderIdParamSchema.parse(req.params);

  const order = await getPaymentOrder(companyId, id);

  return res.status(200).json({
    success: true,
    data: order,
  });
}

export async function updatePaymentOrderController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const { id } = paymentOrderIdParamSchema.parse(req.params);

  const input = updatePaymentOrderSchema.parse(req.body);

  const order = await editPaymentOrder(companyId, id, input);

  return res.status(200).json({
    success: true,
    message: "Payment order updated successfully",
    data: order,
  });
}

export async function cancelPaymentOrderController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const { id } = paymentOrderIdParamSchema.parse(req.params);

  const order = await cancelPaymentOrder(companyId, id);

  return res.status(200).json({
    success: true,
    message: "Payment order cancelled successfully",
    data: order,
  });
}

/* -------------------------------------------------------------------------- */
/*                         PUBLIC PAYMENT LINK                                */
/* -------------------------------------------------------------------------- */

export async function getPublicPaymentOrderController(
  req: Request,
  res: Response,
) {
  const { token } = paymentLinkTokenParamSchema.parse(req.params);

  const order = await getPublicPaymentOrder(token);

  return res.status(200).json({
    success: true,
    data: order,
  });
}


/* -------------------------------------------------------------------------- */
/*                         PAYMENT ATTEMPTS                                   */
/* -------------------------------------------------------------------------- */

export async function listPaymentAttemptsController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);
  const { id } = paymentOrderIdParamSchema.parse(req.params);

  const attempts = await listPaymentAttempts(companyId, id);

  return res.status(200).json({
    success: true,
    data: attempts,
  });
}
