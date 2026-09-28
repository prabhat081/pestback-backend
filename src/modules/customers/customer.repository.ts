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

import type {
  CreateCustomerInput,
  CustomerQuery,
  UpdateCustomerInput,
} from "./customer.schema.js";

export async function createCustomer(
  companyId: string,
  data: CreateCustomerInput,
) {
  const [customer] = await db
    .insert(customers)
    .values({
      companyId,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email || null,
      phone: data.phone,
      notes: data.notes || null,
    })
    .returning();

  return customer;
}

export async function findCustomerById(
  companyId: string,
  customerId: string,
) {
  const [customer] = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.companyId, companyId),
      ),
    )
    .limit(1);

  return customer ?? null;
}

export async function findCustomers(
  companyId: string,
  query: CustomerQuery,
) {
  const conditions = [
    eq(customers.companyId, companyId),
  ];

  if (query.status !== "all") {
    conditions.push(
      eq(
        customers.isActive,
        query.status === "active",
      ),
    );
  }

  if (query.search) {
    const search = `%${query.search}%`;

    conditions.push(
      or(
        ilike(customers.firstName, search),
        ilike(customers.lastName, search),
        ilike(customers.email, search),
        ilike(customers.phone, search),
      )!,
    );
  }

  const offset = (query.page - 1) * query.limit;

  const [items, countResult] = await Promise.all([
    db
      .select()
      .from(customers)
      .where(and(...conditions))
      .orderBy(desc(customers.createdAt))
      .limit(query.limit)
      .offset(offset),

    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(customers)
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

export async function updateCustomer(
  companyId: string,
  customerId: string,
  data: UpdateCustomerInput,
) {
  const [customer] = await db
    .update(customers)
    .set({
      ...data,
      email:
        data.email === ""
          ? null
          : data.email,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.companyId, companyId),
      ),
    )
    .returning();

  return customer ?? null;
}

export async function updateCustomerStatus(
  companyId: string,
  customerId: string,
  isActive: boolean,
) {
  const [customer] = await db
    .update(customers)
    .set({
      isActive,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.companyId, companyId),
      ),
    )
    .returning();

  return customer ?? null;
}

export async function deleteCustomer(
  companyId: string,
  customerId: string,
) {
  const [customer] = await db
    .delete(customers)
    .where(
      and(
        eq(customers.id, customerId),
        eq(customers.companyId, companyId),
      ),
    )
    .returning();

  return customer ?? null;
}