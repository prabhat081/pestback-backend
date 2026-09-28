// src/modules/team/team.email.ts

import { Resend } from "resend";

import { env } from "../../config/env.js";

const resend = new Resend(env.RESEND_API_KEY);

interface SendInvitationEmailInput {
  email: string;
  firstName?: string;
  companyName: string;
  roleName: string;
  token: string;
}

export async function sendTeamInvitationEmail(input: SendInvitationEmailInput) {
  const acceptUrl = `${env.FRONTEND_URL}/accept-invitation?token=${encodeURIComponent(
    input.token,
  )}`;

  await resend.emails.send({
    from: env.EMAIL_FROM,
    to: input.email,
    subject: `You're invited to join ${input.companyName} on PestBack`,

    html: `
      <!DOCTYPE html>
      <html>
        <body
          style="
            margin:0;
            padding:0;
            background:#f5f5f5;
            font-family:Arial,sans-serif;
          "
        >
          <div
            style="
              max-width:600px;
              margin:40px auto;
              background:#ffffff;
              border-radius:12px;
              padding:40px;
            "
          >
            <h1 style="margin:0 0 20px;">
              You're invited to PestBack
            </h1>

            <p>
              Hello${input.firstName ? ` ${input.firstName}` : ""},
            </p>

            <p>
              You've been invited to join
              <strong>${input.companyName}</strong>
              on PestBack as
              <strong>${input.roleName}</strong>.
            </p>

            <p>
              Click the button below to accept your invitation
              and create your account.
            </p>

            <div style="margin:30px 0;">
              <a
                href="${acceptUrl}"
                style="
                  display:inline-block;
                  padding:14px 24px;
                  background:#E30613;
                  color:#ffffff;
                  text-decoration:none;
                  border-radius:8px;
                  font-weight:600;
                "
              >
                Accept Invitation
              </a>
            </div>

            <p style="font-size:14px;color:#666;">
              This invitation will expire in 7 days.
            </p>

            <p style="font-size:13px;color:#888;">
              If you did not expect this invitation,
              you can safely ignore this email.
            </p>
          </div>
        </body>
      </html>
    `,
  });
}
