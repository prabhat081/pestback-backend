// src/modules/payments/payment.queue.ts

import { Queue } from "bullmq";

import { redis as redisConnection } from "../../config/redis.js";

export const PAYMENT_QUEUE_NAME = "payments";

export const paymentQueue = new Queue(PAYMENT_QUEUE_NAME, {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: 1000,
    removeOnFail: 5000,
  },
});

export interface ProcessPaymentWebhookJob {
  webhookId: string;
}

export async function addPaymentWebhookJob(data: ProcessPaymentWebhookJob) {
  return paymentQueue.add("process-webhook", data, {
    jobId: `payment-webhook-${data.webhookId}`,
  });
}
