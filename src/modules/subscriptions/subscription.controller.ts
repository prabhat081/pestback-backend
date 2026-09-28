import type { Request, Response } from "express";

import { ApiError } from "../../utils/api-error.js";

import {
  cancelSubscriptionSchema,
  createSubscriptionSchema,
  subscriptionIdSchema,
  subscriptionListQuerySchema,
} from "./subscription.schema.js";

import {
  cancelSubscription,
  createNewSubscription,
  getCurrentSubscription,
  getSubscription,
  getSubscriptions,
} from "./subscription.service.js";

export async function getSubscriptionsController(req: Request, res: Response) {
  if (!req.company?.id) {
    throw new ApiError(400, "Company context is required", "COMPANY_REQUIRED");
  }

  const query = subscriptionListQuerySchema.parse(req.query);

  const result = await getSubscriptions(query, req.company.id);

  return res.status(200).json({
    success: true,
    data: result,
  });
}

export async function getCurrentSubscriptionController(
  req: Request,
  res: Response,
) {
  if (!req.company?.id) {
    throw new ApiError(400, "Company context is required", "COMPANY_REQUIRED");
  }

  const subscription = await getCurrentSubscription(req.company.id);

  return res.status(200).json({
    success: true,
    data: subscription,
  });
}

export async function getSubscriptionController(req: Request, res: Response) {
  if (!req.company?.id) {
    throw new ApiError(400, "Company context is required", "COMPANY_REQUIRED");
  }

  const { subscriptionId } = subscriptionIdSchema.parse(req.params);

  const subscription = await getSubscription(subscriptionId, req.company.id);

  return res.status(200).json({
    success: true,
    data: subscription,
  });
}

export async function createSubscriptionController(
  req: Request,
  res: Response,
) {
  if (!req.company?.id) {
    throw new ApiError(400, "Company context is required", "COMPANY_REQUIRED");
  }

  const input = createSubscriptionSchema.parse(req.body);

  const subscription = await createNewSubscription(req.company.id, input);

  return res.status(201).json({
    success: true,
    message: "Subscription created successfully",
    data: subscription,
  });
}

export async function cancelSubscriptionController(
  req: Request,
  res: Response,
) {
  if (!req.company?.id) {
    throw new ApiError(400, "Company context is required", "COMPANY_REQUIRED");
  }

  const { subscriptionId } = subscriptionIdSchema.parse(req.params);

  const input = cancelSubscriptionSchema.parse(req.body);

  const subscription = await cancelSubscription(
    req.company.id,
    subscriptionId,
    input,
  );

  return res.status(200).json({
    success: true,
    message: input.cancelAtPeriodEnd
      ? "Subscription cancellation scheduled successfully"
      : "Subscription cancelled successfully",
    data: subscription,
  });
}
