import nodemailer from "nodemailer";
import { config } from "../config.js";

const transporter = nodemailer.createTransport({
  host: config.smtp.host,
  port: config.smtp.port,
  secure: config.smtp.secure,
  auth: {
    user: config.smtp.user,
    pass: config.smtp.pass,
  },
});

function buildConfirmationHtml(email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>You're on the Kalpanik waitlist</title>
  </head>
  <body style="margin:0;padding:0;background:#f0f4f8;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px 28px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.25em;text-transform:uppercase;color:#0ea5e9;">Kalpanik</p>
                <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;">You're on the list</h1>
                <p style="margin:0 0 16px;line-height:1.7;color:#64748b;">
                  Thanks for joining the Kalpanik waitlist with <strong style="color:#0f172a;">${email}</strong>.
                </p>
                <p style="margin:0 0 16px;line-height:1.7;color:#64748b;">
                  We deliver what you imagine — AI solutions, software products, automation systems, and digital experiences. We'll notify you when we launch.
                </p>
                <p style="margin:0;line-height:1.7;color:#64748b;">
                  — The Kalpanik team
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendWaitlistConfirmation(email: string): Promise<void> {
  await transporter.sendMail({
    from: `"${config.mail.fromName}" <${config.smtp.from}>`,
    to: email,
    replyTo: config.mail.replyTo,
    subject: "You're on the Kalpanik waitlist",
    text: `Thanks for joining the Kalpanik waitlist with ${email}. We'll notify you when we launch.\n\n— The Kalpanik team`,
    html: buildConfirmationHtml(email),
  });
}

function buildAdminNotificationHtml(email: string, joinedAt: string): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>New Kalpanik waitlist signup</title>
  </head>
  <body style="margin:0;padding:0;background:#f0f4f8;font-family:Inter,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:40px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px 28px;">
            <tr>
              <td>
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.25em;text-transform:uppercase;color:#0ea5e9;">Kalpanik Waitlist</p>
                <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;">New signup</h1>
                <p style="margin:0 0 12px;line-height:1.7;color:#64748b;">
                  Someone just joined the waitlist:
                </p>
                <p style="margin:0 0 16px;padding:12px 16px;background:#f8fafc;border-radius:8px;font-size:16px;font-weight:600;color:#0f172a;">
                  ${email}
                </p>
                <p style="margin:0;font-size:14px;line-height:1.6;color:#94a3b8;">
                  Joined at ${joinedAt}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export async function sendWaitlistAdminNotification(email: string): Promise<void> {
  const joinedAt = new Date().toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });

  await transporter.sendMail({
    from: `"${config.mail.fromName}" <${config.smtp.from}>`,
    to: config.mail.notifyTo,
    replyTo: email,
    subject: `New waitlist signup: ${email}`,
    text: `Someone just joined the Kalpanik waitlist.\n\nEmail: ${email}\nJoined at: ${joinedAt}`,
    html: buildAdminNotificationHtml(email, joinedAt),
  });
}

export async function verifySmtpConnection(): Promise<void> {
  await transporter.verify();
}
