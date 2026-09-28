import { and, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../database/index.js";
import { properties } from "../../database/schema/properties.js";

import type {
  CreatePropertyInput,
  PropertyQuery,
  UpdatePropertyInput,
} from "./property.schema.js";
import { customers } from "../../database/schema/customers.js";

export async function createProperty(
  companyId: string,
  data: CreatePropertyInput,
) {
  const [property] = await db
    .insert(properties)
    .values({
      companyId,
      customerId: data.customerId,
      name: data.name,
      propertyType: data.propertyType,
      address: data.address,
      city: data.city,
      state: data.state || null,
      postalCode: data.postalCode || null,
      notes: data.notes || null,
    })
    .returning();

  return property;
}

export async function findProperties(companyId: string, query: PropertyQuery) {
  const conditions = [eq(properties.companyId, companyId)];

  if (query.customerId) {
    conditions.push(eq(properties.customerId, query.customerId));
  }

  if (query.status !== "all") {
    conditions.push(eq(properties.isActive, query.status === "active"));
  }

  if (query.propertyType !== "all") {
    conditions.push(eq(properties.propertyType, query.propertyType));
  }

  if (query.search) {
    const search = `%${query.search}%`;

    conditions.push(
      or(
        ilike(properties.name, search),
        ilike(properties.address, search),
        ilike(properties.city, search),
        ilike(properties.postalCode, search),
      )!,
    );
  }

  const offset = (query.page - 1) * query.limit;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(properties)
      .where(and(...conditions))
      .orderBy(desc(properties.createdAt))
      .limit(query.limit)
      .offset(offset),

    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(properties)
      .where(and(...conditions)),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    items,
    total,
    page: query.page,
    limit: query.limit,
    totalPages: Math.ceil(total / query.limit),
  };
}

export async function findPropertyById(companyId: string, propertyId: string) {
  const [property] = await db
    .select()
    .from(properties)
    .where(
      and(eq(properties.id, propertyId), eq(properties.companyId, companyId)),
    )
    .limit(1);

  return property ?? null;
}

export async function updateProperty(
  companyId: string,
  propertyId: string,
  data: UpdatePropertyInput,
) {
  const [property] = await db
    .update(properties)
    .set({
      ...data,
      state: data.state === "" ? null : data.state,

      postalCode: data.postalCode === "" ? null : data.postalCode,

      notes: data.notes === "" ? null : data.notes,

      updatedAt: new Date(),
    })
    .where(
      and(eq(properties.id, propertyId), eq(properties.companyId, companyId)),
    )
    .returning();

  return property ?? null;
}

export async function updatePropertyStatus(
  companyId: string,
  propertyId: string,
  isActive: boolean,
) {
  const [property] = await db
    .update(properties)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(
      and(eq(properties.id, propertyId), eq(properties.companyId, companyId)),
    )
    .returning();

  return property ?? null;
}

export async function deleteProperty(companyId: string, propertyId: string) {
  const [property] = await db
    .delete(properties)
    .where(
      and(eq(properties.id, propertyId), eq(properties.companyId, companyId)),
    )
    .returning();

  return property ?? null;
}

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
