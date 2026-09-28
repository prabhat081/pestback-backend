import {
  index,
  pgTable,
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

import { serviceCatalog } from "./service-catalog.js";
import { technicians } from "./technicians.js";

export const technicianServices = pgTable(
  "technician_services",
  {
    technicianId: uuid("technician_id")
      .notNull()
      .references(() => technicians.id, {
        onDelete: "cascade",
      }),

    serviceCatalogId: uuid("service_catalog_id")
      .notNull()
      .references(() => serviceCatalog.id, {
        onDelete: "cascade",
      }),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },

  (table) => [
    primaryKey({
      columns: [table.technicianId, table.serviceCatalogId],
    }),

    index("technician_services_technician_idx").on(table.technicianId),

    index("technician_services_catalog_idx").on(table.serviceCatalogId),
  ],
);
