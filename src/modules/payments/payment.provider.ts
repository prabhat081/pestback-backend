// src/modules/payments/payment.provider.ts

import { createHmac, timingSafeEqual } from "node:crypto";
import Razorpay from "razorpay";

import { ApiError } from "../../utils/api-error.js";

function getRazorpayClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new ApiError(
      500,
      "Razorpay configuration is missing",
      "RAZORPAY_CONFIG_MISSING",
    );
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  });
}

export interface CreateRazorpayOrderInput {
  amount: number;
  currency: string;
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResult {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface RazorpayPaymentResult {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  status: string;
  order_id: string | null;
  method: string | null;
  created_at: number | null;
  error_code: string | null;
  error_description: string | null;
  error_reason: string | null;
}

export async function createRazorpayOrder(
  input: CreateRazorpayOrderInput,
): Promise<RazorpayOrderResult> {
  const razorpay = getRazorpayClient();
  const amountInSmallestUnit = Math.round(input.amount * 100);

  try {
    const order = await razorpay.orders.create({
      amount: amountInSmallestUnit,
      currency: input.currency,
      receipt: input.receipt,
      notes: input.notes,
    });

    return {
      id: order.id,
      entity: order.entity,
      amount: Number(order.amount),
      amount_paid: Number(order.amount_paid),
      amount_due: Number(order.amount_due),
      currency: order.currency,
      receipt: order.receipt ?? input.receipt,
      status: order.status,
      created_at: Number(order.created_at),
    };
  } catch (error) {
    console.error("Razorpay order creation failed:", error);
    throw new ApiError(
      502,
      "Unable to create Razorpay order",
      "RAZORPAY_ORDER_CREATION_FAILED",
    );
  }
}

export async function fetchRazorpayOrder(providerOrderId: string) {
  const razorpay = getRazorpayClient();

  try {
    const order = await razorpay.orders.fetch(providerOrderId);

    return {
      id: order.id,
      entity: order.entity,
      amount: Number(order.amount),
      amount_paid: Number(order.amount_paid),
      amount_due: Number(order.amount_due),
      currency: order.currency,
      receipt: order.receipt ?? null,
      status: order.status,
      created_at: Number(order.created_at),
    };
  } catch (error) {
    console.error("Razorpay order fetch failed:", error);
    throw new ApiError(
      502,
      "Unable to fetch Razorpay order",
      "RAZORPAY_ORDER_FETCH_FAILED",
    );
  }
}

export async function fetchRazorpayPayment(
  providerPaymentId: string,
): Promise<RazorpayPaymentResult> {
  const razorpay = getRazorpayClient();

  try {
    const payment = await razorpay.payments.fetch(providerPaymentId);

    return {
      id: payment.id,
      entity: payment.entity,
      amount: Number(payment.amount),
      currency: payment.currency,
      status: payment.status,
      order_id: payment.order_id ?? null,
      method: payment.method ?? null,
      created_at:
        payment.created_at === undefined
          ? null
          : Number(payment.created_at),
      error_code: payment.error_code ?? null,
      error_description: payment.error_description ?? null,
      error_reason: payment.error_reason ?? null,
    };
  } catch (error) {
    console.error("Razorpay payment fetch failed:", error);
    throw new ApiError(
      502,
      "Unable to fetch Razorpay payment",
      "RAZORPAY_PAYMENT_FETCH_FAILED",
    );
  }
}

export function verifyRazorpayPaymentSignature(input: {
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new ApiError(
      500,
      "Razorpay configuration is missing",
      "RAZORPAY_CONFIG_MISSING",
    );
  }

  const generated = createHmac("sha256", keySecret)
    .update(`${input.orderId}|${input.paymentId}`)
    .digest("hex");

  return safeCompareHex(generated, input.signature);
}

export function verifyRazorpayWebhook(rawBody: string, signature: string) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new ApiError(
      500,
      "Razorpay webhook secret is missing",
      "RAZORPAY_WEBHOOK_SECRET_MISSING",
    );
  }

  const generated = createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  return safeCompareHex(generated, signature);
}

function safeCompareHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}
