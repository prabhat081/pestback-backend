import { razorpay } from "./razorpay.client.js";

export interface RazorpayInvoiceResult {
  id: string;
  entity: string;
  subscription_id?: string | null;
  customer_id?: string | null;
  order_id?: string | null;
  status?: string;
  currency?: string;
  amount?: number;
  amount_paid?: number;
  amount_due?: number;
}

export async function fetchRazorpayInvoice(
  invoiceId: string,
): Promise<RazorpayInvoiceResult> {
  const invoice = await razorpay.invoices.fetch(invoiceId);

  return invoice as unknown as RazorpayInvoiceResult;
}
