import {
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

export const SUBSCRIPTION_PAYMENT_STATUSES = [
  "created",
  "pending",
  "paid",
  "failed",
  "refunded",
  "partially_refunded",
] as const;

export type SubscriptionPaymentStatus =
  (typeof SUBSCRIPTION_PAYMENT_STATUSES)[number];

export const SUBSCRIPTION_PAYMENT_PROVIDERS = [
  "razorpay",
] as const;

export type SubscriptionPaymentProvider =
  (typeof SUBSCRIPTION_PAYMENT_PROVIDERS)[number];

export const subscriptionPayments = pgTable(
  "subscription_payments",
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
        onDelete: "cascade",
      }),

    provider: varchar("provider", {
      length: 30,
    })
      .$type<SubscriptionPaymentProvider>()
      .notNull()
      .default("razorpay"),

    status: varchar("status", {
      length: 30,
    })
      .$type<SubscriptionPaymentStatus>()
      .notNull()
      .default("created"),

    amount: decimal("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    currency: varchar("currency", {
      length: 3,
    })
      .notNull()
      .default("INR"),

    providerPaymentId: varchar(
      "provider_payment_id",
      {
        length: 150,
      },
    ),

    providerOrderId: varchar(
      "provider_order_id",
      {
        length: 150,
      },
    ),

    providerSubscriptionId: varchar(
      "provider_subscription_id",
      {
        length: 150,
      },
    ),

    failureReason: text("failure_reason"),

    paidAt: timestamp("paid_at", {
      withTimezone: true,
    }),

    refundedAt: timestamp("refunded_at", {
      withTimezone: true,
    }),

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
    index("subscription_payments_company_idx").on(
      table.companyId,
    ),

    index("subscription_payments_subscription_idx").on(
      table.subscriptionId,
    ),

    index("subscription_payments_status_idx").on(
      table.status,
    ),

    index("subscription_payments_created_at_idx").on(
      table.createdAt,
    ),

    uniqueIndex(
      "subscription_payments_provider_payment_id_unique",
    ).on(table.providerPaymentId),

    uniqueIndex(
      "subscription_payments_provider_order_id_unique",
    ).on(table.providerOrderId),
  ],
);