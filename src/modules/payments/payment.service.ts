// src/modules/payments/payment.service.ts

import { randomUUID } from "node:crypto";

import { and, eq, sql } from "drizzle-orm";

import { db } from "../../database/client.js";

import { customers, invoices, payments } from "../../database/schema/index.js";

import type { PaymentStatus } from "../../database/schema/index.js";

import { ApiError } from "../../utils/api-error.js";

import { createRazorpayOrder } from "./payment.provider.js";

import type {
  CompleteOnlinePaymentInput,
  CreatePaymentInput,
  CreatePaymentOrderInput,
  PaymentListQuery,
  PaymentOrderListQuery,
  UpdatePaymentInput,
  UpdatePaymentOrderInput,
} from "./payment.types.js";

import {
  deletePayment,
  findPaymentById,
  findPaymentByIdempotencyKey,
  findPaymentByProviderPaymentId,
  findPaymentOrderById,
  findPaymentOrderByToken,
  findPaymentOrders,
  findPayments,
  insertPayment,
  insertPaymentOrder,
  findPaymentAttemptsByOrderId,
  updatePayment,
  updatePaymentOrder,
  updatePaymentOrderStatus,
  updatePaymentStatus,
} from "./payment.repository.js";

/* -------------------------------------------------------------------------- */
/*                              HELPERS                                       */
/* -------------------------------------------------------------------------- */

async function findInvoice(
  companyId: string,
  invoiceId: string,
  executor:
    | typeof db
    | Parameters<Parameters<typeof db.transaction>[0]>[0] = db,
) {
  const [invoice] = await executor
    .select()
    .from(invoices)
    .where(and(eq(invoices.id, invoiceId), eq(invoices.companyId, companyId)))
    .limit(1);

  return invoice ?? null;
}

