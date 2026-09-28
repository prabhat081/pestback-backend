import {
  boolean,
  date,
  decimal,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { subscriptions } from "./subscriptions.js";

export const SUBSCRIPTION_INVOICE_STATUSES = [
  "draft",
  "issued",
  "paid",
  "overdue",
  "void",
] as const;

export type SubscriptionInvoiceStatus =
  (typeof SUBSCRIPTION_INVOICE_STATUSES)[number];

export const SUBSCRIPTION_TAX_TYPES = ["gst", "other"] as const;

export type SubscriptionTaxType = (typeof SUBSCRIPTION_TAX_TYPES)[number];

export const subscriptionInvoices = pgTable(
  "subscription_invoices",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    subscriptionId: uuid("subscription_id")
      .notNull()
      .references(() => subscriptions.id, {
        onDelete: "restrict",
      }),

    invoiceNumber: varchar("invoice_number", {
      length: 50,
    }).notNull(),

    status: varchar("status", {
      length: 20,
    })
      .$type<SubscriptionInvoiceStatus>()
      .notNull()
      .default("draft"),

    currency: varchar("currency", {
      length: 3,
    })
      .notNull()
      .default("INR"),

    invoiceDate: date("invoice_date").notNull(),

    dueDate: date("due_date"),

    /*
     * Amount calculation
     */
    subtotal: decimal("subtotal", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    discountAmount: decimal("discount_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    taxableAmount: decimal("taxable_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    /*
     * Tax is optional.
     */
    taxEnabled: boolean("tax_enabled").notNull().default(false),

    taxType: varchar("tax_type", {
      length: 20,
    }).$type<SubscriptionTaxType>(),

    taxRate: decimal("tax_rate", {
      precision: 5,
      scale: 2,
    }),

    taxAmount: decimal("tax_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    /*
     * GST breakup.
     * These remain zero/null when GST is not applicable.
     */
    cgstRate: decimal("cgst_rate", {
      precision: 5,
      scale: 2,
    }),

    cgstAmount: decimal("cgst_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    sgstRate: decimal("sgst_rate", {
      precision: 5,
      scale: 2,
    }),

    sgstAmount: decimal("sgst_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    igstRate: decimal("igst_rate", {
      precision: 5,
      scale: 2,
    }),

    igstAmount: decimal("igst_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    totalAmount: decimal("total_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    /*
     * Optional payment information.
     */
    paidAt: timestamp("paid_at", {
      withTimezone: true,
    }),

    /*
     * Generated PDF stored in object storage.
     * Only URL is stored in PostgreSQL.
     */
    pdfUrl: text("pdf_url"),

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
    uniqueIndex("subscription_invoices_invoice_number_unique").on(
      table.invoiceNumber,
    ),

    index("subscription_invoices_company_idx").on(table.companyId),

    index("subscription_invoices_subscription_idx").on(table.subscriptionId),

    index("subscription_invoices_status_idx").on(table.status),

    index("subscription_invoices_invoice_date_idx").on(table.invoiceDate),
  ],
);
