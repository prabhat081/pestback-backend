import {
  and,
  desc,
  eq,
  ilike,
  or,
  sql,
} from "drizzle-orm";

import { db } from "../../database/index.js";

import { customers } from "../../database/schema/customers.js";
import { properties } from "../../database/schema/properties.js";
import { services } from "../../database/schema/services.js";
import { serviceCatalog } from "../../database/schema/service-catalog.js";

import type {
  CreateServiceInput,
  ServiceQuery,
  UpdateServiceInput,
} from "./service.schema.js";

export async function findCustomerForCompany(
  companyId: string,
  customerId: string,
) {
  const [customer] = await db
    .select({
      id: customers.id,
    })
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.companyId, companyId),
        eq(customers.isActive, true),
      ),
    )
    .limit(1);

  return customer ?? null;
}

export async function findPropertyForCustomer(
  companyId: string,
  customerId: string,
  propertyId: string,
) {
  const [property] = await db
    .select({
      id: properties.id,
      customerId: properties.customerId,
    })
    .from(properties)
    .where(
      and(
        eq(properties.id, propertyId),
        eq(properties.companyId, companyId),
        eq(properties.customerId, customerId),
        eq(properties.isActive, true),
      ),
    )
    .limit(1);

  return property ?? null;
}

/**
 * Get active service catalog item
 * belonging to the current company.
 */
export async function findServiceCatalogForCompany(
  companyId: string,
  serviceCatalogId: string,
) {
  const [catalog] = await db
    .select({
      id: serviceCatalog.id,
      name: serviceCatalog.name,
      serviceType: serviceCatalog.serviceType,
      defaultPrice: serviceCatalog.defaultPrice,
      defaultFrequency:
        serviceCatalog.defaultFrequency,
      warrantyDays: serviceCatalog.warrantyDays,
      isActive: serviceCatalog.isActive,
    })
    .from(serviceCatalog)
    .where(
      and(
        eq(serviceCatalog.id, serviceCatalogId),
        eq(
          serviceCatalog.companyId,
          companyId,
        ),
        eq(
          serviceCatalog.isActive,
          true,
        ),
      ),
    )
    .limit(1);

  return catalog ?? null;
}

export async function createService(
  companyId: string,
  data: CreateServiceInput,
  catalog: {
    id: string;
    name: string;
    serviceType: string;
  },
) {
  const [service] = await db
    .insert(services)
    .values({
      companyId,

      customerId: data.customerId,

      propertyId: data.propertyId,

      serviceCatalogId: catalog.id,

      // Snapshot from catalog
      name: catalog.name,

      // Snapshot from catalog
      serviceType: catalog.serviceType,

      description:
        data.description || null,

      // Actual customer price
      price: data.price.toString(),

      // Actual customer frequency
      frequency:
        data.frequency || null,

      startDate: data.startDate,

      endDate:
        data.endDate ?? null,
    })
    .returning();

  return service;
}

export async function findServices(
  companyId: string,
  query: ServiceQuery,
) {
  const conditions = [
    eq(
      services.companyId,
      companyId,
    ),
  ];

  if (query.customerId) {
    conditions.push(
      eq(
        services.customerId,
        query.customerId,
      ),
    );
  }

  if (query.propertyId) {
    conditions.push(
      eq(
        services.propertyId,
        query.propertyId,
      ),
    );
  }

  if (query.status !== "all") {
    conditions.push(
      eq(
        services.isActive,
        query.status === "active",
      ),
    );
  }

  if (query.serviceType !== "all") {
    conditions.push(
      eq(
        services.serviceType,
        query.serviceType,
      ),
    );
  }

  if (query.frequency !== "all") {
    conditions.push(
      eq(
        services.frequency,
        query.frequency,
      ),
    );
  }

  if (query.search) {
    const search = `%${query.search}%`;

    conditions.push(
      or(
        ilike(
          services.name,
          search,
        ),
        ilike(
          services.description,
          search,
        ),
      )!,
    );
  }

  const offset =
    (query.page - 1) *
    query.limit;

  const [items, countResult] =
    await Promise.all([
      db
        .select()
        .from(services)
        .where(and(...conditions))
        .orderBy(
          desc(services.createdAt),
        )
        .limit(query.limit)
        .offset(offset),

      db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(services)
        .where(and(...conditions)),
    ]);

  const total = Number(
    countResult[0]?.count ?? 0,
  );

  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(
      total / query.limit,
    ),
  };
}

export async function findServiceById(
  companyId: string,
  serviceId: string,
) {
  const [service] = await db
    .select()
    .from(services)
    .where(
      and(
        eq(
          services.id,
          serviceId,
        ),
        eq(
          services.companyId,
          companyId,
        ),
      ),
    )
    .limit(1);

  return service ?? null;
}

export async function updateService(
  companyId: string,
  serviceId: string,
  data: UpdateServiceInput,
) {
  const updateData: Partial<
    typeof services.$inferInsert
  > = {
    updatedAt: new Date(),
  };

  if (data.description !== undefined) {
    updateData.description =
      data.description || null;
  }

  if (data.price !== undefined) {
    updateData.price =
      data.price.toString();
  }

  if (data.frequency !== undefined) {
    updateData.frequency =
      data.frequency;
  }

  if (data.startDate !== undefined) {
    updateData.startDate =
      data.startDate;
  }

  if (data.endDate !== undefined) {
    updateData.endDate =
      data.endDate;
  }

  const [service] = await db
    .update(services)
    .set(updateData)
    .where(
      and(
        eq(
          services.id,
          serviceId,
        ),
        eq(
          services.companyId,
          companyId,
        ),
      ),
    )
    .returning();

  return service ?? null;
}

export async function updateServiceStatus(
  companyId: string,
  serviceId: string,
  isActive: boolean,
) {
  const [service] = await db
    .update(services)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(
          services.id,
          serviceId,
        ),
        eq(
          services.companyId,
          companyId,
        ),
      ),
    )
    .returning();

  return service ?? null;
}

export async function deleteService(
  companyId: string,
  serviceId: string,
) {
  const [service] = await db
    .delete(services)
    .where(
      and(
        eq(
          services.id,
          serviceId,
        ),
        eq(
          services.companyId,
          companyId,
        ),
      ),
    )
    .returning();

  return service ?? null;
}