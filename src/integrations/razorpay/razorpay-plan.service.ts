import { razorpay } from "./razorpay.client.js";

export interface CreateRazorpayPlanInput {
  name: string;
  description?: string | null;
  amount: number;
  currency: string;
  interval: "monthly" | "yearly";
}

export interface RazorpayPlanResult {
  id: string;
  entity: string;
  interval: number;
  period: string;
  item: {
    id: string;
    name: string;
    description?: string;
    amount: number;
    currency: string;
  };
}

export async function createRazorpayPlan(
  data: CreateRazorpayPlanInput,
): Promise<RazorpayPlanResult> {
  const period = data.interval === "monthly" ? "monthly" : "yearly";

  const interval = 1;

  const plan = await razorpay.plans.create({
    period,
    interval,
    item: {
      name: data.name,
      description: data.description ?? data.name,
      amount: data.amount,
      currency: data.currency,
    },
  });

  return plan as unknown as RazorpayPlanResult;
}

export async function fetchRazorpayPlan(
  providerPlanId: string,
): Promise<RazorpayPlanResult> {
  const plan = await razorpay.plans.fetch(providerPlanId);

  return plan as unknown as RazorpayPlanResult;
}
