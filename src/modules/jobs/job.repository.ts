import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../database/client.js";

import {
  customers,
  properties,
  services,
  technicianServices,
  technicians,
  jobs,
  schedules,
} from "../../database/schema/index.js";

import type { JobListQuery, UpdateJobInput } from "./job.types.js";

import type { JobPriority, JobStatus } from "../../database/schema/jobs.js";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/* -------------------------------------------------------------------------- */
/*                               VALIDATIONS                                  */
/* -------------------------------------------------------------------------- */

export async function findCustomer(companyId: string, customerId: string) {
  const [customer] = await db
    .select({
      id: customers.id,
      companyId: customers.companyId,
    })
    .from(customers)
    .where(
      and(eq(customers.id, customerId), eq(customers.companyId, companyId)),
    )
    .limit(1);

  return customer ?? null;
}

export async function findProperty(
  companyId: string,
  customerId: string,
  propertyId: string,
) {
  const [property] = await db
    .select({
      id: properties.id,
      companyId: properties.companyId,
      customerId: properties.customerId,
    })
    .from(properties)
    .where(
      and(
        eq(properties.id, propertyId),
        eq(properties.companyId, companyId),
        eq(properties.customerId, customerId),
      ),
    )
    .limit(1);

  return property ?? null;
}

export async function findService(
  companyId: string,
  customerId: string,
  propertyId: string,
  serviceId: string,
) {
  const [service] = await db
    .select({
      id: services.id,
      companyId: services.companyId,
      customerId: services.customerId,
      propertyId: services.propertyId,
      serviceCatalogId: services.serviceCatalogId,
      isActive: services.isActive,
    })
    .from(services)
    .where(
      and(
        eq(services.id, serviceId),
        eq(services.companyId, companyId),
        eq(services.customerId, customerId),
        eq(services.propertyId, propertyId),
      ),
    )
    .limit(1);

  return service ?? null;
}

export async function findTechnician(companyId: string, technicianId: string) {
  const [technician] = await db
    .select({
      id: technicians.id,
      companyId: technicians.companyId,
      status: technicians.status,
    })
    .from(technicians)
    .where(
      and(
        eq(technicians.id, technicianId),
        eq(technicians.companyId, companyId),
      ),
    )
    .limit(1);

  return technician ?? null;
}

export async function findTechnicianServiceCapability(
  technicianId: string,
  serviceCatalogId: string,
) {
  const [capability] = await db
    .select({
      technicianId: technicianServices.technicianId,
      serviceCatalogId: technicianServices.serviceCatalogId,
    })
    .from(technicianServices)
    .where(
      and(
        eq(technicianServices.technicianId, technicianId),
        eq(technicianServices.serviceCatalogId, serviceCatalogId),
      ),
    )
    .limit(1);

  return capability ?? null;
}

/* -------------------------------------------------------------------------- */
/*                              JOB NUMBER                                    */
/* -------------------------------------------------------------------------- */

export async function findJobByNumber(companyId: string, jobNumber: string) {
  const [job] = await db
    .select({
      id: jobs.id,
      jobNumber: jobs.jobNumber,
    })
    .from(jobs)
    .where(and(eq(jobs.companyId, companyId), eq(jobs.jobNumber, jobNumber)))
    .limit(1);

  return job ?? null;
}

/* -------------------------------------------------------------------------- */
/*                                  CREATE                                    */
/* -------------------------------------------------------------------------- */

export async function insertJob(
  tx: DbTransaction,
  data: {
    companyId: string;
    customerId: string;
    propertyId: string;
    serviceId: string;
    technicianId?: string;
    jobNumber: string;
    status: JobStatus;
    priority: JobPriority;
    notes?: string;
  },
) {
  const [job] = await tx
    .insert(jobs)
    .values({
      companyId: data.companyId,
      customerId: data.customerId,
      propertyId: data.propertyId,
      serviceId: data.serviceId,
      technicianId: data.technicianId ?? null,
      jobNumber: data.jobNumber,
      status: data.status,
      priority: data.priority,
      notes: data.notes ?? null,
    })
    .returning();

  return job;
}

/* -------------------------------------------------------------------------- */
/*                                    LIST                                    */
/* -------------------------------------------------------------------------- */

