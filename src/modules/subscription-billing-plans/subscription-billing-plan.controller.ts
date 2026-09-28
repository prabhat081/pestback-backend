import type { Request, Response } from "express";

import {
  subscriptionBillingPlanIdSchema,
  subscriptionBillingPlanQuerySchema,
  createSubscriptionBillingPlanSchema,
  updateSubscriptionBillingPlanSchema,
} from "./subscription-billing-plan.schema.js";

import {
  createNewSubscriptionBillingPlan,
  getSubscriptionBillingPlan,
  getSubscriptionBillingPlans,
  removeSubscriptionBillingPlan,
  updateExistingSubscriptionBillingPlan,
  verifyRazorpayBillingPlan,
} from "./subscription-billing-plan.service.js";

export async function getSubscriptionBillingPlansController(
  req: Request,
  res: Response,
) {
  const query = subscriptionBillingPlanQuerySchema.parse(req.query);

  const result = await getSubscriptionBillingPlans(query);

  res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getSubscriptionBillingPlanController(
  req: Request,
  res: Response,
) {
  const { billingPlanId } = subscriptionBillingPlanIdSchema.parse(req.params);

  const billingPlan = await getSubscriptionBillingPlan(billingPlanId);

  res.status(200).json({
    success: true,
    data: billingPlan,
  });
}

export async function createSubscriptionBillingPlanController(
  req: Request,
  res: Response,
) {
  const data = createSubscriptionBillingPlanSchema.parse(req.body);

  const billingPlan = await createNewSubscriptionBillingPlan(data);

  res.status(201).json({
    success: true,
    message: "Subscription billing plan created successfully",
    data: billingPlan,
  });
}

export async function updateSubscriptionBillingPlanController(
  req: Request,
  res: Response,
) {
  const { billingPlanId } = subscriptionBillingPlanIdSchema.parse(req.params);

  const data = updateSubscriptionBillingPlanSchema.parse(req.body);

  const billingPlan = await updateExistingSubscriptionBillingPlan(
    billingPlanId,
    data,
  );

  res.status(200).json({
    success: true,
    message: "Subscription billing plan updated successfully",
    data: billingPlan,
  });
}

export async function deleteSubscriptionBillingPlanController(
  req: Request,
  res: Response,
) {
  const { billingPlanId } = subscriptionBillingPlanIdSchema.parse(req.params);

  await removeSubscriptionBillingPlan(billingPlanId);

  res.status(200).json({
    success: true,
    message: "Subscription billing plan deleted successfully",
  });
}

export async function verifyRazorpayBillingPlanController(
  req: Request,
  res: Response,
) {
  const { billingPlanId } = subscriptionBillingPlanIdSchema.parse(req.params);

  const result = await verifyRazorpayBillingPlan(billingPlanId);

  res.status(200).json({
    success: true,
    data: result,
  });
}
