import { NextRequest, NextResponse } from "next/server";
import { runEngine } from "@/lib/assistant/engine";
import { buildSystemPrompt } from "@/lib/assistant/knowledge";
import { callLLM } from "@/lib/assistant/llm";
import type { ChatMessage, Lead, ChatResponse } from "@/lib/assistant/types";

export const runtime = "nodejs";

/**
 * Chat endpoint.
 * - Always runs the local engine to keep lead state, quick replies, and the
 *   booking CTA consistent and brand-safe.
 * - If an LLM key is configured, replaces the reply text with the model output
 *   (same system prompt / knowledge base). Any failure falls back to the engine.
 * - CRM + analytics are hooked but no-op until configured.
 */
export async function POST(req: NextRequest) {
  let body: { messages?: ChatMessage[]; lead?: Lead };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = (body.messages ?? []).slice(-20); // simple context window
  const lead = body.lead ?? {};

  // Engine result is the brand-safe baseline (lead, quickReplies, showBooking).
  const base = runEngine(messages, lead);

  // Try the LLM upgrade path if a key is present.
  let result: ChatResponse = base;
  try {
    const llmText = await tryLLM(messages);
    if (llmText) {
      result = { ...base, messages: [llmText], source: "llm" };
    }
  } catch (err) {
    // Stay on the engine fallback; log for observability.
    console.warn("[chat] LLM path failed, using engine:", (err as Error).message);
  }

  // Fire-and-forget side effects (no-ops until configured).
  void captureLeadToCRM(result.lead, messages);
  void trackAnalytics(result);

  return NextResponse.json(result);
}

/** LLM upgrade path — shared caller, same knowledge base. Null → engine. */
async function tryLLM(messages: ChatMessage[]): Promise<string | null> {
  return callLLM({ system: buildSystemPrompt(), messages });
}

/** TODO: write the lead to HubSpot/Pipedrive. No-op until configured. */
async function captureLeadToCRM(lead: Lead, _messages: ChatMessage[]): Promise<void> {
  if (!process.env.CRM_API_KEY) return;
  // Example shape for the future integration:
  // await fetch(process.env.CRM_WEBHOOK_URL!, { method: "POST", body: JSON.stringify({ lead }) });
}

/** TODO: emit a server-side analytics event (chat -> conversion funnel). */
async function trackAnalytics(_result: ChatResponse): Promise<void> {
  // e.g. Plausible/GA4 server event: assistant_reply, assistant_lead_captured
}
