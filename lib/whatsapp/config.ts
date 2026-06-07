/**
 * WhatsApp Cloud API configuration (Meta / Graph API). All values come from env
 * so no secrets live in the repo. The agent runs in a degraded-but-safe mode
 * until these are set (see lib/whatsapp/agent.ts fallback).
 *
 * Required to go live:
 *   WHATSAPP_VERIFY_TOKEN     – arbitrary string you also enter in the Meta webhook UI
 *   WHATSAPP_TOKEN            – permanent access token for the WhatsApp Business app
 *   WHATSAPP_PHONE_NUMBER_ID  – the Cloud API phone number id (not the phone number)
 *   WHATSAPP_APP_SECRET       – Meta app secret, for X-Hub-Signature-256 verification
 * Optional:
 *   WHATSAPP_GRAPH_VERSION    – defaults to v21.0
 *   BOOKING_URL               – scheduling link the agent shares with hot leads
 *   ANTHROPIC_API_KEY / OPENAI_API_KEY – the LLM brain (shared with web chat)
 */
export const WA = {
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || "",
  token: process.env.WHATSAPP_TOKEN || "",
  phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || "",
  appSecret: process.env.WHATSAPP_APP_SECRET || "",
  graphVersion: process.env.WHATSAPP_GRAPH_VERSION || "v21.0",
  bookingUrl: process.env.BOOKING_URL || "https://lumive.ai/#book",
} as const;

/** True when we can actually send replies via the Cloud API. */
export function waConfigured(): boolean {
  return Boolean(WA.token && WA.phoneNumberId);
}
