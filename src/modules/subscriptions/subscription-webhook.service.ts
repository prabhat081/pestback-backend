import { ApiError } from "../../utils/api-error.js";

import {
  createWebhookEvent,
  findWebhookEvent,
  markWebhookEventFailed,
  markWebhookEventProcessed,
  processPaymentFailedTransaction,
  processSubscriptionActivated,
  processSubscriptionCancelled,
  processSubscriptionChargedTransaction,
  processSubscriptionCompleted,
  processSubscriptionHalted,
  processSubscriptionPending,
} from "./subscription-webhook.repository.js";
import { fetchRazorpayInvoice } from "../../integrations/razorpay/razorpay-invoice.service.js";

interface RazorpaySubscriptionEntity {
  id?: string;

  customer_id?: string | null;

  current_start?: number;

  current_end?: number;

  end_at?: number;
}

interface RazorpayPaymentEntity {
  id?: string;

  subscription_id?: string;

  customer_id?: string | null;

  invoice_id?: string | null;

  amount?: number;

  currency?: string;

  order_id?: string | null;

  error_description?: string | null;

  error_reason?: string | null;
}

interface RazorpayWebhookPayload {
  payload?: {
    subscription?: {
      entity?: RazorpaySubscriptionEntity;
    };

    payment?: {
      entity?: RazorpayPaymentEntity;
    };
  };
}

interface ProcessRazorpayWebhookInput {
  eventId: string;

  event: string;

  payload: Record<string, unknown>;
}

function toPayload(payload: Record<string, unknown>): RazorpayWebhookPayload {
  return payload as RazorpayWebhookPayload;
}

function unixToDate(value?: number): Date | null {
  return typeof value === "number" && value > 0 ? new Date(value * 1000) : null;
}

function getSubscriptionEntity(payload: RazorpayWebhookPayload) {
  return payload.payload?.subscription?.entity ?? null;
}

function getPaymentEntity(payload: RazorpayWebhookPayload) {
  return payload.payload?.payment?.entity ?? null;
}

function getProviderSubscriptionId(payload: RazorpayWebhookPayload) {
  return (
    getSubscriptionEntity(payload)?.id ??
    getPaymentEntity(payload)?.subscription_id ??
    null
  );
}

function getAmount(amount?: number) {
  if (typeof amount !== "number" || !Number.isFinite(amount)) {
    return "0.00";
  }

  return (amount / 100).toFixed(2);
}

