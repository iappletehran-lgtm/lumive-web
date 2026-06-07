import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "node:crypto";
import { WA } from "@/lib/whatsapp/config";
import { sendWhatsAppText, maskPhone } from "@/lib/whatsapp/client";
import {
  getConversation,
  pushMessage,
  alreadyProcessed,
  logEvent,
} from "@/lib/whatsapp/store";
import { generateReply, scoreLead } from "@/lib/whatsapp/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * WhatsApp Cloud API webhook.
 *  GET  → Meta verification handshake (hub.challenge).
 *  POST → incoming messages → AI agent → reply, with retry-dedupe + signature
 *         verification. Status callbacks (delivered/read) are acknowledged and
 *         ignored. Always returns 200 so Meta does not retry-storm.
 */

// ── Verification handshake ───────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams;
  const mode = p.get("hub.mode");
  const token = p.get("hub.verify_token");
  const challenge = p.get("hub.challenge");

  if (mode === "subscribe" && token && WA.verifyToken && token === WA.verifyToken) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return new NextResponse("Forbidden", { status: 403 });
}

// ── Incoming messages ────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const raw = await req.text();

  if (!verifySignature(raw, req.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  let payload: WebhookPayload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return new NextResponse("Bad JSON", { status: 400 });
  }

  try {
    await handlePayload(payload);
  } catch (err) {
    // Never 500 to Meta — dedupe protects us, and retries would duplicate replies.
    console.error("[whatsapp] handler error:", (err as Error).message);
  }
  return NextResponse.json({ received: true });
}

async function handlePayload(payload: WebhookPayload) {
  const messages: IncomingMessage[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const msg of change.value?.messages ?? []) {
        if (msg.type === "text" && msg.text?.body) {
          messages.push({ from: msg.from, id: msg.id, body: msg.text.body });
        }
      }
      // change.value.statuses (delivered/read) are intentionally ignored.
    }
  }

  for (const m of messages) {
    if (alreadyProcessed(m.id)) continue;

    const conv = getConversation(m.from);
    conv.turns += 1;
    pushMessage(conv, "user", m.body);

    conv.status = scoreLead(conv);
    logEvent(conv, "inbound", { phone: maskPhone(m.from) });

    const reply = await generateReply(conv);
    pushMessage(conv, "assistant", reply);

    try {
      await sendWhatsAppText(m.from, reply);
      logEvent(conv, "reply_sent");
    } catch (err) {
      logEvent(conv, "reply_failed", { error: (err as Error).message });
    }
  }
}

// ── Meta payload signature (X-Hub-Signature-256 = sha256 HMAC of raw body) ──
function verifySignature(raw: string, header: string | null): boolean {
  if (!WA.appSecret) {
    // No secret configured (local/dev): allow but warn. Set WHATSAPP_APP_SECRET in prod.
    console.warn("[whatsapp] WHATSAPP_APP_SECRET not set — skipping signature check");
    return true;
  }
  if (!header?.startsWith("sha256=")) return false;
  const expected = "sha256=" + createHmac("sha256", WA.appSecret).update(raw).digest("hex");
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

// ── Minimal types for the Cloud API payload we consume ──
interface WebhookPayload {
  entry?: {
    changes?: {
      value?: {
        messages?: {
          from: string;
          id: string;
          type: string;
          text?: { body: string };
        }[];
      };
    }[];
  }[];
}
interface IncomingMessage {
  from: string;
  id: string;
  body: string;
}
