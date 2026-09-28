import { redis } from "../../config/redis.js";

const RESEND_LIMIT_PREFIX = "auth:resend-limit:";

const RESEND_COOLDOWN = 60;

export async function canResendVerification(email: string): Promise<boolean> {
  const key = `${RESEND_LIMIT_PREFIX}${email.toLowerCase()}`;

  const exists = await redis.exists(key);

  return exists === 0;
}

export async function markVerificationResend(email: string) {
  const key = `${RESEND_LIMIT_PREFIX}${email.toLowerCase()}`;

  await redis.set(key, "1", "EX", RESEND_COOLDOWN);
}
