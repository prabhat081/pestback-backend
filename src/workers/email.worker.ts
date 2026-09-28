import { Worker } from "bullmq";

import { EMAIL_QUEUE_NAME, type EmailJob } from "../queues/email.queue.js";

import { redis } from "../config/redis.js";

import {
  sendVerificationEmail,
  sendTeamInvitationEmail,
} from "../modules/email/email.service.js";

export const emailWorker = new Worker<EmailJob>(
  EMAIL_QUEUE_NAME,

  async (job) => {
    console.log(`📧 Processing email job: ${job.id}`);

    switch (job.data.type) {
      case "verification":
        await sendVerificationEmail(
          job.data.email,
          job.data.firstName,
          job.data.verificationToken,
        );
        break;

      case "team-invitation":
        await sendTeamInvitationEmail(
          job.data.email,
          job.data.companyName,
          job.data.roleName,
          job.data.invitationToken,
        );
        break;
    }

    console.log(`✅ Email sent successfully: ${job.id}`);
  },

  {
    connection: redis,

    concurrency: 5,

    limiter: {
      max: 10,
      duration: 1000,
    },
  },
);

emailWorker.on("completed", (job) => {
  console.log(`✅ Email job completed: ${job.id}`);
});

emailWorker.on("failed", (job, error) => {
  console.error(`❌ Email job failed: ${job?.id}`, error);
});

emailWorker.on("error", (error) => {
  console.error("❌ Email worker error:", error);
});
