// Email sending utility (OTP delivery, notifications).
// Requires: npm install nodemailer  (and npm install -D @types/nodemailer)
// Env: EMAIL_SERVER (SMTP connection string, e.g. "smtp://user:pass@smtp.host:587")
//      EMAIL_FROM   (e.g. "CleanNest <no-reply@cleannest.com>")
//      APP_URL      (e.g. "http://localhost:3000" in dev, your real domain in prod)
import "server-only";
import crypto from "node:crypto";
import nodemailer, { type Transporter } from "nodemailer";

const EMAIL_SERVER = process.env.EMAIL_SERVER;
const EMAIL_FROM = process.env.EMAIL_FROM || "CleanNest <no-reply@cleannest.com>";
const EMAIL_REPLY_TO = process.env.EMAIL_REPLY_TO;
const EMAIL_RETURN_PATH = process.env.EMAIL_RETURN_PATH;
const APP_URL = process.env.APP_URL || "http://localhost:3000";

function emailFromDomain() {
  const match = EMAIL_FROM.match(/@([^>\s]+)/);
  return match?.[1]?.toLowerCase() ?? "cleannest.local";
}

if (
  process.env.NODE_ENV === "production" &&
  EMAIL_FROM.includes("no-reply@cleannest.com") &&
  !process.env.EMAIL_FROM
) {
  console.warn(
    "[email] EMAIL_FROM is not configured. Use an authenticated address on your own domain."
  );
}

let transporter: Transporter | null = null;

function getTransporter(): Transporter | null {
  if (!EMAIL_SERVER) return null;
  if (!transporter) {
    const dkimDomain = process.env.EMAIL_DKIM_DOMAIN?.trim();
    const dkimSelector = process.env.EMAIL_DKIM_SELECTOR?.trim();
    const dkimPrivateKey = process.env.EMAIL_DKIM_PRIVATE_KEY?.replaceAll("\\n", "\n");
    transporter = nodemailer.createTransport(EMAIL_SERVER, {
      ...(dkimDomain && dkimSelector && dkimPrivateKey
        ? {
            dkim: {
              domainName: dkimDomain,
              keySelector: dkimSelector,
              privateKey: dkimPrivateKey,
            },
          }
        : {}),
    });
  }
  return transporter;
}

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  referenceId?: string;
}

/**
 * Sends an email via the configured SMTP server.
 * If EMAIL_SERVER isn't configured (e.g. local development), the message is
 * logged to the console instead of failing the request outright.
 */
export async function sendEmail({
  to,
  subject,
  html,
  text,
  replyTo,
  referenceId,
}: SendEmailInput): Promise<void> {
  const client = getTransporter();

  if (!client) {
    console.warn(
      `[email] EMAIL_SERVER is not set — logging email instead of sending.\n` +
        `  to: ${to}\n  subject: ${subject}\n  body: ${text ?? html}`
    );
    return;
  }

  await client.sendMail({
    from: EMAIL_FROM,
    to,
    subject,
    html,
    text: text ?? html.replace(/<[^>]+>/g, ""),
    replyTo: replyTo ?? EMAIL_REPLY_TO,
    envelope: EMAIL_RETURN_PATH ? { from: EMAIL_RETURN_PATH, to } : undefined,
    messageId: `<${referenceId ?? crypto.randomUUID()}@${
      process.env.EMAIL_MESSAGE_DOMAIN?.trim() || emailFromDomain()
    }>`,
    headers: {
      "Auto-Submitted": "auto-generated",
      "X-Auto-Response-Suppress": "All",
      "X-Entity-Ref-ID": referenceId ?? crypto.randomUUID(),
    },
  });
}

export function emailAppUrl(path: string) {
  return new URL(path, APP_URL).toString();
}

export function isPublicEmailUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  } catch {
    return false;
  }
}

/**
 * Sends a one-time-passcode email for either email verification or password reset.
 *
 * Includes BOTH the raw code (for someone who already has the app open) AND a
 * direct link/button straight to the page where that code is entered (for
 * someone reading the email itself, e.g. on their phone) — otherwise the
 * code has nowhere obvious to go.
 */
export async function sendOtpEmail(
  to: string,
  otp: string,
  purpose: "verify-email" | "reset-password"
): Promise<void> {
  const isVerify = purpose === "verify-email";
  const subject = isVerify ? "Verify your CleanNest email" : "Reset your CleanNest password";
  const heading = isVerify ? "Confirm your email address" : "Reset your password";
  const body = isVerify
    ? "Use the code below to verify your email address and activate your account."
    : "Use the code below to reset your password. If you didn't request this, you can safely ignore this email.";

  const actionPath = isVerify ? "/verify-email" : "/reset-password";
  const actionUrl = `${APP_URL}${actionPath}?email=${encodeURIComponent(to)}&otp=${otp}`;
  const includeActionLink = isPublicEmailUrl(actionUrl);
  const actionLabel = isVerify ? "Verify email" : "Reset password";

  const html = `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color:#0f766e;">${heading}</h2>
      <p>${body}</p>

      ${
        includeActionLink
          ? `<div style="text-align:center; margin: 24px 0;">
        <a href="${actionUrl}"
           style="display:inline-block; background:#1E6FD9; color:#ffffff; text-decoration:none;
                  font-weight:600; padding:12px 28px; border-radius:8px;">
          ${actionLabel}
        </a>
      </div>`
          : ""
      }

      <p style="color:#666; font-size: 13px; text-align:center;">
        Or enter this code manually on the ${isVerify ? "verification" : "reset"} page:
      </p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 8px 0;">
        ${otp}
      </p>
      <p style="color:#666; font-size: 13px; text-align:center;">This code expires in 10 minutes.</p>
    </div>
  `;

  await sendEmail({
    to,
    subject,
    html,
    text:
      `${heading}\n\n` +
      (includeActionLink
        ? `Open this link to ${actionLabel.toLowerCase()}: ${actionUrl}\n\n`
        : "") +
      `Or enter this code manually: ${otp}\n` +
      `This code expires in 10 minutes.`,
  });
}
