"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PrismMark } from "../Logo";
import { ChannelButtons, ChannelIcons } from "../Channels";
import { OPENING_QUICK_REPLIES, GREETING } from "@/lib/assistant/knowledge";
import type { ChatMessage, Lead } from "@/lib/assistant/types";

interface UIMessage extends ChatMessage {
  id: string;
}

let _id = 0;
const nid = () => `m${++_id}`;

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [quickReplies, setQuickReplies] = useState<string[]>(OPENING_QUICK_REPLIES);
  const [showBooking, setShowBooking] = useState(false);
  const [showContacts, setShowContacts] = useState(false);
  const [lead, setLead] = useState<Lead>({});
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Seed the greeting the first time the drawer opens.
  useEffect(() => {
    if (open && messages.length === 0) {
      setMessages([{ id: nid(), role: "assistant", content: GREETING }]);
    }
  }, [open, messages.length]);

  // Auto-scroll to newest message / typing indicator.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing, showBooking, showContacts]);

  // Lock body scroll on mobile while open; close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const send = useCallback(
    async (raw: string) => {
      const text = raw.trim();
      if (!text || typing) return;

      const userMsg: UIMessage = { id: nid(), role: "user", content: text };
      const history = [...messages, userMsg];
      setMessages(history);
      setInput("");
      setQuickReplies([]);
      setTyping(true);

      const payload: ChatMessage[] = history.map(({ role, content }) => ({ role, content }));

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: payload, lead }),
        });
        const data = await res.json();

        // Render assistant bubbles in sequence for a natural, paced feel.
        const replies: string[] = data.messages?.length ? data.messages : ["Let me get the team to help with that on a short call."];
        for (let i = 0; i < replies.length; i++) {
          const delay = Math.min(900, 350 + replies[i].length * 9);
          await wait(delay);
          setMessages((prev) => [...prev, { id: nid(), role: "assistant", content: replies[i] }]);
        }
        setLead(data.lead ?? lead);
        setShowBooking(Boolean(data.showBooking));
        setShowContacts(Boolean(data.showContacts));
        setQuickReplies(data.quickReplies ?? []);
      } catch {
        setMessages((prev) => [
          ...prev,
          { id: nid(), role: "assistant", content: "Something went wrong on my side. You can reach the team directly with a 30-minute call." },
        ]);
        setShowBooking(true);
      } finally {
        setTyping(false);
        inputRef.current?.focus();
      }
    },
    [messages, lead, typing]
  );

  const onQuick = (q: string) => {
    if (/book a call/i.test(q)) {
      goToBooking();
      return;
    }
    if (/readiness check/i.test(q)) {
      window.location.assign("/#readiness");
      setOpen(false);
      return;
    }
    send(q);
  };

  const goToBooking = () => {
    window.location.assign("/#book");
    setOpen(false);
  };

  return (
    <>
      {/* Floating launcher — sits above the sticky mobile CTA */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open the Lumive AI Assistant"
          data-sound="assistant"
          className="group fixed bottom-20 right-4 z-[70] flex h-14 w-14 items-center justify-center rounded-full bg-sapphire shadow-lg transition-all duration-200 ease-brand hover:scale-105 hover:shadow-xl focus-brand lg:bottom-6 lg:right-6"
        >
          <PrismMark className="h-7 w-7" tone="dark" />
          <span className="absolute right-0 top-0 h-3 w-3 animate-pulse-soft rounded-full border-2 border-sapphire bg-teal" />
        </button>
      )}

      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-[75] bg-midnight/40 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-0"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Drawer */}
      {open && (
        <div
          role="dialog"
          aria-label="Lumive AI Assistant"
          className="fixed inset-0 z-[80] flex flex-col bg-mist shadow-xl animate-fade-up
                     sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(680px,85vh)] sm:w-[400px] sm:rounded-2xl sm:border sm:border-cloud/60"
        >
          {/* Header */}
          <header className="flex items-center gap-3 rounded-t-2xl bg-sapphire px-5 py-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
              <PrismMark className="h-5 w-5" tone="dark" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight text-mist">Lumive AI Assistant</p>
              <p className="flex items-center gap-1.5 text-[12px] text-cloud/80">
                <span className="h-1.5 w-1.5 rounded-full bg-lumive-light" /> Online — usually replies instantly
              </p>
            </div>
            <ChannelIcons tone="dark" className="mr-1" />
            <button
              onClick={() => setOpen(false)}
              aria-label="Close assistant"
              className="flex h-8 w-8 items-center justify-center rounded-md text-cloud/80 transition-colors hover:bg-white/10 hover:text-mist focus-brand"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-5">
            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} content={m.content} />
            ))}

            {typing && <TypingDots />}

            {showBooking && !typing && (
              <div className="animate-fade-up rounded-lg border border-brass/40 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-sapphire">Ready to talk it through?</p>
                <p className="mt-1 text-[13px] leading-snug text-steel">
                  A 30-minute call, no pitch. We tell you honestly if it is a fit.
                </p>
                <button
                  onClick={goToBooking}
                  data-sound="cta"
                  className="glow-cta mt-3 w-full rounded-md bg-brass px-4 py-2.5 text-sm font-semibold text-midnight transition-all hover:brightness-95 focus-brand"
                >
                  Book a 30-minute call
                </button>
              </div>
            )}

            {showContacts && !typing && (
              <div className="animate-fade-up rounded-lg border border-cloud/70 bg-white p-4 shadow-sm">
                <p className="text-sm font-medium text-sapphire">Prefer to talk directly?</p>
                <p className="mt-1 text-[13px] leading-snug text-steel">
                  Reach the same team on WhatsApp or Telegram — a faster way in.
                </p>
                <ChannelButtons tone="light" className="mt-3" />
              </div>
            )}
          </div>

          {/* Quick replies */}
          {quickReplies.length > 0 && !typing && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {quickReplies.map((q) => (
                <button
                  key={q}
                  onClick={() => onQuick(q)}
                  className="rounded-full border border-sapphire/25 bg-white px-3.5 py-1.5 text-[13px] font-medium text-sapphire transition-colors hover:border-teal hover:text-teal focus-brand"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Composer */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2 border-t border-cloud/60 bg-white px-3 py-3 sm:rounded-b-2xl"
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about Lumive AI..."
              className="min-w-0 flex-1 rounded-md border border-cloud bg-mist/40 px-4 py-2.5 text-sm text-midnight placeholder:text-steel/60 focus:border-sapphire focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="Send message"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sapphire text-mist transition-all hover:brightness-110 disabled:opacity-40 focus-brand"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>

          <p className="bg-white pb-2 text-center text-[10px] text-steel/50 sm:rounded-b-2xl">
            Demo assistant · does not quote pricing or invent results
          </p>
        </div>
      )}
    </>
  );
}

function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex animate-fade-up ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[82%] rounded-2xl rounded-br-sm bg-sapphire px-4 py-2.5 text-sm leading-relaxed text-mist"
            : "max-w-[82%] rounded-2xl rounded-bl-sm border border-cloud/70 bg-white px-4 py-2.5 text-sm leading-relaxed text-midnight"
        }
      >
        {content}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex animate-fade-up justify-start">
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-cloud/70 bg-white px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-2 w-2 animate-bounce rounded-full bg-slate-indigo"
            style={{ animationDelay: `${i * 0.15}s`, animationDuration: "0.9s" }}
          />
        ))}
      </div>
    </div>
  );
}

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
