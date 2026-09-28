import type { Request, Response } from "express";

import {
  addInvoiceItemSchema,
  createInvoiceSchema,
  invoiceIdParamSchema,
  invoiceItemParamSchema,
  invoiceListQuerySchema,
  updateInvoiceItemSchema,
  updateInvoiceSchema,
  updateInvoiceStatusSchema,
} from "./invoice.schema.js";

import {
  addInvoiceItem,
  cancelInvoice,
  createInvoice,
  deleteInvoice,
  deleteInvoiceItem,
  getInvoice,
  getInvoiceItems,
  getInvoices,
  issueInvoice,
  updateInvoice,
  updateInvoiceItem,
  updateInvoiceStatus,
} from "./invoice.service.js";

import { ApiError } from "../../utils/api-error.js";

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
/* List Invoices                                                              */
/* -------------------------------------------------------------------------- */

export async function listInvoicesController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const query = invoiceListQuerySchema.parse(req.query);

  const result = await getInvoices(companyId, query);

  return res.status(200).json(result);
}

/* -------------------------------------------------------------------------- */
/* Create Invoice                                                             */
/* -------------------------------------------------------------------------- */

export async function createInvoiceController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const input = createInvoiceSchema.parse(req.body);

  const invoice = await createInvoice(companyId, input);

  return res.status(201).json({
    data: invoice,
  });
}

/* -------------------------------------------------------------------------- */
/* Get Invoice                                                                */
/* -------------------------------------------------------------------------- */

export async function getInvoiceController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = invoiceIdParamSchema.parse(req.params);

  const invoice = await getInvoice(companyId, id);

  return res.status(200).json({
    data: invoice,
  });
}

/* -------------------------------------------------------------------------- */
/* Update Invoice                                                             */
/* -------------------------------------------------------------------------- */

export async function updateInvoiceController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = invoiceIdParamSchema.parse(req.params);

  const input = updateInvoiceSchema.parse(req.body);

  const invoice = await updateInvoice(companyId, id, input);

  return res.status(200).json({
    data: invoice,
  });
}

/* -------------------------------------------------------------------------- */
/* Delete Invoice                                                             */
/* -------------------------------------------------------------------------- */

export async function deleteInvoiceController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = invoiceIdParamSchema.parse(req.params);

  const result = await deleteInvoice(companyId, id);

  return res.status(200).json(result);
}

/* -------------------------------------------------------------------------- */
/* Update Invoice Status                                                      */
/* -------------------------------------------------------------------------- */

export async function updateInvoiceStatusController(
  req: Request,
  res: Response,
) {
  const companyId = getCompanyId(req);

  const { id } = invoiceIdParamSchema.parse(req.params);

  const { status } = updateInvoiceStatusSchema.parse(req.body);

  const invoice = await updateInvoiceStatus(companyId, id, status);

  return res.status(200).json({
    data: invoice,
  });
}

/* -------------------------------------------------------------------------- */
/* Issue Invoice                                                              */
/* -------------------------------------------------------------------------- */

export async function issueInvoiceController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = invoiceIdParamSchema.parse(req.params);

  const invoice = await issueInvoice(companyId, id);

  return res.status(200).json({
    data: invoice,
  });
}

/* -------------------------------------------------------------------------- */
/* Cancel Invoice                                                             */
/* -------------------------------------------------------------------------- */

export async function cancelInvoiceController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = invoiceIdParamSchema.parse(req.params);

  const invoice = await cancelInvoice(companyId, id);

  return res.status(200).json({
    data: invoice,
  });
}

/* -------------------------------------------------------------------------- */
/* List Invoice Items                                                         */
/* -------------------------------------------------------------------------- */

export async function listInvoiceItemsController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = invoiceIdParamSchema.parse(req.params);

  const items = await getInvoiceItems(companyId, id);

  return res.status(200).json({
    data: items,
  });
}

/* -------------------------------------------------------------------------- */
/* Add Invoice Item                                                            */
/* -------------------------------------------------------------------------- */

export async function addInvoiceItemController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id } = invoiceIdParamSchema.parse(req.params);

  const input = addInvoiceItemSchema.parse(req.body);

  const item = await addInvoiceItem(companyId, id, input);

  return res.status(201).json({
    data: item,
  });
}

/* -------------------------------------------------------------------------- */
/* Update Invoice Item                                                        */
/* -------------------------------------------------------------------------- */

export async function updateInvoiceItemController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id, itemId } = invoiceItemParamSchema.parse(req.params);

  const input = updateInvoiceItemSchema.parse(req.body);

  const item = await updateInvoiceItem(companyId, id, itemId, input);

  return res.status(200).json({
    data: item,
  });
}

/* -------------------------------------------------------------------------- */
/* Delete Invoice Item                                                        */
/* -------------------------------------------------------------------------- */

export async function deleteInvoiceItemController(req: Request, res: Response) {
  const companyId = getCompanyId(req);

  const { id, itemId } = invoiceItemParamSchema.parse(req.params);

  const result = await deleteInvoiceItem(companyId, id, itemId);

  return res.status(200).json(result);
}
