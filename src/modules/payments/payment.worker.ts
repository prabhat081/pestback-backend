// src/modules/payments/payment.worker.ts

import { Worker } from "bullmq";

import {
  findPaymentAttemptByProviderPaymentId,
  findPaymentOrderByProviderOrderId,
  findPaymentWebhookById,
  insertPaymentAttempt,
  updatePaymentAttempt,
  updatePaymentWebhook,
} from "./payment.repository.js";

import { completeOnlinePayment } from "./payment.service.js";
import { fetchRazorpayPayment } from "./payment.provider.js";
import { redis as redisConnection } from "../../config/redis.js";
import { db } from "../../database/client.js";

export const PAYMENT_QUEUE_NAME = "payments";

interface RazorpayWebhookPayload {
  event?: string;
  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
        amount?: number | string;
        currency?: string;
        status?: string;
        method?: string;
        error_code?: string;
        error_description?: string;
        error_reason?: string;
        created_at?: number;
      };
    };
    order?: {
      entity?: {
        id?: string;
        amount?: number | string;
        currency?: string;
        status?: string;
      };
    };
  };
}

async function processRazorpayWebhook(webhookId: string) {
  const webhook = await findPaymentWebhookById(webhookId);

  if (!webhook) {
    throw new Error(`Payment webhook ${webhookId} not found`);
  }

  if (webhook.status === "processed") {
    return;
  }

  await updatePaymentWebhook(webhook.id, {
    status: "processing",
    errorMessage: null,
  });

  try {
    const payload = JSON.parse(webhook.payload) as RazorpayWebhookPayload;

    switch (payload.event) {
      case "payment.captured":
        await processPaymentCaptured(webhook.companyId, payload);
        break;

      case "order.paid":
        await processOrderPaid(webhook.companyId, payload);
        break;

      case "payment.failed":
        await processPaymentFailed(webhook.companyId, payload);
        break;

      default:
        console.log(`[PaymentWorker] Ignoring event: ${payload.event}`);
    }

    await updatePaymentWebhook(webhook.id, {
      status: "processed",
      processedAt: new Date(),
      errorMessage: null,
    });
  } catch (error) {
    await updatePaymentWebhook(webhook.id, {
      status: "failed",
      errorMessage:
        error instanceof Error
          ? error.message
          : "Unknown webhook processing error",
      retryCount: webhook.retryCount + 1,
    });

    throw error;
  }
}

async function processPaymentCaptured(
  companyId: string | null,
  payload: RazorpayWebhookPayload,
) {
  const entity = payload.payload?.payment?.entity;

  if (!entity?.id) {
    throw new Error("Razorpay payment ID missing");
  }

  if (!entity.order_id) {
    throw new Error("Razorpay order ID missing");
  }

  if (!companyId) {
    throw new Error("Company could not be resolved for payment webhook");
  }

  const payment = await fetchRazorpayPayment(entity.id);

  if (!payment.order_id) {
    throw new Error("Razorpay payment has no order ID");
  }

  const order = await findPaymentOrderByProviderOrderId(
    "razorpay",
    payment.order_id,
  );

  if (!order) {
    throw new Error(
      `Payment order not found for Razorpay order ${payment.order_id}`,
    );
  }

  if (order.companyId !== companyId) {
    throw new Error("Webhook company does not match payment order company");
  }

  const razorpayAmount = Number(payment.amount);
  const orderAmount = Math.round(Number(order.amount) * 100);

  if (razorpayAmount !== orderAmount) {
    throw new Error("Razorpay payment amount does not match payment order");
  }

  if (payment.currency !== order.currency) {
    throw new Error("Razorpay payment currency does not match payment order");
  }

  let attempt = await findPaymentAttemptByProviderPaymentId(payment.id);

  if (!attempt) {
    attempt = await insertPaymentAttempt(db, {
      companyId,
      paymentOrderId: order.id,
      provider: "razorpay",
      providerOrderId: payment.order_id,
      providerPaymentId: payment.id,
      amount: order.amount,
      status: "processing",
      startedAt: new Date(),
    });
  } else if (attempt.companyId !== companyId) {
    throw new Error("Payment attempt company does not match payment order");
  } else {
    await updatePaymentAttempt(attempt.id, {
      status: "processing",
      providerOrderId: payment.order_id,
      amount: order.amount,
      startedAt: attempt.startedAt ?? new Date(),
      failureCode: null,
      failureMessage: null,
    });
  }

  try {
    const result = await completeOnlinePayment(companyId, order.id, {
      providerPaymentId: payment.id,
      transactionId: payment.id,
      paymentDate: payment.created_at
        ? new Date(payment.created_at * 1000).toISOString()
        : undefined,
      notes: "Payment captured via Razorpay",
    });

    const paymentId = result.payment?.id ?? null;

    await updatePaymentAttempt(attempt.id, {
      paymentId,
      status: "completed",
      completedAt: new Date(),
    });
  } catch (error) {
    await updatePaymentAttempt(attempt.id, {
      status: "failed",
      failureCode: "PAYMENT_PROCESSING_FAILED",
      failureMessage:
        error instanceof Error ? error.message : "Payment processing failed",
      completedAt: null,
    });

    throw error;
  }
}

