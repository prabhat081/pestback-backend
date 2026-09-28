import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  numeric,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";

export const serviceCatalog = pgTable(
  "service_catalog",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", { length: 150 }).notNull(),

    slug: varchar("slug", { length: 150 }).notNull(),

    serviceType: varchar("service_type", { length: 50 }).notNull(),

    description: text("description"),

    defaultPrice: numeric("default_price", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    defaultFrequency: varchar("default_frequency", {
      length: 30,
    }),

    warrantyDays: numeric("warranty_days", {
      precision: 6,
      scale: 0,
    })
      .notNull()
      .default("0"),

    isActive: boolean("is_active").notNull().default(true),

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
    index("service_catalog_company_idx").on(table.companyId),

    index("service_catalog_active_idx").on(table.companyId, table.isActive),

    index("service_catalog_type_idx").on(table.companyId, table.serviceType),

    uniqueIndex("service_catalog_company_slug_unique").on(
      table.companyId,
      table.slug,
    ),
  ],
);
