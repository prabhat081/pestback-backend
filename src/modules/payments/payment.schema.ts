// src/modules/payments/payment.schema.ts

import { z } from "zod";

import {
  PAYMENT_METHODS,
  PAYMENT_ORDER_PROVIDERS,
  PAYMENT_ORDER_STATUSES,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
} from "../../database/schema/index.js";

/* -------------------------------------------------------------------------- */
/*                                  PARAMS                                    */
/* -------------------------------------------------------------------------- */

export const paymentIdParamSchema = z.object({
  id: z.string().uuid("Invalid payment ID"),
});

export const paymentOrderIdParamSchema = z.object({
  id: z.string().uuid("Invalid payment order ID"),
});

export const paymentLinkTokenParamSchema = z.object({
  token: z
    .string()
    .trim()
    .min(20, "Invalid payment link token")
    .max(200, "Invalid payment link token"),
});

/* -------------------------------------------------------------------------- */
/*                               COMMON                                       */
/* -------------------------------------------------------------------------- */

const moneySchema = z
  .number()
  .positive("Amount must be greater than 0")
  .refine(
    (value) =>
      Number.isFinite(value) && Math.round(value * 100) === value * 100,
    {
      message: "Amount can have maximum 2 decimal places",
    },
  );

const currencySchema = z
  .string()
  .trim()
  .length(3, "Currency must be 3 characters")
  .regex(/^[A-Z]{3}$/, "Currency must be uppercase");

const dateTimeSchema = z.string().datetime({
  offset: true,
  message: "Invalid date-time",
});

/* -------------------------------------------------------------------------- */
/*                              PAYMENT LIST                                  */
/* -------------------------------------------------------------------------- */

export const paymentListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    search: z.string().trim().max(100).optional(),

    status: z
      .enum([...PAYMENT_STATUSES, "all"])
      .optional()
      .default("all"),

    paymentMethod: z
      .enum([...PAYMENT_METHODS, "all"])
      .optional()
      .default("all"),

    paymentProvider: z
      .enum([...PAYMENT_PROVIDERS, "all"])
      .optional()
      .default("all"),

    invoiceId: z.string().uuid("Invalid invoice ID").optional(),

    customerId: z.string().uuid("Invalid customer ID").optional(),

    fromDate: z.string().date("Invalid from date").optional(),

    toDate: z.string().date("Invalid to date").optional(),
  })
  .refine(
    (data) => {
      if (!data.fromDate || !data.toDate) {
        return true;
      }

      return data.fromDate <= data.toDate;
    },
    {
      message: "fromDate cannot be after toDate",
      path: ["fromDate"],
    },
  );

/* -------------------------------------------------------------------------- */
/*                          PAYMENT ORDER LIST                                */
/* -------------------------------------------------------------------------- */

export const paymentOrderListQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).default(1),

    limit: z.coerce.number().int().min(1).max(100).default(10),

    search: z.string().trim().max(100).optional(),

    status: z
      .enum([...PAYMENT_ORDER_STATUSES, "all"])
      .optional()
      .default("all"),

    invoiceId: z.string().uuid("Invalid invoice ID").optional(),

    customerId: z.string().uuid("Invalid customer ID").optional(),

    fromDate: z.string().date("Invalid from date").optional(),

    toDate: z.string().date("Invalid to date").optional(),
  })
  .refine(
    (data) => {
      if (!data.fromDate || !data.toDate) {
        return true;
      }

      return data.fromDate <= data.toDate;
    },
    {
      message: "fromDate cannot be after toDate",
      path: ["fromDate"],
    },
  );

/* -------------------------------------------------------------------------- */
/*                              CREATE PAYMENT                                */
/* -------------------------------------------------------------------------- */

export const createPaymentSchema = z
  .object({
    invoiceId: z.string().uuid("Invalid invoice ID"),

    customerId: z.string().uuid("Invalid customer ID"),

    amount: moneySchema,

    currency: currencySchema.default("INR"),

    paymentMethod: z.enum(PAYMENT_METHODS),

    paymentProvider: z.enum(PAYMENT_PROVIDERS).default("manual"),

    transactionId: z.string().trim().max(150).optional(),

    idempotencyKey: z.string().trim().max(150).optional(),

    paymentDate: dateTimeSchema.optional(),

    notes: z.string().trim().max(5000).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.paymentProvider === "razorpay" &&
      data.paymentMethod !== "online"
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Razorpay payments must use online payment method",
        path: ["paymentMethod"],
      });
    }

    if (data.paymentProvider === "manual" && data.paymentMethod === "online") {
      ctx.addIssue({
        code: "custom",
        message: "Online payment method requires Razorpay provider",
        path: ["paymentProvider"],
      });
    }
  });

/* -------------------------------------------------------------------------- */
/*                              UPDATE PAYMENT                                */
/* -------------------------------------------------------------------------- */

export const updatePaymentSchema = z.object({
  transactionId: z.union([z.string().trim().max(150), z.null()]).optional(),

  paymentDate: z.union([dateTimeSchema, z.null()]).optional(),

  notes: z.union([z.string().trim().max(5000), z.null()]).optional(),
});

/* -------------------------------------------------------------------------- */
/*                           UPDATE STATUS                                    */
/* -------------------------------------------------------------------------- */

export const updatePaymentStatusSchema = z.object({
  status: z.enum(PAYMENT_STATUSES),
});

/* -------------------------------------------------------------------------- */
/*                          CREATE PAYMENT ORDER                              */
/* -------------------------------------------------------------------------- */

export const createPaymentOrderSchema = z.object({
  invoiceId: z.string().uuid("Invalid invoice ID"),

  customerId: z.string().uuid("Invalid customer ID"),

  amount: moneySchema,

  currency: currencySchema.default("INR"),

  provider: z.enum(PAYMENT_ORDER_PROVIDERS),

  expiresAt: dateTimeSchema.optional(),

  notes: z.string().trim().max(5000).optional(),
});

/* -------------------------------------------------------------------------- */
/*                          UPDATE PAYMENT ORDER                              */
/* -------------------------------------------------------------------------- */

export const updatePaymentOrderSchema = z.object({
  expiresAt: z.union([dateTimeSchema, z.null()]).optional(),

  notes: z.union([z.string().trim().max(5000), z.null()]).optional(),
});

/* -------------------------------------------------------------------------- */
/*                              WEBHOOK                                       */
/* -------------------------------------------------------------------------- */

export const paymentWebhookSchema = z.object({
  eventId: z.string().trim().min(1).max(200),

  eventType: z.string().trim().min(1).max(100),

  payload: z.string().min(1),

  signature: z.string().trim().max(500).optional(),
});

/* -------------------------------------------------------------------------- */
/*                                TYPES                                       */
/* -------------------------------------------------------------------------- */

export type PaymentIdParam = z.infer<typeof paymentIdParamSchema>;

export type PaymentOrderIdParam = z.infer<typeof paymentOrderIdParamSchema>;

export type PaymentLinkTokenParam = z.infer<typeof paymentLinkTokenParamSchema>;

export type PaymentListQueryInput = z.infer<typeof paymentListQuerySchema>;

export type PaymentOrderListQueryInput = z.infer<
  typeof paymentOrderListQuerySchema
>;

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;

export type UpdatePaymentInput = z.infer<typeof updatePaymentSchema>;

export type UpdatePaymentStatusInput = z.infer<
  typeof updatePaymentStatusSchema
>;

export type CreatePaymentOrderInput = z.infer<typeof createPaymentOrderSchema>;

export type UpdatePaymentOrderInput = z.infer<typeof updatePaymentOrderSchema>;
