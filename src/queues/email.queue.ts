import { Queue } from "bullmq";

import { redis } from "../config/redis.js";

export const EMAIL_QUEUE_NAME = "email";

export interface VerificationEmailJob {
  type: "verification";

  email: string;

  firstName: string;

  verificationToken: string;
}

export interface TeamInvitationEmailJob {
  type: "team-invitation";

  email: string;

  companyName: string;

  roleName: string;

  invitationToken: string;
}

export type EmailJob = VerificationEmailJob | TeamInvitationEmailJob;

export const emailQueue = new Queue<EmailJob>(EMAIL_QUEUE_NAME, {
  connection: redis,

  defaultJobOptions: {
    attempts: 3,

    backoff: {
      type: "exponential",
      delay: 5000,
    },

    removeOnComplete: {
      count: 100,
    },

    removeOnFail: {
      count: 500,
    },
  },
});

export async function queueVerificationEmail(data: {
  email: string;

  firstName: string;

  verificationToken: string;
}) {
  await emailQueue.add("verification-email", {
    type: "verification",

    email: data.email,

    firstName: data.firstName,

    verificationToken: data.verificationToken,
  });
}

export async function queueTeamInvitationEmail(data: {
  email: string;

  companyName: string;

  roleName: string;

  invitationToken: string;
}) {
  await emailQueue.add("team-invitation-email", {
    type: "team-invitation",

    email: data.email,

    companyName: data.companyName,

    roleName: data.roleName,

    invitationToken: data.invitationToken,
  });
}
