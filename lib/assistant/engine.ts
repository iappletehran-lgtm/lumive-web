/**
 * Local conversation engine — makes the assistant fully functional with no API
 * key. Deterministic, brand-voice, never hallucinates. When an LLM key is added
 * (see app/api/chat/route.ts) the route uses the model instead and this becomes
 * the graceful fallback.
 */
import { KB, OPENING_QUICK_REPLIES } from "./knowledge";
import type { ChatMessage, ChatResponse, Lead } from "./types";

type Intent =
  | "greeting"
  | "services"
  | "receptionist"
  | "chatSystems"
  | "workflow"
  | "crm"
  | "agents"
  | "ninetyDay"
  | "readiness"
  | "pricing"
  | "booking"
  | "humanSupport"
  | "industries"
  | "about"
  | "difference"
  | "thanks"
  | "unknown";

const PATTERNS: [Intent, RegExp][] = [
  ["humanSupport", /\b(human|real person|speak to (someone|a person)|talk to (someone|a person)|whatsapp|telegram|message you|text you|urgent|asap|right now)\b/i],
  ["booking", /\b(book|call|meet|consult|schedule|talk to|speak|demo)\b/i],
  ["pricing", /\b(pric|cost|how much|budget|fee|expensive|afford|quote)\b/i],
  ["receptionist", /\b(receptionist|inbound|missed call|answer (the )?(calls?|phone)|front desk|answering|enquir|inquir|after hours|24\/7)\b/i],
  ["crm", /\b(crm|pipeline|lead (management|capture|routing)|follow.?ups?|hubspot|salesforce|pipedrive|sales process)\b/i],
  ["chatSystems", /\b(chat (system|widget|solution|tool)|website chat|live chat|chat for (my|our)|internal chat|knowledge base bot)\b/i],
  ["workflow", /\b(workflow|automat|orchestrat|manual (task|process|work)|repetitive|data entry|handoff|integrat)\b/i],
  ["ninetyDay", /\b(90|ninety|process|timeline|how long|phases?|steps?|how do(es)? it work)\b/i],
  ["readiness", /\b(ready|readiness|assess|self-?check|suitable|right for|good fit)\b/i],
  ["agents", /\b(agent|agents|autonomous)\b/i],
  ["services", /\b(service|offer|do you do|what do you|what can you|build|report)\b/i],
  ["industries", /\b(industr|sector|logistic|e-?commerce|saas|professional services|manufactur)\b/i],
  ["difference", /\b(differ|why (you|lumive)|better|compare|vs\b|competitor|unique)\b/i],
  ["about", /\b(who are you|about|what is lumive|company|founders?)\b/i],
  ["thanks", /\b(thanks|thank you|cheers|appreciate)\b/i],
  ["greeting", /\b(hi|hello|hey|good (morning|afternoon|evening))\b/i],
];

function detectIntent(text: string): Intent {
  for (const [intent, re] of PATTERNS) if (re.test(text)) return intent;
  return "unknown";
}

/** Tidy multi-line KB strings into single-paragraph replies. */
const clean = (s: string) => s.replace(/\s+/g, " ").trim();

const HIGH_INTENT: Intent[] = ["pricing", "booking"];

const QUALIFY = {
  industry: "To point you to the most relevant examples — what industry are you in?",
  size: "Roughly how many people are in your business?",
  goal: "What is the main thing you would want AI to help with?",
} as const;

function nextQualifier(lead: Lead): "industry" | "size" | "goal" | null {
  const asked = lead.asked ?? [];
  if (!lead.industry && !asked.includes("industry")) return "industry";
  if (!lead.size && !asked.includes("size")) return "size";
  if (!lead.goal && !asked.includes("goal")) return "goal";
  return null;
}

function answeredCount(lead: Lead): number {
  return [lead.industry, lead.size, lead.goal].filter(Boolean).length;
}

