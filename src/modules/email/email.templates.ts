import type {
  VerificationEmailData,
  TeamInvitationEmailData,
} from "./email.types.js";
import { env } from "../../config/env.js";
export function verificationEmailTemplate({
  firstName,
  verificationToken,
}: VerificationEmailData) {
  const verificationUrl = `${env.FRONTEND_URL}/verify-email?token=${encodeURIComponent(
    verificationToken,
  )}`;

  return {
    subject: "Verify your PestBack account",

    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Verify your PestBack account</title>
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background:#f5f5f5;
            font-family:Arial,Helvetica,sans-serif;
          "
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="padding:40px 20px;"
          >
            <tr>
              <td align="center">

                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    max-width:600px;
                    background:#ffffff;
                    border-radius:12px;
                    overflow:hidden;
                  "
                >

                  <tr>
                    <td
                      style="
                        padding:30px;
                        text-align:center;
                        background:#111111;
                      "
                    >
                      <div
                        style="
                          font-size:28px;
                          font-weight:bold;
                          color:#ffffff;
                        "
                      >
                        PEST<span style="color:#E30613;">BACK</span>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:40px 35px;">

                      <h1
                        style="
                          margin:0 0 20px;
                          font-size:24px;
                          color:#111111;
                        "
                      >
                        Verify your email
                      </h1>

                      <p
                        style="
                          font-size:16px;
                          line-height:1.6;
                          color:#555555;
                        "
                      >
                        Hi ${firstName},
                      </p>

                      <p
                        style="
                          font-size:16px;
                          line-height:1.6;
                          color:#555555;
                        "
                      >
                        Thanks for signing up for PestBack.
                        Please verify your email address to continue
                        setting up your business.
                      </p>

                      <div style="text-align:center;margin:30px 0;">

                        <a
                          href="${verificationUrl}"
                          style="
                            display:inline-block;
                            padding:14px 28px;
                            background:#E30613;
                            color:#ffffff;
                            text-decoration:none;
                            border-radius:7px;
                            font-weight:bold;
                          "
                        >
                          Verify Email
                        </a>

                      </div>

                      <p
                        style="
                          font-size:14px;
                          line-height:1.6;
                          color:#777777;
                        "
                      >
                        This verification link will expire in
                        <strong>30 minutes</strong>.
                      </p>

                      <p
                        style="
                          font-size:13px;
                          line-height:1.6;
                          color:#999999;
                          word-break:break-all;
                        "
                      >
                        If the button doesn't work, copy and paste this URL:
                        <br />
                        ${verificationUrl}
                      </p>

                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:20px 35px;
                        background:#fafafa;
                        text-align:center;
                        color:#999999;
                        font-size:12px;
                      "
                    >
                      © ${new Date().getFullYear()} PestBack.
                      All rights reserved.
                    </td>
                  </tr>

                </table>

              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };
}

export function teamInvitationEmailTemplate({
  companyName,
  roleName,
  invitationToken,
}: TeamInvitationEmailData) {
  const invitationUrl =
    `${env.FRONTEND_URL}/accept-invitation?token=${encodeURIComponent(
      invitationToken,
    )}`;

  return {
    subject: `You're invited to join ${companyName} on PestBack`,

    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>PestBack Invitation</title>
        </head>

        <body
          style="
            margin:0;
            padding:0;
            background:#f5f5f5;
            font-family:Arial,Helvetica,sans-serif;
          "
        >
          <table
            width="100%"
            cellpadding="0"
            cellspacing="0"
            style="padding:40px 20px;"
          >
            <tr>
              <td align="center">
                <table
                  width="100%"
                  cellpadding="0"
                  cellspacing="0"
                  style="
                    max-width:600px;
                    background:#ffffff;
                    border-radius:12px;
                    overflow:hidden;
                  "
                >
                  <tr>
                    <td
                      style="
                        padding:30px;
                        text-align:center;
                        background:#111111;
                      "
                    >
                      <div
                        style="
                          font-size:28px;
                          font-weight:bold;
                          color:#ffffff;
                        "
                      >
                        PEST<span style="color:#E30613;">BACK</span>
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding:40px 35px;">

                      <h1
                        style="
                          margin:0 0 20px;
                          font-size:24px;
                          color:#111111;
                        "
                      >
                        You're invited to join PestBack
                      </h1>

                      <p
                        style="
                          font-size:16px;
                          line-height:1.6;
                          color:#555555;
                        "
                      >
                        You have been invited to join
                        <strong>${companyName}</strong>
                        on PestBack.
                      </p>

                      <p
                        style="
                          font-size:16px;
                          line-height:1.6;
                          color:#555555;
                        "
                      >
                        Your assigned role is:
                        <strong>${roleName}</strong>
                      </p>

                      <div
                        style="
                          text-align:center;
                          margin:30px 0;
                        "
                      >
                        <a
                          href="${invitationUrl}"
                          style="
                            display:inline-block;
                            padding:14px 28px;
                            background:#E30613;
                            color:#ffffff;
                            text-decoration:none;
                            border-radius:7px;
                            font-weight:bold;
                          "
                        >
                          Accept Invitation
                        </a>
                      </div>

                      <p
                        style="
                          font-size:14px;
                          line-height:1.6;
                          color:#777777;
                        "
                      >
                        This invitation will expire in
                        <strong>7 days</strong>.
                      </p>

                      <p
                        style="
                          font-size:13px;
                          line-height:1.6;
                          color:#999999;
                          word-break:break-all;
                        "
                      >
                        If the button doesn't work, copy and paste this URL:
                        <br />
                        ${invitationUrl}
                      </p>

                    </td>
                  </tr>

                  <tr>
                    <td
                      style="
                        padding:20px 35px;
                        background:#fafafa;
                        text-align:center;
                        color:#999999;
                        font-size:12px;
                      "
                    >
                      © ${new Date().getFullYear()} PestBack.
                      All rights reserved.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };
}
