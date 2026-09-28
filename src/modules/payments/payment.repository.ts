// src/modules/payments/payment.repository.ts

import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { db } from "../../database/client.js";

import {
  paymentAttempts,
  paymentOrders,
  paymentWebhooks,
  payments,
} from "../../database/schema/index.js";

import type {
  PaymentOrderProvider,
  PaymentOrderStatus,
  PaymentStatus,
  PaymentWebhookProvider,
} from "../../database/schema/index.js";

import type {
  PaymentListQuery,
  PaymentOrderListQuery,
} from "./payment.types.js";

export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export type DbExecutor = typeof db | DbTransaction;

/* -------------------------------------------------------------------------- */
/*                              PAYMENTS                                      */
/* -------------------------------------------------------------------------- */

export async function insertPayment(
  executor: DbExecutor,
  data: typeof payments.$inferInsert,
) {
  const [payment] = await executor.insert(payments).values(data).returning();

  if (!payment) {
    throw new Error("Failed to create payment");
  }

  return payment;
}

export async function findPaymentById(
  companyId: string,
  paymentId: string,
  executor: DbExecutor = db,
) {
  const [payment] = await executor
    .select()
    .from(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.companyId, companyId)))
    .limit(1);

  return payment ?? null;
}

export async function findPaymentByIdempotencyKey(
  companyId: string,
  idempotencyKey: string,
  executor: DbExecutor = db,
) {
  const [payment] = await executor
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.companyId, companyId),
        eq(payments.idempotencyKey, idempotencyKey),
      ),
    )
    .limit(1);

  return payment ?? null;
}

export async function findPaymentByProviderPaymentId(
  companyId: string,
  providerPaymentId: string,
  executor: DbExecutor = db,
) {
  const [payment] = await executor
    .select()
    .from(payments)
    .where(
      and(
        eq(payments.companyId, companyId),
        eq(payments.providerPaymentId, providerPaymentId),
      ),
    )
    .limit(1);

  return payment ?? null;
}

