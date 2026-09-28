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

import { plans } from "./plans.js";

export const BILLING_PLAN_STATUSES = ["active", "inactive"] as const;

export type BillingPlanStatus = (typeof BILLING_PLAN_STATUSES)[number];

export const BILLING_PLAN_PROVIDERS = ["razorpay"] as const;

export type BillingPlanProvider = (typeof BILLING_PLAN_PROVIDERS)[number];

export const BILLING_PLAN_INTERVALS = ["monthly", "yearly"] as const;

export type BillingPlanInterval = (typeof BILLING_PLAN_INTERVALS)[number];

export const subscriptionBillingPlans = pgTable(
  "subscription_billing_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, {
        onDelete: "cascade",
      }),

    provider: varchar("provider", {
      length: 30,
    })
      .$type<BillingPlanProvider>()
      .notNull()
      .default("razorpay"),

    billingInterval: varchar("billing_interval", {
      length: 20,
    })
      .$type<BillingPlanInterval>()
      .notNull(),

    amount: decimal("amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    currency: varchar("currency", {
      length: 3,
    })
      .notNull()
      .default("INR"),

    providerPlanId: varchar("provider_plan_id", {
      length: 150,
    }).notNull(),

    status: varchar("status", {
      length: 20,
    })
      .$type<BillingPlanStatus>()
      .notNull()
      .default("active"),

    isCurrent: boolean("is_current").notNull().default(true),

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
    uniqueIndex("subscription_billing_plans_provider_plan_unique").on(
      table.provider,
      table.providerPlanId,
    ),

    uniqueIndex("subscription_billing_plans_plan_interval_provider_unique").on(
      table.planId,
      table.billingInterval,
      table.provider,
    ),

    index("subscription_billing_plans_plan_idx").on(table.planId),

    index("subscription_billing_plans_provider_idx").on(table.provider),

    index("subscription_billing_plans_status_idx").on(table.status),

    index("subscription_billing_plans_current_idx").on(table.isCurrent),
  ],
);
