import { ApiError } from "../../utils/api-error.js";

import {
  cancelRazorpaySubscription,
  createRazorpaySubscription,
} from "../../integrations/razorpay/razorpay-subscription.service.js";

import {
  createSubscription,
  findBillingPlan,
  findCurrentSubscriptionByCompanyId,
  findPlanById,
  findSubscriptionById,
  findSubscriptions,
  updateSubscription,
} from "./subscription.repository.js";

import type {
  CreateSubscriptionInput,
  SubscriptionListQuery,
} from "./subscription.types.js";

/**
 * =========================================================
 * HELPERS
 * =========================================================
 */

function getPlanAmount(
  plan: {
    monthlyPrice: string;
    yearlyPrice: string;
  },
  billingInterval: CreateSubscriptionInput["billingInterval"],
) {
  return billingInterval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
}

function getTrialEndDate(trialDays: number) {
  if (trialDays <= 0) {
    return null;
  }

  const trialEndsAt = new Date();

  trialEndsAt.setDate(trialEndsAt.getDate() + trialDays);

  return trialEndsAt;
}

/**
 * =========================================================
 * GET SUBSCRIPTIONS
 * =========================================================
 */

export async function getSubscriptions(
  query: SubscriptionListQuery,
  companyId: string,
) {
  return findSubscriptions(query, companyId);
}

/**
 * =========================================================
 * GET SINGLE SUBSCRIPTION
 * =========================================================
 */

