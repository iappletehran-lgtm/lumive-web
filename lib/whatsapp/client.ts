import { WA, waConfigured } from "./config";

/**
 * Send a plain-text WhatsApp message via the Meta Cloud API.
 * No-op (logged) when credentials are not configured, so local/dev runs and the
 * webhook smoke-test never crash.
 */
export async function sendWhatsAppText(to: string, body: string): Promise<void> {
  if (!waConfigured()) {
    console.warn("[whatsapp] not configured — would send:", { to: maskPhone(to), body });
    return;
  }
  const url = `https://graph.facebook.com/${WA.graphVersion}/${WA.phoneNumberId}/messages`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      authorization: `Bearer ${WA.token}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "text",
      text: { body, preview_url: true },
    }),
  });
  if (!res.ok) {
    throw new Error(`WhatsApp send failed ${res.status}: ${await res.text()}`);
  }
}

/** Mask a phone number for logs (keep country-ish prefix + last 2). */
export function maskPhone(phone: string): string {
  if (phone.length < 6) return "***";
  return `${phone.slice(0, 3)}***${phone.slice(-2)}`;
}