async function findCustomer(
  companyId: string,
  customerId: string,
  executor:
    | typeof db
    | Parameters<Parameters<typeof db.transaction>[0]>[0] = db,
) {
  const [customer] = await executor
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

async function getCompletedPaymentTotal(
  companyId: string,
  invoiceId: string,
  executor:
    | typeof db
    | Parameters<Parameters<typeof db.transaction>[0]>[0] = db,
) {
  const result = await executor.execute(
    sql`
      SELECT COALESCE(SUM(amount), 0) AS total
      FROM payments
      WHERE
        company_id = ${companyId}
        AND invoice_id = ${invoiceId}
        AND status = 'completed'
    `,
  );

  return Number(
    (result.rows[0] as { total?: string } | undefined)?.total ?? 0,
  );
}

function assertAmountDoesNotExceedRemaining(
  requestedAmount: number,
  invoiceTotal: number,
  paidAmount: number,
) {
  const remaining = Math.max(0, invoiceTotal - paidAmount);

  if (requestedAmount > remaining + 0.000001) {
    throw new ApiError(
      409,
      `Payment amount exceeds remaining invoice balance of ${remaining.toFixed(2)}`,
      "PAYMENT_AMOUNT_EXCEEDS_BALANCE",
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                              PAYMENT LIST                                  */
/* -------------------------------------------------------------------------- */

export async function listPayments(companyId: string, query: PaymentListQuery) {
  return findPayments(companyId, query);
}

/* -------------------------------------------------------------------------- */
/*                              GET PAYMENT                                   */
/* -------------------------------------------------------------------------- */

export async function getPayment(companyId: string, paymentId: string) {
  const payment = await findPaymentById(companyId, paymentId);

  if (!payment) {
    throw new ApiError(404, "Payment not found", "PAYMENT_NOT_FOUND");
  }

  return payment;
}

/* -------------------------------------------------------------------------- */
/*                             CREATE PAYMENT                                 */
/* -------------------------------------------------------------------------- */

export async function createPayment(
  companyId: string,
  input: CreatePaymentInput,
) {
  return db.transaction(async (tx) => {
    const invoice = await findInvoice(companyId, input.invoiceId, tx);

    if (!invoice) {
      throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
    }

    if (invoice.status === "cancelled") {
      throw new ApiError(
        409,
        "Cannot create payment for cancelled invoice",
        "INVOICE_CANCELLED",
      );
    }

    if (invoice.status === "draft") {
      throw new ApiError(
        409,
        "Cannot create payment for draft invoice",
        "INVOICE_NOT_ISSUED",
      );
    }

    const customer = await findCustomer(companyId, input.customerId, tx);

    if (!customer) {
      throw new ApiError(404, "Customer not found", "CUSTOMER_NOT_FOUND");
    }

    if (invoice.customerId !== input.customerId) {
      throw new ApiError(
        409,
        "Payment customer does not belong to invoice",
        "CUSTOMER_INVOICE_MISMATCH",
      );
    }

    if (input.idempotencyKey) {
      const existing = await findPaymentByIdempotencyKey(
        companyId,
        input.idempotencyKey,
        tx,
      );

      if (existing) {
        return existing;
      }
    }

    const paidAmount = await getCompletedPaymentTotal(
      companyId,
      input.invoiceId,
      tx,
    );

    assertAmountDoesNotExceedRemaining(
      input.amount,
      Number(invoice.total),
      paidAmount,
    );

    const payment = await insertPayment(tx, {
      companyId,
      invoiceId: input.invoiceId,
      customerId: input.customerId,
      amount: String(input.amount),
      currency: input.currency ?? "INR",
      paymentMethod: input.paymentMethod,
      paymentProvider: input.paymentProvider ?? "manual",
      status: "completed",
      transactionId: input.transactionId,
      idempotencyKey: input.idempotencyKey,
      paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
      notes: input.notes,
    });

    await syncInvoiceStatus(companyId, input.invoiceId, tx);

    return payment;
  });
}

/* -------------------------------------------------------------------------- */
/*                              UPDATE PAYMENT                                */
/* -------------------------------------------------------------------------- */

export async function editPayment(
  companyId: string,
  paymentId: string,
  input: UpdatePaymentInput,
) {
  const existing = await findPaymentById(companyId, paymentId);

  if (!existing) {
    throw new ApiError(404, "Payment not found", "PAYMENT_NOT_FOUND");
  }

  if (existing.status === "completed") {
    throw new ApiError(
      409,
      "Completed payment cannot be edited",
      "PAYMENT_NOT_EDITABLE",
    );
  }

  const payment = await updatePayment(companyId, paymentId, {
    transactionId: input.transactionId,

    paymentDate:
      input.paymentDate === undefined
        ? undefined
        : input.paymentDate === null
          ? null
          : new Date(input.paymentDate),

    notes: input.notes,
  });

  if (!payment) {
    throw new ApiError(404, "Payment not found", "PAYMENT_NOT_FOUND");
  }

  return payment;
}

/* -------------------------------------------------------------------------- */
/*                            UPDATE STATUS                                   */
/* -------------------------------------------------------------------------- */

export async function changePaymentStatus(
  companyId: string,
  paymentId: string,
  status: PaymentStatus,
) {
  return db.transaction(async (tx) => {
    const existing = await findPaymentById(companyId, paymentId, tx);

    if (!existing) {
      throw new ApiError(404, "Payment not found", "PAYMENT_NOT_FOUND");
    }

    if (existing.status === "cancelled" && status !== "cancelled") {
      throw new ApiError(
        409,
        "Cancelled payment cannot be changed",
        "PAYMENT_STATUS_LOCKED",
      );
    }

    const payment = await updatePaymentStatus(companyId, paymentId, status, tx);

    await syncInvoiceStatus(companyId, existing.invoiceId, tx);

    return payment;
  });
}

/* -------------------------------------------------------------------------- */
/*                              DELETE PAYMENT                                */
/* -------------------------------------------------------------------------- */

export async function removePayment(companyId: string, paymentId: string) {
  return db.transaction(async (tx) => {
    const existing = await findPaymentById(companyId, paymentId, tx);

    if (!existing) {
      throw new ApiError(404, "Payment not found", "PAYMENT_NOT_FOUND");
    }

    if (existing.status === "completed") {
      throw new ApiError(
        409,
        "Completed payment cannot be deleted",
        "PAYMENT_NOT_DELETABLE",
      );
    }

    await deletePayment(companyId, paymentId, tx);

    await syncInvoiceStatus(companyId, existing.invoiceId, tx);
  });
}

/* -------------------------------------------------------------------------- */
/*                           PAYMENT ORDERS                                   */
/* -------------------------------------------------------------------------- */

export async function listPaymentOrders(
  companyId: string,
  query: PaymentOrderListQuery,
) {
  return findPaymentOrders(companyId, query);
}

export async function getPaymentOrder(
  companyId: string,
  paymentOrderId: string,
) {
  const order = await findPaymentOrderById(companyId, paymentOrderId);

  if (!order) {
    throw new ApiError(
      404,
      "Payment order not found",
      "PAYMENT_ORDER_NOT_FOUND",
    );
  }

  return order;
}

/* -------------------------------------------------------------------------- */
/*                       PUBLIC PAYMENT LINK                                 */
/* -------------------------------------------------------------------------- */

export async function getPublicPaymentOrder(token: string) {
  const order = await findPaymentOrderByToken(token);

  if (!order) {
    throw new ApiError(404, "Payment link not found", "PAYMENT_LINK_NOT_FOUND");
  }

  if (order.status === "cancelled") {
    throw new ApiError(
      409,
      "Payment link has been cancelled",
      "PAYMENT_LINK_CANCELLED",
    );
  }

  if (order.status === "expired") {
    throw new ApiError(409, "Payment link has expired", "PAYMENT_LINK_EXPIRED");
  }

  if (
    order.expiresAt &&
    new Date(order.expiresAt) < new Date() &&
    order.status === "pending"
  ) {
    throw new ApiError(409, "Payment link has expired", "PAYMENT_LINK_EXPIRED");
  }

  return {
    id: order.id,
    amount: order.amount,
    currency: order.currency,
    provider: order.provider,
    providerOrderId: order.providerOrderId,
    status: order.status,
    expiresAt: order.expiresAt,
    paidAt: order.paidAt,
    razorpayKeyId:
      order.provider === "razorpay"
        ? process.env.RAZORPAY_KEY_ID ?? null
        : null,
  };
}

/* -------------------------------------------------------------------------- */
/*                        CREATE PAYMENT ORDER                               */
/* -------------------------------------------------------------------------- */

export async function createPaymentOrder(
  companyId: string,
  input: CreatePaymentOrderInput,
) {
  const invoice = await findInvoice(companyId, input.invoiceId);

  if (!invoice) {
    throw new ApiError(404, "Invoice not found", "INVOICE_NOT_FOUND");
  }

  if (invoice.status === "cancelled") {
    throw new ApiError(
      409,
      "Cannot create payment order for cancelled invoice",
      "INVOICE_CANCELLED",
    );
  }

  if (invoice.status === "draft") {
    throw new ApiError(
      409,
      "Cannot create payment order for draft invoice",
      "INVOICE_NOT_ISSUED",
    );
  }

  if (invoice.customerId !== input.customerId) {
    throw new ApiError(
      409,
      "Customer does not belong to invoice",
      "CUSTOMER_INVOICE_MISMATCH",
    );
  }

  const customer = await findCustomer(companyId, input.customerId);

  if (!customer) {
    throw new ApiError(404, "Customer not found", "CUSTOMER_NOT_FOUND");
  }

  const paidAmount = await getCompletedPaymentTotal(
    companyId,
    input.invoiceId,
  );

  assertAmountDoesNotExceedRemaining(
    input.amount,
    Number(invoice.total),
    paidAmount,
  );

  const paymentLinkToken = `${randomUUID()}${randomUUID()}`;

  const localOrder = await insertPaymentOrder(db, {
    companyId,
    invoiceId: input.invoiceId,
    customerId: input.customerId,
    amount: String(input.amount),
    currency: input.currency ?? "INR",
    provider: input.provider,
    paymentLinkToken,
    status: "pending",
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
    notes: input.notes,
  });

  if (input.provider !== "razorpay") {
    throw new ApiError(
      400,
      `Unsupported payment provider: ${input.provider}`,
      "PAYMENT_PROVIDER_NOT_SUPPORTED",
    );
  }

  try {
    const razorpayOrder = await createRazorpayOrder({
      amount: Number(localOrder.amount),
      currency: localOrder.currency,
      receipt: `PB-${localOrder.id}`,
      notes: {
        paymentOrderId: localOrder.id,
        invoiceId: localOrder.invoiceId,
        companyId,
      },
    });

    const updatedOrder = await updatePaymentOrder(
      companyId,
      localOrder.id,
      {
        providerOrderId: razorpayOrder.id,
      },
    );

    if (!updatedOrder) {
      throw new ApiError(
        500,
        "Payment order could not be finalized",
        "PAYMENT_ORDER_FINALIZATION_FAILED",
      );
    }

    return updatedOrder;
  } catch (error) {
    await updatePaymentOrder(companyId, localOrder.id, {
      status: "cancelled",
      cancelledAt: new Date(),
      notes:
        localOrder.notes
          ? `${localOrder.notes}\nGateway order creation failed.`
          : "Gateway order creation failed.",
    });

    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                        UPDATE PAYMENT ORDER                               */
/* -------------------------------------------------------------------------- */

export async function editPaymentOrder(
  companyId: string,
  paymentOrderId: string,
  input: UpdatePaymentOrderInput,
) {
  const existing = await findPaymentOrderById(companyId, paymentOrderId);

  if (!existing) {
    throw new ApiError(
      404,
      "Payment order not found",
      "PAYMENT_ORDER_NOT_FOUND",
    );
  }

  if (existing.status !== "pending") {
    throw new ApiError(
      409,
      "Only pending payment orders can be updated",
      "PAYMENT_ORDER_NOT_EDITABLE",
    );
  }

  return updatePaymentOrder(companyId, paymentOrderId, {
    expiresAt:
      input.expiresAt === undefined
        ? undefined
        : input.expiresAt === null
          ? null
          : new Date(input.expiresAt),

    notes: input.notes,
  });
}

/* -------------------------------------------------------------------------- */
/*                        CANCEL PAYMENT ORDER                               */
/* -------------------------------------------------------------------------- */

export async function cancelPaymentOrder(
  companyId: string,
  paymentOrderId: string,
) {
  const existing = await findPaymentOrderById(companyId, paymentOrderId);

  if (!existing) {
    throw new ApiError(
      404,
      "Payment order not found",
      "PAYMENT_ORDER_NOT_FOUND",
    );
  }

  if (existing.status === "paid") {
    throw new ApiError(
      409,
      "Paid payment order cannot be cancelled",
      "PAYMENT_ORDER_PAID",
    );
  }

  if (existing.status === "expired") {
    throw new ApiError(
      409,
      "Expired payment order cannot be cancelled",
      "PAYMENT_ORDER_EXPIRED",
    );
  }

  if (existing.status === "cancelled") {
    return existing;
  }

  return updatePaymentOrderStatus(companyId, paymentOrderId, "cancelled");
}

/* -------------------------------------------------------------------------- */
/*                    COMPLETE ONLINE PAYMENT                                */
/* -------------------------------------------------------------------------- */

export async function completeOnlinePayment(
  companyId: string,
  paymentOrderId: string,
  input: CompleteOnlinePaymentInput,
) {
  return db.transaction(async (tx) => {
    const order = await findPaymentOrderById(companyId, paymentOrderId, tx);

    if (!order) {
      throw new ApiError(
        404,
        "Payment order not found",
        "PAYMENT_ORDER_NOT_FOUND",
      );
    }

    if (order.status === "paid") {
      const existing = await findPaymentByProviderPaymentId(
        companyId,
        input.providerPaymentId,
        tx,
      );

      return {
        payment: existing,
        paymentOrder: order,
      };
    }

    if (order.status !== "pending") {
      throw new ApiError(
        409,
        `Payment order is ${order.status}`,
        "PAYMENT_ORDER_NOT_PENDING",
      );
    }

    const existing = await findPaymentByProviderPaymentId(
      companyId,
      input.providerPaymentId,
      tx,
    );

    if (existing) {
      return {
        payment: existing,
        paymentOrder: order,
      };
    }

    const payment = await insertPayment(tx, {
      companyId,
      invoiceId: order.invoiceId,
      customerId: order.customerId,
      amount: order.amount,
      currency: order.currency,
      paymentMethod: "online",
      paymentProvider: "razorpay",
      status: "completed",
      providerOrderId: order.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      transactionId: input.transactionId,
      paymentDate: input.paymentDate ? new Date(input.paymentDate) : new Date(),
      notes: input.notes,
    });

    const paymentOrder = await updatePaymentOrderStatus(
      companyId,
      paymentOrderId,
      "paid",
      tx,
    );

    await syncInvoiceStatus(companyId, order.invoiceId, tx);

    return {
      payment,
      paymentOrder,
    };
  });
}

/* -------------------------------------------------------------------------- */
/*                       INVOICE STATUS SYNC                                 */
/* -------------------------------------------------------------------------- */

async function syncInvoiceStatus(
  companyId: string,
  invoiceId: string,
  executor:
    | typeof db
    | Parameters<Parameters<typeof db.transaction>[0]>[0] = db,
) {
  const invoice = await findInvoice(companyId, invoiceId, executor);

  if (!invoice) {
    return null;
  }

  if (invoice.status === "cancelled") {
    return invoice;
  }

  const result = await executor.execute(
    sql`
        SELECT
          COALESCE(
            SUM(amount),
            0
          ) AS total
        FROM payments
        WHERE
          company_id = ${companyId}
          AND invoice_id = ${invoiceId}
          AND status = 'completed'
      `,
  );

  const paidAmount = Number(
    (result.rows[0] as { total?: string } | undefined)?.total ?? 0,
  );

  const invoiceTotal = Number(invoice.total);

  let status = invoice.status;

  if (paidAmount <= 0) {
    status = invoice.status === "draft" ? "draft" : "issued";
  } else if (paidAmount < invoiceTotal) {
    status = "partially-paid";
  } else {
    status = "paid";
  }

  if (status === invoice.status) {
    return invoice;
  }

  const [updated] = await executor
    .update(invoices)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(and(eq(invoices.id, invoiceId), eq(invoices.companyId, companyId)))
    .returning();

  return updated ?? invoice;
}


/* -------------------------------------------------------------------------- */
/*                         PAYMENT ATTEMPTS                                   */
/* -------------------------------------------------------------------------- */

export async function listPaymentAttempts(
  companyId: string,
  paymentOrderId: string,
) {
  const order = await findPaymentOrderById(companyId, paymentOrderId);

  if (!order) {
    throw new ApiError(
      404,
      "Payment order not found",
      "PAYMENT_ORDER_NOT_FOUND",
    );
  }

  return findPaymentAttemptsByOrderId(companyId, paymentOrderId);
}
