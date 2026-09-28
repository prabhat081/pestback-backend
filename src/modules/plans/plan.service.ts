import { ApiError } from "../../utils/api-error.js";

import {
  createPlan,
  createPlanFeature,
  deletePlan,
  deletePlanFeature,
  findPlanById,
  findPlanBySlug,
  findPlanFeatureById,
  findPlanFeatureByKey,
  findPlanFeatures,
  findPlanWithFeatures,
  findPlans,
  updatePlan,
  updatePlanFeature,
} from "./plan.repository.js";

import type {
  CreatePlanFeatureInput,
  CreatePlanInput,
  PlanListQuery,
  UpdatePlanFeatureInput,
  UpdatePlanInput,
  UpdatePlanStatusInput,
} from "./plan.types.js";

/* -------------------------------------------------------------------------- */
/*                                  PLANS                                     */
/* -------------------------------------------------------------------------- */

export async function getPlans(params: PlanListQuery) {
  const page = params.page ?? 1;
  const limit = params.limit ?? 20;

  const result = await findPlans({
    page,
    limit,
    search: params.search,
    status: params.status,
  });

  return {
    items: result.items,
    total: result.total,
    page,
    limit,
    totalPages: result.total === 0 ? 0 : Math.ceil(result.total / limit),
  };
}

export async function getPlan(planId: string) {
  const plan = await findPlanWithFeatures(planId);

  if (!plan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  return plan;
}

export async function createNewPlan(data: CreatePlanInput) {
  const existingPlan = await findPlanBySlug(data.slug);

  if (existingPlan) {
    throw new ApiError(
      409,
      "A plan with this slug already exists",
      "PLAN_SLUG_EXISTS",
    );
  }

  return createPlan(data);
}

export async function updateExistingPlan(
  planId: string,
  data: UpdatePlanInput,
) {
  const existingPlan = await findPlanById(planId);

  if (!existingPlan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  if (data.slug && data.slug !== existingPlan.slug) {
    const planWithSlug = await findPlanBySlug(data.slug);

    if (planWithSlug) {
      throw new ApiError(
        409,
        "A plan with this slug already exists",
        "PLAN_SLUG_EXISTS",
      );
    }
  }

  const updatedPlan = await updatePlan(planId, data);

  if (!updatedPlan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  return updatedPlan;
}

export async function updateExistingPlanStatus(
  planId: string,
  data: UpdatePlanStatusInput,
) {
  const existingPlan = await findPlanById(planId);

  if (!existingPlan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  const updatedPlan = await updatePlan(planId, {
    status: data.status,
  });

  if (!updatedPlan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  return updatedPlan;
}

export async function removePlan(planId: string) {
  const existingPlan = await findPlanById(planId);

  if (!existingPlan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  const deletedPlan = await deletePlan(planId);

  if (!deletedPlan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  return deletedPlan;
}

/* -------------------------------------------------------------------------- */
/*                             PLAN FEATURES                                  */
/* -------------------------------------------------------------------------- */

export async function getPlanFeatures(planId: string) {
  const plan = await findPlanById(planId);

  if (!plan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  return findPlanFeatures(planId);
}

export async function getPlanFeature(planId: string, featureId: string) {
  const plan = await findPlanById(planId);

  if (!plan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  const feature = await findPlanFeatureById(featureId);

  if (!feature) {
    throw new ApiError(404, "Plan feature not found", "PLAN_FEATURE_NOT_FOUND");
  }

  if (feature.planId !== planId) {
    throw new ApiError(404, "Plan feature not found", "PLAN_FEATURE_NOT_FOUND");
  }

  return feature;
}

export async function addPlanFeature(
  planId: string,
  data: CreatePlanFeatureInput,
) {
  const plan = await findPlanById(planId);

  if (!plan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  const existingFeature = await findPlanFeatureByKey(planId, data.featureKey);

  if (existingFeature) {
    throw new ApiError(
      409,
      "A feature with this key already exists for this plan",
      "PLAN_FEATURE_KEY_EXISTS",
    );
  }

  const featureData = {
    ...data,
    limit: data.type === "boolean" ? null : (data.limit ?? null),
  };

  return createPlanFeature(planId, featureData);
}

export async function updateExistingPlanFeature(
  planId: string,
  featureId: string,
  data: UpdatePlanFeatureInput,
) {
  const plan = await findPlanById(planId);

  if (!plan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  const existingFeature = await findPlanFeatureById(featureId);

  if (!existingFeature) {
    throw new ApiError(404, "Plan feature not found", "PLAN_FEATURE_NOT_FOUND");
  }

  if (existingFeature.planId !== planId) {
    throw new ApiError(404, "Plan feature not found", "PLAN_FEATURE_NOT_FOUND");
  }

  if (data.featureKey && data.featureKey !== existingFeature.featureKey) {
    const featureWithKey = await findPlanFeatureByKey(planId, data.featureKey);

    if (featureWithKey) {
      throw new ApiError(
        409,
        "A feature with this key already exists for this plan",
        "PLAN_FEATURE_KEY_EXISTS",
      );
    }
  }

  const featureData: UpdatePlanFeatureInput = {
    ...data,
  };

  if (data.type === "boolean") {
    featureData.limit = null;
  }

  const updatedFeature = await updatePlanFeature(featureId, featureData);

  if (!updatedFeature) {
    throw new ApiError(404, "Plan feature not found", "PLAN_FEATURE_NOT_FOUND");
  }

  return updatedFeature;
}

export async function removePlanFeature(planId: string, featureId: string) {
  const plan = await findPlanById(planId);

  if (!plan) {
    throw new ApiError(404, "Plan not found", "PLAN_NOT_FOUND");
  }

  const existingFeature = await findPlanFeatureById(featureId);

  if (!existingFeature) {
    throw new ApiError(404, "Plan feature not found", "PLAN_FEATURE_NOT_FOUND");
  }

  if (existingFeature.planId !== planId) {
    throw new ApiError(404, "Plan feature not found", "PLAN_FEATURE_NOT_FOUND");
  }

  const deletedFeature = await deletePlanFeature(featureId);

  if (!deletedFeature) {
    throw new ApiError(404, "Plan feature not found", "PLAN_FEATURE_NOT_FOUND");
  }

  return deletedFeature;
}