export async function findPayments(
  companyId: string,
  query: PaymentListQuery,
  executor: DbExecutor = db,
) {
  const conditions: SQL[] = [eq(payments.companyId, companyId)];

  if (query.search) {
    conditions.push(
      or(
        ilike(payments.transactionId, `%${query.search}%`),
        ilike(payments.providerPaymentId, `%${query.search}%`),
      )!,
    );
  }

  if (query.status && query.status !== "all") {
    conditions.push(eq(payments.status, query.status));
  }

  if (query.paymentMethod && query.paymentMethod !== "all") {
    conditions.push(eq(payments.paymentMethod, query.paymentMethod));
  }

  if (query.paymentProvider && query.paymentProvider !== "all") {
    conditions.push(eq(payments.paymentProvider, query.paymentProvider));
  }

  if (query.invoiceId) {
    conditions.push(eq(payments.invoiceId, query.invoiceId));
  }

  if (query.customerId) {
    conditions.push(eq(payments.customerId, query.customerId));
  }

  if (query.fromDate) {
    conditions.push(sql`${payments.paymentDate} >= ${query.fromDate}::date`);
  }

  if (query.toDate) {
    conditions.push(
      sql`${payments.paymentDate} < (${query.toDate}::date + INTERVAL '1 day')`,
    );
  }

  const offset = (query.page - 1) * query.limit;

  const [items, countResult] = await Promise.all([
    executor
      .select()
      .from(payments)
      .where(and(...conditions))
      .orderBy(desc(payments.createdAt))
      .limit(query.limit)
      .offset(offset),

    executor
      .select({
        count: sql<number>`count(*)`,
      })
      .from(payments)
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

export async function updatePayment(
  companyId: string,
  paymentId: string,
  data: Partial<typeof payments.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [payment] = await executor
    .update(payments)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(and(eq(payments.id, paymentId), eq(payments.companyId, companyId)))
    .returning();

  return payment ?? null;
}

export async function updatePaymentStatus(
  companyId: string,
  paymentId: string,
  status: PaymentStatus,
  executor: DbExecutor = db,
) {
  const [payment] = await executor
    .update(payments)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(payments.id, paymentId), eq(payments.companyId, companyId)))
    .returning();

  return payment ?? null;
}

export async function deletePayment(
  companyId: string,
  paymentId: string,
  executor: DbExecutor = db,
) {
  const [payment] = await executor
    .delete(payments)
    .where(and(eq(payments.id, paymentId), eq(payments.companyId, companyId)))
    .returning();

  return payment ?? null;
}

/* -------------------------------------------------------------------------- */
/*                           PAYMENT ORDERS                                   */
/* -------------------------------------------------------------------------- */

export async function insertPaymentOrder(
  executor: DbExecutor,
  data: typeof paymentOrders.$inferInsert,
) {
  const [order] = await executor.insert(paymentOrders).values(data).returning();

  if (!order) {
    throw new Error("Failed to create payment order");
  }

  return order;
}

export async function findPaymentOrderById(
  companyId: string,
  paymentOrderId: string,
  executor: DbExecutor = db,
) {
  const [order] = await executor
    .select()
    .from(paymentOrders)
    .where(
      and(
        eq(paymentOrders.id, paymentOrderId),
        eq(paymentOrders.companyId, companyId),
      ),
    )
    .limit(1);

  return order ?? null;
}

export async function findPaymentOrderByToken(
  token: string,
  executor: DbExecutor = db,
) {
  const [order] = await executor
    .select()
    .from(paymentOrders)
    .where(eq(paymentOrders.paymentLinkToken, token))
    .limit(1);

  return order ?? null;
}

export async function findPaymentOrderByProviderOrderId(
  provider: PaymentOrderProvider,
  providerOrderId: string,
  executor: DbExecutor = db,
) {
  const [order] = await executor
    .select()
    .from(paymentOrders)
    .where(
      and(
        eq(paymentOrders.provider, provider),
        eq(paymentOrders.providerOrderId, providerOrderId),
      ),
    )
    .limit(1);

  return order ?? null;
}

export async function findPaymentOrders(
  companyId: string,
  query: PaymentOrderListQuery,
  executor: DbExecutor = db,
) {
  const conditions: SQL[] = [eq(paymentOrders.companyId, companyId)];

  if (query.search) {
    conditions.push(ilike(paymentOrders.paymentLinkToken, `%${query.search}%`));
  }

  if (query.status && query.status !== "all") {
    conditions.push(eq(paymentOrders.status, query.status));
  }

  if (query.invoiceId) {
    conditions.push(eq(paymentOrders.invoiceId, query.invoiceId));
  }

  if (query.customerId) {
    conditions.push(eq(paymentOrders.customerId, query.customerId));
  }

  if (query.fromDate) {
    conditions.push(sql`${paymentOrders.createdAt} >= ${query.fromDate}::date`);
  }

  if (query.toDate) {
    conditions.push(
      sql`${paymentOrders.createdAt} < (${query.toDate}::date + INTERVAL '1 day')`,
    );
  }

  const offset = (query.page - 1) * query.limit;

  const [items, countResult] = await Promise.all([
    executor
      .select()
      .from(paymentOrders)
      .where(and(...conditions))
      .orderBy(desc(paymentOrders.createdAt))
      .limit(query.limit)
      .offset(offset),

    executor
      .select({
        count: sql<number>`count(*)`,
      })
      .from(paymentOrders)
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

export async function updatePaymentOrder(
  companyId: string,
  paymentOrderId: string,
  data: Partial<typeof paymentOrders.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [order] = await executor
    .update(paymentOrders)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(paymentOrders.id, paymentOrderId),
        eq(paymentOrders.companyId, companyId),
      ),
    )
    .returning();

  return order ?? null;
}

export async function updatePaymentOrderStatus(
  companyId: string,
  paymentOrderId: string,
  status: PaymentOrderStatus,
  executor: DbExecutor = db,
) {
  const data: Partial<typeof paymentOrders.$inferInsert> = {
    status,
    updatedAt: new Date(),
  };

  if (status === "paid") {
    data.paidAt = new Date();
  }

  if (status === "cancelled") {
    data.cancelledAt = new Date();
  }

  const [order] = await executor
    .update(paymentOrders)
    .set(data)
    .where(
      and(
        eq(paymentOrders.id, paymentOrderId),
        eq(paymentOrders.companyId, companyId),
      ),
    )
    .returning();

  return order ?? null;
}

/* -------------------------------------------------------------------------- */
/*                           PAYMENT ATTEMPTS                                 */
/* -------------------------------------------------------------------------- */

export async function insertPaymentAttempt(
  executor: DbExecutor,
  data: typeof paymentAttempts.$inferInsert,
) {
  const [attempt] = await executor
    .insert(paymentAttempts)
    .values(data)
    .returning();

  if (!attempt) {
    throw new Error("Failed to create payment attempt");
  }

  return attempt;
}

export async function findPaymentAttemptByProviderPaymentId(
  providerPaymentId: string,
  executor: DbExecutor = db,
) {
  const [attempt] = await executor
    .select()
    .from(paymentAttempts)
    .where(eq(paymentAttempts.providerPaymentId, providerPaymentId))
    .limit(1);

  return attempt ?? null;
}

export async function findPaymentAttemptsByOrderId(
  companyId: string,
  paymentOrderId: string,
  executor: DbExecutor = db,
) {
  return executor
    .select()
    .from(paymentAttempts)
    .where(
      and(
        eq(paymentAttempts.companyId, companyId),
        eq(paymentAttempts.paymentOrderId, paymentOrderId),
      ),
    )
    .orderBy(desc(paymentAttempts.createdAt));
}

export async function updatePaymentAttempt(
  attemptId: string,
  data: Partial<typeof paymentAttempts.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [attempt] = await executor
    .update(paymentAttempts)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(paymentAttempts.id, attemptId))
    .returning();

  return attempt ?? null;
}

/* -------------------------------------------------------------------------- */
/*                              WEBHOOKS                                      */
/* -------------------------------------------------------------------------- */

export async function insertPaymentWebhook(
  data: typeof paymentWebhooks.$inferInsert,
  executor: DbExecutor = db,
) {
  const [webhook] = await executor
    .insert(paymentWebhooks)
    .values(data)
    .returning();

  if (!webhook) {
    throw new Error("Failed to create payment webhook");
  }

  return webhook;
}

export async function findPaymentWebhookByEventId(
  provider: PaymentWebhookProvider,
  eventId: string,
  executor: DbExecutor = db,
) {
  const [webhook] = await executor
    .select()
    .from(paymentWebhooks)
    .where(
      and(
        eq(paymentWebhooks.provider, provider),
        eq(paymentWebhooks.eventId, eventId),
      ),
    )
    .limit(1);

  return webhook ?? null;
}

export async function updatePaymentWebhook(
  webhookId: string,
  data: Partial<typeof paymentWebhooks.$inferInsert>,
  executor: DbExecutor = db,
) {
  const [webhook] = await executor
    .update(paymentWebhooks)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(paymentWebhooks.id, webhookId))
    .returning();

  return webhook ?? null;
}

// payment.repository.ts

export async function findPaymentWebhookById(
  webhookId: string,
  executor: DbExecutor = db,
) {
  const [webhook] = await executor
    .select()
    .from(paymentWebhooks)
    .where(eq(paymentWebhooks.id, webhookId))
    .limit(1);

  return webhook ?? null;
}


/* -------------------------------------------------------------------------- */
/*                         PAYMENT ATTEMPT HELPERS                            */
/* -------------------------------------------------------------------------- */

export async function findPaymentAttemptById(
  companyId: string,
  attemptId: string,
  executor: DbExecutor = db,
) {
  const [attempt] = await executor
    .select()
    .from(paymentAttempts)
    .where(
      and(
        eq(paymentAttempts.id, attemptId),
        eq(paymentAttempts.companyId, companyId),
      ),
    )
    .limit(1);

  return attempt ?? null;
}
