import { NextRequest, NextResponse } from "next/server";
import { sendProspectWelcome } from "@/lib/email";

export const runtime = "nodejs";

/**
 * Fires the prospect welcome email after a new user registers. The actual
 * sign-up happens client-side via Supabase; the register page calls this once
 * sign-up succeeds. Kept side-effect-only (no auth) so it can never block the
 * registration UX — failures are logged and swallowed.
 */
export async function POST(req: NextRequest) {
  let body: { full_name?: string; email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const email = (body.email ?? "").trim();
  const name = (body.full_name ?? "").trim();
  if (!email) return NextResponse.json({ ok: false, error: "Missing email." }, { status: 400 });

  try {
    await sendProspectWelcome({ email, name });
  } catch (err) {
    console.error("[auth/register] welcome email failed:", (err as Error).message);
  }

  return NextResponse.json({ ok: true });
}
