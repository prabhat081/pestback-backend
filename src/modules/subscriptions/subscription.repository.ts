import { and, asc, desc, eq, sql } from "drizzle-orm";

import { db } from "../../database/client.js";

import {
  companies,
  plans,
  subscriptionBillingPlans,
  subscriptions,
} from "../../database/schema/index.js";

import type {
  CreateSubscriptionInput,
  SubscriptionBillingInterval,
  SubscriptionListQuery,
  SubscriptionStatus,
} from "./subscription.types.js";

/**
 * Transaction type
 *
 * Allows repository methods to work with either:
 * - normal db connection
 * - db.transaction(...)
 */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type DbClient = typeof db | DbTransaction;

/**
 * =========================================================
 * FIND SUBSCRIPTIONS
 * =========================================================
 */
export async function findSubscriptions(
  query: SubscriptionListQuery,
  companyId: string,
) {
  const { page = 1, limit = 10, status, planId } = query;

  const offset = (page - 1) * limit;

  const conditions = [eq(subscriptions.companyId, companyId)];

  if (status && status !== "all") {
    conditions.push(eq(subscriptions.status, status as SubscriptionStatus));
  }

  if (planId) {
    conditions.push(eq(subscriptions.planId, planId));
  }

  const whereClause = and(...conditions);

  const [rows, countResult] = await Promise.all([
    db
      .select({
        id: subscriptions.id,
        companyId: subscriptions.companyId,
        planId: subscriptions.planId,
        status: subscriptions.status,
        billingInterval: subscriptions.billingInterval,
        amount: subscriptions.amount,
        currency: subscriptions.currency,
        provider: subscriptions.provider,
        providerCustomerId: subscriptions.providerCustomerId,
        providerSubscriptionId: subscriptions.providerSubscriptionId,
        isCurrent: subscriptions.isCurrent,
        startedAt: subscriptions.startedAt,
        trialEndsAt: subscriptions.trialEndsAt,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
        cancelledAt: subscriptions.cancelledAt,
        endedAt: subscriptions.endedAt,
        createdAt: subscriptions.createdAt,
        updatedAt: subscriptions.updatedAt,

        plan: {
          id: plans.id,
          name: plans.name,
          slug: plans.slug,
          description: plans.description,
        },

        company: {
          id: companies.id,
          name: companies.name,
        },
      })
      .from(subscriptions)
      .innerJoin(plans, eq(subscriptions.planId, plans.id))
      .innerJoin(companies, eq(subscriptions.companyId, companies.id))
      .where(whereClause)
      .orderBy(desc(subscriptions.createdAt), asc(subscriptions.id))
      .limit(limit)
      .offset(offset),

    db
      .select({
        count: sql<number>`count(*)`,
      })
      .from(subscriptions)
      .where(whereClause),
  ]);

  const total = Number(countResult[0]?.count ?? 0);

  return {
    items: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

/**
 * =========================================================
 * FIND SUBSCRIPTION BY ID
 * =========================================================
 */
export async function findSubscriptionById(subscriptionId: string) {
  const [subscription] = await db
    .select({
      id: subscriptions.id,
      companyId: subscriptions.companyId,
      planId: subscriptions.planId,
      status: subscriptions.status,
      billingInterval: subscriptions.billingInterval,
      amount: subscriptions.amount,
      currency: subscriptions.currency,
      provider: subscriptions.provider,
      providerCustomerId: subscriptions.providerCustomerId,
      providerSubscriptionId: subscriptions.providerSubscriptionId,
      isCurrent: subscriptions.isCurrent,
      startedAt: subscriptions.startedAt,
      trialEndsAt: subscriptions.trialEndsAt,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      cancelledAt: subscriptions.cancelledAt,
      endedAt: subscriptions.endedAt,
      createdAt: subscriptions.createdAt,
      updatedAt: subscriptions.updatedAt,

      plan: {
        id: plans.id,
        name: plans.name,
        slug: plans.slug,
        description: plans.description,
        monthlyPrice: plans.monthlyPrice,
        yearlyPrice: plans.yearlyPrice,
        currency: plans.currency,
        trialDays: plans.trialDays,
        status: plans.status,
      },

      company: {
        id: companies.id,
        name: companies.name,
      },
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .innerJoin(companies, eq(subscriptions.companyId, companies.id))
    .where(eq(subscriptions.id, subscriptionId))
    .limit(1);

  return subscription ?? null;
}

/**
 * =========================================================
 * FIND CURRENT SUBSCRIPTION BY COMPANY
 * =========================================================
 */
export async function findCurrentSubscriptionByCompanyId(companyId: string) {
  const [subscription] = await db
    .select({
      id: subscriptions.id,
      companyId: subscriptions.companyId,
      planId: subscriptions.planId,
      status: subscriptions.status,
      billingInterval: subscriptions.billingInterval,
      amount: subscriptions.amount,
      currency: subscriptions.currency,
      provider: subscriptions.provider,
      providerCustomerId: subscriptions.providerCustomerId,
      providerSubscriptionId: subscriptions.providerSubscriptionId,
      isCurrent: subscriptions.isCurrent,
      startedAt: subscriptions.startedAt,
      trialEndsAt: subscriptions.trialEndsAt,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      cancelledAt: subscriptions.cancelledAt,
      endedAt: subscriptions.endedAt,
      createdAt: subscriptions.createdAt,
      updatedAt: subscriptions.updatedAt,

      plan: {
        id: plans.id,
        name: plans.name,
        slug: plans.slug,
        description: plans.description,
        monthlyPrice: plans.monthlyPrice,
        yearlyPrice: plans.yearlyPrice,
        currency: plans.currency,
        trialDays: plans.trialDays,
        status: plans.status,
      },

      company: {
        id: companies.id,
        name: companies.name,
      },
    })
    .from(subscriptions)
    .innerJoin(plans, eq(subscriptions.planId, plans.id))
    .innerJoin(companies, eq(subscriptions.companyId, companies.id))
    .where(
      and(
        eq(subscriptions.companyId, companyId),
        eq(subscriptions.isCurrent, true),
      ),
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return subscription ?? null;
}

/**
 * =========================================================
 * FIND PLAN
 * =========================================================
 */
export async function findPlanById(planId: string) {
  const [plan] = await db
    .select({
      id: plans.id,
      name: plans.name,
      slug: plans.slug,
      description: plans.description,
      monthlyPrice: plans.monthlyPrice,
      yearlyPrice: plans.yearlyPrice,
      currency: plans.currency,
      trialDays: plans.trialDays,
      status: plans.status,
    })
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  return plan ?? null;
}

/**
 * =========================================================
 * FIND RAZORPAY BILLING PLAN
 * =========================================================
 */
export async function findBillingPlan(
  planId: string,
  billingInterval: SubscriptionBillingInterval,
) {
  const [billingPlan] = await db
    .select({
      id: subscriptionBillingPlans.id,
      planId: subscriptionBillingPlans.planId,
      provider: subscriptionBillingPlans.provider,
      billingInterval: subscriptionBillingPlans.billingInterval,
      amount: subscriptionBillingPlans.amount,
      currency: subscriptionBillingPlans.currency,
      providerPlanId: subscriptionBillingPlans.providerPlanId,
      status: subscriptionBillingPlans.status,
      isCurrent: subscriptionBillingPlans.isCurrent,
    })
    .from(subscriptionBillingPlans)
    .where(
      and(
        eq(subscriptionBillingPlans.planId, planId),
        eq(subscriptionBillingPlans.billingInterval, billingInterval),
        eq(subscriptionBillingPlans.provider, "razorpay"),
        eq(subscriptionBillingPlans.status, "active"),
        eq(subscriptionBillingPlans.isCurrent, true),
      ),
    )
    .limit(1);

  return billingPlan ?? null;
}

/**
 * =========================================================
 * CREATE SUBSCRIPTION
 * =========================================================
 *
 * Internal repository method.
 *
 * This is NOT a public CRUD endpoint.
 *
 * The service decides:
 * - which company
 * - which plan
 * - amount
 * - provider
 * - provider subscription ID
 * - status
 */
export async function createSubscription(
  data: {
    companyId: string;
    planId: string;
    billingInterval: CreateSubscriptionInput["billingInterval"];
    amount: string;
    currency: string;
    provider: "razorpay";
    providerCustomerId: string | null;
    providerSubscriptionId: string | null;
    status: SubscriptionStatus;
    startedAt: Date;
    trialEndsAt: Date | null;
    currentPeriodStart: Date | null;
    currentPeriodEnd: Date | null;
  },
  tx?: DbTransaction,
) {
  const client: DbClient = tx ?? db;

  const [subscription] = await client
    .insert(subscriptions)
    .values({
      companyId: data.companyId,
      planId: data.planId,
      billingInterval: data.billingInterval,
      amount: data.amount,
      currency: data.currency,
      provider: data.provider,
      providerCustomerId: data.providerCustomerId,
      providerSubscriptionId: data.providerSubscriptionId,
      status: data.status,

      isCurrent: true,

      startedAt: data.startedAt,
      trialEndsAt: data.trialEndsAt,
      currentPeriodStart: data.currentPeriodStart,
      currentPeriodEnd: data.currentPeriodEnd,

      cancelAtPeriodEnd: false,
      cancelledAt: null,
      endedAt: null,
    })
    .returning();

  if (!subscription) {
    throw new Error("Failed to create subscription");
  }

  return subscription;
}

/**
 * =========================================================
 * UPDATE SUBSCRIPTION
 * =========================================================
 *
 * Used internally by:
 * - cancellation flow
 * - Razorpay webhook synchronization
 * - subscription lifecycle updates
 */
export async function updateSubscription(
  subscriptionId: string,
  data: {
    providerCustomerId?: string | null;

    cancelAtPeriodEnd?: boolean;
    cancelledAt?: Date | null;
    endedAt?: Date | null;
    status?: SubscriptionStatus;
    currentPeriodStart?: Date | null;
    currentPeriodEnd?: Date | null;
    trialEndsAt?: Date | null;
    isCurrent?: boolean;
  },
  tx?: DbTransaction,
) {
  const client: DbClient = tx ?? db;

  const [subscription] = await client
    .update(subscriptions)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, subscriptionId))
    .returning();

  return subscription ?? null;
}
/**
 * =========================================================
 * FIND BY RAZORPAY SUBSCRIPTION ID
 * =========================================================
 *
 * Important for webhook processing.
 *
 * Razorpay sends provider subscription ID,
 * so webhook should resolve the local subscription
 * using this method.
 */
export async function findSubscriptionByProviderSubscriptionId(
  providerSubscriptionId: string,
) {
  const [subscription] = await db
    .select({
      id: subscriptions.id,
      companyId: subscriptions.companyId,
      planId: subscriptions.planId,
      status: subscriptions.status,
      billingInterval: subscriptions.billingInterval,
      amount: subscriptions.amount,
      currency: subscriptions.currency,
      provider: subscriptions.provider,
      providerCustomerId: subscriptions.providerCustomerId,
      providerSubscriptionId: subscriptions.providerSubscriptionId,
      isCurrent: subscriptions.isCurrent,
      startedAt: subscriptions.startedAt,
      trialEndsAt: subscriptions.trialEndsAt,
      currentPeriodStart: subscriptions.currentPeriodStart,
      currentPeriodEnd: subscriptions.currentPeriodEnd,
      cancelAtPeriodEnd: subscriptions.cancelAtPeriodEnd,
      cancelledAt: subscriptions.cancelledAt,
      endedAt: subscriptions.endedAt,
      createdAt: subscriptions.createdAt,
      updatedAt: subscriptions.updatedAt,
    })
    .from(subscriptions)
    .where(eq(subscriptions.providerSubscriptionId, providerSubscriptionId))
    .limit(1);

  return subscription ?? null;
}