export async function getSubscription(
  subscriptionId: string,
  companyId: string,
) {
  const subscription = await findSubscriptionById(subscriptionId);

  if (!subscription) {
    throw new ApiError(404, "Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  }

  if (subscription.company.id !== companyId) {
    throw new ApiError(
      403,
      "You do not have access to this subscription",
      "SUBSCRIPTION_ACCESS_DENIED",
    );
  }

  return subscription;
}

/**
 * =========================================================
 * GET CURRENT SUBSCRIPTION
 * =========================================================
 */

export async function getCurrentSubscription(companyId: string) {
  return findCurrentSubscriptionByCompanyId(companyId);
}

/**
 * =========================================================
 * CREATE NEW SUBSCRIPTION
 * =========================================================
 *
 * Flow:
 *
 * 1. Check current subscription
 * 2. Validate plan
 * 3. Calculate amount
 * 4. Free plan:
 *      create local subscription
 *
 * 5. Paid plan:
 *      find Razorpay billing plan
 *      create Razorpay subscription
 *      create local subscription as "pending"
 *
 * 6. Razorpay webhook:
 *      pending -> active
 */

export async function createNewSubscription(
  companyId: string,
  data: CreateSubscriptionInput,
) {
  /**
   * -------------------------------------------------------
   * 1. CHECK CURRENT SUBSCRIPTION
   * -------------------------------------------------------
   */

  const existingSubscription =
    await findCurrentSubscriptionByCompanyId(companyId);

  if (existingSubscription) {
    throw new ApiError(
      409,
      "Company already has a current subscription",
      "CURRENT_SUBSCRIPTION_EXISTS",
    );
  }

  /**
   * -------------------------------------------------------
   * 2. FIND PLAN
   * -------------------------------------------------------
   */

  const plan = await findPlanById(data.planId);

  if (!plan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  /**
   * -------------------------------------------------------
   * 3. CHECK PLAN STATUS
   * -------------------------------------------------------
   */

  if (plan.status !== "active") {
    throw new ApiError(400, "Selected plan is inactive", "PLAN_INACTIVE");
  }

  /**
   * -------------------------------------------------------
   * 4. GET PLAN AMOUNT
   * -------------------------------------------------------
   */

  const amount = getPlanAmount(plan, data.billingInterval);

  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw new ApiError(
      400,
      "Invalid subscription amount",
      "INVALID_SUBSCRIPTION_AMOUNT",
    );
  }

  /**
   * -------------------------------------------------------
   * 5. TRIAL
   * -------------------------------------------------------
   */

  const trialEndsAt = getTrialEndDate(Number(plan.trialDays ?? 0));

  /**
   * =======================================================
   * FREE PLAN
   * =======================================================
   *
   * No Razorpay subscription is created.
   */

  if (numericAmount === 0) {
    const now = new Date();

    const status = trialEndsAt ? "trialing" : "active";

    return createSubscription({
      companyId,

      planId: data.planId,

      billingInterval: data.billingInterval,

      amount,

      currency: plan.currency,

      provider: "razorpay",

      providerCustomerId: null,

      providerSubscriptionId: null,

      status,

      startedAt: now,

      trialEndsAt,

      currentPeriodStart: now,

      currentPeriodEnd: trialEndsAt,
    });
  }

  /**
   * =======================================================
   * PAID PLAN
   * =======================================================
   */

  /**
   * -------------------------------------------------------
   * 6. FIND RAZORPAY BILLING PLAN
   * -------------------------------------------------------
   */

  const billingPlan = await findBillingPlan(data.planId, data.billingInterval);

  if (!billingPlan) {
    throw new ApiError(
      400,
      "Razorpay billing plan is not configured for the selected plan and billing interval",
      "BILLING_PLAN_NOT_CONFIGURED",
    );
  }

  if (!billingPlan.providerPlanId) {
    throw new ApiError(
      400,
      "Razorpay provider plan ID is missing",
      "RAZORPAY_PLAN_ID_MISSING",
    );
  }

  /**
   * -------------------------------------------------------
   * 7. CREATE RAZORPAY SUBSCRIPTION
   * -------------------------------------------------------
   */

  const totalCount =
    data.billingInterval === "monthly"
      ? Number(process.env.RAZORPAY_MONTHLY_TOTAL_COUNT ?? 120)
      : Number(process.env.RAZORPAY_YEARLY_TOTAL_COUNT ?? 10);

  if (!Number.isInteger(totalCount) || totalCount <= 0) {
    throw new ApiError(500, "Invalid Razorpay subscription total count configuration", "INVALID_RAZORPAY_TOTAL_COUNT");
  }

  const razorpaySubscription = await createRazorpaySubscription({
    planId: billingPlan.providerPlanId,
    customerNotify: true,
    totalCount,
  });

  if (!razorpaySubscription?.id) {
    throw new ApiError(
      502,
      "Failed to create Razorpay subscription",
      "RAZORPAY_SUBSCRIPTION_CREATE_FAILED",
    );
  }

  /**
   * -------------------------------------------------------
   * 8. CREATE LOCAL SUBSCRIPTION
   * -------------------------------------------------------
   *
   * IMPORTANT:
   *
   * Paid subscription is intentionally stored as
   * "pending".
   *
   * We do NOT trust the create API response to mark
   * the subscription active.
   *
   * Razorpay webhook will synchronize the actual
   * lifecycle state.
   */

  return createSubscription({
    companyId,

    planId: data.planId,

    billingInterval: data.billingInterval,

    amount,

    currency: plan.currency,

    provider: "razorpay",

    providerCustomerId: null,

    providerSubscriptionId: razorpaySubscription.id,

    status: "pending",

    startedAt: new Date(),

    trialEndsAt,

    currentPeriodStart: null,

    currentPeriodEnd: null,
  });
}

/**
 * =========================================================
 * CANCEL SUBSCRIPTION
 * =========================================================
 *
 * Razorpay subscription:
 *
 * 1. Call Razorpay
 * 2. Save cancellation preference locally
 * 3. Webhook finalizes lifecycle state
 *
 * Free/local subscription:
 *
 * 1. Update local state directly
 */

export async function cancelSubscription(
  companyId: string,
  subscriptionId: string,
  data: {
    cancelAtPeriodEnd: boolean;
  },
) {
  /**
   * -------------------------------------------------------
   * 1. FIND SUBSCRIPTION
   * -------------------------------------------------------
   */

  const subscription = await findSubscriptionById(subscriptionId);

  if (!subscription) {
    throw new ApiError(404, "Subscription not found", "SUBSCRIPTION_NOT_FOUND");
  }

  /**
   * -------------------------------------------------------
   * 2. COMPANY OWNERSHIP
   * -------------------------------------------------------
   */

  if (subscription.company.id !== companyId) {
    throw new ApiError(
      403,
      "You do not have access to this subscription",
      "SUBSCRIPTION_ACCESS_DENIED",
    );
  }

  /**
   * -------------------------------------------------------
   * 3. ALREADY INACTIVE
   * -------------------------------------------------------
   */

  if (
    subscription.status === "cancelled" ||
    subscription.status === "expired"
  ) {
    throw new ApiError(
      400,
      "Subscription is already inactive",
      "SUBSCRIPTION_ALREADY_INACTIVE",
    );
  }

  const providerSubscriptionId = subscription.providerSubscriptionId;

  /**
   * =======================================================
   * FREE / LOCAL SUBSCRIPTION
   * =======================================================
   */

  if (!providerSubscriptionId) {
    const now = new Date();

    /**
     * Immediate cancellation
     */
    if (!data.cancelAtPeriodEnd) {
      return updateSubscription(subscriptionId, {
        cancelAtPeriodEnd: false,
        cancelledAt: now,
        endedAt: now,
        status: "cancelled",
        isCurrent: false,
      });
    }

    /**
     * Cancel at period end
     *
     * Keep subscription current until the
     * current period actually ends.
     */
    return updateSubscription(subscriptionId, {
      cancelAtPeriodEnd: true,
    });
  }

  /**
   * =======================================================
   * RAZORPAY SUBSCRIPTION
   * =======================================================
   */

  const razorpaySubscription = await cancelRazorpaySubscription(
    providerSubscriptionId,
    data.cancelAtPeriodEnd,
  );

  if (!razorpaySubscription?.id) {
    throw new ApiError(
      502,
      "Failed to cancel Razorpay subscription",
      "RAZORPAY_SUBSCRIPTION_CANCEL_FAILED",
    );
  }

  /**
   * -------------------------------------------------------
   * IMPORTANT
   * -------------------------------------------------------
   *
   * Do not manually set:
   *
   * status = cancelled
   *
   * for Razorpay subscriptions.
   *
   * Razorpay webhook is responsible for the
   * final provider lifecycle state.
   */

  return updateSubscription(subscriptionId, {
    cancelAtPeriodEnd: data.cancelAtPeriodEnd,
  });
}
