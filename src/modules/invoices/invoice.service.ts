import { db } from "../../database/index.js";
import {
  customers,
  jobs,
  properties,
  services,
} from "../../database/schema/index.js";
import { invoices, invoiceItems } from "../../database/schema/invoices.js";
import { ApiError } from "../../utils/api-error.js";

import {
  findInvoiceById,
  findInvoiceByJobId,
  listInvoices,
  insertInvoice,
  insertInvoiceItems,
  updateInvoiceById,
  updateInvoiceStatusById,
  deleteInvoiceById,
  findInvoiceItemById,
  listInvoiceItems,
  insertInvoiceItem,
  updateInvoiceItemById,
  deleteInvoiceItemById,
} from "./invoice.repository.js";

import type {
  CreateInvoiceInput,
  CreateInvoiceItemInput,
  UpdateInvoiceInput,
  UpdateInvoiceItemInput,
  InvoiceListQuery,
} from "./invoice.types.js";

import { and, eq } from "drizzle-orm";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

const INVOICE_STATUS_TRANSITIONS = {
  draft: ["draft", "issued", "cancelled"],
  issued: ["issued", "partially-paid", "paid", "cancelled"],
  "partially-paid": ["partially-paid", "paid"],
  paid: ["paid"],
  cancelled: ["cancelled"],
} as const;

function assertStatusTransition(
  currentStatus: keyof typeof INVOICE_STATUS_TRANSITIONS,
  nextStatus: keyof typeof INVOICE_STATUS_TRANSITIONS,
) {
  const allowed = INVOICE_STATUS_TRANSITIONS[currentStatus];

  if (!allowed.includes(nextStatus as never)) {
    throw new ApiError(
      409,
      `Invoice cannot move from ${currentStatus} to ${nextStatus}`,
      "INVALID_INVOICE_STATUS_TRANSITION",
    );
  }
}

