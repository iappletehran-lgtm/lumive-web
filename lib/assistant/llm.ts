import type { ChatMessage } from "./types";

/**
 * Shared LLM caller for every Lumive assistant surface (web chat + WhatsApp).
 * Provider-agnostic over fetch (no SDK): Anthropic if ANTHROPIC_API_KEY is set,
 * else OpenAI if OPENAI_API_KEY is set, else null so callers fall back to a
 * brand-safe canned path. Throws on API error so callers can degrade gracefully.
 */
export interface LLMOptions {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
}

export function llmConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY);
}

export async function callLLM({ system, messages, maxTokens = 400 }: LLMOptions): Promise<string | null> {
  const convo = messages.filter((m) => m.role === "user" || m.role === "assistant");

  if (process.env.ANTHROPIC_API_KEY) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6",
        max_tokens: maxTokens,
        // Prompt-cache the static system prompt for cost/latency.
        system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
        messages: convo.map((m) => ({ role: m.role, content: m.content })),
      }),
    });
    if (!res.ok) throw new Error(`Anthropic ${res.status}`);
    const data = await res.json();
    return data?.content?.[0]?.text?.trim() || null;
  }

  if (process.env.OPENAI_API_KEY) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        max_tokens: maxTokens,
        messages: [{ role: "system", content: system }, ...convo],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}`);
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  }

  return null; // no key configured
}
