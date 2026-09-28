export type SubscriptionPaymentStatus =
  | "created"
  | "pending"
  | "paid"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type SubscriptionPaymentProvider = "razorpay";

export interface SubscriptionPayment {
  id: string;
  companyId: string;
  subscriptionId: string;
  provider: SubscriptionPaymentProvider;
  status: SubscriptionPaymentStatus;
  amount: string;
  currency: string;
  providerPaymentId: string | null;
  providerOrderId: string | null;
  providerSubscriptionId: string | null;
  failureReason: string | null;
  paidAt: string | null;
  refundedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionPaymentSubscription {
  id: string;
  planId: string;
  status:
    | "pending"
    | "trialing"
    | "active"
    | "past_due"
    | "paused"
    | "cancelled"
    | "expired";
  billingInterval: "monthly" | "yearly";
  amount: string;
  currency: string;
}

export interface SubscriptionPaymentCompany {
  id: string;
  name: string;
}

export interface SubscriptionPaymentDetails extends SubscriptionPayment {
  subscription: SubscriptionPaymentSubscription | null;

  company: SubscriptionPaymentCompany | null;
}

export interface SubscriptionPaymentListQuery {
  page?: number;
  limit?: number;
  status?: SubscriptionPaymentStatus | "all";
  subscriptionId?: string;
}

export interface SubscriptionPaymentListData {
  items: SubscriptionPaymentDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface SubscriptionPaymentsResponse {
  success: boolean;
  message?: string;
  data: SubscriptionPaymentListData;
}

export interface SubscriptionPaymentResponse {
  success: boolean;
  message?: string;
  data: SubscriptionPaymentDetails;
}
