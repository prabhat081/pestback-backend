// src/modules/payments/payment.webhook.controller.ts

import type { Request, Response } from "express";

import {
  findPaymentOrderByProviderOrderId,
  findPaymentWebhookByEventId,
  insertPaymentWebhook,
} from "./payment.repository.js";

import { verifyRazorpayWebhook } from "./payment.provider.js";

import { addPaymentWebhookJob } from "./payment.queue.js";

import { ApiError } from "../../utils/api-error.js";

/* -------------------------------------------------------------------------- */
/*                         RAZORPAY PAYLOAD                                  */
/* -------------------------------------------------------------------------- */

interface RazorpayWebhookPayload {
  id?: string;

  event?: string;

  payload?: {
    payment?: {
      entity?: {
        id?: string;
        order_id?: string;
      };
    };

    order?: {
      entity?: {
        id?: string;
      };
    };
  };
}


function providerOrderIdFromPayload(payload: RazorpayWebhookPayload) {
  return (
    payload.payload?.payment?.entity?.order_id ??
    payload.payload?.order?.entity?.id ??
    "unknown-order"
  );
}

/* -------------------------------------------------------------------------- */
/*                              WEBHOOK                                      */
/* -------------------------------------------------------------------------- */

export async function razorpayWebhookController(req: Request, res: Response) {
  const signature = req.headers["x-razorpay-signature"];

  if (typeof signature !== "string") {
    throw new ApiError(
      400,
      "Razorpay webhook signature is missing",
      "WEBHOOK_SIGNATURE_MISSING",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                              RAW BODY                                   */
  /* ------------------------------------------------------------------------ */

  if (!Buffer.isBuffer(req.body)) {
    throw new ApiError(
      400,
      "Webhook raw body is required",
      "WEBHOOK_RAW_BODY_REQUIRED",
    );
  }

  const rawBody = req.body.toString("utf8");

  if (!rawBody) {
    throw new ApiError(400, "Webhook body is empty", "WEBHOOK_BODY_EMPTY");
  }

  /* ------------------------------------------------------------------------ */
  /*                         VERIFY SIGNATURE                                 */
  /* ------------------------------------------------------------------------ */

  const isValid = verifyRazorpayWebhook(rawBody, signature);

  if (!isValid) {
    throw new ApiError(
      401,
      "Invalid Razorpay webhook signature",
      "INVALID_WEBHOOK_SIGNATURE",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                              PARSE                                       */
  /* ------------------------------------------------------------------------ */

  let payload: RazorpayWebhookPayload;

  try {
    payload = JSON.parse(rawBody) as RazorpayWebhookPayload;
  } catch {
    throw new ApiError(
      400,
      "Invalid webhook payload",
      "INVALID_WEBHOOK_PAYLOAD",
    );
  }

  if (!payload.event) {
    throw new ApiError(
      400,
      "Webhook event is missing",
      "WEBHOOK_EVENT_MISSING",
    );
  }

  /* ------------------------------------------------------------------------ */
  /*                         RESOLVE EVENT ID                                 */
  /* ------------------------------------------------------------------------ */

  const eventId =
    payload.id ??
    `${signature}:${payload.event}:${providerOrderIdFromPayload(payload)}`;

  /* ------------------------------------------------------------------------ */
  /*                           IDEMPOTENCY                                    */
  /* ------------------------------------------------------------------------ */

  const existing = await findPaymentWebhookByEventId("razorpay", eventId);

  if (existing) {
    /*
     * Razorpay can retry the same webhook.
     *
     * Do not create another webhook record.
     */
    return res.status(200).json({
      success: true,
      message: "Webhook already received",
    });
  }

  /* ------------------------------------------------------------------------ */
  /*                       RESOLVE PROVIDER ORDER                             */
  /* ------------------------------------------------------------------------ */

  const providerOrderId =
    payload.payload?.payment?.entity?.order_id ??
    payload.payload?.order?.entity?.id;

  let companyId: string | undefined;

  if (providerOrderId) {
    const paymentOrder = await findPaymentOrderByProviderOrderId(
      "razorpay",
      providerOrderId,
    );

    if (paymentOrder) {
      companyId = paymentOrder.companyId;
    }
  }

  /*
   * Some webhook events may not contain an
   * order ID that can be resolved immediately.
   *
   * companyId is therefore nullable in the
   * payment_webhooks table.
   */
  const webhook = await insertPaymentWebhook({
    companyId: companyId ?? null,
    provider: "razorpay",
    eventId,
    eventType: payload.event,
    payload: rawBody,
    signature,
    status: "pending",
    retryCount: 0,
  });

  /* ------------------------------------------------------------------------ */
  /*                             QUEUE                                        */
  /* ------------------------------------------------------------------------ */

  await addPaymentWebhookJob({
    webhookId: webhook.id,
  });

  /* ------------------------------------------------------------------------ */
  /*                            RESPONSE                                      */
  /* ------------------------------------------------------------------------ */

  return res.status(200).json({
    success: true,
    message: "Webhook received successfully",
  });
}
