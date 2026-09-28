import {
  decimal,
  index,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { subscriptionInvoices } from "./subscription-invoices.js";

export const subscriptionInvoiceItems = pgTable(
  "subscription_invoice_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    invoiceId: uuid("invoice_id")
      .notNull()
      .references(() => subscriptionInvoices.id, {
        onDelete: "cascade",
      }),

    description: varchar("description", {
      length: 255,
    }).notNull(),

    quantity: integer("quantity").notNull().default(1),

    unitPrice: decimal("unit_price", {
      precision: 12,
      scale: 2,
    }).notNull(),

    discountAmount: decimal("discount_amount", {
      precision: 12,
      scale: 2,
    })
      .notNull()
      .default("0"),

    taxableAmount: decimal("taxable_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    totalAmount: decimal("total_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("subscription_invoice_items_invoice_idx").on(table.invoiceId),
  ],
);
