import { ApiError } from "../../utils/api-error.js";

import { findPlanById } from "../plans/plan.repository.js";

import {
  createRazorpayPlan,
  fetchRazorpayPlan,
} from "../../integrations/razorpay/razorpay-plan.service.js";

import {
  createSubscriptionBillingPlan,
  deleteSubscriptionBillingPlan,
  findBillingPlanByProviderPlanId,
  findCurrentBillingPlan,
  findSubscriptionBillingPlanById,
  findSubscriptionBillingPlans,
  updateSubscriptionBillingPlan,
} from "./subscription-billing-plan.repository.js";

import type {
  BillingPlanInterval,
  CreateSubscriptionBillingPlanInput,
  SubscriptionBillingPlanListQuery,
  UpdateSubscriptionBillingPlanInput,
} from "./subscription-billing-plan.types.js";

function getPlanAmount(
  plan: {
    monthlyPrice: string;
    yearlyPrice: string;
  },
  billingInterval: BillingPlanInterval,
) {
  return billingInterval === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
}

function toRazorpayAmount(amount: string) {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new ApiError(
      400,
      "Plan amount must be greater than zero",
      "INVALID_PLAN_AMOUNT",
    );
  }

  return Math.round(numericAmount * 100);
}

export async function getSubscriptionBillingPlans(
  query: SubscriptionBillingPlanListQuery,
) {
  return findSubscriptionBillingPlans(query);
}

export async function getSubscriptionBillingPlan(billingPlanId: string) {
  const billingPlan = await findSubscriptionBillingPlanById(billingPlanId);

  if (!billingPlan) {
    throw new ApiError(
      404,
      "Subscription billing plan not found",
      "BILLING_PLAN_NOT_FOUND",
    );
  }

  return billingPlan;
}

export async function createNewSubscriptionBillingPlan(
  data: CreateSubscriptionBillingPlanInput,
) {
  const plan = await findPlanById(data.planId);

  if (!plan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  if (plan.status !== "active") {
    throw new ApiError(400, "Plan is not active", "PLAN_NOT_ACTIVE");
  }

  const existing = await findCurrentBillingPlan(
    data.planId,
    data.billingInterval,
    data.provider ?? "razorpay",
  );

  if (existing) {
    throw new ApiError(
      409,
      "Billing plan already exists for this plan and interval",
      "BILLING_PLAN_ALREADY_EXISTS",
    );
  }

  const amount = getPlanAmount(plan, data.billingInterval);

  const razorpayAmount = toRazorpayAmount(amount);

  const razorpayPlan = await createRazorpayPlan({
    name: `${plan.name} - ${data.billingInterval}`,
    description:
      plan.description ?? `${plan.name} ${data.billingInterval} subscription`,
    amount: razorpayAmount,
    currency: plan.currency,
    interval: data.billingInterval,
  });

  if (!razorpayPlan.id) {
    throw new ApiError(
      502,
      "Razorpay plan creation failed",
      "RAZORPAY_PLAN_CREATION_FAILED",
    );
  }

  const existingProviderPlan = await findBillingPlanByProviderPlanId(
    razorpayPlan.id,
  );

  if (existingProviderPlan) {
    throw new ApiError(
      409,
      "Razorpay plan is already mapped",
      "RAZORPAY_PLAN_ALREADY_MAPPED",
    );
  }

  return createSubscriptionBillingPlan({
    ...data,
    amount,
    currency: plan.currency,
    provider: data.provider ?? "razorpay",
    providerPlanId: razorpayPlan.id,
  });
}

export async function updateExistingSubscriptionBillingPlan(
  billingPlanId: string,
  data: UpdateSubscriptionBillingPlanInput,
) {
  const existing = await findSubscriptionBillingPlanById(billingPlanId);

  if (!existing) {
    throw new ApiError(
      404,
      "Subscription billing plan not found",
      "BILLING_PLAN_NOT_FOUND",
    );
  }

  if (data.amount !== undefined && data.amount !== existing.amount) {
    throw new ApiError(
      400,
      "Billing plan amount cannot be changed directly",
      "BILLING_PLAN_AMOUNT_IMMUTABLE",
    );
  }

  if (data.currency !== undefined && data.currency !== existing.currency) {
    throw new ApiError(
      400,
      "Billing plan currency cannot be changed directly",
      "BILLING_PLAN_CURRENCY_IMMUTABLE",
    );
  }

  return updateSubscriptionBillingPlan(billingPlanId, data);
}

export async function removeSubscriptionBillingPlan(billingPlanId: string) {
  const existing = await findSubscriptionBillingPlanById(billingPlanId);

  if (!existing) {
    throw new ApiError(
      404,
      "Subscription billing plan not found",
      "BILLING_PLAN_NOT_FOUND",
    );
  }

  if (existing.isCurrent) {
    throw new ApiError(
      400,
      "Current billing plan cannot be deleted",
      "CURRENT_BILLING_PLAN_CANNOT_BE_DELETED",
    );
  }

  await deleteSubscriptionBillingPlan(billingPlanId);

  return {
    success: true,
  };
}

export async function verifyRazorpayBillingPlan(billingPlanId: string) {
  const billingPlan = await findSubscriptionBillingPlanById(billingPlanId);

  if (!billingPlan) {
    throw new ApiError(
      404,
      "Subscription billing plan not found",
      "BILLING_PLAN_NOT_FOUND",
    );
  }

  if (billingPlan.provider !== "razorpay") {
    throw new ApiError(
      400,
      "Unsupported billing provider",
      "UNSUPPORTED_BILLING_PROVIDER",
    );
  }

  try {
    const providerPlan = await fetchRazorpayPlan(billingPlan.providerPlanId);

    return {
      billingPlan,
      providerPlan,
    };
  } catch {
    throw new ApiError(
      502,
      "Unable to verify Razorpay billing plan",
      "RAZORPAY_PLAN_VERIFICATION_FAILED",
    );
  }
}
