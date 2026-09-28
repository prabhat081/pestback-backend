import {
  boolean,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { customers } from "./customers.js";
import { jobs } from "./jobs.js";
import { properties } from "./properties.js";

export const INVOICE_STATUSES = [
  "draft",
  "issued",
  "partially-paid",
  "paid",
  "cancelled",
] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export const GST_TYPES = ["cgst-sgst", "igst"] as const;

export type GstType = (typeof GST_TYPES)[number];

export const invoices = pgTable(
  "invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, {
        onDelete: "restrict",
      }),

    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, {
        onDelete: "restrict",
      }),

    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, {
        onDelete: "restrict",
      }),

    invoiceNumber: varchar("invoice_number", {
      length: 50,
    }).notNull(),

    status: varchar("status", {
      length: 20,
    })
      .$type<InvoiceStatus>()
      .notNull()
      .default("draft"),

    issueDate: date("issue_date"),

    dueDate: date("due_date"),

    /*
     * GST
     *
     * taxApplied = false
     *   => no GST is applied
     *
     * taxApplied = true
     *   => gstType + GST amounts are applicable
     */
    taxApplied: boolean("tax_applied").notNull().default(false),

    gstType: varchar("gst_type", {
      length: 20,
    }).$type<GstType>(),

    subtotal: numeric("subtotal", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    discount: numeric("discount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    taxableAmount: numeric("taxable_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    cgstAmount: numeric("cgst_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    sgstAmount: numeric("sgst_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    igstAmount: numeric("igst_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    totalTax: numeric("total_tax", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    total: numeric("total", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    notes: text("notes"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },

  (table) => [
    uniqueIndex("invoices_company_invoice_number_unique").on(
      table.companyId,
      table.invoiceNumber,
    ),

    index("invoices_company_idx").on(table.companyId),

    index("invoices_company_customer_idx").on(
      table.companyId,
      table.customerId,
    ),

    index("invoices_company_property_idx").on(
      table.companyId,
      table.propertyId,
    ),

    index("invoices_company_job_idx").on(table.companyId, table.jobId),

    index("invoices_company_status_idx").on(table.companyId, table.status),

    index("invoices_company_issue_date_idx").on(
      table.companyId,
      table.issueDate,
    ),

    index("invoices_company_due_date_idx").on(table.companyId, table.dueDate),
  ],
);

export const invoiceItems = pgTable(
  "invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, {
        onDelete: "cascade",
      }),

    /*
     * Snapshot of what was billed.
     * We intentionally don't depend on the current
     * service catalog price/name for historical invoices.
     */
    description: varchar("description", {
      length: 255,
    }).notNull(),

    quantity: numeric("quantity", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("1"),

    unitPrice: numeric("unit_price", {
      precision: 12,
      scale: 2,
    }).notNull(),

    discount: numeric("discount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    taxableAmount: numeric("taxable_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    taxRate: numeric("tax_rate", {
      precision: 5,
      scale: 2,
    })
      .notNull()
      .default("0"),

    taxAmount: numeric("tax_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },

  (table) => [index("invoice_items_invoice_idx").on(table.invoiceId)],
);
