import {
  boolean,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    firstName: varchar("first_name", {
      length: 100,
    }).notNull(),

    lastName: varchar("last_name", {
      length: 100,
    }).notNull(),

    email: varchar("email", {
      length: 255,
    }),

    phone: varchar("phone", {
      length: 30,
    }).notNull(),

    notes: text("notes"),

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
    index("customers_company_idx").on(table.companyId),

    index("customers_company_active_idx").on(
      table.companyId,
      table.isActive,
    ),

    index("customers_company_phone_idx").on(
      table.companyId,
      table.phone,
    ),

    index("customers_company_email_idx").on(
      table.companyId,
      table.email,
    ),
  ],
);