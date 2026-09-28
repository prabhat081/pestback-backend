import type {
  SubscriptionBillingInterval,
  SubscriptionStatus,
  SubscriptionProvider,
} from "../../database/schema/subscriptions.js";

export type {
  SubscriptionBillingInterval,
  SubscriptionStatus,
  SubscriptionProvider,
};

export interface Subscription {
  id: string;

  companyId: string;

  planId: string;

  status: SubscriptionStatus;

  billingInterval: SubscriptionBillingInterval;

  amount: string;

  currency: string;

  provider: SubscriptionProvider;

  providerCustomerId: string | null;

  providerSubscriptionId: string | null;

  isCurrent: boolean;

  startedAt: string;

  trialEndsAt: string | null;

  currentPeriodStart: string | null;

  currentPeriodEnd: string | null;

  cancelAtPeriodEnd: boolean;

  cancelledAt: string | null;

  endedAt: string | null;

  createdAt: string;

  updatedAt: string;
}

export interface SubscriptionPlan {
  id: string;

  name: string;

  slug: string;

  monthlyPrice: string;

  yearlyPrice: string;

  currency: string;

  trialDays: number;

  status: "active" | "inactive";
}

export interface SubscriptionCompany {
  id: string;

  name: string;
}

export interface SubscriptionDetails extends Subscription {
  plan?: SubscriptionPlan;

  company?: SubscriptionCompany;
}

export interface SubscriptionListQuery {
  page?: number;

  limit?: number;

  status?: SubscriptionStatus | "all";

  companyId?: string;

  planId?: string;
}

export interface SubscriptionListData {
  items: SubscriptionDetails[];

  total: number;

  page: number;

  limit: number;

  totalPages: number;
}

export interface SubscriptionsResponse {
  success: boolean;

  message?: string;

  data: SubscriptionListData;
}

export interface SubscriptionResponse {
  success: boolean;

  message?: string;

  data: SubscriptionDetails;
}

/**
 * Client only selects:
 * - plan
 * - billing interval
 *
 * Amount, status and Razorpay IDs are controlled by backend.
 */
export interface CreateSubscriptionInput {
  planId: string;

  billingInterval: SubscriptionBillingInterval;
}

export interface UpdateSubscriptionInput {
  planId?: string;

  billingInterval?: SubscriptionBillingInterval;

  cancelAtPeriodEnd?: boolean;

  cancelledAt?: string | null;

  endedAt?: string | null;
}

export interface UpdateSubscriptionStatusInput {
  status: SubscriptionStatus;
}

export interface CancelSubscriptionInput {
  cancelAtPeriodEnd?: boolean;
}