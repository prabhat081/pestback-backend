import {
  boolean,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { customers } from "./customers.js";
import { properties } from "./properties.js";
import { serviceCatalog } from "./service-catalog.js";

export const services = pgTable(
  "services",
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

    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, {
        onDelete: "cascade",
      }),

    serviceCatalogId: uuid("service_catalog_id")
      .notNull()
      .references(() => serviceCatalog.id, {
        onDelete: "restrict",
      }),

    name: varchar("name", { length: 150 }).notNull(),

    serviceType: varchar("service_type", {
      length: 50,
    }).notNull(),

    description: text("description"),

    price: numeric("price", {
      precision: 12,
      scale: 2,
    }).notNull(),

    frequency: varchar("frequency", {
      length: 30,
    }),

    startDate: timestamp("start_date", {
      withTimezone: true,
    }).notNull(),

    endDate: timestamp("end_date", {
      withTimezone: true,
    }),

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
    index("services_company_idx").on(table.companyId),

    index("services_customer_idx").on(table.customerId),

    index("services_property_idx").on(table.propertyId),

    index("services_catalog_idx").on(table.serviceCatalogId),

    index("services_company_customer_idx").on(
      table.companyId,
      table.customerId,
    ),

    index("services_company_property_idx").on(
      table.companyId,
      table.propertyId,
    ),

    index("services_company_active_idx").on(table.companyId, table.isActive),

    index("services_start_date_idx").on(table.startDate),
  ],
);
