export type BillingPlanStatus = "active" | "inactive";

export type BillingPlanProvider = "razorpay";

export type BillingPlanInterval = "monthly" | "yearly";

export interface SubscriptionBillingPlan {
  id: string;
  planId: string;
  provider: BillingPlanProvider;
  billingInterval: BillingPlanInterval;
  amount: string;
  currency: string;
  providerPlanId: string;
  status: BillingPlanStatus;
  isCurrent: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionBillingPlanDetails extends SubscriptionBillingPlan {
  plan?: {
    id: string;
    name: string;
    slug: string;
    monthlyPrice: string;
    yearlyPrice: string;
    currency: string;
    status: "active" | "inactive";
  };
}

export interface SubscriptionBillingPlanListQuery {
  page?: number;
  limit?: number;
  planId?: string;
  provider?: BillingPlanProvider;
  billingInterval?: BillingPlanInterval;
  status?: BillingPlanStatus | "all";
}

export interface SubscriptionBillingPlanListData {
  items: SubscriptionBillingPlanDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubscriptionBillingPlansResponse {
  success: boolean;
  message?: string;
  data: SubscriptionBillingPlanListData;
}

export interface SubscriptionBillingPlanResponse {
  success: boolean;
  message?: string;
  data: SubscriptionBillingPlanDetails;
}
export interface CreateSubscriptionBillingPlanInput {
  planId: string;
  provider?: BillingPlanProvider;
  billingInterval: BillingPlanInterval;
}

export interface UpdateSubscriptionBillingPlanInput {
  amount?: string;
  currency?: string;
  status?: BillingPlanStatus;
  isCurrent?: boolean;
}
