"use client";

import { Fragment, useEffect, useRef, useState, useCallback } from "react";
import { usePathname } from "next/navigation";
import { PrismMark } from "../Logo";
import { type LumiMessage } from "@/lib/assistant/lumi";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface UIMessage extends LumiMessage {
  id: string;
}

let _id = 0;
const nid = () => `m${++_id}`;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Hide the widget on the private app/auth pages — public pages only. */
const HIDE_ON = /^\/(dashboard|admin|login|register)(\/|$)/;

export function LumiWidget() {
  const pathname = usePathname();
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<UIMessage[]>(() => [
    { id: nid(), role: "assistant", content: t.chat.greeting },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  // One stable id per conversation, generated when the widget first opens; sent
  // with every message so the server can group the turns into one chat_logs row.
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (open && !sessionId) setSessionId(crypto.randomUUID());
  }, [open, sessionId]);

  // Keep the seeded greeting in the active language until the visitor speaks.
  useEffect(() => {
    setMessages((prev) =>
      prev.length === 1 && prev[0].role === "assistant"
        ? [{ ...prev[0], content: t.chat.greeting }]
        : prev
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll to newest message / typing indicator.
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, typing]);

  // Focus the input when the window opens; close on Escape.
  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
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
      setTyping(true);

      // Ensure a session id even if the open-effect has not run yet.
      const sid = sessionId ?? crypto.randomUUID();
      if (!sessionId) setSessionId(sid);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })), lang, session_id: sid }),
        });
        const data = await res.json().catch(() => ({}));
        const reply: string = data.reply || t.chat.fallback;
        await wait(Math.min(700, 250 + reply.length * 6));
        setMessages((prev) => [...prev, { id: nid(), role: "assistant", content: reply }]);
      } catch {
        setMessages((prev) => [...prev, { id: nid(), role: "assistant", content: t.chat.fallback }]);
      } finally {
        setTyping(false);
        inputRef.current?.focus();
      }
    },
    [messages, typing, lang, sessionId, t.chat.fallback]
  );

  // Public pages only.
  if (HIDE_ON.test(pathname || "")) return null;

  return (
    <>
      {/* Trigger — pill launcher with a subtle attention pulse */}
      {!open && (
        <div className="fixed bottom-20 right-4 z-[70] lg:bottom-6 lg:right-6">
          <span
            aria-hidden
            className="absolute inset-0 rounded-full bg-sapphire/25 motion-safe:animate-ping"
            style={{ animationDuration: "2.6s" }}
          />
          <button
            onClick={() => setOpen(true)}
            aria-label={t.chat.launcher}
            data-sound="assistant"
            className="focus-brand relative flex items-center gap-2.5 rounded-full bg-sapphire py-2.5 pl-2.5 pr-4 text-mist shadow-lg transition-all duration-200 ease-brand hover:bg-sapphire/90 hover:shadow-xl"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10">
              <PrismMark className="h-5 w-5" tone="dark" />
            </span>
            <span className="text-sm font-semibold">{t.chat.launcher}</span>
            <span className="h-2 w-2 rounded-full bg-lumive-light motion-safe:animate-pulse-soft" />
          </button>
        </div>
      )}

      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-[75] bg-midnight/40 backdrop-blur-sm sm:bg-transparent sm:backdrop-blur-0"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      {/* Chat window */}
      {open && (
        <div
          role="dialog"
          aria-label={t.chat.header}
          className="glass fixed inset-0 z-[80] flex flex-col bg-mist shadow-xl animate-fade-up
                     sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(640px,82vh)] sm:w-[380px] sm:rounded-2xl sm:border sm:border-cloud/60"
        >
          {/* Header */}
          <header className="flex items-center gap-3 bg-sapphire px-5 py-4 sm:rounded-t-2xl">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10">
              <PrismMark className="h-5 w-5" tone="dark" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight text-mist">
                {t.chat.header}
              </p>
              <p className="flex items-center gap-1.5 text-[12px] text-cloud/80">
                <span className="h-1.5 w-1.5 rounded-full bg-lumive-light" /> {t.chat.online}
              </p>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="focus-brand flex h-8 w-8 items-center justify-center rounded-md text-cloud/80 transition-colors hover:bg-white/10 hover:text-mist"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-mist/70 px-4 py-5">
            {messages.map((m) => (
              <Bubble key={m.id} role={m.role} content={m.content} />
            ))}
            {typing && <TypingDots />}
          </div>

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
              placeholder={t.chat.placeholder}
              className="min-w-0 flex-1 rounded-md border border-cloud bg-mist/40 px-4 py-2.5 text-sm text-midnight placeholder:text-steel/60 focus:border-sapphire focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={!input.trim() || typing}
              aria-label="Send message"
              className="focus-brand flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-sapphire text-mist transition-all hover:brightness-110 disabled:opacity-40"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
}

/** Render an assistant/user bubble, linking any "/book" mention. */
function Bubble({ role, content }: { role: "user" | "assistant"; content: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex animate-fade-up ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={
          isUser
            ? "max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-sapphire px-4 py-2.5 text-sm leading-relaxed text-mist"
            : "max-w-[82%] whitespace-pre-wrap rounded-2xl rounded-bl-sm border border-cloud/70 bg-white px-4 py-2.5 text-sm leading-relaxed text-midnight"
        }
      >
        {isUser ? content : linkifyBook(content)}
      </div>
    </div>
  );
}

/** Turn "/book" references into a clickable link to the booking page. */
function linkifyBook(text: string) {
  const parts = text.split(/(\/book\b)/g);
  return parts.map((part, i) =>
    part === "/book" ? (
      <a
        key={i}
        href="/book"
        data-sound="cta"
        className="font-semibold text-sapphire underline decoration-sapphire/40 underline-offset-2 hover:text-teal"
      >
        /book
      </a>
    ) : (
      <Fragment key={i}>{part}</Fragment>
    )
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