function toNumber(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

function money(value: number): string {
  return value.toFixed(2);
}

function calculateItem(item: CreateInvoiceItemInput | UpdateInvoiceItemInput) {
  const quantity = toNumber(item.quantity);
  const unitPrice = toNumber(item.unitPrice);
  const discount = toNumber(item.discount ?? "0");
  const taxRate = toNumber(item.taxRate ?? "0");

  const grossAmount = quantity * unitPrice;

  const taxableAmount = Math.max(grossAmount - discount, 0);

  const taxAmount = taxableAmount * (taxRate / 100);

  const amount = taxableAmount + taxAmount;

  return {
    quantity: money(quantity),
    unitPrice: money(unitPrice),
    discount: money(discount),
    taxableAmount: money(taxableAmount),
    taxRate: money(taxRate),
    taxAmount: money(taxAmount),
    amount: money(amount),
  };
}

function calculateInvoiceTotals(
  items: Array<{
    quantity: string;
    unitPrice: string;
    discount: string;
    taxableAmount: string;
    taxRate: string;
    taxAmount: string;
    amount: string;
  }>,
  invoiceDiscount: string,
  taxApplied: boolean,
  gstType?: "cgst-sgst" | "igst",
) {
  const subtotal = items.reduce(
    (sum, item) => sum + toNumber(item.quantity) * toNumber(item.unitPrice),
    0,
  );

  const itemDiscount = items.reduce(
    (sum, item) => sum + toNumber(item.discount),
    0,
  );

  const invoiceLevelDiscount = toNumber(invoiceDiscount);

  const totalDiscount = itemDiscount + invoiceLevelDiscount;

  const itemsTaxableAmount = items.reduce(
    (sum, item) => sum + toNumber(item.taxableAmount),
    0,
  );

  const taxableAmount = Math.max(itemsTaxableAmount - invoiceLevelDiscount, 0);

  if (!taxApplied) {
    return {
      subtotal: money(subtotal),
      discount: money(totalDiscount),
      taxableAmount: money(taxableAmount),
      cgstAmount: "0.00",
      sgstAmount: "0.00",
      igstAmount: "0.00",
      totalTax: "0.00",
      total: money(taxableAmount),
    };
  }

  const itemTax = items.reduce(
    (sum, item) => sum + toNumber(item.taxAmount),
    0,
  );

  /*
   * If an invoice-level discount exists, recalculate
   * the effective tax impact proportionally.
   */
  const originalTaxableAmount = itemsTaxableAmount;

  let totalTax = itemTax;

  if (originalTaxableAmount > 0 && invoiceLevelDiscount > 0) {
    const effectiveTaxRate = itemTax / originalTaxableAmount;

    totalTax = taxableAmount * effectiveTaxRate;
  }

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (gstType === "cgst-sgst") {
    cgstAmount = totalTax / 2;
    sgstAmount = totalTax / 2;
  }

  if (gstType === "igst") {
    igstAmount = totalTax;
  }

  return {
    subtotal: money(subtotal),
    discount: money(totalDiscount),
    taxableAmount: money(taxableAmount),
    cgstAmount: money(cgstAmount),
    sgstAmount: money(sgstAmount),
    igstAmount: money(igstAmount),
    totalTax: money(totalTax),
    total: money(taxableAmount + totalTax),
  };
}

/* -------------------------------------------------------------------------- */
/* Invoice Number                                                             */
/* -------------------------------------------------------------------------- */

async function generateInvoiceNumber(companyId: string) {
  const year = new Date().getFullYear();

  /*
   * We intentionally use a random suffix here as a safe
   * temporary generator. A DB-backed sequence/locking
   * strategy can replace this later if strict sequential
   * numbering is required by the business.
   */
  const randomPart = Math.floor(100000 + Math.random() * 900000);

  return `INV-${year}-${randomPart}`;
}

/* -------------------------------------------------------------------------- */
/* Validate Job / Customer / Property                                          */
/* -------------------------------------------------------------------------- */

async function validateInvoiceReferences(
  companyId: string,
  customerId: string,
  propertyId: string,
  jobId: string,
) {
  const [customer, property, job] = await Promise.all([
    db
      .select({ id: customers.id })
      .from(customers)
      .where(
        and(eq(customers.id, customerId), eq(customers.companyId, companyId)),
      )
      .limit(1),

    db
      .select({
        id: properties.id,
        customerId: properties.customerId,
      })
      .from(properties)
      .where(
        and(eq(properties.id, propertyId), eq(properties.companyId, companyId)),
      )
      .limit(1),

    db
      .select({
        id: jobs.id,
        customerId: jobs.customerId,
        propertyId: jobs.propertyId,
        status: jobs.status,
      })
      .from(jobs)
      .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
      .limit(1),
  ]);

  if (!customer[0]) {
    throw new ApiError(404, "Customer not found", "CUSTOMER_NOT_FOUND");
  }

  if (!property[0]) {
    throw new ApiError(404, "Property not found", "PROPERTY_NOT_FOUND");
  }

  if (!job[0]) {
    throw new ApiError(404, "Job not found", "JOB_NOT_FOUND");
  }

  if (property[0].customerId !== customerId) {
    throw new ApiError(
      409,
      "Property does not belong to the selected customer",
      "PROPERTY_CUSTOMER_MISMATCH",
    );
  }

  if (job[0].customerId !== customerId) {
    throw new ApiError(
      409,
      "Job does not belong to the selected customer",
      "JOB_CUSTOMER_MISMATCH",
    );
  }

  if (job[0].propertyId !== propertyId) {
    throw new ApiError(
      409,
      "Job does not belong to the selected property",
      "JOB_PROPERTY_MISMATCH",
    );
  }

  if (job[0].status !== "completed") {
    throw new ApiError(
      409,
      "Invoice can only be created for a completed job",
      "JOB_NOT_COMPLETED",
    );
  }

  return job[0];
}

/* -------------------------------------------------------------------------- */
/* Create Invoice                                                             */
/* -------------------------------------------------------------------------- */

export async function createInvoice(
  companyId: string,
  input: CreateInvoiceInput,
) {
  await validateInvoiceReferences(
    companyId,
    input.customerId,
    input.propertyId,
    input.jobId,
  );

  const existingInvoice = await findInvoiceByJobId(companyId, input.jobId);

  if (existingInvoice) {
    throw new ApiError(
      409,
      "An invoice already exists for this job",
      "INVOICE_ALREADY_EXISTS",
    );
  }

  if (input.taxApplied && !input.gstType) {
    throw new ApiError(
      400,
      "GST type is required when GST is applied",
      "GST_TYPE_REQUIRED",
    );
  }

  const calculatedItems = input.items.map((item) => calculateItem(item));

  if (!input.taxApplied) {
    for (const item of calculatedItems) {
      if (toNumber(item.taxRate) !== 0) {
        throw new ApiError(
          400,
          "Tax rate must be 0 when GST is not applied",
          "INVALID_TAX_RATE",
        );
      }
    }
  }

  const totals = calculateInvoiceTotals(
    calculatedItems,
    input.discount ?? "0",
    input.taxApplied ?? false,
    input.gstType,
  );

  const invoiceNumber = await generateInvoiceNumber(companyId);

  const invoice = await db.transaction(async (tx) => {
    const createdInvoice = await insertInvoice(
      {
        companyId,
        customerId: input.customerId,
        propertyId: input.propertyId,
        jobId: input.jobId,
        invoiceNumber,
        status: "draft",
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        taxApplied: input.taxApplied ?? false,
        gstType: input.gstType,
        ...totals,
        notes: input.notes,
      },
      tx,
    );

    if (!createdInvoice) {
      throw new ApiError(
        500,
        "Failed to create invoice",
        "INVOICE_CREATE_FAILED",
      );
    }

    await insertInvoiceItems(
      calculatedItems.map((item) => ({
        invoiceId: createdInvoice.id,
        description:
          input.items[calculatedItems.indexOf(item)]?.description ?? "",
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        taxableAmount: item.taxableAmount,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        amount: item.amount,
      })),
      tx,
    );

    return createdInvoice;
  });

  return invoice;
}

/* -------------------------------------------------------------------------- */
/* Get Invoice                                                                */
/* -------------------------------------------------------------------------- */

export async function getInvoice(companyId: string, invoiceId: string) {
  const invoice = await findInvoiceById(companyId, invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
  }

  return invoice;
}

/* -------------------------------------------------------------------------- */
/* List Invoices                                                              */
/* -------------------------------------------------------------------------- */

export async function getInvoices(companyId: string, query: InvoiceListQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;

  const result = await listInvoices({
    companyId,
    page,
    limit,
    search: query.search,
    status: query.status,
    customerId: query.customerId,
    propertyId: query.propertyId,
    jobId: query.jobId,
    fromDate: query.fromDate,
    toDate: query.toDate,
  });

  return {
    data: result.rows,
    pagination: {
      page,
      limit,
      total: result.total,
      totalPages: Math.ceil(result.total / limit),
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Update Invoice                                                             */
/* -------------------------------------------------------------------------- */

export async function updateInvoice(
  companyId: string,
  invoiceId: string,
  input: UpdateInvoiceInput,
) {
  const invoice = await findInvoiceById(companyId, invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
  }

  if (invoice.status !== "draft") {
    throw new ApiError(
      409,
      "Only draft invoices can be edited",
      "INVOICE_NOT_EDITABLE",
    );
  }

  if (input.taxApplied === true && !input.gstType) {
    throw new ApiError(
      400,
      "GST type is required when GST is enabled",
      "GST_TYPE_REQUIRED",
    );
  }

  if (input.taxApplied === false && input.gstType) {
    throw new ApiError(
      400,
      "GST type cannot be provided when GST is disabled",
      "INVALID_GST_TYPE",
    );
  }

  const updated = await updateInvoiceById(companyId, invoiceId, {
    issueDate: input.issueDate,
    dueDate: input.dueDate,
    taxApplied: input.taxApplied,
    gstType: input.gstType,
    discount: input.discount,
    notes: input.notes,
  });

  if (!updated) {
    throw new ApiError(
      500,
      "Failed to update invoice",
      "INVOICE_UPDATE_FAILED",
    );
  }

  return updated;
}

/* -------------------------------------------------------------------------- */
/* Update Status                                                              */
/* -------------------------------------------------------------------------- */

export async function updateInvoiceStatus(
  companyId: string,
  invoiceId: string,
  nextStatus: "draft" | "issued" | "partially-paid" | "paid" | "cancelled",
) {
  const invoice = await findInvoiceById(companyId, invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
  }

  assertStatusTransition(invoice.status, nextStatus);

  if (nextStatus === "issued" && invoice.total === "0.00") {
    throw new ApiError(
      409,
      "Zero-value invoice cannot be issued",
      "INVALID_INVOICE_TOTAL",
    );
  }

  const updated = await updateInvoiceStatusById(
    companyId,
    invoiceId,
    nextStatus,
  );

  if (!updated) {
    throw new ApiError(
      500,
      "Failed to update invoice status",
      "INVOICE_STATUS_UPDATE_FAILED",
    );
  }

  return updated;
}

/* -------------------------------------------------------------------------- */
/* Issue Invoice                                                              */
/* -------------------------------------------------------------------------- */

export async function issueInvoice(companyId: string, invoiceId: string) {
  return updateInvoiceStatus(companyId, invoiceId, "issued");
}

/* -------------------------------------------------------------------------- */
/* Cancel Invoice                                                             */
/* -------------------------------------------------------------------------- */

export async function cancelInvoice(companyId: string, invoiceId: string) {
  const invoice = await findInvoiceById(companyId, invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
  }

  if (invoice.status === "paid" || invoice.status === "partially-paid") {
    throw new ApiError(
      409,
      "Paid or partially paid invoice cannot be cancelled",
      "INVOICE_CANNOT_BE_CANCELLED",
    );
  }

  return updateInvoiceStatus(companyId, invoiceId, "cancelled");
}

/* -------------------------------------------------------------------------- */
/* Delete Invoice                                                             */
/* -------------------------------------------------------------------------- */

export async function deleteInvoice(companyId: string, invoiceId: string) {
  const invoice = await findInvoiceById(companyId, invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
  }

  if (invoice.status !== "draft") {
    throw new ApiError(
      409,
      "Only draft invoices can be deleted",
      "INVOICE_NOT_DELETABLE",
    );
  }

  const deleted = await deleteInvoiceById(companyId, invoiceId);

  if (!deleted) {
    throw new ApiError(
      500,
      "Failed to delete invoice",
      "INVOICE_DELETE_FAILED",
    );
  }

  return {
    message: "Invoice deleted successfully",
  };
}

/* -------------------------------------------------------------------------- */
/* Invoice Items                                                              */
/* -------------------------------------------------------------------------- */

export async function getInvoiceItems(companyId: string, invoiceId: string) {
  const invoice = await findInvoiceById(companyId, invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
  }

  return listInvoiceItems(invoiceId);
}

export async function addInvoiceItem(
  companyId: string,
  invoiceId: string,
  input: CreateInvoiceItemInput,
) {
  const invoice = await findInvoiceById(companyId, invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
  }

  if (invoice.status !== "draft") {
    throw new ApiError(
      409,
      "Items can only be added to draft invoices",
      "INVOICE_NOT_EDITABLE",
    );
  }

  const calculated = calculateItem(input);

  if (!invoice.taxApplied && toNumber(calculated.taxRate) !== 0) {
    throw new ApiError(
      400,
      "Tax rate must be 0 when GST is disabled",
      "INVALID_TAX_RATE",
    );
  }

  return db.transaction(async (tx) => {
    const [item] = await tx
      .insert(invoiceItems)
      .values({
        invoiceId,
        description: input.description,
        quantity: calculated.quantity,
        unitPrice: calculated.unitPrice,
        discount: calculated.discount,
        taxableAmount: calculated.taxableAmount,
        taxRate: calculated.taxRate,
        taxAmount: calculated.taxAmount,
        amount: calculated.amount,
      })
      .returning();

    if (!item) {
      throw new ApiError(
        500,
        "Failed to add invoice item",
        "INVOICE_ITEM_CREATE_FAILED",
      );
    }

    return item;
  });
}

export async function updateInvoiceItem(
  companyId: string,
  invoiceId: string,
  itemId: string,
  input: UpdateInvoiceItemInput,
) {
  const invoice = await findInvoiceById(companyId, invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
  }

  if (invoice.status !== "draft") {
    throw new ApiError(
      409,
      "Items can only be edited on draft invoices",
      "INVOICE_NOT_EDITABLE",
    );
  }

  const existing = await findInvoiceItemById(invoiceId, itemId);

  if (!existing) {
    throw new ApiError(404, "Invoice item not found", "INVOICE_ITEM_NOT_FOUND");
  }

  const calculated = calculateItem({
    description: input.description ?? existing.description,
    quantity: input.quantity ?? existing.quantity,
    unitPrice: input.unitPrice ?? existing.unitPrice,
    discount: input.discount ?? existing.discount,
    taxRate: input.taxRate ?? existing.taxRate,
  });

  if (!invoice.taxApplied && toNumber(calculated.taxRate) !== 0) {
    throw new ApiError(
      400,
      "Tax rate must be 0 when GST is disabled",
      "INVALID_TAX_RATE",
    );
  }

  return updateInvoiceItemById(invoiceId, itemId, {
    description: input.description,
    quantity: calculated.quantity,
    unitPrice: calculated.unitPrice,
    discount: calculated.discount,
    taxableAmount: calculated.taxableAmount,
    taxRate: calculated.taxRate,
    taxAmount: calculated.taxAmount,
    amount: calculated.amount,
  });
}

export async function deleteInvoiceItem(
  companyId: string,
  invoiceId: string,
  itemId: string,
) {
  const invoice = await findInvoiceById(companyId, invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
  }

  if (invoice.status !== "draft") {
    throw new ApiError(
      409,
      "Items can only be deleted from draft invoices",
      "INVOICE_NOT_EDITABLE",
    );
  }

  const item = await findInvoiceItemById(invoiceId, itemId);

  if (!item) {
    throw new ApiError(404, "Invoice item not found", "INVOICE_ITEM_NOT_FOUND");
  }

  const deleted = await deleteInvoiceItemById(invoiceId, itemId);

  if (!deleted) {
    throw new ApiError(
      500,
      "Failed to delete invoice item",
      "INVOICE_ITEM_DELETE_FAILED",
    );
  }

  return {
    message: "Invoice item deleted successfully",
  };
}
