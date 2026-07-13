import { NextRequest, NextResponse } from "next/server";
import { waitUntil } from "@vercel/functions";
import { callLumi, type LumiMessage } from "@/lib/assistant/lumi";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  LEAD_ASK,
  captureLead,
  conversationSummary,
  detectBookingSignal,
  extractLead,
  lastAssistantWasLeadAsk,
  leadAlreadyAsked,
} from "@/lib/assistant/leads";
import { fetchMemory, generateAndSaveMemory, memoryContextBlock } from "@/lib/assistant/memory";

export const runtime = "nodejs";

const FALLBACK_REPLY =
  "I'm having trouble responding right now. You can book a 30-minute strategy call at /book and the team will help directly.";

/**
 * Lumi chat endpoint. Receives the conversation history and returns Lumi's next
 * reply from OpenRouter (system prompt applied server-side). Degrades to a
 * brand-safe fallback when OpenRouter is unavailable, so the widget never breaks.
 *
 * Conversations are logged to chat_logs (service-role) as a side effect — fired
 * and forgotten so it never adds latency to, or breaks, the chat response.
 */
export async function POST(req: NextRequest) {
  let body: { messages?: LumiMessage[]; lang?: string; session_id?: string };
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

  const language: "en" | "fa" = body.lang === "fa" ? "fa" : "en";
  const sessionId = typeof body.session_id === "string" ? body.session_id : "";

  const userText = messages[messages.length - 1]?.content || "";
  const userMsgCount = messages.filter((m) => m.role === "user").length;

  // Returning-visitor memory — fetched before generating the reply so it can shape
  // the response. Best-effort: if it fails, we continue without it silently.
  let memoryContext: string | undefined;
  try {
    const mem = await fetchMemory(sessionId);
    if (mem) memoryContext = memoryContextBlock(mem.summary, mem.key_facts, language);
  } catch {
    /* no memory — proceed normally */
  }

  let replyText: string;
  let leadCaptured = false;
  if (lastAssistantWasLeadAsk(messages)) {
    // This message is the visitor's response to our lead-ask — capture it.
    const lead = extractLead(userText);
    if (lead.email || lead.phone) {
      leadCaptured = true;
      waitUntil(
        captureLead({
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          source: "chat",
          language,
          message: conversationSummary(messages),
        })
      );
    }
    replyText = (await callLumi(messages, language === "fa" ? "fa" : undefined, memoryContext)) || FALLBACK_REPLY;
  } else {
    replyText = (await callLumi(messages, language === "fa" ? "fa" : undefined, memoryContext)) || FALLBACK_REPLY;
    // Natural lead-ask on a booking signal, at most once per conversation.
    if (detectBookingSignal(userText, replyText, userMsgCount) && !leadAlreadyAsked(messages)) {
      replyText = `${replyText}\n\n${LEAD_ASK[language]}`;
    }
  }

  const fullMessages: LumiMessage[] = [...messages, { role: "assistant", content: replyText }];

  // Best-effort conversation log — never blocks the response. waitUntil keeps the
  // function alive until the write finishes (so it isn't cut off when the serverless
  // function freezes after responding), without delaying the reply to the client.
  waitUntil(logConversation({ sessionId, language, messages: fullMessages }));

  // Long-term memory (async, never blocks): summarise at 5 messages, on a lead
  // capture, and again every 10 messages.
  const total = fullMessages.length;
  if (sessionId && (total === 5 || leadCaptured || (total >= 10 && total % 10 === 0))) {
    waitUntil(persistMemory(sessionId, fullMessages, language));
  }

  return NextResponse.json({ reply: replyText });
}

/**
 * Resolve the visitor's user id (cookie-based, null when anonymous) then generate
 * and save the conversation memory. createClient() runs synchronously at the start
 * (inside the request scope) so the auth cookie is captured before the response.
 */
async function persistMemory(sessionId: string, messages: LumiMessage[], language: "en" | "fa") {
  let userId: string | null = null;
  try {
    const { data } = await createClient().auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    /* anonymous */
  }
  await generateAndSaveMemory({ sessionId, userId, messages, language });
}

/**
 * Upsert the full conversation into chat_logs, keyed on session_id. Relies on the
 * UNIQUE index chat_logs_session_key (session_id) for an atomic native upsert —
 * no select-then-write race. created_at is omitted so it is preserved on update.
 * Entirely best-effort: silently no-ops when Supabase env vars are absent, and
 * swallows any error.
 */
async function logConversation(params: {
  sessionId: string;
  language: "en" | "fa";
  messages: LumiMessage[];
}) {
  const { sessionId, language, messages } = params;
  if (!sessionId) return;
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  // Resolve the visitor's user id from the auth cookie (null when anonymous).
  let userId: string | null = null;
  try {
    const { data } = await createClient().auth.getUser();
    userId = data.user?.id ?? null;
  } catch {
    /* anonymous visitor — leave userId null */
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin
      .from("chat_logs")
      .upsert(
        { session_id: sessionId, language, user_id: userId, messages, updated_at: new Date().toISOString() },
        { onConflict: "session_id" }
      );
    if (error) throw error;
  } catch (err) {
    console.error("[chat] conversation log failed:", (err as Error).message);
  }
}