export async function findJobs(companyId: string, query: JobListQuery) {
  const { page, limit, search, status, priority, technicianId, customerId } =
    query;

  const conditions = [eq(jobs.companyId, companyId)];

  if (search) {
    conditions.push(
      or(
        ilike(jobs.jobNumber, `%${search}%`),
        ilike(jobs.notes, `%${search}%`),
      )!,
    );
  }

  if (status && status !== "all") {
    conditions.push(eq(jobs.status, status));
  }

  if (priority && priority !== "all") {
    conditions.push(eq(jobs.priority, priority));
  }

  if (technicianId) {
    conditions.push(eq(jobs.technicianId, technicianId));
  }

  if (customerId) {
    conditions.push(eq(jobs.customerId, customerId));
  }

  const offset = (page - 1) * limit;

  const whereClause = and(...conditions);

  const [items, countResult] = await Promise.all([
    db
      .select({
        id: jobs.id,
        companyId: jobs.companyId,
        customerId: jobs.customerId,
        propertyId: jobs.propertyId,
        serviceId: jobs.serviceId,
        technicianId: jobs.technicianId,
        jobNumber: jobs.jobNumber,
        status: jobs.status,
        priority: jobs.priority,
        notes: jobs.notes,
        completionNotes: jobs.completionNotes,
        completedAt: jobs.completedAt,
        createdAt: jobs.createdAt,
        updatedAt: jobs.updatedAt,
      })
      .from(jobs)
      .where(whereClause)
      .orderBy(desc(jobs.createdAt))
      .limit(limit)
      .offset(offset),

    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(jobs)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/* -------------------------------------------------------------------------- */
/*                                  GET ONE                                   */
/* -------------------------------------------------------------------------- */

export async function findJobById(companyId: string, jobId: string) {
  const [job] = await db
    .select({
      id: jobs.id,

      companyId: jobs.companyId,

      customerId: jobs.customerId,

      propertyId: jobs.propertyId,

      serviceId: jobs.serviceId,

      technicianId: jobs.technicianId,

      jobNumber: jobs.jobNumber,

      status: jobs.status,

      priority: jobs.priority,

      notes: jobs.notes,

      completionNotes: jobs.completionNotes,

      completedAt: jobs.completedAt,

      createdAt: jobs.createdAt,

      updatedAt: jobs.updatedAt,

      customer: customers,

      property: properties,

      service: services,

      technician: technicians,
    })
    .from(jobs)

    .leftJoin(customers, eq(jobs.customerId, customers.id))

    .leftJoin(properties, eq(jobs.propertyId, properties.id))

    .leftJoin(services, eq(jobs.serviceId, services.id))

    .leftJoin(technicians, eq(jobs.technicianId, technicians.id))

    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    .limit(1);

  if (!job) {
    return null;
  }

  const jobSchedules = await db
    .select({
      id: schedules.id,
      companyId: schedules.companyId,
      jobId: schedules.jobId,
      technicianId: schedules.technicianId,
      scheduledDate: schedules.scheduledDate,
      startTime: schedules.startTime,
      endTime: schedules.endTime,
      status: schedules.status,
      notes: schedules.notes,
      createdAt: schedules.createdAt,
      updatedAt: schedules.updatedAt,
    })
    .from(schedules)
    .where(
      and(eq(schedules.jobId, job.id), eq(schedules.companyId, companyId)),
    );

  return {
    ...job,
    schedules: jobSchedules,
  };
}

/* -------------------------------------------------------------------------- */
/*                                  UPDATE                                    */
/* -------------------------------------------------------------------------- */

export async function updateJob(
  companyId: string,
  jobId: string,
  data: UpdateJobInput,
) {
  const [job] = await db
    .update(jobs)
    .set({
      ...(data.priority !== undefined && {
        priority: data.priority,
      }),

      ...(data.notes !== undefined && {
        notes: data.notes,
      }),

      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    .returning();

  return job ?? null;
}

/* -------------------------------------------------------------------------- */
/*                              UPDATE STATUS                                 */
/* -------------------------------------------------------------------------- */

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

/* -------------------------------------------------------------------------- */
/*                           ASSIGN TECHNICIAN                                */
/* -------------------------------------------------------------------------- */

export async function assignTechnician(
  companyId: string,
  jobId: string,
  technicianId: string | null,
) {
  const [job] = await db
    .update(jobs)
    .set({
      technicianId,
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    .returning();

  return job ?? null;
}

/* -------------------------------------------------------------------------- */
/*                                COMPLETE                                    */
/* -------------------------------------------------------------------------- */

export async function completeJobInDb(
  companyId: string,
  jobId: string,
  completionNotes?: string | null,
) {
  const [job] = await db
    .update(jobs)
    .set({
      status: "completed",
      completionNotes: completionNotes ?? null,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    .returning();

  return job ?? null;
}

/* -------------------------------------------------------------------------- */
/*                                  DELETE                                    */
/* -------------------------------------------------------------------------- */

export async function deleteJob(companyId: string, jobId: string) {
  const [job] = await db
    .delete(jobs)
    .where(and(eq(jobs.id, jobId), eq(jobs.companyId, companyId)))
    .returning({
      id: jobs.id,
    });

  return job ?? null;
}
