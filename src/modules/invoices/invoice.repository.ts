import { and, asc, count, desc, eq, gte, ilike, lte, or } from "drizzle-orm";

import type { SQL } from "drizzle-orm";

import { db } from "../../database/index.js";

import { invoiceItems, invoices } from "../../database/schema/invoices.js";

/* -------------------------------------------------------------------------- */
/* Database Executor                                                          */
/* -------------------------------------------------------------------------- */

/**
 * Supports both:
 * - normal database connection
 * - Drizzle transaction
 *
 * This is important because invoice creation inserts
 * invoice + invoice items inside one transaction.
 */
type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type DbExecutor = typeof db | DbTransaction;

/* -------------------------------------------------------------------------- */
/* Input Types                                                                */
/* -------------------------------------------------------------------------- */

interface InvoiceListFilters {
  companyId: string;
  page: number;
  limit: number;
  search?: string;
  status?: string;
  customerId?: string;
  propertyId?: string;
  jobId?: string;
  fromDate?: string;
  toDate?: string;
}

interface InsertInvoiceData {
  companyId: string;
  customerId: string;
  propertyId: string;
  jobId: string;
  invoiceNumber: string;

  status: "draft" | "issued" | "partially-paid" | "paid" | "cancelled";

  issueDate?: string;
  dueDate?: string;

  taxApplied: boolean;

  gstType?: "cgst-sgst" | "igst";

  subtotal: string;
  discount: string;
  taxableAmount: string;

  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;

  totalTax: string;
  total: string;

  notes?: string;
}

interface InsertInvoiceItemData {
  invoiceId: string;
  description: string;

  quantity: string;
  unitPrice: string;
  discount: string;

  taxableAmount: string;

  taxRate: string;
  taxAmount: string;

  amount: string;
}

interface UpdateInvoiceData {
  issueDate?: string | null;
  dueDate?: string | null;

  taxApplied?: boolean;

  gstType: "cgst-sgst" | "igst" | null | undefined;

  discount?: string;

  notes?: string | null;
}

interface UpdateInvoiceItemData {
  description?: string;
  quantity?: string;
  unitPrice?: string;
  discount?: string;
  taxableAmount?: string;
  taxRate?: string;
  taxAmount?: string;
  amount?: string;
}

/* -------------------------------------------------------------------------- */
/* Invoice                                                                    */
/* -------------------------------------------------------------------------- */

export async function insertInvoice(
  data: InsertInvoiceData,
  executor: DbExecutor = db,
) {
  const [invoice] = await executor
    .insert(invoices)
    .values({
      companyId: data.companyId,
      customerId: data.customerId,
      propertyId: data.propertyId,
      jobId: data.jobId,

      invoiceNumber: data.invoiceNumber,
      status: data.status,

      issueDate: data.issueDate,
      dueDate: data.dueDate,

      taxApplied: data.taxApplied,
      gstType: data.gstType,

      subtotal: data.subtotal,
      discount: data.discount,
      taxableAmount: data.taxableAmount,

      cgstAmount: data.cgstAmount,
      sgstAmount: data.sgstAmount,
      igstAmount: data.igstAmount,

      totalTax: data.totalTax,
      total: data.total,

      notes: data.notes,
    })
    .returning();

  return invoice;
}

export async function findInvoiceById(companyId: string, invoiceId: string) {
  const invoice = await db.query.invoices.findFirst({
    where: and(eq(invoices.companyId, companyId), eq(invoices.id, invoiceId)),

    columns: {
      id: true,
      companyId: true,

      customerId: true,
      propertyId: true,
      jobId: true,

      invoiceNumber: true,
      status: true,

      issueDate: true,
      dueDate: true,

      taxApplied: true,
      gstType: true,

      subtotal: true,
      discount: true,
      taxableAmount: true,

      cgstAmount: true,
      sgstAmount: true,
      igstAmount: true,

      totalTax: true,
      total: true,

      notes: true,

      createdAt: true,
      updatedAt: true,
    },

    with: {
      customer: {
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },

      property: {
        columns: {
          id: true,
          name: true,
          propertyType: true,
          address: true,
          city: true,
          state: true,
          postalCode: true,
        },
      },

      job: {
        columns: {
          id: true,
          jobNumber: true,
          status: true,
          priority: true,
        },
      },

      items: {
        columns: {
          id: true,
          invoiceId: true,
          description: true,
          quantity: true,
          unitPrice: true,
          discount: true,
          taxableAmount: true,
          taxRate: true,
          taxAmount: true,
          amount: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  });

  return invoice ?? null;
}

export async function findInvoiceByNumber(
  companyId: string,
  invoiceNumber: string,
) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(
      and(
        eq(invoices.companyId, companyId),
        eq(invoices.invoiceNumber, invoiceNumber),
      ),
    )
    .limit(1);

  return invoice ?? null;
}

export async function findInvoiceByJobId(companyId: string, jobId: string) {
  const [invoice] = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.companyId, companyId), eq(invoices.jobId, jobId)))
    .limit(1);

  return invoice ?? null;
}

/* -------------------------------------------------------------------------- */
/* Invoice List                                                               */
/* -------------------------------------------------------------------------- */

