import { NextRequest, NextResponse } from "next/server";
import { callLumi, type LumiMessage } from "@/lib/assistant/lumi";

export const runtime = "nodejs";

/**
 * Lumi chat endpoint. Receives the conversation history and returns Lumi's next
 * reply from OpenRouter (system prompt applied server-side). Degrades to a
 * brand-safe fallback when OpenRouter is unavailable, so the widget never breaks.
 */
export async function POST(req: NextRequest) {
  let body: { messages?: LumiMessage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Keep only valid turns, cap the context window.
  const messages: LumiMessage[] = (body.messages ?? [])
    .filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content }))
    .slice(-20);

  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages." }, { status: 400 });
  }

  const reply = await callLumi(messages);

  if (!reply) {
    return NextResponse.json({
      reply:
        "I'm having trouble responding right now. You can book a 30-minute strategy call at /book and the team will help directly.",
    });
  }

  return NextResponse.json({ reply });
}
