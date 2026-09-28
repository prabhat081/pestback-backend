import {
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
import { invoices } from "./invoices.js";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export const PAYMENT_STATUSES = [
  "pending",
  "completed",
  "failed",
  "cancelled",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  "cash",
  "upi",
  "card",
  "bank-transfer",
  "cheque",
  "online",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_PROVIDERS = ["manual", "razorpay"] as const;

export type PaymentProvider = (typeof PAYMENT_PROVIDERS)[number];

/* -------------------------------------------------------------------------- */
/*                                  PAYMENTS                                  */
/* -------------------------------------------------------------------------- */

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => invoices.id, {
        onDelete: "restrict",
      }),

    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, {
        onDelete: "restrict",
      }),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    currency: varchar("currency", {
      length: 3,
    })
      .notNull()
      .default("INR"),

    paymentMethod: varchar("payment_method", {
      length: 30,
    })
      .$type<PaymentMethod>()
      .notNull(),

    paymentProvider: varchar("payment_provider", {
      length: 30,
    })
      .$type<PaymentProvider>()
      .notNull()
      .default("manual"),

    status: varchar("status", {
      length: 20,
    })
      .$type<PaymentStatus>()
      .notNull()
      .default("pending"),

    transactionId: varchar("transaction_id", {
      length: 150,
    }),

    providerOrderId: varchar("provider_order_id", {
      length: 150,
    }),

    providerPaymentId: varchar("provider_payment_id", {
      length: 150,
    }),

    idempotencyKey: varchar("idempotency_key", {
      length: 150,
    }),

    paymentDate: timestamp("payment_date", {
      withTimezone: true,
    }),

    notes: text("notes"),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("payments_company_idx").on(table.companyId),

    index("payments_company_invoice_idx").on(table.companyId, table.invoiceId),

    index("payments_company_customer_idx").on(
      table.companyId,
      table.customerId,
    ),

    index("payments_company_status_idx").on(table.companyId, table.status),

    index("payments_company_date_idx").on(table.companyId, table.paymentDate),

    uniqueIndex("payments_company_idempotency_idx").on(
      table.companyId,
      table.idempotencyKey,
    ),

    uniqueIndex("payments_company_provider_payment_idx").on(
      table.companyId,
      table.providerPaymentId,
    ),
  ],
);
