import {
  date,
  index,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

import { companies } from "./companies.js";
import { jobs } from "./jobs.js";
import { technicians } from "./technicians.js";

export const SCHEDULE_STATUSES = [
  "scheduled",
  "confirmed",
  "in-progress",
  "completed",
  "cancelled",
  "rescheduled",
] as const;

export type ScheduleStatus = (typeof SCHEDULE_STATUSES)[number];

export const schedules = pgTable(
  "schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    companyId: uuid("company_id")
      .notNull()
      .references(() => companies.id, {
        onDelete: "cascade",
      }),

    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, {
        onDelete: "cascade",
      }),

    technicianId: uuid("technician_id")
      .notNull()
      .references(() => technicians.id, {
        onDelete: "restrict",
      }),

    scheduledDate: date("scheduled_date").notNull(),

    startTime: time("start_time").notNull(),

    endTime: time("end_time").notNull(),

    status: varchar("status", {
      length: 20,
    })
      .$type<ScheduleStatus>()
      .notNull()
      .default("scheduled"),

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
    index("schedules_company_idx").on(table.companyId),

    index("schedules_company_job_idx").on(table.companyId, table.jobId),

    index("schedules_company_technician_idx").on(
      table.companyId,
      table.technicianId,
    ),

    index("schedules_company_date_idx").on(
      table.companyId,
      table.scheduledDate,
    ),

    index("schedules_company_status_idx").on(table.companyId, table.status),

    index("schedules_technician_date_idx").on(
      table.technicianId,
      table.scheduledDate,
    ),
  ],
);
