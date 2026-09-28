import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

import { db } from "../../database/client.js";

import { planFeatures, plans } from "../../database/schema/index.js";

import type {
  CreatePlanFeatureInput,
  CreatePlanInput,
  PlanListQuery,
  UpdatePlanFeatureInput,
  UpdatePlanInput,
} from "./plan.types.js";

/* -------------------------------------------------------------------------- */
/*                                  PLANS                                     */
/* -------------------------------------------------------------------------- */

// export async function findPlans({
//   page,
//   limit,
//   search,
//   status,
// }: PlanListQuery & {
//   page: number;
//   limit: number;
// }) {
//   const offset = (page - 1) * limit;

//   const conditions = [];

//   if (search?.trim()) {
//     const searchValue = `%${search.trim()}%`;

//     conditions.push(
//       or(
//         ilike(plans.name, searchValue),
//         ilike(plans.slug, searchValue),
//         ilike(plans.description, searchValue),
//       ),
//     );
//   }

//   if (status && status !== "all") {
//     conditions.push(eq(plans.status, status));
//   }

//   const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

//   const [items, countResult] = await Promise.all([
//     db
//       .select()
//       .from(plans)
//       .where(whereClause)
//       .orderBy(asc(plans.displayOrder), desc(plans.createdAt))
//       .limit(limit)
//       .offset(offset),

//     db
//       .select({
//         count: sql<number>`count(*)::int`,
//       })
//       .from(plans)
//       .where(whereClause),
//   ]);

//   return {
//     items,
//     total: countResult[0]?.count ?? 0,
//   };
// }
export async function findPlans({
  page,
  limit,
  search,
  status,
}: PlanListQuery & {
  page: number;
  limit: number;
}) {
  const offset = (page - 1) * limit;

  const conditions = [];

  if (search?.trim()) {
    const searchValue = `%${search.trim()}%`;

    conditions.push(
      or(
        ilike(plans.name, searchValue),
        ilike(plans.slug, searchValue),
        ilike(plans.description, searchValue),
      ),
    );
  }

  if (status && status !== "all") {
    conditions.push(eq(plans.status, status));
  }

  const whereClause =
    conditions.length > 0
      ? and(...conditions)
      : undefined;

  const [planRows, countResult] = await Promise.all([
    db
      .select()
      .from(plans)
      .where(whereClause)
      .orderBy(
        asc(plans.displayOrder),
        desc(plans.createdAt),
      )
      .limit(limit)
      .offset(offset),

    db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(plans)
      .where(whereClause),
  ]);

  const items = await Promise.all(
    planRows.map(async (plan) => {
      const features = await findPlanFeatures(plan.id);

      return {
        ...plan,
        planFeatures: features,
      };
    }),
  );

  return {
    items,
    total: countResult[0]?.count ?? 0,
  };
}
export async function findPlanById(planId: string) {
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.id, planId))
    .limit(1);

  return plan ?? null;
}

export async function findPlanBySlug(slug: string) {
  const [plan] = await db
    .select()
    .from(plans)
    .where(eq(plans.slug, slug))
    .limit(1);

  return plan ?? null;
}

export async function findPlanWithFeatures(planId: string) {
  const plan = await findPlanById(planId);

  if (!plan) {
    return null;
  }

  const features = await findPlanFeatures(planId);

  return {
    ...plan,
    planFeatures: features,
  };
}

export async function createPlan(data: CreatePlanInput) {
  const [plan] = await db
    .insert(plans)
    .values({
      name: data.name,
      slug: data.slug,
      description: data.description ?? null,
      monthlyPrice: data.monthlyPrice,
      yearlyPrice: data.yearlyPrice,
      currency: data.currency ?? "INR",
      trialDays: data.trialDays ?? 0,
      status: data.status ?? "active",
      displayOrder: data.displayOrder ?? 0,
      isPopular: data.isPopular ?? false,
      isPublic: data.isPublic ?? true,
    })
    .returning();

  return plan;
}

export async function updatePlan(planId: string, data: UpdatePlanInput) {
  const [plan] = await db
    .update(plans)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(plans.id, planId))
    .returning();

  return plan ?? null;
}

export async function deletePlan(planId: string) {
  const [deleted] = await db
    .delete(plans)
    .where(eq(plans.id, planId))
    .returning({
      id: plans.id,
    });

  return deleted ?? null;
}

/* -------------------------------------------------------------------------- */
/*                             PLAN FEATURES                                  */
/* -------------------------------------------------------------------------- */

export async function findPlanFeatures(planId: string) {
  return db
    .select()
    .from(planFeatures)
    .where(eq(planFeatures.planId, planId))
    .orderBy(asc(planFeatures.name));
}

export async function findPlanFeatureById(featureId: string) {
  const [feature] = await db
    .select()
    .from(planFeatures)
    .where(eq(planFeatures.id, featureId))
    .limit(1);

  return feature ?? null;
}

export async function findPlanFeatureByKey(planId: string, featureKey: string) {
  const [feature] = await db
    .select()
    .from(planFeatures)
    .where(
      and(
        eq(planFeatures.planId, planId),
        eq(planFeatures.featureKey, featureKey),
      ),
    )
    .limit(1);

  return feature ?? null;
}

export async function createPlanFeature(
  planId: string,
  data: CreatePlanFeatureInput,
) {
  const [feature] = await db
    .insert(planFeatures)
    .values({
      planId,
      featureKey: data.featureKey,
      name: data.name,
      type: data.type,
      limit: data.limit ?? null,
      enabled: data.enabled ?? false,
      unit: data.unit ?? null,
    })
    .returning();

  return feature;
}

export async function updatePlanFeature(
  featureId: string,
  data: UpdatePlanFeatureInput,
) {
  const [feature] = await db
    .update(planFeatures)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(planFeatures.id, featureId))
    .returning();

  return feature ?? null;
}

export async function deletePlanFeature(featureId: string) {
  const [deleted] = await db
    .delete(planFeatures)
    .where(eq(planFeatures.id, featureId))
    .returning({
      id: planFeatures.id,
    });

  return deleted ?? null;
}
