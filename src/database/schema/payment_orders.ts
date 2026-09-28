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

export const PAYMENT_ORDER_STATUSES = [
  "pending",
  "paid",
  "expired",
  "cancelled",
] as const;

export type PaymentOrderStatus = (typeof PAYMENT_ORDER_STATUSES)[number];

export const PAYMENT_ORDER_PROVIDERS = ["razorpay"] as const;

export type PaymentOrderProvider = (typeof PAYMENT_ORDER_PROVIDERS)[number];

/* -------------------------------------------------------------------------- */
/*                              PAYMENT ORDERS                                */
/* -------------------------------------------------------------------------- */

export const paymentOrders = pgTable(
  "payment_orders",
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

    provider: varchar("provider", {
      length: 30,
    })
      .$type<PaymentOrderProvider>()
      .notNull(),

    providerOrderId: varchar("provider_order_id", {
      length: 150,
    }),

    paymentLinkToken: varchar("payment_link_token", {
      length: 200,
    }).notNull(),

    status: varchar("status", {
      length: 20,
    })
      .$type<PaymentOrderStatus>()
      .notNull()
      .default("pending"),

    expiresAt: timestamp("expires_at", {
      withTimezone: true,
    }),

    paidAt: timestamp("paid_at", {
      withTimezone: true,
    }),

    cancelledAt: timestamp("cancelled_at", {
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
    index("payment_orders_company_idx").on(table.companyId),

    index("payment_orders_company_invoice_idx").on(
      table.companyId,
      table.invoiceId,
    ),

    index("payment_orders_company_customer_idx").on(
      table.companyId,
      table.customerId,
    ),

    index("payment_orders_company_status_idx").on(
      table.companyId,
      table.status,
    ),

    index("payment_orders_company_expiry_idx").on(
      table.companyId,
      table.expiresAt,
    ),

    uniqueIndex("payment_orders_link_token_idx").on(table.paymentLinkToken),

    uniqueIndex("payment_orders_provider_order_idx").on(
      table.provider,
      table.providerOrderId,
    ),
  ],
);
