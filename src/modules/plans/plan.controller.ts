import type { Request, Response } from "express";

import {
  createPlanFeatureSchema,
  createPlanSchema,
  planFeatureIdSchema,
  planIdSchema,
  planQuerySchema,
  updatePlanFeatureSchema,
  updatePlanSchema,
  updatePlanStatusSchema,
} from "./plan.schema.js";

import {
  addPlanFeature,
  createNewPlan,
  getPlan,
  getPlanFeature,
  getPlanFeatures,
  getPlans,
  removePlan,
  removePlanFeature,
  updateExistingPlan,
  updateExistingPlanFeature,
  updateExistingPlanStatus,
} from "./plan.service.js";

/* -------------------------------------------------------------------------- */
/*                                  PLANS                                     */
/* -------------------------------------------------------------------------- */

export async function getPlansController(req: Request, res: Response) {
  const query = planQuerySchema.parse(req.query);

  const result = await getPlans(query);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getPlanController(req: Request, res: Response) {
  const { planId } = planIdSchema.parse(req.params);

  const plan = await getPlan(planId);

  res.status(200).json({
    success: true,
    data: plan,
  });
}

export async function createPlanController(req: Request, res: Response) {
  const data = createPlanSchema.parse(req.body);

  const plan = await createNewPlan(data);

  res.status(201).json({
    success: true,
    message: "Plan created successfully",
    data: plan,
  });
}

export async function updatePlanController(req: Request, res: Response) {
  const { planId } = planIdSchema.parse(req.params);
  const data = updatePlanSchema.parse(req.body);

  const plan = await updateExistingPlan(planId, data);

  res.status(200).json({
    success: true,
    message: "Plan updated successfully",
    data: plan,
  });
}

export async function updatePlanStatusController(req: Request, res: Response) {
  const { planId } = planIdSchema.parse(req.params);
  const data = updatePlanStatusSchema.parse(req.body);

  const plan = await updateExistingPlanStatus(planId, data);

  res.status(200).json({
    success: true,
    message: "Plan status updated successfully",
    data: plan,
  });
}

export async function deletePlanController(req: Request, res: Response) {
  const { planId } = planIdSchema.parse(req.params);

  await removePlan(planId);

  res.status(200).json({
    success: true,
    message: "Plan deleted successfully",
  });
}

/* -------------------------------------------------------------------------- */
/*                             PLAN FEATURES                                  */
/* -------------------------------------------------------------------------- */

export async function getPlanFeaturesController(req: Request, res: Response) {
  const { planId } = planIdSchema.parse(req.params);

  const features = await getPlanFeatures(planId);

  res.status(200).json({
    success: true,
    data: features,
  });
}

export async function getPlanFeatureController(req: Request, res: Response) {
  const { planId } = planIdSchema.parse(req.params);
  const { featureId } = planFeatureIdSchema.parse(req.params);

  const feature = await getPlanFeature(planId, featureId);

  res.status(200).json({
    success: true,
    data: feature,
  });
}

export async function createPlanFeatureController(req: Request, res: Response) {
  const { planId } = planIdSchema.parse(req.params);
  const data = createPlanFeatureSchema.parse(req.body);

  const feature = await addPlanFeature(planId, data);

  res.status(201).json({
    success: true,
    message: "Plan feature created successfully",
    data: feature,
  });
}

export async function updatePlanFeatureController(req: Request, res: Response) {
  const { planId } = planIdSchema.parse(req.params);
  const { featureId } = planFeatureIdSchema.parse(req.params);
  const data = updatePlanFeatureSchema.parse(req.body);

  const feature = await updateExistingPlanFeature(planId, featureId, data);

  res.status(200).json({
    success: true,
    message: "Plan feature updated successfully",
    data: feature,
  });
}

export async function deletePlanFeatureController(req: Request, res: Response) {
  const { planId } = planIdSchema.parse(req.params);
  const { featureId } = planFeatureIdSchema.parse(req.params);

  await removePlanFeature(planId, featureId);

  res.status(200).json({
    success: true,
    message: "Plan feature deleted successfully",
  });
}
