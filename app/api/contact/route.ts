import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Contact-form lead capture. Validates, then forwards the lead through the first
 * configured channel, falling back to a server log so a lead is never lost:
 *   1. LEAD_WEBHOOK_URL          → POST JSON (Zapier / Make / CRM intake)
 *   2. RESEND_API_KEY + LEAD_TO_EMAIL → email the team (reply-to = the lead)
 *   3. neither set               → structured server log (visible in platform logs)
 *
 * Booking stays on Cal.com; this is the "send a message" path, kept separate.
 */

interface LeadBody {
  name?: string;
  email?: string;
  company?: string;
  message?: string;
  website?: string; // honeypot — real users never fill this
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  let body: LeadBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot: silently accept (so bots think they succeeded) but drop.
  if (body.website) return NextResponse.json({ ok: true });

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const company = (body.company ?? "").trim();
  const message = (body.message ?? "").trim();

  if (!name || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please add your name and a valid email." },
      { status: 422 }
    );
  }

  const lead = { name, email, company, message, source: "contact_form", at: new Date().toISOString() };

  let forwarded = false;
  try {
    forwarded = await forwardLead(lead);
  } catch (err) {
    console.error("[contact] forward failed:", (err as Error).message);
  }

  // Always keep a record (the lead is the deliverable here).
  console.info("[contact] lead", JSON.stringify({ ...lead, forwarded }));

  return NextResponse.json({ ok: true });
}

async function forwardLead(lead: Record<string, string>): Promise<boolean> {
  if (process.env.LEAD_WEBHOOK_URL) {
    const r = await fetch(process.env.LEAD_WEBHOOK_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(lead),
    });
    if (!r.ok) throw new Error(`webhook ${r.status}`);
    return true;
  }

  if (process.env.RESEND_API_KEY && process.env.LEAD_TO_EMAIL) {
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.LEAD_FROM_EMAIL || "Lumive AI <onboarding@resend.dev>",
        to: [process.env.LEAD_TO_EMAIL],
        reply_to: lead.email,
        subject: `New enquiry — ${lead.name}${lead.company ? ` (${lead.company})` : ""}`,
        text: `Name: ${lead.name}\nEmail: ${lead.email}\nCompany: ${lead.company || "—"}\n\n${lead.message || "(no message)"}`,
      }),
    });
    if (!r.ok) throw new Error(`resend ${r.status}`);
    return true;
  }

  return false; // logged only
}
