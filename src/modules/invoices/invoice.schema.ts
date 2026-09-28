import { z } from "zod";

import { GST_TYPES, INVOICE_STATUSES } from "../../database/schema/invoices.js";

/* -------------------------------------------------------------------------- */
/* Common                                                                     */
/* -------------------------------------------------------------------------- */

const uuidSchema = z.string().uuid();

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid monetary value")
  .refine((value) => Number(value) >= 0, {
    message: "Value cannot be negative",
  });

const quantitySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid quantity")
  .refine((value) => Number(value) > 0, {
    message: "Quantity must be greater than 0",
  });

const taxRateSchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Invalid tax rate")
  .refine((value) => {
    const rate = Number(value);
    return rate >= 0 && rate <= 100;
  }, "Tax rate must be between 0 and 100");

/* -------------------------------------------------------------------------- */
/* Invoice Item                                                               */
/* -------------------------------------------------------------------------- */

export const invoiceItemSchema = z.object({
  description: z.string().trim().min(1, "Description is required").max(255),

  quantity: quantitySchema,

  unitPrice: moneySchema,

  discount: moneySchema.optional().default("0"),

  taxRate: taxRateSchema.optional().default("0"),
});

/* -------------------------------------------------------------------------- */
/* Create Invoice                                                             */
/* -------------------------------------------------------------------------- */

export const createInvoiceSchema = z
  .object({
    customerId: uuidSchema,

    propertyId: uuidSchema,

    jobId: uuidSchema,

    issueDate: dateSchema.optional(),

    dueDate: dateSchema.optional(),

    taxApplied: z.boolean().default(false),

    gstType: z.enum(GST_TYPES).optional(),

    discount: moneySchema.optional().default("0"),

    items: z
      .array(invoiceItemSchema)
      .min(1, "At least one invoice item is required"),

    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    /* ---------------------------------------------------------------------- */
    /* Due date                                                               */
    /* ---------------------------------------------------------------------- */

    if (data.issueDate && data.dueDate) {
      if (data.dueDate < data.issueDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["dueDate"],
          message: "Due date cannot be before issue date",
        });
      }
    }

    /* ---------------------------------------------------------------------- */
    /* GST                                                                    */
    /* ---------------------------------------------------------------------- */

    if (!data.taxApplied) {
      if (data.gstType !== undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["gstType"],
          message: "GST type cannot be provided when tax is not applied",
        });
      }

      data.items.forEach((item, index) => {
        if (item.taxRate !== undefined && Number(item.taxRate) !== 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["items", index, "taxRate"],
            message: "Tax rate must be 0 when GST is not applied",
          });
        }
      });

      return;
    }

    if (!data.gstType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gstType"],
        message: "GST type is required when tax is applied",
      });
    }
  });

/* -------------------------------------------------------------------------- */
/* Update Invoice                                                             */
/* -------------------------------------------------------------------------- */

export const updateInvoiceSchema = z
  .object({
    issueDate: dateSchema.optional(),

    dueDate: dateSchema.optional(),

    taxApplied: z.boolean().optional(),

    gstType: z.enum(GST_TYPES).optional(),

    discount: moneySchema.optional(),

    notes: z.string().trim().max(2000).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.taxApplied === false && data.gstType !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gstType"],
        message: "GST type cannot be provided when tax is disabled",
      });
    }

    if (data.taxApplied === true && data.gstType === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["gstType"],
        message: "GST type is required when GST is enabled",
      });
    }
  });

/* -------------------------------------------------------------------------- */
/* Invoice Status                                                             */
/* -------------------------------------------------------------------------- */

export const updateInvoiceStatusSchema = z.object({
  status: z.enum(INVOICE_STATUSES),
});

/* -------------------------------------------------------------------------- */
/* Add Invoice Item                                                           */
/* -------------------------------------------------------------------------- */

export const addInvoiceItemSchema = invoiceItemSchema;

/* -------------------------------------------------------------------------- */
/* Update Invoice Item                                                        */
/* -------------------------------------------------------------------------- */

export const updateInvoiceItemSchema = z.object({
  description: z.string().trim().min(1).max(255).optional(),

  quantity: quantitySchema.optional(),

  unitPrice: moneySchema.optional(),

  discount: moneySchema.optional(),

  taxRate: taxRateSchema.optional(),
});

/* -------------------------------------------------------------------------- */
/* Invoice ID Params                                                          */
/* -------------------------------------------------------------------------- */

export const invoiceIdParamSchema = z.object({
  id: uuidSchema,
});

/* -------------------------------------------------------------------------- */
/* Invoice Item Params                                                        */
/* -------------------------------------------------------------------------- */

export const invoiceItemParamSchema = z.object({
  id: uuidSchema,

  itemId: uuidSchema,
});

/* -------------------------------------------------------------------------- */
/* List Query                                                                 */
/* -------------------------------------------------------------------------- */

export const invoiceListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(20),

    search: z.string().trim().max(100).optional(),

    status: z.enum(INVOICE_STATUSES).optional(),

    customerId: uuidSchema.optional(),

    propertyId: uuidSchema.optional(),

    jobId: uuidSchema.optional(),

    fromDate: dateSchema.optional(),

    toDate: dateSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.fromDate && data.toDate && data.toDate < data.fromDate) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["toDate"],
        message: "toDate cannot be before fromDate",
      });
    }
  });

/* -------------------------------------------------------------------------- */
/* Inferred Types                                                             */
/* -------------------------------------------------------------------------- */

export type CreateInvoiceSchemaInput = z.infer<typeof createInvoiceSchema>;

export type UpdateInvoiceSchemaInput = z.infer<typeof updateInvoiceSchema>;

export type UpdateInvoiceStatusSchemaInput = z.infer<
  typeof updateInvoiceStatusSchema
>;

export type AddInvoiceItemSchemaInput = z.infer<typeof addInvoiceItemSchema>;

export type UpdateInvoiceItemSchemaInput = z.infer<
  typeof updateInvoiceItemSchema
>;

export type InvoiceListQuerySchemaInput = z.infer<
  typeof invoiceListQuerySchema
>;
