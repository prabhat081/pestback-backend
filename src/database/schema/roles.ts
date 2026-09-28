import { sql } from "drizzle-orm";

import {
  pgTable,
  uuid,
  varchar,
  text,
  boolean,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id").references(
      () => companies.id,
      {
        onDelete: "cascade",
      },
    ),

    name: varchar("name", {
      length: 100,
    }).notNull(),

    slug: varchar("slug", {
      length: 100,
    }).notNull(),

    description: text("description"),

    isSystem: boolean("is_system")
      .notNull()
      .default(false),

    isActive: boolean("is_active")
      .notNull()
      .default(true),

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
    index("roles_company_idx").on(table.companyId),

    index("roles_active_idx").on(table.isActive),

    // System roles: slug globally unique
    uniqueIndex("roles_system_slug_unique")
      .on(table.slug)
      .where(sql`${table.companyId} IS NULL`),

    // Company roles: slug unique within company
    uniqueIndex("roles_company_slug_unique")
      .on(table.companyId, table.slug)
      .where(sql`${table.companyId} IS NOT NULL`),
  ],
);