import { redis } from "../../config/redis.js";

import type { PendingRegistration } from "./auth.types.js";

const REGISTRATION_PREFIX = "auth:registration:";
const REGISTRATION_EMAIL_PREFIX = "auth:registration-email:";

const REGISTRATION_TTL = 30 * 60; // 30 minutes

export async function savePendingRegistration(
  tokenHash: string,
  data: PendingRegistration,
) {
  const registrationKey = `${REGISTRATION_PREFIX}${tokenHash}`;

  const emailKey = `${REGISTRATION_EMAIL_PREFIX}${data.email}`;

  await redis
    .multi()
    .set(registrationKey, JSON.stringify(data), "EX", REGISTRATION_TTL)
    .set(emailKey, tokenHash, "EX", REGISTRATION_TTL)
    .exec();
}

export async function getPendingRegistration(
  tokenHash: string,
): Promise<PendingRegistration | null> {
  const key = `${REGISTRATION_PREFIX}${tokenHash}`;

  const data = await redis.get(key);

  if (!data) {
    return null;
  }

  return JSON.parse(data) as PendingRegistration;
}

export async function getPendingRegistrationTokenHash(
  email: string,
): Promise<string | null> {
  const key = `${REGISTRATION_EMAIL_PREFIX}${email.toLowerCase()}`;

  return redis.get(key);
}

export async function deletePendingRegistration(
  tokenHash: string,
  email?: string,
) {
  const registrationKey = `${REGISTRATION_PREFIX}${tokenHash}`;

  const keys = [registrationKey];

  if (email) {
    keys.push(`${REGISTRATION_EMAIL_PREFIX}${email.toLowerCase()}`);
  }

  await redis.del(...keys);
}