import crypto from "node:crypto";

import { Router } from "express";
import type { Request, Response } from "express";

import { ApiError } from "../../utils/api-error.js";
import { verifyRazorpayWebhookSignature } from "./razorpay-webhook.util.js";
import { processRazorpayWebhook } from "./subscription-webhook.service.js";

const router = Router();

router.post("/razorpay", async (req: Request, res: Response) => {
  const signature = req.header("x-razorpay-signature");
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!signature) {
    throw new ApiError(400, "Razorpay webhook signature is required", "WEBHOOK_SIGNATURE_REQUIRED");
  }

  if (!secret) {
    throw new ApiError(500, "Razorpay webhook secret is not configured", "WEBHOOK_SECRET_NOT_CONFIGURED");
  }

  const rawBody = req.body;

  if (!Buffer.isBuffer(rawBody)) {
    throw new ApiError(400, "Invalid Razorpay webhook body", "INVALID_WEBHOOK_BODY");
  }

  if (!verifyRazorpayWebhookSignature(rawBody, signature, secret)) {
    throw new ApiError(400, "Invalid Razorpay webhook signature", "INVALID_WEBHOOK_SIGNATURE");
  }

  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(rawBody.toString("utf8")) as Record<string, unknown>;
  } catch {
    throw new ApiError(400, "Invalid Razorpay webhook JSON", "INVALID_WEBHOOK_JSON");
  }

  const event = typeof payload.event === "string" ? payload.event : null;
  if (!event) {
    throw new ApiError(400, "Razorpay webhook event is required", "WEBHOOK_EVENT_REQUIRED");
  }

  const providerEventId = req.header("x-razorpay-event-id");
  const eventId = providerEventId || `${event}:${crypto.createHash("sha256").update(rawBody).digest("hex")}`;

  const result = await processRazorpayWebhook({ eventId, event, payload });

  return res.status(200).json({ success: true, data: result });
});

export default router;