export async function listInvoices(filters: InvoiceListFilters) {
  const {
    companyId,
    page,
    limit,
    search,
    status,
    customerId,
    propertyId,
    jobId,
    fromDate,
    toDate,
  } = filters;

  const conditions: SQL[] = [eq(invoices.companyId, companyId)];

  if (search) {
    const searchCondition = or(
      ilike(invoices.invoiceNumber, `%${search}%`),
      ilike(invoices.notes, `%${search}%`),
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  if (status) {
    conditions.push(
      eq(
        invoices.status,
        status as "draft" | "issued" | "partially-paid" | "paid" | "cancelled",
      ),
    );
  }

  if (customerId) {
    conditions.push(eq(invoices.customerId, customerId));
  }

  if (propertyId) {
    conditions.push(eq(invoices.propertyId, propertyId));
  }

  if (jobId) {
    conditions.push(eq(invoices.jobId, jobId));
  }

  if (fromDate) {
    conditions.push(gte(invoices.issueDate, fromDate));
  }

  if (toDate) {
    conditions.push(lte(invoices.issueDate, toDate));
  }

  const offset = (page - 1) * limit;

  const [rows, totalResult] = await Promise.all([
    db.query.invoices.findMany({
      where: and(...conditions),

      columns: {
        id: true,
        companyId: true,

        customerId: true,
        propertyId: true,
        jobId: true,

        invoiceNumber: true,
        status: true,

        issueDate: true,
        dueDate: true,

        taxApplied: true,
        gstType: true,

        subtotal: true,
        discount: true,
        taxableAmount: true,

        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,

        totalTax: true,
        total: true,

        notes: true,

        createdAt: true,
        updatedAt: true,
      },

      with: {
        customer: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },

        property: {
          columns: {
            id: true,
            name: true,
            propertyType: true,
            address: true,
            city: true,
            state: true,
            postalCode: true,
          },
        },

        job: {
          columns: {
            id: true,
            jobNumber: true,
            status: true,
            priority: true,
          },
        },
      },

      orderBy: desc(invoices.createdAt),

      limit,
      offset,
    }),

    db
      .select({
        count: count(),
      })
      .from(invoices)
      .where(and(...conditions)),
  ]);

  return {
    rows,
    total: Number(totalResult[0]?.count ?? 0),
  };
}

/* -------------------------------------------------------------------------- */
/* Invoice Update                                                             */
/* -------------------------------------------------------------------------- */

export async function updateInvoiceById(
  companyId: string,
  invoiceId: string,
  data: UpdateInvoiceData,
) {
  const [invoice] = await db
    .update(invoices)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.companyId, companyId), eq(invoices.id, invoiceId)))
    .returning();

  return invoice ?? null;
}

/* -------------------------------------------------------------------------- */
/* Invoice Status                                                             */
/* -------------------------------------------------------------------------- */

export async function updateInvoiceStatusById(
  companyId: string,
  invoiceId: string,
  status: "draft" | "issued" | "partially-paid" | "paid" | "cancelled",
) {
  const [invoice] = await db
    .update(invoices)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.companyId, companyId), eq(invoices.id, invoiceId)))
    .returning();

  return invoice ?? null;
}

/* -------------------------------------------------------------------------- */
/* Invoice Delete                                                             */
/* -------------------------------------------------------------------------- */

export async function deleteInvoiceById(companyId: string, invoiceId: string) {
  const [invoice] = await db
    .delete(invoices)
    .where(and(eq(invoices.companyId, companyId), eq(invoices.id, invoiceId)))
    .returning();

  return invoice ?? null;
}

/* -------------------------------------------------------------------------- */
/* Invoice Items - Insert                                                      */
/* -------------------------------------------------------------------------- */

export async function insertInvoiceItem(
  data: InsertInvoiceItemData,
  executor: DbExecutor = db,
) {
  const [item] = await executor
    .insert(invoiceItems)
    .values({
      invoiceId: data.invoiceId,

      description: data.description,

      quantity: data.quantity,
      unitPrice: data.unitPrice,
      discount: data.discount,

      taxableAmount: data.taxableAmount,

      taxRate: data.taxRate,
      taxAmount: data.taxAmount,

      amount: data.amount,
    })
    .returning();

  return item;
}

/* -------------------------------------------------------------------------- */
/* Invoice Items - Bulk Insert                                                 */
/* -------------------------------------------------------------------------- */

export async function insertInvoiceItems(
  data: InsertInvoiceItemData[],
  executor: DbExecutor = db,
) {
  if (data.length === 0) {
    return [];
  }

  return executor.insert(invoiceItems).values(data).returning();
}

/* -------------------------------------------------------------------------- */
/* Invoice Item Find                                                          */
/* -------------------------------------------------------------------------- */

export async function findInvoiceItemById(invoiceId: string, itemId: string) {
  const [item] = await db
    .select()
    .from(invoiceItems)
    .where(
      and(eq(invoiceItems.invoiceId, invoiceId), eq(invoiceItems.id, itemId)),
    )
    .limit(1);

  return item ?? null;
}

/* -------------------------------------------------------------------------- */
/* Invoice Items List                                                          */
/* -------------------------------------------------------------------------- */

export async function listInvoiceItems(invoiceId: string) {
  return db
    .select()
    .from(invoiceItems)
    .where(eq(invoiceItems.invoiceId, invoiceId))
    .orderBy(asc(invoiceItems.createdAt));
}

/* -------------------------------------------------------------------------- */
/* Invoice Item Update                                                        */
/* -------------------------------------------------------------------------- */

export async function updateInvoiceItemById(
  invoiceId: string,
  itemId: string,
  data: UpdateInvoiceItemData,
) {
  const [item] = await db
    .update(invoiceItems)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(eq(invoiceItems.invoiceId, invoiceId), eq(invoiceItems.id, itemId)),
    )
    .returning();

  return item ?? null;
}

/* -------------------------------------------------------------------------- */
/* Invoice Item Delete                                                        */
/* -------------------------------------------------------------------------- */

export async function deleteInvoiceItemById(invoiceId: string, itemId: string) {
  const [item] = await db
    .delete(invoiceItems)
    .where(
      and(eq(invoiceItems.invoiceId, invoiceId), eq(invoiceItems.id, itemId)),
    )
    .returning();

  return item ?? null;
}
