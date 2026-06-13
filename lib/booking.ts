/**
 * Booking/payment configuration for the $50 USDT consultation (the /book flow).
 * Single source of truth for price, network, and copy. Payment itself is run
 * through NOWPayments (see lib/nowpayments.ts) — the deposit address shown to the
 * payer comes from NOWPayments per-invoice; `wallet` here is only a fallback used
 * if NOWPayments is unreachable.
 */
export type PaymentStatus = "waiting" | "confirming" | "confirmed" | "failed";

export const PAYMENT = {
  /** USD price; the NOWPayments invoice is created in USD and paid in USDT. */
  priceUsd: Number(process.env.CONSULTATION_PRICE_USD || 50),
  currency: "USDT",
  network: "TRC20",
  /** NOWPayments currency code for USDT on the TRON (TRC20) network. */
  payCurrency: "usdttrc20",
  offer: "90-minute AI implementation consultation",
  /** Fallback receive address — used only when NOWPayments cannot be reached. */
  wallet: process.env.NEXT_PUBLIC_WALLET_ADDRESS || "TU6i7jUGaVQAM7ifBf6tfHwe4Q2QfQRebj",
} as const;

/** Human label for each payment status, used by the live indicator and admin. */
export const STATUS_LABEL: Record<PaymentStatus, string> = {
  waiting: "Waiting for payment",
  confirming: "Confirming on-chain",
  confirmed: "Confirmed",
  failed: "Payment failed",
};
