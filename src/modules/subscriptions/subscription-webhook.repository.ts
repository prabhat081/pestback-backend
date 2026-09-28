import { and, eq } from "drizzle-orm";

import { db } from "../../database/client.js";

import {
  razorpayWebhookEvents,
  subscriptionPayments,
  subscriptions,
} from "../../database/schema/index.js";

import type { RazorpayWebhookEventStatus } from "../../database/schema/razorpay-webhook-events.js";

import type { SubscriptionStatus } from "../../database/schema/subscriptions.js";

/**
 * Find webhook event by Razorpay event ID.
 *
 * Used for webhook idempotency.
 */
export async function findWebhookEvent(
  eventId: string,
) {
  const result = await db
    .select()
    .from(razorpayWebhookEvents)
    .where(
      and(
        eq(
          razorpayWebhookEvents.provider,
          "razorpay",
        ),
        eq(
          razorpayWebhookEvents.eventId,
          eventId,
        ),
      ),
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Create webhook event.
 *
 * The unique provider + eventId constraint protects
 * against duplicate webhook deliveries.
 */
export async function createWebhookEvent(
  data: {
    eventId: string;
    event: string;
    payload: Record<string, unknown>;
  },
) {
  const result = await db
    .insert(razorpayWebhookEvents)
    .values({
      provider: "razorpay",
      eventId: data.eventId,
      event: data.event,
      payload: data.payload,
      status: "received",
    })
    .onConflictDoNothing({
      target: [
        razorpayWebhookEvents.provider,
        razorpayWebhookEvents.eventId,
      ],
    })
    .returning();

  return result[0] ?? null;
}

/**
 * Update webhook event processing state.
 */
export async function updateWebhookEventStatus(
  eventId: string,
  status: RazorpayWebhookEventStatus,
  errorMessage?: string | null,
) {
  const result = await db
    .update(razorpayWebhookEvents)
    .set({
      status,
      errorMessage:
        errorMessage ?? null,
      processedAt:
        status === "processed"
          ? new Date()
          : undefined,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(
          razorpayWebhookEvents.provider,
          "razorpay",
        ),
        eq(
          razorpayWebhookEvents.eventId,
          eventId,
        ),
      ),
    )
    .returning();

  return result[0] ?? null;
}

export async function markWebhookEventProcessed(
  eventId: string,
) {
  return updateWebhookEventStatus(
    eventId,
    "processed",
  );
}

export async function markWebhookEventFailed(
  eventId: string,
  errorMessage: string,
) {
  return updateWebhookEventStatus(
    eventId,
    "failed",
    errorMessage,
  );
}

/**
 * Find local subscription using Razorpay subscription ID.
 */
export async function findSubscriptionByProviderSubscriptionId(
  providerSubscriptionId: string,
) {
  const result = await db
    .select()
    .from(subscriptions)
    .where(
      eq(
        subscriptions.providerSubscriptionId,
        providerSubscriptionId,
      ),
    )
    .limit(1);

  return result[0] ?? null;
}

/**
 * Update subscription using provider lifecycle data.
 *
 * This is an internal webhook operation.
 * It must never be exposed as a public CRUD endpoint.
 */
export async function updateSubscriptionFromWebhook(
  providerSubscriptionId: string,
  data: {
    status?: SubscriptionStatus;

    providerCustomerId?: string | null;

    currentPeriodStart?: Date | null;

    currentPeriodEnd?: Date | null;

    trialEndsAt?: Date | null;

    cancelAtPeriodEnd?: boolean;

    cancelledAt?: Date | null;

    endedAt?: Date | null;

    isCurrent?: boolean;
  },
) {
  const result = await db
    .update(subscriptions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(
      eq(
        subscriptions.providerSubscriptionId,
        providerSubscriptionId,
      ),
    )
    .returning();

  return result[0] ?? null;
}

/**
 * subscription.activated
 *
 * Updates the local subscription after Razorpay
 * confirms activation.
 */
export async function processSubscriptionActivated(
  providerSubscriptionId: string,
  data: {
    providerCustomerId?: string | null;

    currentPeriodStart?: Date | null;

    currentPeriodEnd?: Date | null;
  },
) {
  return updateSubscriptionFromWebhook(
    providerSubscriptionId,
    {
      status: "active",

      providerCustomerId:
        data.providerCustomerId ?? null,

      currentPeriodStart:
        data.currentPeriodStart ?? null,

      currentPeriodEnd:
        data.currentPeriodEnd ?? null,
    },
  );
}

/**
 * subscription.charged
 *
 * Payment creation/update + subscription period update
 * must happen atomically.
 */
export async function processSubscriptionChargedTransaction(
  data: {
    providerSubscriptionId: string;

    providerPaymentId: string;

    providerOrderId?: string | null;

    providerCustomerId?: string | null;

    amount: string;

    currency: string;

    paidAt: Date | null;

    currentPeriodStart: Date | null;

    currentPeriodEnd: Date | null;
  },
) {
  return db.transaction(async (tx) => {
    const [subscription] = await tx
      .select()
      .from(subscriptions)
      .where(
        eq(
          subscriptions.providerSubscriptionId,
          data.providerSubscriptionId,
        ),
      )
      .limit(1);

    if (!subscription) {
      throw new Error(
        "Subscription not found for Razorpay subscription ID",
      );
    }

    const [existingPayment] =
      await tx
        .select()
        .from(subscriptionPayments)
        .where(
          eq(
            subscriptionPayments.providerPaymentId,
            data.providerPaymentId,
          ),
        )
        .limit(1);

    if (existingPayment) {
      await tx
        .update(subscriptionPayments)
        .set({
          status: "paid",

          amount: data.amount,

          currency: data.currency,

          providerSubscriptionId:
            data.providerSubscriptionId,

          providerOrderId:
            data.providerOrderId ??
            existingPayment.providerOrderId,

          paidAt:
            data.paidAt ??
            existingPayment.paidAt,

          failureReason: null,

          updatedAt: new Date(),
        })
        .where(
          eq(
            subscriptionPayments.id,
            existingPayment.id,
          ),
        );
    } else {
      await tx
        .insert(subscriptionPayments)
        .values({
          companyId: subscription.companyId,

          subscriptionId: subscription.id,

          provider: "razorpay",

          status: "paid",

          amount: data.amount,

          currency: data.currency,

          providerPaymentId:
            data.providerPaymentId,

          providerSubscriptionId:
            data.providerSubscriptionId,

          providerOrderId:
            data.providerOrderId ?? null,

          failureReason: null,

          paidAt: data.paidAt,

          refundedAt: null,
        })
        .onConflictDoNothing({
          target:
            subscriptionPayments.providerPaymentId,
        });
    }

    const [updatedSubscription] =
      await tx
        .update(subscriptions)
        .set({
          status: "active",

          providerCustomerId:
            data.providerCustomerId ??
            subscription.providerCustomerId,

          currentPeriodStart:
            data.currentPeriodStart,

          currentPeriodEnd:
            data.currentPeriodEnd,

          updatedAt: new Date(),
        })
        .where(
          eq(
            subscriptions.id,
            subscription.id,
          ),
        )
        .returning();

    return {
      subscription:
        updatedSubscription ?? null,
    };
  });
}

/**
 * payment.failed
 *
 * Creates/updates the payment ledger and marks
 * the subscription as past_due.
 */
export async function processPaymentFailedTransaction(
  data: {
    providerPaymentId: string;

    providerSubscriptionId: string;

    providerOrderId?: string | null;

    providerCustomerId?: string | null;

    amount: string;

    currency: string;

    failureReason: string | null;
  },
) {
  return db.transaction(async (tx) => {
    const [subscription] = await tx
      .select()
      .from(subscriptions)
      .where(
        eq(
          subscriptions.providerSubscriptionId,
          data.providerSubscriptionId,
        ),
      )
      .limit(1);

    if (!subscription) {
      throw new Error(
        "Subscription not found for failed Razorpay payment",
      );
    }

    const [existingPayment] =
      await tx
        .select()
        .from(subscriptionPayments)
        .where(
          eq(
            subscriptionPayments.providerPaymentId,
            data.providerPaymentId,
          ),
        )
        .limit(1);

    if (existingPayment) {
      await tx
        .update(subscriptionPayments)
        .set({
          status: "failed",

          amount: data.amount,

          currency: data.currency,

          providerSubscriptionId:
            data.providerSubscriptionId,

          providerOrderId:
            data.providerOrderId ??
            existingPayment.providerOrderId,

          failureReason:
            data.failureReason,

          updatedAt: new Date(),
        })
        .where(
          eq(
            subscriptionPayments.id,
            existingPayment.id,
          ),
        );
    } else {
      await tx
        .insert(subscriptionPayments)
        .values({
          companyId: subscription.companyId,

          subscriptionId: subscription.id,

          provider: "razorpay",

          status: "failed",

          amount: data.amount,

          currency: data.currency,

          providerPaymentId:
            data.providerPaymentId,

          providerSubscriptionId:
            data.providerSubscriptionId,

          providerOrderId:
            data.providerOrderId ?? null,

          failureReason:
            data.failureReason,

          paidAt: null,

          refundedAt: null,
        })
        .onConflictDoNothing({
          target:
            subscriptionPayments.providerPaymentId,
        });
    }

    const [updatedSubscription] =
      await tx
        .update(subscriptions)
        .set({
          status: "past_due",

          providerCustomerId:
            data.providerCustomerId ??
            subscription.providerCustomerId,

          updatedAt: new Date(),
        })
        .where(
          eq(
            subscriptions.id,
            subscription.id,
          ),
        )
        .returning();

    return {
      subscription:
        updatedSubscription ?? null,
    };
  });
}

/**
 * subscription.halted
 *
 * Razorpay has halted the subscription after payment retries
 * have been exhausted.
 */
export async function processSubscriptionHalted(
  providerSubscriptionId: string,
) {
  return updateSubscriptionFromWebhook(
    providerSubscriptionId,
    {
      status: "past_due",
    },
  );
}

/**
 * subscription.pending
 *
 * Razorpay subscription is pending activation/payment.
 */
export async function processSubscriptionPending(
  providerSubscriptionId: string,
) {
  return updateSubscriptionFromWebhook(
    providerSubscriptionId,
    {
      status: "pending",
    },
  );
}

/**
 * subscription.cancelled
 */
export async function processSubscriptionCancelled(
  providerSubscriptionId: string,
  data: {
    cancelledAt: Date;

    endedAt: Date | null;
  },
) {
  return updateSubscriptionFromWebhook(
    providerSubscriptionId,
    {
      status: "cancelled",

      cancelledAt:
        data.cancelledAt,

      endedAt:
        data.endedAt,

      isCurrent: false,

      cancelAtPeriodEnd: false,
    },
  );
}

/**
 * subscription.completed
 */
export async function processSubscriptionCompleted(
  providerSubscriptionId: string,
  endedAt: Date | null,
) {
  return updateSubscriptionFromWebhook(
    providerSubscriptionId,
    {
      status: "expired",

      endedAt,

      isCurrent: false,
    },
  );
}