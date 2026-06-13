/**
 * Minimal transactional email sender. Uses Resend when RESEND_API_KEY is set;
 * otherwise logs the message server-side so nothing is silently lost and local
 * dev works with zero config (matching the rest of the app's "degrade, don't
 * fail" posture). SERVER ONLY.
 */
type SendArgs = {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
};

export async function sendEmail({ to, subject, text, replyTo }: SendArgs): Promise<{ sent: boolean }> {
  if (process.env.RESEND_API_KEY) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || "Lumive AI <onboarding@resend.dev>",
        to: [to],
        ...(replyTo ? { reply_to: replyTo } : {}),
        subject,
        text,
      }),
    });
    if (!r.ok) throw new Error(`resend ${r.status} ${await r.text()}`);
    return { sent: true };
  }

  console.info(
    "[email] no RESEND_API_KEY — logged, not sent:",
    JSON.stringify({ to, subject, text })
  );
  return { sent: false };
}
