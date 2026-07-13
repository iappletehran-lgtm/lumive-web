/**
 * Long-term memory for Lumi — conversation summaries persisted per session and
 * injected back into future requests. SERVER ONLY (OpenRouter key + service role).
 *
 * generateMemory() summarises a conversation via the same OpenRouter model Lumi
 * uses; saveMemory()/fetchMemory() upsert/read the memories table (keyed on
 * session_id). Everything is best-effort and never throws into the chat path.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import { LUMI_MODEL, type LumiMessage } from "@/lib/assistant/lumi";

export type Memory = { summary: string; key_facts: Record<string, unknown> };

const EXTRACT_PROMPT =
  "Extract key facts from this conversation in 3-5 bullet points. Include: industry, " +
  "company size, problems mentioned, interest level, and any personal details shared.\n" +
  "Return as JSON: { summary: string, key_facts: object }\n" +
  "Return ONLY the JSON object — no prose, no code fences.";

function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

/** Parse the model's reply into a Memory, tolerating code fences / surrounding prose. */
function parseMemory(text: string): Memory | null {
  try {
    let t = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) t = t.slice(start, end + 1);
    const obj = JSON.parse(t) as { summary?: unknown; key_facts?: unknown };
    const summary = typeof obj.summary === "string" ? obj.summary.trim() : "";
    const key_facts =
      obj.key_facts && typeof obj.key_facts === "object" ? (obj.key_facts as Record<string, unknown>) : {};
    if (!summary && Object.keys(key_facts).length === 0) return null;
    return { summary: summary.slice(0, 4000), key_facts };
  } catch {
    return null;
  }
}

/**
 * ① Summarise a conversation into { summary, key_facts } via OpenRouter (same key
 * and model as Lumi). Returns null on any failure or missing key.
 */
export async function generateMemory(messages: LumiMessage[], language: "en" | "fa"): Promise<Memory | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key || messages.length === 0) return null;

  const transcript = messages
    .map((m) => `${m.role === "user" ? "Visitor" : "Lumi"}: ${m.content}`)
    .join("\n");
  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://lumive-web.vercel.app";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        "HTTP-Referer": site,
        "X-Title": "Lumive AI Memory",
      },
      body: JSON.stringify({
        model: LUMI_MODEL,
        messages: [
          { role: "system", content: EXTRACT_PROMPT },
          { role: "user", content: `Language: ${language}\n\nConversation:\n${transcript}` },
        ],
        temperature: 0.2,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn("[memory] OpenRouter", res.status);
      return null;
    }
    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content;
    return typeof text === "string" ? parseMemory(text) : null;
  } catch (err) {
    console.warn("[memory] generate failed:", (err as Error).message);
    return null;
  }
}

/** ② Upsert a memory for a session (atomic on session_id via memories_session_idx). */
export async function saveMemory(
  sessionId: string,
  userId: string | null,
  memory: Memory,
  language: "en" | "fa"
): Promise<void> {
  if (!sessionId || !hasSupabaseEnv()) return;
  try {
    const admin = createAdminClient();
    const { error } = await admin.from("memories").upsert(
      {
        session_id: sessionId,
        user_id: userId,
        summary: memory.summary,
        key_facts: memory.key_facts,
        language,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "session_id" }
    );
    if (error) throw error;
  } catch (err) {
    console.error("[memory] save failed:", (err as Error).message);
  }
}

/** Read a stored memory for a session, or null. Never throws. */
export async function fetchMemory(
  sessionId: string
): Promise<{ summary: string; key_facts: Record<string, unknown>; language: string } | null> {
  if (!sessionId || !hasSupabaseEnv()) return null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("memories")
      .select("summary, key_facts, language")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (!data || !data.summary) return null;
    return {
      summary: data.summary as string,
      key_facts:
        data.key_facts && typeof data.key_facts === "object"
          ? (data.key_facts as Record<string, unknown>)
          : {},
      language: (data.language as string) || "en",
    };
  } catch {
    return null;
  }
}

/** Build the system-prompt block injected for a returning visitor. */
export function memoryContextBlock(
  summary: string,
  keyFacts: Record<string, unknown>,
  lang: "en" | "fa"
): string {
  const facts = JSON.stringify(keyFacts ?? {});
  return lang === "fa"
    ? `زمینه بازدیدکننده قبلی:\n${summary}\nاطلاعات کلیدی: ${facts}\nاز این اطلاعات برای شخصی‌سازی پاسخ استفاده کن.\nمگر اینکه خودشان اشاره کنند، نگو که یادت هست.`
    : `RETURNING VISITOR CONTEXT:\n${summary}\nKey facts: ${facts}\nUse this context to personalize your response.\nDo not mention that you have memory of them unless they bring it up.`;
}

/** generate + save in one step (used inside waitUntil by the routes). */
export async function generateAndSaveMemory(params: {
  sessionId: string;
  userId: string | null;
  messages: LumiMessage[];
  language: "en" | "fa";
}): Promise<void> {
  const mem = await generateMemory(params.messages, params.language);
  if (mem) await saveMemory(params.sessionId, params.userId, mem, params.language);
}
