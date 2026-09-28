import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { companyUsers } from "./company-users.js";

export const TECHNICIAN_STATUSES = ["active", "inactive", "on-leave"] as const;

export type TechnicianStatus = (typeof TECHNICIAN_STATUSES)[number];

export const technicians = pgTable(
  "technicians",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    companyUserId: uuid("company_user_id")
      .notNull()
      .references(() => companyUsers.id, {
        onDelete: "cascade",
      }),

    employeeCode: varchar("employee_code", {
      length: 50,
    }).notNull(),

    status: varchar("status", {
      length: 20,
    })
      .$type<TechnicianStatus>()
      .notNull()
      .default("active"),

    joiningDate: date("joining_date"),

    notes: text("notes"),

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
    uniqueIndex("technicians_company_employee_code_unique").on(
      table.companyId,
      table.employeeCode,
    ),

    uniqueIndex("technicians_company_user_unique").on(
      table.companyId,
      table.companyUserId,
    ),

    index("technicians_company_idx").on(table.companyId),

    index("technicians_company_status_idx").on(table.companyId, table.status),

    index("technicians_company_user_idx").on(
      table.companyId,
      table.companyUserId,
    ),
  ],
);
