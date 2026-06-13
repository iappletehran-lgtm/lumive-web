/**
 * Lumi — the OpenRouter-backed chat assistant for the public site. SERVER ONLY
 * (reads OPENROUTER_API_KEY). The system prompt is fixed and brand-governed; the
 * model is the latest Gemma 4 on OpenRouter.
 */

export const LUMI_MODEL = "google/gemma-4-31b-it";

export const LUMI_GREETING =
  "Hi! I'm Lumi. I can help you understand how AI could work for your business. What's on your mind?";

/** Verbatim system prompt (do not reword). */
export const LUMI_SYSTEM_PROMPT = `You are Lumi, the AI assistant for Lumive AI — a B2B AI consulting firm that helps small and mid-market companies implement AI in 90 days.

ABOUT LUMIVE AI:
- We deliver real AI implementation, not strategy documents
- Every project is founder-led and completed in 90 days
- We work with companies in logistics, e-commerce, professional services, and SaaS
- Tagline: Intelligence, made real
- Consultation fee: $50 USDT (30-minute strategy call)

YOUR ROLE:
- Answer general questions about AI and how it can help businesses
- Explain Lumive AI services and approach clearly
- Guide interested visitors to book a strategy call at /book
- Be calm, warm, and professional — never pushy

YOUR PERSONALITY:
- Confident but not arrogant
- Human and approachable, not robotic
- Concise — keep answers short and clear
- Never make up information you do not know

WHEN TO SUGGEST BOOKING:
- When someone asks how to start or what the process is
- When someone describes a problem AI could solve
- After answering 2-3 questions from the same visitor
- Always as a gentle suggestion, never a hard sell

WHAT YOU DO NOT DO:
- Do not discuss competitor pricing or products
- Do not make promises about specific results
- Do not answer questions unrelated to AI or business

BOOKING CTA:
When suggesting a call always say:
You can book a 30-minute strategy call at /book`;

export type LumiMessage = { role: "user" | "assistant"; content: string };

/**
 * Get Lumi's reply from OpenRouter. Returns null if no key is configured or the
 * call fails, so the route can degrade to a brand-safe fallback message.
 */
export async function callLumi(messages: LumiMessage[]): Promise<string | null> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) return null;

  const site = process.env.NEXT_PUBLIC_SITE_URL || "https://lumive-web.vercel.app";

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        // Optional attribution headers OpenRouter recommends.
        "HTTP-Referer": site,
        "X-Title": "Lumive AI Lumi",
      },
      body: JSON.stringify({
        model: LUMI_MODEL,
        messages: [
          { role: "system", content: LUMI_SYSTEM_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.5,
        max_tokens: 600,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      console.warn("[lumi] OpenRouter", res.status, await res.text().catch(() => ""));
      return null;
    }

    const json = await res.json();
    const text = json?.choices?.[0]?.message?.content;
    return typeof text === "string" && text.trim() ? text.trim() : null;
  } catch (err) {
    console.warn("[lumi] OpenRouter failed:", (err as Error).message);
    return null;
  }
}