async function handleActivated(payload: RazorpayWebhookPayload) {
  const providerSubscriptionId = getProviderSubscriptionId(payload);

  if (!providerSubscriptionId) {
    throw new ApiError(
      400,
      "Razorpay subscription ID missing",
      "RAZORPAY_SUBSCRIPTION_ID_MISSING",
    );
  }

  const entity = getSubscriptionEntity(payload);

  const result = await processSubscriptionActivated(providerSubscriptionId, {
    providerCustomerId: entity?.customer_id ?? null,

    currentPeriodStart: unixToDate(entity?.current_start),

    currentPeriodEnd: unixToDate(entity?.current_end),
  });

  if (!result) {
    throw new ApiError(404, "Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  }

  return result;
}

async function handleCharged(payload: RazorpayWebhookPayload) {
  const providerSubscriptionId = getProviderSubscriptionId(payload);

  const payment = getPaymentEntity(payload);

  const subscription = getSubscriptionEntity(payload);

  if (!providerSubscriptionId) {
    throw new ApiError(
      400,
      "Razorpay subscription ID missing",
      "RAZORPAY_SUBSCRIPTION_ID_MISSING",
    );
  }

  if (!payment?.id) {
    throw new ApiError(
      400,
      "Razorpay payment ID missing",
      "RAZORPAY_PAYMENT_ID_MISSING",
    );
  }

  return processSubscriptionChargedTransaction({
    providerSubscriptionId,

    providerPaymentId: payment.id,

    providerOrderId: payment.order_id ?? null,

    providerCustomerId:
      payment.customer_id ?? subscription?.customer_id ?? null,

    amount: getAmount(payment.amount),

    currency: payment.currency ?? "INR",

    paidAt: new Date(),

    currentPeriodStart: unixToDate(subscription?.current_start),

    currentPeriodEnd: unixToDate(subscription?.current_end),
  });
}

async function handlePending(payload: RazorpayWebhookPayload) {
  const providerSubscriptionId = getProviderSubscriptionId(payload);

  if (!providerSubscriptionId) {
    throw new ApiError(
      400,
      "Razorpay subscription ID missing",
      "RAZORPAY_SUBSCRIPTION_ID_MISSING",
    );
  }

  const result = await processSubscriptionPending(providerSubscriptionId);

  if (!result) {
    throw new ApiError(404, "Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  }

  return result;
}

async function handleHalted(payload: RazorpayWebhookPayload) {
  const providerSubscriptionId = getProviderSubscriptionId(payload);

  if (!providerSubscriptionId) {
    throw new ApiError(
      400,
      "Razorpay subscription ID missing",
      "RAZORPAY_SUBSCRIPTION_ID_MISSING",
    );
  }

  const result = await processSubscriptionHalted(providerSubscriptionId);

  if (!result) {
    throw new ApiError(404, "Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  }

  return result;
}

async function handlePaymentFailed(payload: RazorpayWebhookPayload) {
  const payment = getPaymentEntity(payload);

  if (!payment?.id) {
    throw new ApiError(
      400,
      "Razorpay payment ID missing",
      "RAZORPAY_PAYMENT_ID_MISSING",
    );
  }

  let providerSubscriptionId = getProviderSubscriptionId(payload);

  let providerCustomerId = payment.customer_id ?? null;

  /*
   * payment.failed does not always contain
   * subscription_id directly.
   *
   * For subscription invoice payments:
   * payment.invoice_id
   *       ↓
   * fetch Razorpay invoice
   *       ↓
   * invoice.subscription_id
   */
  if (!providerSubscriptionId && payment.invoice_id) {
    const invoice = await fetchRazorpayInvoice(payment.invoice_id);

    providerSubscriptionId = invoice.subscription_id ?? null;

    providerCustomerId = providerCustomerId ?? invoice.customer_id ?? null;
  }

  if (!providerSubscriptionId) {
    throw new ApiError(
      400,
      "Unable to resolve Razorpay subscription from failed payment",
      "RAZORPAY_SUBSCRIPTION_ID_MISSING",
    );
  }

  const result = await processPaymentFailedTransaction({
    providerPaymentId: payment.id,

    providerSubscriptionId,

    providerOrderId: payment.order_id ?? null,

    providerCustomerId,

    amount: getAmount(payment.amount),

    currency: payment.currency ?? "INR",

    failureReason: payment.error_description ?? payment.error_reason ?? null,
  });

  if (!result.subscription) {
    throw new ApiError(404, "Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  }

  return result;
}

async function handleCancelled(payload: RazorpayWebhookPayload) {
  const providerSubscriptionId = getProviderSubscriptionId(payload);

  if (!providerSubscriptionId) {
    throw new ApiError(
      400,
      "Razorpay subscription ID missing",
      "RAZORPAY_SUBSCRIPTION_ID_MISSING",
    );
  }

  const now = new Date();

  const result = await processSubscriptionCancelled(providerSubscriptionId, {
    cancelledAt: now,

    endedAt: now,
  });

  if (!result) {
    throw new ApiError(404, "Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  }

  return result;
}

async function handleCompleted(payload: RazorpayWebhookPayload) {
  const providerSubscriptionId = getProviderSubscriptionId(payload);

  if (!providerSubscriptionId) {
    throw new ApiError(
      400,
      "Razorpay subscription ID missing",
      "RAZORPAY_SUBSCRIPTION_ID_MISSING",
    );
  }

  const entity = getSubscriptionEntity(payload);

  const result = await processSubscriptionCompleted(
    providerSubscriptionId,

    unixToDate(entity?.end_at) ?? new Date(),
  );

  if (!result) {
    throw new ApiError(404, "Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  }

  return result;
}

export async function processRazorpayWebhook(
  input: ProcessRazorpayWebhookInput,
) {
  const { eventId, event, payload } = input;

  const webhookPayload = toPayload(payload);

  console.log("========== RAZORPAY WEBHOOK PAYLOAD ==========");

  console.log(JSON.stringify(payload, null, 2));

  console.log("==============================================");

  const existingEvent = await findWebhookEvent(eventId);

  if (existingEvent?.status === "processed") {
    return {
      processed: true,

      duplicate: true,

      eventId,

      event,
    };
  }

  if (!existingEvent) {
    const created = await createWebhookEvent({
      eventId,

      event,

      payload,
    });

    if (!created) {
      const concurrentEvent = await findWebhookEvent(eventId);

      if (concurrentEvent?.status === "processed") {
        return {
          processed: true,

          duplicate: true,

          eventId,

          event,
        };
      }
    }
  }

  try {
    switch (event) {
      case "subscription.activated":
        await handleActivated(webhookPayload);
        break;

      case "subscription.charged":
        await handleCharged(webhookPayload);
        break;

      case "subscription.pending":
        await handlePending(webhookPayload);
        break;

      case "subscription.halted":
        await handleHalted(webhookPayload);
        break;

      case "payment.failed":
        await handlePaymentFailed(webhookPayload);
        break;

      case "subscription.cancelled":
        await handleCancelled(webhookPayload);
        break;

      case "subscription.completed":
        await handleCompleted(webhookPayload);
        break;

      default:
        break;
    }

    await markWebhookEventProcessed(eventId);

    return {
      processed: true,

      duplicate: false,

      eventId,

      event,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Webhook processing failed";

    await markWebhookEventFailed(eventId, message);

    throw error;
  }
}
