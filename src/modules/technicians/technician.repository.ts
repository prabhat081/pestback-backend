import { and, asc, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";

import { db } from "../../database/index.js";

import {
  companyUsers,
  serviceCatalog,
  technicianServices,
  technicians,
  users,
} from "../../database/schema/index.js";

import type { TechnicianListQuery } from "./technician.types.js";

import type { TechnicianStatus } from "../../database/schema/technicians.js";

/**
 * Transaction type inferred directly from Drizzle DB.
 *
 * Do NOT use `typeof db` for transaction parameters.
 */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * ---------------------------------------------------------
 * COMPANY USER
 * ---------------------------------------------------------
 */

export async function findCompanyUser(
  companyId: string,
  companyUserId: string,
) {
  const [result] = await db
    .select({
      id: companyUsers.id,
      companyId: companyUsers.companyId,
      userId: companyUsers.userId,
      roleId: companyUsers.roleId,
      isActive: companyUsers.isActive,
    })
    .from(companyUsers)
    .where(
      and(
        eq(companyUsers.id, companyUserId),
        eq(companyUsers.companyId, companyId),
      ),
    )
    .limit(1);

  return result ?? null;
}

/**
 * ---------------------------------------------------------
 * FIND BY EMPLOYEE CODE
 * ---------------------------------------------------------
 */

export async function findByEmployeeCode(
  companyId: string,
  employeeCode: string,
  excludeTechnicianId?: string,
) {
  const conditions = [
    eq(technicians.companyId, companyId),
    eq(technicians.employeeCode, employeeCode),
  ];

  if (excludeTechnicianId) {
    conditions.push(sql`${technicians.id} != ${excludeTechnicianId}`);
  }

  const [result] = await db
    .select({
      id: technicians.id,
      companyId: technicians.companyId,
      companyUserId: technicians.companyUserId,
      employeeCode: technicians.employeeCode,
      status: technicians.status,
    })
    .from(technicians)
    .where(and(...conditions))
    .limit(1);

  return result ?? null;
}

/**
 * ---------------------------------------------------------
 * FIND BY COMPANY USER
 * ---------------------------------------------------------
 */

export async function findByCompanyUser(
  companyId: string,
  companyUserId: string,
  excludeTechnicianId?: string,
) {
  const conditions = [
    eq(technicians.companyId, companyId),
    eq(technicians.companyUserId, companyUserId),
  ];

  if (excludeTechnicianId) {
    conditions.push(sql`${technicians.id} != ${excludeTechnicianId}`);
  }

  const [result] = await db
    .select({
      id: technicians.id,
      companyId: technicians.companyId,
      companyUserId: technicians.companyUserId,
      employeeCode: technicians.employeeCode,
      status: technicians.status,
      joiningDate: technicians.joiningDate,
      notes: technicians.notes,
      createdAt: technicians.createdAt,
      updatedAt: technicians.updatedAt,
    })
    .from(technicians)
    .where(and(...conditions))
    .limit(1);

  return result ?? null;
}

/**
 * ---------------------------------------------------------
 * COMPANY SERVICE CATALOG
 * ---------------------------------------------------------
 */

export async function findCompanyServiceCatalogs(
  companyId: string,
  serviceCatalogIds: string[],
) {
  if (serviceCatalogIds.length === 0) {
    return [];
  }

  return db
    .select({
      id: serviceCatalog.id,
      companyId: serviceCatalog.companyId,
      name: serviceCatalog.name,
      serviceType: serviceCatalog.serviceType,
      isActive: serviceCatalog.isActive,
    })
    .from(serviceCatalog)
    .where(
      and(
        eq(serviceCatalog.companyId, companyId),
        inArray(serviceCatalog.id, serviceCatalogIds),
      ),
    );
}

/**
 * ---------------------------------------------------------
 * INSERT TECHNICIAN
 * ---------------------------------------------------------
 */

export async function insertTechnician(
  tx: DbTransaction,
  data: {
    companyId: string;
    companyUserId: string;
    employeeCode: string;
    status?: TechnicianStatus;
    joiningDate?: string;
    notes?: string;
  },
) {
  const [technician] = await tx
    .insert(technicians)
    .values({
      companyId: data.companyId,
      companyUserId: data.companyUserId,
      employeeCode: data.employeeCode,
      status: data.status ?? "active",
      joiningDate: data.joiningDate,
      notes: data.notes,
    })
    .returning();

  return technician;
}

/**
 * ---------------------------------------------------------
 * INSERT TECHNICIAN SERVICES
 * ---------------------------------------------------------
 */

export async function insertTechnicianServices(
  tx: DbTransaction,
  technicianId: string,
  serviceCatalogIds: string[],
) {
  if (serviceCatalogIds.length === 0) {
    return [];
  }

  return tx
    .insert(technicianServices)
    .values(
      serviceCatalogIds.map((serviceCatalogId) => ({
        technicianId,
        serviceCatalogId,
      })),
    )
    .returning();
}

/**
 * ---------------------------------------------------------
 * LIST TECHNICIANS
 * ---------------------------------------------------------
 */

export async function findTechnicians(
  companyId: string,
  query: TechnicianListQuery,
) {
  const { page, limit, search, status } = query;

  const offset = (page - 1) * limit;

  const conditions = [eq(technicians.companyId, companyId)];

  /**
   * Status filter
   */
  if (status && status !== "all") {
    conditions.push(eq(technicians.status, status));
  }

  /**
   * Search
   */
  if (search) {
    const searchPattern = `%${search}%`;

    conditions.push(
      or(
        ilike(users.firstName, searchPattern),
        ilike(users.lastName, searchPattern),
        ilike(users.email, searchPattern),
        ilike(users.phone, searchPattern),
        ilike(technicians.employeeCode, searchPattern),
      )!,
    );
  }

  const whereCondition = and(...conditions);

  const items = await db
    .select({
      id: technicians.id,

      companyUserId: technicians.companyUserId,

      employeeCode: technicians.employeeCode,

      status: technicians.status,

      joiningDate: technicians.joiningDate,

      notes: technicians.notes,

      createdAt: technicians.createdAt,

      updatedAt: technicians.updatedAt,

      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(technicians)
    .innerJoin(companyUsers, eq(technicians.companyUserId, companyUsers.id))
    .innerJoin(users, eq(companyUsers.userId, users.id))
    .where(whereCondition)
    .orderBy(desc(technicians.createdAt))
    .limit(limit)
    .offset(offset);

  const countResult = await db
    .select({
      count: sql<number>`count(*)`,
    })
    .from(technicians)
    .innerJoin(companyUsers, eq(technicians.companyUserId, companyUsers.id))
    .innerJoin(users, eq(companyUsers.userId, users.id))
    .where(whereCondition);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    items,
    total,
  };
}

/**
 * ---------------------------------------------------------
 * FIND TECHNICIAN BY ID
 * ---------------------------------------------------------
 */

export async function findTechnicianById(
  companyId: string,
  technicianId: string,
) {
  const [technician] = await db
    .select({
      id: technicians.id,

      companyId: technicians.companyId,

      companyUserId: technicians.companyUserId,

      employeeCode: technicians.employeeCode,

      status: technicians.status,

      joiningDate: technicians.joiningDate,

      notes: technicians.notes,

      createdAt: technicians.createdAt,

      updatedAt: technicians.updatedAt,

      user: {
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
      },
    })
    .from(technicians)
    .innerJoin(companyUsers, eq(technicians.companyUserId, companyUsers.id))
    .innerJoin(users, eq(companyUsers.userId, users.id))
    .where(
      and(
        eq(technicians.companyId, companyId),
        eq(technicians.id, technicianId),
      ),
    )
    .limit(1);

  return technician ?? null;
}

/**
 * ---------------------------------------------------------
 * UPDATE TECHNICIAN
 * ---------------------------------------------------------
 */

export async function updateTechnician(
  companyId: string,
  technicianId: string,
  data: {
    employeeCode?: string;
    status?: TechnicianStatus;
    joiningDate?: string | null;
    notes?: string | null;
  },
) {
  const [updated] = await db
    .update(technicians)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(technicians.id, technicianId),
        eq(technicians.companyId, companyId),
      ),
    )
    .returning();

  return updated ?? null;
}

