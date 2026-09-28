import {
  boolean,
  decimal,
  index,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { plans } from "./plans.js";

export const SUBSCRIPTION_STATUSES = [
  "pending",
  "trialing",
  "active",
  "past_due",
  "paused",
  "cancelled",
  "expired",
] as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUSES)[number];

export const SUBSCRIPTION_BILLING_INTERVALS = [
  "monthly",
  "yearly",
] as const;

export type SubscriptionBillingInterval =
  (typeof SUBSCRIPTION_BILLING_INTERVALS)[number];

export const SUBSCRIPTION_PROVIDERS = [
  "razorpay",
] as const;

export type SubscriptionProvider =
  (typeof SUBSCRIPTION_PROVIDERS)[number];

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id")
      .defaultRandom()
      .primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, {
        onDelete: "restrict",
      }),

    /**
     * Subscription lifecycle:
     *
     * pending   -> Razorpay subscription created
     * trialing  -> Free/trial subscription
     * active    -> Subscription activated
     * past_due  -> Payment failed
     * paused    -> Subscription paused
     * cancelled -> Subscription cancelled
     * expired   -> Subscription completed/ended
     */
    status: varchar("status", {
      length: 20,
    })
      .$type<SubscriptionStatus>()
      .notNull()
      .default("pending"),

    billingInterval: varchar("billing_interval", {
      length: 20,
    })
      .$type<SubscriptionBillingInterval>()
      .notNull(),

    /**
     * Price snapshot.
     *
     * The plan price may change later, but an existing
     * subscription keeps the agreed price.
     */
    amount: decimal("amount", {
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
      .$type<SubscriptionProvider>()
      .notNull()
      .default("razorpay"),

    providerCustomerId: varchar(
      "provider_customer_id",
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

    /**
     * Marks the company's current subscription.
     *
     * Historical subscriptions should become false
     * when they are no longer current.
     */
    isCurrent: boolean("is_current")
      .notNull()
      .default(true),

    startedAt: timestamp("started_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),

    trialEndsAt: timestamp("trial_ends_at", {
      withTimezone: true,
    }),

    currentPeriodStart: timestamp(
      "current_period_start",
      {
        withTimezone: true,
      },
    ),

    currentPeriodEnd: timestamp(
      "current_period_end",
      {
        withTimezone: true,
      },
    ),

    cancelAtPeriodEnd: boolean(
      "cancel_at_period_end",
    )
      .notNull()
      .default(false),

    cancelledAt: timestamp("cancelled_at", {
      withTimezone: true,
    }),

    endedAt: timestamp("ended_at", {
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
    index("subscriptions_company_idx").on(
      table.companyId,
    ),

    index("subscriptions_company_current_idx").on(
      table.companyId,
      table.isCurrent,
    ),

    index("subscriptions_company_status_idx").on(
      table.companyId,
      table.status,
    ),

    index("subscriptions_plan_idx").on(
      table.planId,
    ),

    index("subscriptions_period_end_idx").on(
      table.currentPeriodEnd,
    ),

    /**
     * Razorpay subscription ID must be unique.
     *
     * Multiple NULL values are allowed, which is
     * required for free subscriptions.
     */
    uniqueIndex(
      "subscriptions_provider_subscription_id_unique",
    ).on(
      table.providerSubscriptionId,
    ),
  ],
);