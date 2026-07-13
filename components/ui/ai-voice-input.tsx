"use client";
import { Mic } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AIVoiceInputProps {
  onStart?: () => void;
  onStop?: (duration: number) => void;
  visualizerBars?: number;
  className?: string;
}

export function AIVoiceInput({
  onStart, onStop,
  visualizerBars = 48, className
}: AIVoiceInputProps) {
  const [submitted, setSubmitted] = useState(false);
  const [time, setTime] = useState(0);
  const [isClient, setIsClient] = useState(false);
  useEffect(() => { setIsClient(true); }, []);
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (submitted) {
      onStart?.();
      intervalId = setInterval(() => setTime(t => t + 1), 1000);
    } else { onStop?.(time); setTime(0); }
    return () => clearInterval(intervalId);
  }, [submitted]);
  const formatTime = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  return (
    <div className={cn("w-full py-4", className)}>
      <div className="relative max-w-xl w-full mx-auto flex items-center flex-col gap-2">
        <button
          className="group w-16 h-16 rounded-xl flex items-center justify-center transition-colors hover:bg-black/10"
          type="button"
          onClick={() => setSubmitted(p => !p)}
        >
          {submitted ? (
            <div className="w-6 h-6 rounded-sm animate-spin cursor-pointer"
                 style={{ background: "#1B3F72", animationDuration: "3s" }} />
          ) : (
            <Mic className="w-6 h-6" style={{ color: "#1B3F72" }} />
          )}
        </button>
        <span className={cn(
          "font-mono text-sm transition-opacity duration-300",
          submitted ? "opacity-70" : "opacity-30"
        )}>
          {formatTime(time)}
        </span>
        <div className="h-4 w-64 flex items-center justify-center gap-0.5">
          {[...Array(visualizerBars)].map((_, i) => (
            <div key={i}
              className={cn(
                "w-0.5 rounded-full transition-all duration-300",
                submitted ? "animate-pulse" : "h-1"
              )}
              style={submitted && isClient ? {
                background: "#1A8C6B",
                height: `${20 + Math.random() * 80}%`,
                animationDelay: `${i * 0.05}s`,
              } : { background: "#1A8C6B", opacity: 0.2 }}
            />
          ))}
        </div>
        <p className="h-4 text-xs opacity-70">
          {submitted ? "Listening..." : "Click to speak"}
        </p>
      </div>
    </div>
  );
}
