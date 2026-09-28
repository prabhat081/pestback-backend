import {
  and,
  asc,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";

import { db } from "../../database/index.js";
import { serviceCatalog } from "../../database/schema/service-catalog.js";

import type {
  CreateServiceCatalogInput,
  ServiceCatalogQuery,
  UpdateServiceCatalogInput,
} from "./service-catalog.schema.js";

export async function createServiceCatalog(
  companyId: string,
  data: CreateServiceCatalogInput,
) {
  const [service] = await db
    .insert(serviceCatalog)
    .values({
      companyId,
      name: data.name,
      slug: data.slug,
      serviceType: data.serviceType,
      description: data.description || null,
      defaultPrice: data.defaultPrice.toString(),
      defaultFrequency: data.defaultFrequency ?? null,
      warrantyDays: data.warrantyDays.toString(),
    })
    .returning();

  return service;
}

export async function findServiceCatalogById(
  companyId: string,
  id: string,
) {
  const [service] = await db
    .select()
    .from(serviceCatalog)
    .where(
      and(
        eq(serviceCatalog.id, id),
        eq(serviceCatalog.companyId, companyId),
      ),
    )
    .limit(1);

  return service ?? null;
}

export async function findServiceCatalogBySlug(
  companyId: string,
  slug: string,
) {
  const [service] = await db
    .select()
    .from(serviceCatalog)
    .where(
      and(
        eq(serviceCatalog.companyId, companyId),
        eq(serviceCatalog.slug, slug),
      ),
    )
    .limit(1);

  return service ?? null;
}

export async function findServiceCatalog(
  companyId: string,
  query: ServiceCatalogQuery,
) {
  const conditions = [
    eq(serviceCatalog.companyId, companyId),
  ];

  if (query.status !== "all") {
    conditions.push(
      eq(
        serviceCatalog.isActive,
        query.status === "active",
      ),
    );
  }

  if (
    query.serviceType &&
    query.serviceType !== "all"
  ) {
    conditions.push(
      eq(
        serviceCatalog.serviceType,
        query.serviceType,
      ),
    );
  }

  if (query.search) {
    const search = `%${query.search}%`;

    const searchCondition = or(
      ilike(serviceCatalog.name, search),
      ilike(serviceCatalog.slug, search),
      ilike(serviceCatalog.description, search),
    );

    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const offset = (query.page - 1) * query.limit;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(serviceCatalog)
      .where(and(...conditions))
      .orderBy(desc(serviceCatalog.createdAt))
      .limit(query.limit)
      .offset(offset),

    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(serviceCatalog)
      .where(and(...conditions)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    items,
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

export async function updateServiceCatalog(
  companyId: string,
  id: string,
  data: UpdateServiceCatalogInput,
) {
  const updateData: Partial<
    typeof serviceCatalog.$inferInsert
  > = {
    updatedAt: new Date(),
  };

  if (data.name !== undefined) {
    updateData.name = data.name;
  }

  if (data.slug !== undefined) {
    updateData.slug = data.slug;
  }

  if (data.serviceType !== undefined) {
    updateData.serviceType = data.serviceType;
  }

  if (data.description !== undefined) {
    updateData.description =
      data.description || null;
  }

  if (data.defaultPrice !== undefined) {
    updateData.defaultPrice =
      data.defaultPrice.toString();
  }

  if (data.defaultFrequency !== undefined) {
    updateData.defaultFrequency =
      data.defaultFrequency;
  }

  if (data.warrantyDays !== undefined) {
    updateData.warrantyDays =
      data.warrantyDays.toString();
  }

  const [service] = await db
    .update(serviceCatalog)
    .set(updateData)
    .where(
      and(
        eq(serviceCatalog.id, id),
        eq(serviceCatalog.companyId, companyId),
      ),
    )
    .returning();

  return service ?? null;
}

export async function updateServiceCatalogStatus(
  companyId: string,
  id: string,
  isActive: boolean,
) {
  const [service] = await db
    .update(serviceCatalog)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(serviceCatalog.id, id),
        eq(serviceCatalog.companyId, companyId),
      ),
    )
    .returning();

  return service ?? null;
}

export async function deleteServiceCatalog(
  companyId: string,
  id: string,
) {
  const [service] = await db
    .delete(serviceCatalog)
    .where(
      and(
        eq(serviceCatalog.id, id),
        eq(serviceCatalog.companyId, companyId),
      ),
    )
    .returning();

  return service ?? null;
}