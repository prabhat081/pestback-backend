import { and, desc, eq, ilike, ne, or, sql } from "drizzle-orm";

import { db } from "../../database/client.js";
import {
  schedules,
  type ScheduleStatus,
} from "../../database/schema/schedules.js";

import { jobs, type JobStatus } from "../../database/schema/jobs.js";

import { technicians } from "../../database/schema/technicians.js";

// ─────────────────────────────────────────────
// Find Schedule
// ─────────────────────────────────────────────

export async function findScheduleById(companyId: string, scheduleId: string) {
  const schedule = await db.query.schedules.findFirst({
    where: and(
      eq(schedules.id, scheduleId),
      eq(schedules.companyId, companyId),
    ),

    with: {
      company: true,

      job: {
        with: {
          customer: true,
          property: true,
          service: true,
        },
      },

      technician: true,
    },
  });

  return schedule ?? null;
}

// ─────────────────────────────────────────────
// List
// ─────────────────────────────────────────────

interface FindSchedulesParams {
  companyId: string;
  offset: number;
  limit: number;
  search?: string;
  status?: ScheduleStatus | "all";
  technicianId?: string;
  jobId?: string;
  scheduledDate?: string;
}

export async function findSchedules({
  companyId,
  offset,
  limit,
  search,
  status,
  technicianId,
  jobId,
  scheduledDate,
}: FindSchedulesParams) {
  const conditions = [eq(schedules.companyId, companyId)];

  if (status && status !== "all") {
    conditions.push(eq(schedules.status, status));
  }

  if (technicianId) {
    conditions.push(eq(schedules.technicianId, technicianId));
  }

  if (jobId) {
    conditions.push(eq(schedules.jobId, jobId));
  }

  if (scheduledDate) {
    conditions.push(eq(schedules.scheduledDate, scheduledDate));
  }

  if (search) {
    conditions.push(or(ilike(schedules.notes, `%${search}%`))!);
  }

  const [data, countResult] = await Promise.all([
    db.query.schedules.findMany({
      where: and(...conditions),

      with: {
        job: {
          with: {
            customer: true,
            property: true,
            service: true,
          },
        },

        technician: {
          columns: {
            id: true,
            companyId: true,
            companyUserId: true,
            employeeCode: true,
            status: true,
            joiningDate: true,
            notes: true,
            createdAt: true,
            updatedAt: true,
          },

          with: {
            companyUser: {
              columns: {
                id: true,
              },

              with: {
                user: {
                  columns: {
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },

      orderBy: [desc(schedules.scheduledDate), desc(schedules.startTime)],

      offset,
      limit,
    }),

    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(schedules)
      .where(and(...conditions)),
  ]);

  const formattedData = data.map((schedule) => {
    const { companyUser, ...technician } = schedule.technician;

    return {
      ...schedule,

      technician: {
        ...technician,

        firstName: companyUser.user.firstName,
        lastName: companyUser.user.lastName,
        email: companyUser.user.email,
      },
    };
  });

  return {
    data: formattedData,
    total: Number(countResult[0]?.count ?? 0),
  };
}

// ─────────────────────────────────────────────
// Create
// ─────────────────────────────────────────────

export async function createSchedule(
  companyId: string,
  data: {
    jobId: string;
    technicianId: string;
    scheduledDate: string;
    startTime: string;
    endTime: string;
    notes?: string;
  },
) {
  const [schedule] = await db
    .insert(schedules)
    .values({
      companyId,

      jobId: data.jobId,

      technicianId: data.technicianId,

      scheduledDate: data.scheduledDate,

      startTime: data.startTime,

      endTime: data.endTime,

      notes: data.notes ?? null,

      status: "scheduled",
    })
    .returning();

  return schedule ?? null;
}

// ─────────────────────────────────────────────
// Update Schedule
// ─────────────────────────────────────────────

export async function updateSchedule(
  companyId: string,
  scheduleId: string,
  data: {
    scheduledDate?: string;
    startTime?: string;
    endTime?: string;
    notes?: string | null;
  },
) {
  const [schedule] = await db
    .update(schedules)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(eq(schedules.id, scheduleId), eq(schedules.companyId, companyId)),
    )
    .returning();

  return schedule ?? null;
}

// ─────────────────────────────────────────────
// Update Status
// ─────────────────────────────────────────────

export async function updateScheduleStatus(
  companyId: string,
  scheduleId: string,
  status: ScheduleStatus,
) {
  const [schedule] = await db
    .update(schedules)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(
      and(eq(schedules.id, scheduleId), eq(schedules.companyId, companyId)),
    )
    .returning();

  return schedule ?? null;
}

// ─────────────────────────────────────────────
// Reassign Technician
// ─────────────────────────────────────────────

export async function reassignScheduleTechnician(
  companyId: string,
  scheduleId: string,
  technicianId: string,
) {
  const [schedule] = await db
    .update(schedules)
    .set({
      technicianId,
      updatedAt: new Date(),
    })
    .where(
      and(eq(schedules.id, scheduleId), eq(schedules.companyId, companyId)),
    )
    .returning();

  return schedule ?? null;
}

// ─────────────────────────────────────────────
// Delete
// ─────────────────────────────────────────────

export async function deleteSchedule(companyId: string, scheduleId: string) {
  const [schedule] = await db
    .delete(schedules)
    .where(
      and(eq(schedules.id, scheduleId), eq(schedules.companyId, companyId)),
    )
    .returning();

  return schedule ?? null;
}

// ─────────────────────────────────────────────
// Technician
// ─────────────────────────────────────────────

export async function findTechnicianById(
  companyId: string,
  technicianId: string,
) {
  const technician = await db.query.technicians.findFirst({
    where: and(
      eq(technicians.id, technicianId),
      eq(technicians.companyId, companyId),
    ),
  });

  return technician ?? null;
}

// ─────────────────────────────────────────────
// Schedule Conflict
// ─────────────────────────────────────────────

export async function findScheduleConflict(
  companyId: string,
  technicianId: string,
  scheduledDate: string,
  startTime: string,
  endTime: string,
  excludeScheduleId?: string,
) {
  const conditions = [
    eq(schedules.companyId, companyId),

    eq(schedules.technicianId, technicianId),

    eq(schedules.scheduledDate, scheduledDate),

    // Existing start < new end
    sql`${schedules.startTime} < ${endTime}`,

    // Existing end > new start
    sql`${schedules.endTime} > ${startTime}`,

    // Cancelled/rescheduled schedules don't block time
    sql`${schedules.status} NOT IN ('cancelled', 'rescheduled')`,
  ];

  if (excludeScheduleId) {
    conditions.push(ne(schedules.id, excludeScheduleId));
  }

  const conflict = await db.query.schedules.findFirst({
    where: and(...conditions),
  });

  return conflict ?? null;
}

// ─────────────────────────────────────────────
// Service Capability
// ─────────────────────────────────────────────

export async function findTechnicianServiceCapability(
  technicianId: string,
  serviceCatalogId: string,
) {
  // IMPORTANT:
  // Replace this query with your actual technician-service
  // junction table/schema if the table name differs.

  const result = await db.execute(sql`
    SELECT 1
    FROM technician_services
    WHERE technician_id = ${technicianId}
      AND service_catalog_id = ${serviceCatalogId}
    LIMIT 1
  `);

  return result.rows.length > 0 ? true : null;
}

// ─────────────────────────────────────────────
// Find Job
// ─────────────────────────────────────────────

export async function findJobById(companyId: string, jobId: string) {
  const job = await db.query.jobs.findFirst({
    where: and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)),
  });

  return job ?? null;
}

// ─────────────────────────────────────────────
// Update Job Status
// ─────────────────────────────────────────────

export async function updateJobStatus(
  companyId: string,
  jobId: string,
  status: JobStatus,
) {
  const [job] = await db
    .update(jobs)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    .returning();

  return job ?? null;
}
