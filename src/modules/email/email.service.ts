import { Resend } from "resend";

import { env } from "../../config/env.js";
import { ApiError } from "../../utils/api-error.js";

import {
  verificationEmailTemplate,
  teamInvitationEmailTemplate,
} from "./email.templates.js";

const resend = new Resend(env.RESEND_API_KEY);

export async function sendVerificationEmail(
  email: string,
  firstName: string,
  verificationToken: string,
) {
  const { subject, html } = verificationEmailTemplate({
    firstName,
    verificationToken,
  });

  const { data, error } = await resend.emails.send({
    from: env.EMAIL_FROM,
    to: [email],
    subject,
    html,
  });

  if (error) {
    console.error("❌ Verification email failed:", error);

    throw new ApiError(
      500,
      "Unable to send verification email",
      "EMAIL_SEND_FAILED",
    );
  }

  return data;
}

export async function sendTeamInvitationEmail(
  email: string,
  companyName: string,
  roleName: string,
  invitationToken: string,
) {
  const { subject, html } =
    teamInvitationEmailTemplate({
      companyName,
      roleName,
      invitationToken,
    });

  const { data, error } =
    await resend.emails.send({
      from: env.EMAIL_FROM,
      to: [email],
      subject,
      html,
    });

  if (error) {
    console.error(
      "❌ Team invitation email failed:",
      error,
    );

    throw new ApiError(
      500,
      "Unable to send team invitation email",
      "EMAIL_SEND_FAILED",
    );
  }

  return data;
}
