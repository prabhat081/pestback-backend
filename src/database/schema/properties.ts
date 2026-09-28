import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { customers } from "./customers.js";

export const properties = pgTable(
  "properties",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, {
        onDelete: "cascade",
      }),

    name: varchar("name", {
      length: 150,
    }).notNull(),

    propertyType: varchar("property_type", {
      length: 30,
    }).notNull(),

    address: text("address").notNull(),

    city: varchar("city", {
      length: 100,
    }).notNull(),

    state: varchar("state", {
      length: 100,
    }),

    postalCode: varchar("postal_code", {
      length: 20,
    }),

    notes: text("notes"),

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
    index("properties_company_idx").on(table.companyId),

    index("properties_customer_idx").on(table.customerId),

    index("properties_company_customer_idx").on(
      table.companyId,
      table.customerId,
    ),

    index("properties_company_active_idx").on(table.companyId, table.isActive),
  ],
);