/**
 * ---------------------------------------------------------
 * UPDATE STATUS
 * ---------------------------------------------------------
 */

export async function updateTechnicianStatus(
  companyId: string,
  technicianId: string,
  status: TechnicianStatus,
) {
  const [updated] = await db
    .update(technicians)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(technicians.id, technicianId),
        eq(technicians.companyId, companyId),
      ),
    )
    .returning();

  return updated ?? null;
}

/**
 * ---------------------------------------------------------
 * DELETE TECHNICIAN
 * ---------------------------------------------------------
 */

export async function deleteTechnician(
  companyId: string,
  technicianId: string,
) {
  const [deleted] = await db
    .delete(technicians)
    .where(
      and(
        eq(technicians.id, technicianId),
        eq(technicians.companyId, companyId),
      ),
    )
    .returning({
      id: technicians.id,
    });

  return deleted ?? null;
}

/**
 * ---------------------------------------------------------
 * GET TECHNICIAN SERVICES
 * ---------------------------------------------------------
 */

export async function getTechnicianServices(
  companyId: string,
  technicianId: string,
) {
  return db
    .select({
      id: technicianServices.serviceCatalogId,

      name: serviceCatalog.name,

      serviceType: serviceCatalog.serviceType,

      description: serviceCatalog.description,

      defaultPrice: serviceCatalog.defaultPrice,

      defaultFrequency: serviceCatalog.defaultFrequency,

      warrantyDays: serviceCatalog.warrantyDays,

      isActive: serviceCatalog.isActive,
    })
    .from(technicianServices)
    .innerJoin(technicians, eq(technicianServices.technicianId, technicians.id))
    .innerJoin(
      serviceCatalog,
      eq(technicianServices.serviceCatalogId, serviceCatalog.id),
    )
    .where(
      and(
        eq(technicians.companyId, companyId),
        eq(technicians.id, technicianId),
        eq(serviceCatalog.companyId, companyId),
      ),
    )
    .orderBy(asc(serviceCatalog.name));
}

/**
 * ---------------------------------------------------------
 * DELETE TECHNICIAN SERVICES
 * ---------------------------------------------------------
 */

export async function deleteTechnicianServices(
  tx: DbTransaction,
  technicianId: string,
) {
  await tx
    .delete(technicianServices)
    .where(eq(technicianServices.technicianId, technicianId));
}

/**
 * ---------------------------------------------------------
 * REPLACE TECHNICIAN SERVICES
 * ---------------------------------------------------------
 */

export async function replaceTechnicianServices(
  tx: DbTransaction,
  technicianId: string,
  serviceCatalogIds: string[],
) {
  await deleteTechnicianServices(tx, technicianId);

  if (serviceCatalogIds.length === 0) {
    return [];
  }

  return insertTechnicianServices(tx, technicianId, serviceCatalogIds);
}
