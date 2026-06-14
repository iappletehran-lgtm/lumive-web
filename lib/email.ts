/**
 * Transactional email via Resend. SERVER ONLY (reads RESEND_API_KEY).
 *
 * `sendEmail` is the low-level helper; the three exported senders build the
 * branded HTML for each transactional moment. Degrades safely: with no
 * RESEND_API_KEY the message is logged, not sent, so local dev needs no config.
 */
import { Resend } from "resend";
import { PAYMENT, BUSINESS_TZ, formatSlot } from "@/lib/booking";

const FROM = `${process.env.FROM_NAME || "Lumive AI"} <${process.env.FROM_EMAIL || "onboarding@resend.dev"}>`;
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://lumive-web.vercel.app";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

type SendArgs = { to: string; subject: string; html: string; text: string; replyTo?: string };

/** Low-level send. Returns delivery info; logs (does not send) when unconfigured. */
export async function sendEmail({ to, subject, html, text, replyTo }: SendArgs): Promise<{ sent: boolean; id?: string }> {
  if (!resend) {
    console.info("[email] no RESEND_API_KEY — logged, not sent:", JSON.stringify({ to, subject }));
    return { sent: false };
  }
  const { data, error } = await resend.emails.send({
    from: FROM,
    to: [to],
    subject,
    html,
    text,
    ...(replyTo ? { replyTo } : {}),
  });
  if (error) {
    throw new Error(`resend: ${error.name} — ${error.message}`);
  }
  return { sent: true, id: data?.id };
}

// ── Branded HTML building blocks ──────────────────────────────
const C = { sapphire: "#1B3F72", teal: "#1A8C6B", mist: "#E8EFF9", midnight: "#0E1C2F", steel: "#4A5568", cloud: "#CBD5E0" };

function button(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:${C.teal};color:#ffffff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;font-size:14px;">${label}</a>`;
}

function signature(): string {
  return `<p style="margin:28px 0 0;color:${C.midnight};font-size:15px;line-height:1.6;">Alireza Sharafeddin<br/><span style="color:${C.steel};font-size:13px;">Lumive AI</span></p>`;
}

/** Wrap body content in the branded email shell (table-based, mobile-friendly). */
function layout(preheader: string, body: string): string {
  return `<!doctype html>
<html lang="en">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/><meta name="color-scheme" content="light"/></head>
<body style="margin:0;padding:0;background:${C.mist};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.mist};padding:24px 12px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${C.cloud};border-radius:14px;overflow:hidden;">
        <tr><td style="background:${C.sapphire};padding:20px 28px;">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:18px;font-weight:bold;letter-spacing:.5px;color:${C.mist};">LUMIVE <span style="color:${C.teal};">AI</span></span>
        </td></tr>
        <tr><td style="padding:32px 28px;color:${C.midnight};font-size:15px;line-height:1.7;">
          ${body}
        </td></tr>
        <tr><td style="padding:18px 28px;border-top:1px solid ${C.mist};color:${C.steel};font-size:12px;line-height:1.6;">
          Lumive AI · Intelligence, made real.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

const firstNameOf = (name?: string | null) => (name || "").trim().split(/\s+/)[0] || "there";

// ── ① Booking confirmation ────────────────────────────────────
export async function sendBookingConfirmation(args: {
  email: string;
  name?: string | null;
  selectedSlot?: string | null;
  bookingLink?: string | null;
}): Promise<{ sent: boolean; id?: string }> {
  const first = firstNameOf(args.name);
  const when = args.selectedSlot ? formatSlot(args.selectedSlot, BUSINESS_TZ) : null;
  const price = `$${PAYMENT.priceUsd} ${PAYMENT.currency}`;

  const body = `
    <p style="margin:0 0 16px;">Hi ${first},</p>
    <p style="margin:0 0 16px;">Your payment of <strong>${price}</strong> has been confirmed.</p>
    ${when ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 16px;background:${C.mist};border-radius:10px;"><tr><td style="padding:14px 18px;"><span style="display:block;font-size:11px;letter-spacing:1px;text-transform:uppercase;color:${C.teal};font-weight:600;">Your session</span><span style="display:block;margin-top:4px;font-size:16px;font-weight:600;color:${C.sapphire};">${when}</span><span style="display:block;margin-top:2px;font-size:12px;color:${C.steel};">Istanbul time — your calendar invite shows your local time.</span></td></tr></table>` : ""}
    ${args.bookingLink ? `<p style="margin:0 0 24px;">${button(args.bookingLink, "Join your call")}</p>` : ""}
    <p style="margin:0;">We look forward to speaking with you.</p>
    ${signature()}`;

  const text =
    `Hi ${first},\n\n` +
    `Your payment of ${price} has been confirmed.\n\n` +
    (when ? `Your session: ${when} (Istanbul time — your calendar invite shows your local time).\n\n` : "") +
    (args.bookingLink ? `Join your call: ${args.bookingLink}\n\n` : "") +
    `We look forward to speaking with you.\n\n` +
    `Alireza Sharafeddin\nLumive AI`;

  return sendEmail({
    to: args.email,
    subject: "Your strategy call is confirmed — Lumive AI",
    html: layout("Your strategy call is confirmed.", body),
    text,
  });
}

// ── ② Prospect welcome ────────────────────────────────────────
export async function sendProspectWelcome(args: { email: string; name?: string | null }): Promise<{ sent: boolean; id?: string }> {
  const first = firstNameOf(args.name);
  const body = `
    <p style="margin:0 0 16px;">Hi ${first},</p>
    <p style="margin:0 0 16px;">Thank you for joining Lumive AI.</p>
    <p style="margin:0 0 16px;">Your account is under review.</p>
    <p style="margin:0;">We will be in touch within 24 hours.</p>
    ${signature()}`;
  const text =
    `Hi ${first},\n\n` +
    `Thank you for joining Lumive AI.\n\n` +
    `Your account is under review.\n\n` +
    `We will be in touch within 24 hours.\n\n` +
    `Alireza Sharafeddin\nLumive AI`;

  return sendEmail({
    to: args.email,
    subject: "Welcome to Lumive AI",
    html: layout("Your account is under review.", body),
    text,
  });
}

// ── ③ Client promotion ────────────────────────────────────────
export async function sendClientPromotion(args: { email: string; name?: string | null }): Promise<{ sent: boolean; id?: string }> {
  const first = firstNameOf(args.name);
  const dashboard = `${SITE.replace(/\/$/, "")}/dashboard`;
  const body = `
    <p style="margin:0 0 16px;">Hi ${first},</p>
    <p style="margin:0 0 16px;">Your account has been approved.</p>
    <p style="margin:0 0 24px;">You can now access your dashboard.</p>
    <p style="margin:0 0 24px;">${button(dashboard, "Open your dashboard")}</p>
    ${signature()}`;
  const text =
    `Hi ${first},\n\n` +
    `Your account has been approved.\n\n` +
    `You can now access your dashboard: ${dashboard}\n\n` +
    `Alireza Sharafeddin\nLumive AI`;

  return sendEmail({
    to: args.email,
    subject: "Your Lumive AI account is ready",
    html: layout("Your account has been approved.", body),
    text,
  });
}
