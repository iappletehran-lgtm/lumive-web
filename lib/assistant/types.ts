export type Role = "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

/** Lightweight lead profile, built up over the conversation. Sent back and
 *  forth with each request so the (stateless) backend can continue the flow. */
export interface Lead {
  industry?: string;
  size?: string;
  goal?: string;
  /** which qualifying question the assistant is currently waiting on an answer to */
  pendingQ?: "industry" | "size" | "goal" | null;
  /** qualifying questions already asked, so we never repeat */
  asked?: ("industry" | "size" | "goal")[];
  /** rough intent strength — booking/pricing questions raise it */
  intentScore?: number;
}

export interface ChatResponse {
  /** one or more assistant bubbles to render in sequence */
  messages: string[];
  /** suggested quick-reply chips for the next turn */
  quickReplies: string[];
  /** when true, the UI surfaces the "Book a 30-minute call" CTA card */
  showBooking: boolean;
  /** when true, the UI surfaces the WhatsApp / Telegram contact card */
  showContacts?: boolean;
  /** updated lead profile to carry into the next turn */
  lead: Lead;
  /** which engine produced this — "llm" once an API key is configured */
  source: "engine" | "llm";
}