async function processOrderPaid(
  companyId: string | null,
  payload: RazorpayWebhookPayload,
) {
  const paymentEntity = payload.payload?.payment?.entity;

  if (paymentEntity?.id) {
    await processPaymentCaptured(companyId, payload);
    return;
  }

  const orderEntity = payload.payload?.order?.entity;

  if (!orderEntity?.id) {
    throw new Error("Razorpay order ID missing");
  }

  /*
   * The payment.captured event is the source used to create
   * the actual payments record. order.paid without a payment
   * entity is therefore acknowledged but does not invent a
   * payment record.
   */
  console.log(
    `[PaymentWorker] order.paid received without payment entity: ${orderEntity.id}`,
  );
}

async function processPaymentFailed(
  companyId: string | null,
  payload: RazorpayWebhookPayload,
) {
  const entity = payload.payload?.payment?.entity;

  if (!entity?.id) {
    throw new Error("Razorpay failed payment ID missing");
  }

  if (!entity.order_id) {
    throw new Error("Razorpay failed payment order ID missing");
  }

  if (!companyId) {
    throw new Error("Company could not be resolved for failed payment");
  }

  const order = await findPaymentOrderByProviderOrderId(
    "razorpay",
    entity.order_id,
  );

  if (!order) {
    throw new Error(
      `Payment order not found for Razorpay order ${entity.order_id}`,
    );
  }

  if (order.companyId !== companyId) {
    throw new Error("Webhook company does not match payment order company");
  }

  let attempt = await findPaymentAttemptByProviderPaymentId(entity.id);

  if (!attempt) {
    attempt = await insertPaymentAttempt(db, {
      companyId,
      paymentOrderId: order.id,
      provider: "razorpay",
      providerOrderId: entity.order_id,
      providerPaymentId: entity.id,
      amount: order.amount,
      status: "failed",
      failureCode: entity.error_code ?? "PAYMENT_FAILED",
      failureMessage:
        entity.error_description ??
        entity.error_reason ??
        "Razorpay payment failed",
      startedAt: new Date(),
      completedAt: new Date(),
    });
  } else {
    if (attempt.companyId !== companyId) {
      throw new Error("Payment attempt company does not match payment order");
    }

    if (attempt.status === "completed") {
      return;
    }

    await updatePaymentAttempt(attempt.id, {
      providerOrderId: entity.order_id,
      status: "failed",
      failureCode: entity.error_code ?? "PAYMENT_FAILED",
      failureMessage:
        entity.error_description ??
        entity.error_reason ??
        "Razorpay payment failed",
      completedAt: new Date(),
    });
  }

  console.log(`[PaymentWorker] Razorpay payment failed: ${entity.id}`);
}

export const paymentWorker = new Worker(
  PAYMENT_QUEUE_NAME,
  async (job) => {
    if (job.name !== "process-webhook") {
      return;
    }

    const { webhookId } = job.data as { webhookId: string };

    await processRazorpayWebhook(webhookId);
  },
  {
    connection: redisConnection,
    concurrency: 10,
    limiter: {
      max: 20,
      duration: 1000,
    },
  },
);

paymentWorker.on("completed", (job) => {
  console.log(`[PaymentWorker] Completed: ${job.id}`);
});

paymentWorker.on("failed", (job, error) => {
  console.error(`[PaymentWorker] Failed: ${job?.id}`, error);
});
