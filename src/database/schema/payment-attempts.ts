import {
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { paymentOrders } from "./payment_orders.js";
import { payments } from "./payments.js";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export const PAYMENT_ATTEMPT_STATUSES = [
  "pending",
  "processing",
  "completed",
  "failed",
] as const;

export type PaymentAttemptStatus = (typeof PAYMENT_ATTEMPT_STATUSES)[number];

/* -------------------------------------------------------------------------- */
/*                             PAYMENT ATTEMPTS                               */
/* -------------------------------------------------------------------------- */

export const paymentAttempts = pgTable(
  "payment_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    paymentOrderId: uuid("payment_order_id")
      .notNull()
      .references(() => paymentOrders.id, {
        onDelete: "cascade",
      }),

    paymentId: uuid("payment_id").references(() => payments.id, {
      onDelete: "set null",
    }),

    provider: varchar("provider", {
      length: 30,
    })
      .notNull()
      .default("razorpay"),

    providerOrderId: varchar("provider_order_id", {
      length: 150,
    }),

    providerPaymentId: varchar("provider_payment_id", {
      length: 150,
    }),

    amount: numeric("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    status: varchar("status", {
      length: 20,
    })
      .$type<PaymentAttemptStatus>()
      .notNull()
      .default("pending"),

    failureCode: varchar("failure_code", {
      length: 100,
    }),

    failureMessage: text("failure_message"),

    startedAt: timestamp("started_at", {
      withTimezone: true,
    }),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
    }),

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
    index("payment_attempts_company_idx").on(table.companyId),

    index("payment_attempts_company_order_idx").on(
      table.companyId,
      table.paymentOrderId,
    ),

    index("payment_attempts_company_payment_idx").on(
      table.companyId,
      table.paymentId,
    ),

    index("payment_attempts_company_status_idx").on(
      table.companyId,
      table.status,
    ),

    index("payment_attempts_provider_payment_idx").on(
      table.provider,
      table.providerPaymentId,
    ),
  ],
);
