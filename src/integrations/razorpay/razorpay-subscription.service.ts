import { razorpay } from "./razorpay.client.js";

export interface CreateRazorpaySubscriptionInput {
  planId: string;
  customerNotify?: boolean;
  totalCount: number;
  quantity?: number;
  startAt?: number;
}

export interface RazorpaySubscriptionResult {
  id: string;
  entity: string;
  plan_id: string;
  status: string;
  customer_id?: string | null;
  current_start?: number | null;
  current_end?: number | null;
  charge_at?: number | null;
  start_at?: number | null;
  end_at?: number | null;
  total_count?: number | null;
  paid_count?: number | null;
  remaining_count?: number | null;
  quantity?: number | null;
  customer_notify?: boolean;
  created_at?: number;
}

export async function createRazorpaySubscription(
  data: CreateRazorpaySubscriptionInput,
): Promise<RazorpaySubscriptionResult> {
  const payload = {
    plan_id: data.planId,
    customer_notify: data.customerNotify ?? true,
    total_count: data.totalCount,
    ...(data.quantity !== undefined && {
      quantity: data.quantity,
    }),
    ...(data.startAt !== undefined && {
      start_at: data.startAt,
    }),
  };

  const subscription = await razorpay.subscriptions.create(payload);

  return subscription as unknown as RazorpaySubscriptionResult;
}

export async function fetchRazorpaySubscription(
  providerSubscriptionId: string,
): Promise<RazorpaySubscriptionResult> {
  const subscription = await razorpay.subscriptions.fetch(
    providerSubscriptionId,
  );

  return subscription as unknown as RazorpaySubscriptionResult;
}

export async function cancelRazorpaySubscription(
  providerSubscriptionId: string,
  cancelAtCycleEnd = true,
): Promise<RazorpaySubscriptionResult> {
  const subscription = await razorpay.subscriptions.cancel(
    providerSubscriptionId,
    cancelAtCycleEnd,
  );

  return subscription as unknown as RazorpaySubscriptionResult;
}
