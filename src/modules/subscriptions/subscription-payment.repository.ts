import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "../../database/client.js";

import {
  companies,
  subscriptionPayments,
  subscriptions,
} from "../../database/schema/index.js";

import type {
  SubscriptionPaymentListQuery,
  SubscriptionPaymentStatus,
} from "./subscription-payment.types.js";

export async function findSubscriptionPayments({
  companyId,
  page = 1,
  limit = 10,
  status,
  subscriptionId,
}: SubscriptionPaymentListQuery & {
  companyId: string;
}) {
  const offset = (page - 1) * limit;

  const conditions = [eq(subscriptionPayments.companyId, companyId)];

  if (status && status !== "all") {
    conditions.push(eq(subscriptionPayments.status, status));
  }

  if (subscriptionId) {
    conditions.push(eq(subscriptionPayments.subscriptionId, subscriptionId));
  }

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        payment: subscriptionPayments,

        subscription: {
          id: subscriptions.id,
          planId: subscriptions.planId,
          status: subscriptions.status,
          billingInterval: subscriptions.billingInterval,
          amount: subscriptions.amount,
          currency: subscriptions.currency,
        },

        company: {
          id: companies.id,
          name: companies.name,
        },
      })
      .from(subscriptionPayments)
      .leftJoin(
        subscriptions,
        eq(subscriptionPayments.subscriptionId, subscriptions.id),
      )
      .leftJoin(companies, eq(subscriptionPayments.companyId, companies.id))
      .where(whereClause)
      .orderBy(
        desc(subscriptionPayments.createdAt),
        asc(subscriptionPayments.id),
      )
      .limit(limit)
      .offset(offset),

    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(subscriptionPayments)
      .where(whereClause),
  ]);

  return {
    items: rows.map((row) => ({
      ...row.payment,
      subscription: row.subscription,
      company: row.company,
    })),
    total: Number(countResult[0]?.count ?? 0),
    page,
    limit,
    totalPages: Math.ceil(Number(countResult[0]?.count ?? 0) / limit),
  };
}

export async function findSubscriptionPaymentById(paymentId: string) {
  const rows = await db
    .select({
      payment: subscriptionPayments,

      subscription: {
        id: subscriptions.id,
        planId: subscriptions.planId,
        status: subscriptions.status,
        billingInterval: subscriptions.billingInterval,
        amount: subscriptions.amount,
        currency: subscriptions.currency,
      },

      company: {
        id: companies.id,
        name: companies.name,
      },
    })
    .from(subscriptionPayments)
    .leftJoin(
      subscriptions,
      eq(subscriptionPayments.subscriptionId, subscriptions.id),
    )
    .leftJoin(companies, eq(subscriptionPayments.companyId, companies.id))
    .where(eq(subscriptionPayments.id, paymentId))
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    ...row.payment,
    subscription: row.subscription,
    company: row.company,
  };
}

export async function findPaymentByProviderPaymentId(
  providerPaymentId: string,
) {
  const result = await db
    .select()
    .from(subscriptionPayments)
    .where(eq(subscriptionPayments.providerPaymentId, providerPaymentId))
    .limit(1);

  return result[0] ?? null;
}

export async function findPaymentByProviderOrderId(providerOrderId: string) {
  const result = await db
    .select()
    .from(subscriptionPayments)
    .where(eq(subscriptionPayments.providerOrderId, providerOrderId))
    .limit(1);

  return result[0] ?? null;
}

export async function findPaymentByProviderSubscriptionId(
  providerSubscriptionId: string,
) {
  const result = await db
    .select()
    .from(subscriptionPayments)
    .where(
      eq(subscriptionPayments.providerSubscriptionId, providerSubscriptionId),
    )
    .orderBy(desc(subscriptionPayments.createdAt))
    .limit(1);

  return result[0] ?? null;
}
