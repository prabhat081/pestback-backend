import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const RAZORPAY_WEBHOOK_EVENT_STATUSES = [
  "received",
  "processed",
  "failed",
] as const;

export type RazorpayWebhookEventStatus =
  (typeof RAZORPAY_WEBHOOK_EVENT_STATUSES)[number];

export const razorpayWebhookEvents = pgTable(
  "razorpay_webhook_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    provider: varchar("provider", {
      length: 30,
    })
      .notNull()
      .default("razorpay"),

    eventId: varchar("event_id", {
      length: 150,
    }).notNull(),

    event: varchar("event", {
      length: 150,
    }).notNull(),

    status: varchar("status", {
      length: 20,
    })
      .$type<RazorpayWebhookEventStatus>()
      .notNull()
      .default("received"),

    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),

    errorMessage: text("error_message"),

    processedAt: timestamp("processed_at", {
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
    uniqueIndex("razorpay_webhook_events_provider_event_unique").on(
      table.provider,
      table.eventId,
    ),

    index("razorpay_webhook_events_event_idx").on(table.event),

    index("razorpay_webhook_events_status_idx").on(table.status),

    index("razorpay_webhook_events_created_at_idx").on(table.createdAt),
  ],
);
