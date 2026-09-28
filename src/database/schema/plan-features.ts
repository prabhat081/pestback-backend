import {
  boolean,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { plans } from "./plans.js";

export const PLAN_FEATURE_TYPES = ["limit", "boolean"] as const;

export type PlanFeatureType = (typeof PLAN_FEATURE_TYPES)[number];

export const planFeatures = pgTable(
  "plan_features",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    planId: uuid("plan_id")
      .notNull()
      .references(() => plans.id, {
        onDelete: "cascade",
      }),

    featureKey: varchar("feature_key", {
      length: 100,
    }).notNull(),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    type: varchar("type", {
      length: 20,
    })
      .$type<PlanFeatureType>()
      .notNull(),

    limit: integer("limit"),

    enabled: boolean("enabled").notNull().default(false),

    unit: varchar("unit", {
      length: 30,
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
    uniqueIndex("plan_features_plan_feature_key_unique").on(
      table.planId,
      table.featureKey,
    ),

    index("plan_features_plan_idx").on(table.planId),

    index("plan_features_feature_key_idx").on(table.featureKey),
  ],
);
