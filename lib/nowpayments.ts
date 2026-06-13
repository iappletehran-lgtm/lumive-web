/**
 * NOWPayments API wrapper. SERVER ONLY (reads NOWPAYMENTS_API_KEY /
 * NOWPAYMENTS_IPN_SECRET). Covers the three things the app needs: create an
 * invoice, read an invoice's status, and verify the IPN webhook signature.
 *
 * Docs: https://documenter.getpostman.com/view/7907941/S1a32n38
 */
import crypto from "crypto";
import type { PaymentStatus } from "./booking";

const API_BASE = "https://api.nowpayments.io/v1";

export type NowPayment = {
  payment_id: string | number;
  payment_status: string;
  pay_address: string;
  pay_amount: number;
  pay_currency: string;
  price_amount?: number;
  price_currency?: string;
};

/**
 * Map a NOWPayments status to our 4-state model. NOWPayments flows
 * waiting → confirming → confirmed → sending → finished; we treat anything from
 * "confirmed" onward as paid, and refunded/expired/failed as failed.
 */
export function mapStatus(np: string | undefined | null): PaymentStatus {
  const s = String(np || "").toLowerCase();
  if (["finished", "confirmed", "sending"].includes(s)) return "confirmed";
  if (["confirming", "partially_paid"].includes(s)) return "confirming";
  if (["failed", "refunded", "expired"].includes(s)) return "failed";
  return "waiting";
}

/**
 * Create a USDT-TRC20 invoice for a USD price. Returns the NOWPayments payment
 * (with pay_address / pay_amount / payment_id), or null if no API key is set so
 * callers can fall back to the static wallet. Throws on a real API error.
 */
export async function createPayment(opts: {
  priceUsd: number;
  payCurrency: string;
  orderId: string;
  orderDescription: string;
  ipnCallbackUrl?: string;
}): Promise<NowPayment | null> {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) return null;

  const res = await fetch(`${API_BASE}/payment`, {
    method: "POST",
    headers: { "x-api-key": key, "content-type": "application/json" },
    body: JSON.stringify({
      price_amount: opts.priceUsd,
      price_currency: "usd",
      pay_currency: opts.payCurrency,
      order_id: opts.orderId,
      order_description: opts.orderDescription,
      ...(opts.ipnCallbackUrl ? { ipn_callback_url: opts.ipnCallbackUrl } : {}),
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`NOWPayments create ${res.status}: ${detail}`);
  }
  return (await res.json()) as NowPayment;
}

/** Read an invoice's current status. Null if no key or the lookup fails. */
export async function getPaymentStatus(paymentId: string): Promise<NowPayment | null> {
  const key = process.env.NOWPAYMENTS_API_KEY;
  if (!key) return null;

  const res = await fetch(`${API_BASE}/payment/${encodeURIComponent(paymentId)}`, {
    headers: { "x-api-key": key },
    cache: "no-store",
  });
  if (!res.ok) return null;
  return (await res.json()) as NowPayment;
}

/** Recursively key-sort an object — NOWPayments signs the sorted JSON. */
function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = sortKeys((value as Record<string, unknown>)[k]);
        return acc;
      }, {});
  }
  return value;
}

/**
 * Verify an IPN callback. NOWPayments sends x-nowpayments-sig = HMAC-SHA512 of
 * the key-sorted JSON body, signed with NOWPAYMENTS_IPN_SECRET. Constant-time
 * comparison; returns false if the secret or signature is missing.
 */
export function verifyIpnSignature(body: unknown, signature: string | null): boolean {
  const secret = process.env.NOWPAYMENTS_IPN_SECRET;
  if (!secret || !signature) return false;

  const digest = crypto
    .createHmac("sha512", secret)
    .update(JSON.stringify(sortKeys(body)))
    .digest("hex");

  try {
    const a = Buffer.from(digest, "utf8");
    const b = Buffer.from(signature, "utf8");
    return a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
