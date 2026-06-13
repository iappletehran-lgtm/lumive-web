import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import QRCode from "qrcode";
import { createAdminClient } from "@/lib/supabase/admin";
import { PAYMENT, type PaymentStatus } from "@/lib/booking";
import { createPayment, mapStatus } from "@/lib/nowpayments";

export const runtime = "nodejs";

interface Body {
  full_name?: string;
  email?: string;
  preferred_times?: string;
  website?: string; // honeypot
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Public base URL so NOWPayments can call our IPN webhook (set in production). */
function ipnCallbackUrl(): string | undefined {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return base ? `${base.replace(/\/$/, "")}/api/webhook/nowpayments` : undefined;
}

/**
 * Opens a NOWPayments USDT-TRC20 invoice for the consultation, records the
 * booking (status 'waiting') via the service-role client, and returns the
 * pay address / amount / a QR data-URL for the payment step. If NOWPayments is
 * unreachable it degrades to the static wallet so the payer is never blocked.
 */
export async function POST(req: NextRequest) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  // Honeypot — pretend success, drop silently.
  if (body.website) return NextResponse.json({ ok: true });

  const full_name = (body.full_name ?? "").trim();
  const email = (body.email ?? "").trim();
  const preferred_times = (body.preferred_times ?? "").trim();

  if (!full_name || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Please add your name and a valid email." },
      { status: 422 }
    );
  }

  const orderId = crypto.randomUUID();

  // 1) Open the invoice (or fall back to the static wallet).
  let payment: {
    payment_id: string;
    pay_address: string;
    pay_amount: number | string;
    pay_currency: string;
    payment_status: PaymentStatus;
  };
  try {
    const np = await createPayment({
      priceUsd: PAYMENT.priceUsd,
      payCurrency: PAYMENT.payCurrency,
      orderId,
      orderDescription: `Lumive AI — ${PAYMENT.offer}`,
      ipnCallbackUrl: ipnCallbackUrl(),
    });
    if (np) {
      payment = {
        payment_id: String(np.payment_id),
        pay_address: np.pay_address,
        pay_amount: np.pay_amount,
        pay_currency: np.pay_currency,
        payment_status: mapStatus(np.payment_status),
      };
    } else {
      throw new Error("no api key");
    }
  } catch (err) {
    console.warn("[create-payment] NOWPayments unavailable, using fallback wallet:", (err as Error).message);
    payment = {
      payment_id: `manual_${orderId}`,
      pay_address: PAYMENT.wallet,
      pay_amount: PAYMENT.priceUsd, // USDT ≈ USD 1:1
      pay_currency: "usdttrc20",
      payment_status: "waiting",
    };
  }

  // 2) Record the booking. Non-fatal: a DB hiccup must not block a paying user;
  // the webhook/poll reconcile by payment_id, and we log loudly if it fails.
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("bookings").insert({
      full_name,
      email,
      preferred_times,
      payment_id: payment.payment_id,
      payment_status: payment.payment_status,
    });
    if (error) console.error("[create-payment] booking insert failed:", error.message);
  } catch (err) {
    console.error("[create-payment] booking insert threw:", (err as Error).message);
  }

  // 3) QR of the deposit address — Midnight on white for reliable scanning.
  const qr = await QRCode.toDataURL(payment.pay_address, {
    margin: 1,
    width: 320,
    color: { dark: "#0E1C2F", light: "#FFFFFF" },
  });

  return NextResponse.json({
    ok: true,
    payment: {
      ...payment,
      qr,
      network: PAYMENT.network,
      amount_usd: String(PAYMENT.priceUsd),
    },
  });
}
