import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "../../database/client.js";

import {
  plans,
  subscriptionBillingPlans,
} from "../../database/schema/index.js";

import type {
  CreateSubscriptionBillingPlanInput,
  SubscriptionBillingPlanListQuery,
  UpdateSubscriptionBillingPlanInput,
} from "./subscription-billing-plan.types.js";

export async function findSubscriptionBillingPlans({
  page = 1,
  limit = 10,
  planId,
  provider,
  billingInterval,
  status,
}: SubscriptionBillingPlanListQuery) {
  const offset = (page - 1) * limit;

  const conditions = [];

  if (planId) {
    conditions.push(eq(subscriptionBillingPlans.planId, planId));
  }

  if (provider) {
    conditions.push(eq(subscriptionBillingPlans.provider, provider));
  }

  if (billingInterval) {
    conditions.push(
      eq(subscriptionBillingPlans.billingInterval, billingInterval),
    );
  }

  if (status && status !== "all") {
    conditions.push(eq(subscriptionBillingPlans.status, status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, countResult] = await Promise.all([
    db
      .select({
        billingPlan: subscriptionBillingPlans,
        plan: {
          id: plans.id,
          name: plans.name,
          slug: plans.slug,
          monthlyPrice: plans.monthlyPrice,
          yearlyPrice: plans.yearlyPrice,
          currency: plans.currency,
          status: plans.status,
        },
      })
      .from(subscriptionBillingPlans)
      .leftJoin(plans, eq(subscriptionBillingPlans.planId, plans.id))
      .where(whereClause)
      .orderBy(
        desc(subscriptionBillingPlans.createdAt),
        asc(subscriptionBillingPlans.id),
      )
      .limit(limit)
      .offset(offset),

    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(subscriptionBillingPlans)
      .where(whereClause),
  ]);

  const items = rows.map((row) => ({
    ...row.billingPlan,
    plan: row.plan,
  }));

  const total = Number(countResult[0]?.count ?? 0);

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function findSubscriptionBillingPlanById(billingPlanId: string) {
  const rows = await db
    .select({
      billingPlan: subscriptionBillingPlans,
      plan: {
        id: plans.id,
        name: plans.name,
        slug: plans.slug,
        monthlyPrice: plans.monthlyPrice,
        yearlyPrice: plans.yearlyPrice,
        currency: plans.currency,
        status: plans.status,
      },
    })
    .from(subscriptionBillingPlans)
    .leftJoin(plans, eq(subscriptionBillingPlans.planId, plans.id))
    .where(eq(subscriptionBillingPlans.id, billingPlanId))
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    ...row.billingPlan,
    plan: row.plan,
  };
}

export async function findCurrentBillingPlan(
  planId: string,
  billingInterval: "monthly" | "yearly",
  provider: "razorpay",
) {
  const rows = await db
    .select({
      billingPlan: subscriptionBillingPlans,
      plan: {
        id: plans.id,
        name: plans.name,
        slug: plans.slug,
        monthlyPrice: plans.monthlyPrice,
        yearlyPrice: plans.yearlyPrice,
        currency: plans.currency,
        status: plans.status,
      },
    })
    .from(subscriptionBillingPlans)
    .leftJoin(plans, eq(subscriptionBillingPlans.planId, plans.id))
    .where(
      and(
        eq(subscriptionBillingPlans.planId, planId),
        eq(subscriptionBillingPlans.billingInterval, billingInterval),
        eq(subscriptionBillingPlans.provider, provider),
        eq(subscriptionBillingPlans.isCurrent, true),
      ),
    )
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    ...row.billingPlan,
    plan: row.plan,
  };
}

export async function findBillingPlanByProviderPlanId(providerPlanId: string) {
  const rows = await db
    .select({
      billingPlan: subscriptionBillingPlans,
      plan: {
        id: plans.id,
        name: plans.name,
        slug: plans.slug,
        monthlyPrice: plans.monthlyPrice,
        yearlyPrice: plans.yearlyPrice,
        currency: plans.currency,
        status: plans.status,
      },
    })
    .from(subscriptionBillingPlans)
    .leftJoin(plans, eq(subscriptionBillingPlans.planId, plans.id))
    .where(eq(subscriptionBillingPlans.providerPlanId, providerPlanId))
    .limit(1);

  const row = rows[0];

  if (!row) {
    return null;
  }

  return {
    ...row.billingPlan,
    plan: row.plan,
  };
}

export async function createSubscriptionBillingPlan(
  data: CreateSubscriptionBillingPlanInput & {
    amount: string;
    currency: string;
    providerPlanId: string;
  },
) {
  const [billingPlan] = await db
    .insert(subscriptionBillingPlans)
    .values({
      planId: data.planId,
      provider: data.provider ?? "razorpay",
      billingInterval: data.billingInterval,
      amount: data.amount,
      currency: data.currency,
      providerPlanId: data.providerPlanId,
      status: "active",
      isCurrent: true,
    })
    .returning();

  return billingPlan;
}

export async function updateSubscriptionBillingPlan(
  billingPlanId: string,
  data: UpdateSubscriptionBillingPlanInput,
) {
  const updateData = {
    ...(data.amount !== undefined && {
      amount: data.amount,
    }),

    ...(data.currency !== undefined && {
      currency: data.currency,
    }),

    ...(data.status !== undefined && {
      status: data.status,
    }),

    ...(data.isCurrent !== undefined && {
      isCurrent: data.isCurrent,
    }),

    updatedAt: new Date(),
  };

  const [billingPlan] = await db
    .update(subscriptionBillingPlans)
    .set(updateData)
    .where(eq(subscriptionBillingPlans.id, billingPlanId))
    .returning();

  return billingPlan ?? null;
}

export async function deleteSubscriptionBillingPlan(billingPlanId: string) {
  const [billingPlan] = await db
    .delete(subscriptionBillingPlans)
    .where(eq(subscriptionBillingPlans.id, billingPlanId))
    .returning();

  return billingPlan ?? null;
}
