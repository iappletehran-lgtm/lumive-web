import { buildSystemPrompt } from "@/lib/assistant/knowledge";
import { callLLM } from "@/lib/assistant/llm";
import type { ChatMessage } from "@/lib/assistant/types";
import { WA } from "./config";
import type { Conversation, LeadStatus } from "./store";

/**
 * The WhatsApp agent shares the web assistant's knowledge base and brand-voice
 * rules (no invented pricing/services, no hype, booking focus) and adds the
 * channel-specific behaviour and safety rules required for WhatsApp.
 */
const WHATSAPP_ADDENDUM = `
CHANNEL: You are replying on WhatsApp as Lumive AI's automated assistant.

Behaviour:
- You are an AI assistant, not a human. Never pretend otherwise. If asked, say so
  plainly and offer to connect them with the team.
- Keep messages very short and human — 1 to 3 sentences, conversational, no bullet
  lists or headings. This is a chat, not an email.
- Ask one clarifying question at a time about their business and what they want AI
  to do. Understand the need before suggesting anything.
- Recommend only Lumive AI's actual services. If asked for something outside the
  offering, say it is not what we do and redirect to what we can help with.
- When there is a genuine fit or clear interest, suggest a 30-minute call and share
  the booking link: ${WA.bookingUrl}
- Do not paste the booking link in every message — only when it is genuinely useful.
- Never invent pricing, client names, or case studies. If unsure, say so and offer a call.
`.trim();

export function buildWaSystemPrompt(): string {
  return `${buildSystemPrompt()}\n\n${WHATSAPP_ADDENDUM}`;
}

/**
 * Heuristic lead scoring over the conversation. Deterministic and content-free
 * to log (only the resulting status is stored). cold → warm → hot, with
 * "qualified" once a hot lead has engaged across a few turns.
 */
const HOT = /\b(book|schedule|set up a call|demo|ready|let'?s (start|do)|get started|when can|availab|how much|pricing|quote|budget|sign up)\b/i;
const WARM = /\b(automat|crm|receptionist|chatbot|chat system|workflow|lead|invoic|follow.?up|support|website|integrat|need|help with|looking for|interested|our (team|company|business)|process)\b/i;

export function scoreLead(conv: Conversation): LeadStatus {
  const userText = conv.history.filter((m) => m.role === "user").map((m) => m.content).join(" ");
  const turns = conv.history.filter((m) => m.role === "user").length;

  if (HOT.test(userText)) return turns >= 2 ? "qualified" : "hot";
  if (WARM.test(userText) || turns >= 3) return "warm";
  return "cold";
}

/**
 * Generate the reply. Uses the LLM brain when configured; otherwise returns a
 * brand-safe canned reply so WhatsApp still auto-responds (degraded, never wrong).
 * Guarantees the booking link is offered once a lead is hot/qualified.
 */
export async function generateReply(conv: Conversation): Promise<string> {
  const wantsBooking = (conv.status === "hot" || conv.status === "qualified") && !conv.bookingShared;

  let reply: string | null = null;
  try {
    reply = await callLLM({ system: buildWaSystemPrompt(), messages: conv.history, maxTokens: 280 });
  } catch (err) {
    console.warn("[whatsapp] LLM failed, using fallback:", (err as Error).message);
  }

  if (!reply) reply = fallbackReply(conv);

  // Safety net: make sure a hot lead actually receives the booking link once.
  if (wantsBooking && !reply.includes(WA.bookingUrl)) {
    reply = `${reply}\n\nWhenever you're ready, you can book a 30-minute call here: ${WA.bookingUrl}`;
    conv.bookingShared = true;
  } else if (reply.includes(WA.bookingUrl)) {
    conv.bookingShared = true;
  }

  return reply.trim();
}

/** Brand-safe reply when no LLM key is configured — still useful, never invents. */
function fallbackReply(conv: Conversation): string {
  if (conv.turns <= 1) {
    return "Hi, thanks for reaching out to Lumive AI. I am the team's AI assistant. To point you in the right direction — what does your business do, and where do you think AI could help?";
  }
  if (conv.status === "hot" || conv.status === "qualified") {
    return `That sounds like something we could help with. The best next step is a short, no-pressure call to scope it. You can book 30 minutes here: ${WA.bookingUrl}`;
  }
  return "Got it. We design and build working AI systems — things like an AI receptionist, chat systems, workflow automation, and CRM flows — live in 90 days. Which part of your business takes up the most repetitive time right now?";
}
