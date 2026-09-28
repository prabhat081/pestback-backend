import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { customers } from "./customers.js";
import { properties } from "./properties.js";
import { services } from "./services.js";
import { technicians } from "./technicians.js";

export const JOB_STATUSES = [
  "pending",
  "scheduled",
  "in-progress",
  "completed",
  "cancelled",
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export const JOB_PRIORITIES = ["low", "medium", "high", "urgent"] as const;

export type JobPriority = (typeof JOB_PRIORITIES)[number];

export const jobs = pgTable(
  "jobs",
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
        onDelete: "restrict",
      }),

    propertyId: uuid("property_id")
      .notNull()
      .references(() => properties.id, {
        onDelete: "restrict",
      }),

    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, {
        onDelete: "restrict",
      }),

    technicianId: uuid("technician_id").references(() => technicians.id, {
      onDelete: "set null",
    }),

    jobNumber: varchar("job_number", {
      length: 50,
    }).notNull(),

    status: varchar("status", {
      length: 20,
    })
      .$type<JobStatus>()
      .notNull()
      .default("pending"),

    priority: varchar("priority", {
      length: 20,
    })
      .$type<JobPriority>()
      .notNull()
      .default("medium"),

    notes: text("notes"),

    completionNotes: text("completion_notes"),

    completedAt: timestamp("completed_at", {
      withTimezone: true,
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
    uniqueIndex("jobs_company_job_number_unique").on(
      table.companyId,
      table.jobNumber,
    ),

    index("jobs_company_idx").on(table.companyId),

    index("jobs_company_status_idx").on(table.companyId, table.status),

    index("jobs_company_technician_idx").on(
      table.companyId,
      table.technicianId,
    ),

    index("jobs_company_customer_idx").on(table.companyId, table.customerId),

    index("jobs_company_property_idx").on(table.companyId, table.propertyId),

    index("jobs_company_service_idx").on(table.companyId, table.serviceId),

    index("jobs_company_priority_idx").on(table.companyId, table.priority),
  ],
);