export function runEngine(history: ChatMessage[], leadIn: Lead): ChatResponse {
  const lead: Lead = {
    ...leadIn,
    asked: [...(leadIn.asked ?? [])],
    intentScore: leadIn.intentScore ?? 0,
  };
  const last = [...history].reverse().find((m) => m.role === "user");
  const text = (last?.content ?? "").trim();

  const messages: string[] = [];
  let showBooking = false;
  let showContacts = false;
  let quickReplies: string[] = OPENING_QUICK_REPLIES;

  // 1) If we are waiting on a qualifying answer and the user did not pivot to a
  //    strong intent, capture their answer.
  const intent = detectIntent(text);
  const pivoted = intent !== "unknown" && intent !== "thanks" && intent !== "greeting";

  if (lead.pendingQ && !pivoted && text) {
    lead[lead.pendingQ] = text.slice(0, 80);
    lead.asked = Array.from(new Set([...(lead.asked ?? []), lead.pendingQ]));
    const justAnswered = lead.pendingQ;
    lead.pendingQ = null;

    const ack =
      justAnswered === "industry"
        ? "Got it, thank you."
        : justAnswered === "size"
        ? "Understood."
        : "That helps.";

    // Once we know enough, or after the goal, move toward a call.
    if (answeredCount(lead) >= 2 || justAnswered === "goal") {
      messages.push(
        `${ack} Based on that, the most useful next step is a short call — we can tell you honestly where AI is worth it for a business like yours, and where it is not. There is no pitch.`
      );
      showBooking = true;
      quickReplies = ["Book a call", "How does the 90-day process work?", "What services do you offer?"];
      return { messages, quickReplies, showBooking, showContacts, lead, source: "engine" };
    }

    const nq = nextQualifier(lead);
    if (nq) {
      lead.pendingQ = nq;
      lead.asked = Array.from(new Set([...(lead.asked ?? []), nq]));
      messages.push(`${ack} ${QUALIFY[nq]}`);
      quickReplies = ["Book a call", "Pricing"];
      return { messages, quickReplies, showBooking, showContacts, lead, source: "engine" };
    }
  }

  // 2) Main intent handling.
  if (HIGH_INTENT.includes(intent)) lead.intentScore = (lead.intentScore ?? 0) + 1;

  switch (intent) {
    case "greeting":
      messages.push(
        "Hello. I can explain what we do, how the 90-day process works, or help you decide if a call makes sense. What would be useful?"
      );
      break;
    case "services":
      messages.push(clean(KB.services));
      quickReplies = ["AI Receptionist", "AI Chat Systems", "Workflow Automation", "CRM Automation"];
      break;
    case "receptionist":
      messages.push(clean(KB.receptionist));
      quickReplies = ["How does the 90-day process work?", "Book a call", "AI Chat Systems"];
      break;
    case "chatSystems":
      messages.push(clean(KB.chatSystems));
      quickReplies = ["AI Receptionist", "Book a call", "CRM Automation"];
      break;
    case "workflow":
      messages.push(clean(KB.workflowAutomation));
      quickReplies = ["CRM Automation", "Book a call", "How does the 90-day process work?"];
      break;
    case "crm":
      messages.push(clean(KB.crmAutomation));
      quickReplies = ["Workflow Automation", "Book a call", "AI Receptionist"];
      break;
    case "agents":
      messages.push(clean(KB.agents));
      break;
    case "humanSupport":
      messages.push(clean(KB.channels));
      showContacts = true;
      quickReplies = ["Book a call", "What services do you offer?"];
      break;
    case "ninetyDay":
      messages.push(clean(KB.ninetyDay));
      break;
    case "readiness":
      messages.push(clean(KB.readiness));
      quickReplies = ["Take the readiness check", "Book a call", "What do you build?"];
      break;
    case "industries":
      messages.push(clean(KB.industries));
      break;
    case "about":
      messages.push(clean(KB.about));
      break;
    case "difference":
      messages.push(clean(KB.difference));
      break;
    case "pricing":
      messages.push(clean(KB.pricing));
      showBooking = true;
      quickReplies = ["Book a call", "How does the 90-day process work?"];
      break;
    case "booking":
      messages.push(clean(KB.booking));
      showBooking = true;
      quickReplies = ["Book a call", "What happens on the call?"];
      break;
    case "thanks":
      messages.push("You are welcome. Anything else you would like to know?");
      break;
    default:
      messages.push(
        "I am not certain I have that on hand, and I would rather not guess. I can cover what we build, the 90-day process, readiness, or pricing — or you can put it to the team directly on a short call."
      );
      quickReplies = ["What do you build?", "How does the 90-day process work?", "Book a call"];
  }

  // 3) Light-touch qualification: after a substantive answer, ask one question —
  //    but only if we are not already pushing the booking CTA.
  const substantive = !["greeting", "thanks", "unknown", "pricing", "booking", "humanSupport"].includes(intent);
  if (substantive && !showBooking && answeredCount(lead) < 2) {
    const nq = nextQualifier(lead);
    if (nq) {
      lead.pendingQ = nq;
      lead.asked = Array.from(new Set([...(lead.asked ?? []), nq]));
      messages.push(QUALIFY[nq]);
      quickReplies = ["Book a call", "Pricing"];
    }
  }

  // 4) Escalate to booking once intent is strong.
  if ((lead.intentScore ?? 0) >= 2 && !showBooking) {
    showBooking = true;
    quickReplies = Array.from(new Set(["Book a call", ...quickReplies])).slice(0, 4);
  }

  return { messages, quickReplies, showBooking, showContacts, lead, source: "engine" };
}
