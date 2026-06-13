import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PaymentStatus } from "@/lib/booking";
import { getPaymentStatus, mapStatus } from "@/lib/nowpayments";
import { syncPaymentStatus } from "@/lib/booking-store";

export const runtime = "nodejs";

/**
 * Live status for the /book payment step. Reads the invoice from NOWPayments and
 * returns the mapped status; it also syncs that status to the booking row (and
 * sends the confirmation email on first confirm) so the system works even before
 * the IPN webhook is registered. Falls back to the stored status if NOWPayments
 * can't be reached (e.g. the static-wallet fallback path).
 */
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ ok: false, error: "Missing payment id." }, { status: 400 });
  }

  const np = await getPaymentStatus(id);

  if (np?.payment_status) {
    const status = mapStatus(np.payment_status);
    await syncPaymentStatus(id, status); // best-effort DB sync + email-on-confirm
    return NextResponse.json({ ok: true, payment_status: status });
  }

  // No NOWPayments record (fallback id, or lookup failed) — use the stored status.
  let status: PaymentStatus = "waiting";
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("bookings")
      .select("payment_status")
      .eq("payment_id", id)
      .maybeSingle();
    if (data?.payment_status) status = data.payment_status as PaymentStatus;
  } catch (err) {
    console.error("[payment-status] lookup failed:", (err as Error).message);
  }

  return NextResponse.json({ ok: true, payment_status: status });
}
