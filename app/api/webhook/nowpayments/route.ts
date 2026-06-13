import { NextRequest, NextResponse } from "next/server";
import { mapStatus, verifyIpnSignature } from "@/lib/nowpayments";
import { syncPaymentStatus } from "@/lib/booking-store";

export const runtime = "nodejs";

/**
 * NOWPayments IPN (Instant Payment Notification) webhook.
 *
 * NOTE: only reachable once deployed to a public URL registered with NOWPayments
 * (dashboard IPN settings or the ipn_callback_url we pass on create). Verifies
 * the x-nowpayments-sig HMAC before trusting anything, then advances the booking.
 * On 'confirmed'/'finished' the syncPaymentStatus call updates the row and emails
 * the Cal.com booking link exactly once.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-nowpayments-sig");

  // Need the parsed body for the (sorted-JSON) signature check.
  const raw = await req.text();
  let body: { payment_id?: string | number; payment_status?: string };
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  if (!verifyIpnSignature(body, signature)) {
    console.warn("[webhook/nowpayments] rejected: bad or missing signature");
    return NextResponse.json({ ok: false, error: "Invalid signature." }, { status: 401 });
  }

  const paymentId = String(body.payment_id ?? "");
  const status = mapStatus(body.payment_status);

  if (paymentId) {
    await syncPaymentStatus(paymentId, status);
    console.info(`[webhook/nowpayments] ${paymentId} → ${body.payment_status} (${status})`);
  }

  // Always 200 on a verified call so NOWPayments stops retrying.
  return NextResponse.json({ ok: true });
}
