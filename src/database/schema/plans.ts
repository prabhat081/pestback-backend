import {
  boolean,
  decimal,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const PLAN_STATUSES = ["active", "inactive"] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];

export const BILLING_INTERVALS = ["monthly", "yearly"] as const;

export type BillingInterval = (typeof BILLING_INTERVALS)[number];

export const plans = pgTable(
  "plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    slug: varchar("slug", {
      length: 100,
    }).notNull(),

    description: text("description"),

    monthlyPrice: decimal("monthly_price", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    yearlyPrice: decimal("yearly_price", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    currency: varchar("currency", {
      length: 3,
    })
      .notNull()
      .default("INR"),

    trialDays: integer("trial_days").notNull().default(0),

    status: varchar("status", {
      length: 20,
    })
      .$type<PlanStatus>()
      .notNull()
      .default("active"),

    displayOrder: integer("display_order").notNull().default(0),

    isPopular: boolean("is_popular").notNull().default(false),

    isPublic: boolean("is_public").notNull().default(true),

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
    uniqueIndex("plans_slug_unique").on(table.slug),

    index("plans_status_idx").on(table.status),

    index("plans_display_order_idx").on(table.displayOrder),

    index("plans_public_status_idx").on(table.isPublic, table.status),
  ],
);
