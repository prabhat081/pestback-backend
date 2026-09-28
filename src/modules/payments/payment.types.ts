// src/modules/payments/payment.types.ts

import type {
  PaymentMethod,
  PaymentOrderProvider,
  PaymentOrderStatus,
  PaymentProvider,
  PaymentStatus,
} from "../../database/schema/index.js";

export type {
  PaymentMethod,
  PaymentOrderProvider,
  PaymentOrderStatus,
  PaymentProvider,
  PaymentStatus,
};

/* -------------------------------------------------------------------------- */
/*                              PAGINATION                                    */
/* -------------------------------------------------------------------------- */

export interface PaymentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/* -------------------------------------------------------------------------- */
/*                              PAYMENT LIST                                  */
/* -------------------------------------------------------------------------- */

export interface PaymentListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: PaymentStatus | "all";
  paymentMethod?: PaymentMethod | "all";
  paymentProvider?: PaymentProvider | "all";
  invoiceId?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}

/* -------------------------------------------------------------------------- */
/*                          PAYMENT ORDER LIST                                */
/* -------------------------------------------------------------------------- */

export interface PaymentOrderListQuery {
  page: number;
  limit: number;
  search?: string;
  status?: PaymentOrderStatus | "all";
  invoiceId?: string;
  customerId?: string;
  fromDate?: string;
  toDate?: string;
}

/* -------------------------------------------------------------------------- */
/*                              CREATE PAYMENT                                */
/* -------------------------------------------------------------------------- */

export interface CreatePaymentInput {
  invoiceId: string;
  customerId: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  paymentProvider?: PaymentProvider;
  transactionId?: string;
  idempotencyKey?: string;
  paymentDate?: string;
  notes?: string;
}

/* -------------------------------------------------------------------------- */
/*                              UPDATE PAYMENT                                */
/* -------------------------------------------------------------------------- */

export interface UpdatePaymentInput {
  transactionId?: string | null;
  paymentDate?: string | null;
  notes?: string | null;
}

/* -------------------------------------------------------------------------- */
/*                           PAYMENT ORDER                                    */
/* -------------------------------------------------------------------------- */

export interface CreatePaymentOrderInput {
  invoiceId: string;
  customerId: string;
  amount: number;
  currency?: string;
  provider: PaymentOrderProvider;
  expiresAt?: string;
  notes?: string;
}

export interface UpdatePaymentOrderInput {
  expiresAt?: string | null;
  notes?: string | null;
}

/* -------------------------------------------------------------------------- */
/*                              WEBHOOK                                       */
/* -------------------------------------------------------------------------- */

export interface RazorpayWebhookInput {
  eventId: string;
  eventType: string;
  payload: string;
  signature?: string;
}

/* -------------------------------------------------------------------------- */
/*                           INTERNAL PAYMENT                                 */
/* -------------------------------------------------------------------------- */

export interface CompleteOnlinePaymentInput {
  providerPaymentId: string;
  transactionId?: string;
  paymentDate?: string;
  notes?: string;
}
