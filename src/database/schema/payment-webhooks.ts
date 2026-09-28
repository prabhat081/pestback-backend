import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

export const PAYMENT_WEBHOOK_STATUSES = [
  "pending",
  "processing",
  "processed",
  "failed",
] as const;

export type PaymentWebhookStatus =
  (typeof PAYMENT_WEBHOOK_STATUSES)[number];

export const PAYMENT_WEBHOOK_PROVIDERS = [
  "razorpay",
] as const;

export type PaymentWebhookProvider =
  (typeof PAYMENT_WEBHOOK_PROVIDERS)[number];

/* -------------------------------------------------------------------------- */
/*                             PAYMENT WEBHOOKS                               */
/* -------------------------------------------------------------------------- */

export const paymentWebhooks = pgTable(
  "payment_webhooks",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    /*
     * companyId can be nullable because the webhook request may arrive
     * before we can identify the PestBack company from the gateway payload.
     */
    companyId: uuid("company_id").references(() => companies.id, {
      onDelete: "cascade",
    }),

    provider: varchar("provider", {
      length: 30,
    })
      .$type<PaymentWebhookProvider>()
      .notNull(),

    /*
     * Gateway event ID.
     * This is the main idempotency key for webhook events.
     */
    eventId: varchar("event_id", {
      length: 200,
    }).notNull(),

    eventType: varchar("event_type", {
      length: 100,
    }).notNull(),

    /*
     * Store the original webhook payload.
     * JSONB can be introduced later if querying payload fields becomes necessary.
     */
    payload: text("payload").notNull(),

    /*
     * Signature received from the payment provider.
     */
    signature: varchar("signature", {
      length: 500,
    }),

    status: varchar("status", {
      length: 20,
    })
      .$type<PaymentWebhookStatus>()
      .notNull()
      .default("pending"),

    processedAt: timestamp("processed_at", {
      withTimezone: true,
    }),

    errorMessage: text("error_message"),

    retryCount: integer("retry_count")
      .notNull()
      .default(0),

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
    /*
     * Same provider + event must never be stored twice.
     */
    uniqueIndex("payment_webhooks_provider_event_idx").on(
      table.provider,
      table.eventId,
    ),

    index("payment_webhooks_company_idx").on(
      table.companyId,
    ),

    index("payment_webhooks_company_status_idx").on(
      table.companyId,
      table.status,
    ),

    index("payment_webhooks_provider_idx").on(
      table.provider,
    ),

    index("payment_webhooks_created_at_idx").on(
      table.createdAt,
    ),
  ],
);