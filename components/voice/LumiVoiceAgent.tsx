"use client";

import { useCallback } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { VoiceChat } from "@/components/ui/voice-chat";
import { useLanguage } from "@/lib/i18n/LanguageContext";

/** Public ElevenLabs Conversational AI agent. */
const AGENT_ID = "agent_1201kxdete4df3ctxck96xhs82qh";

/**
 * Bridges the ElevenLabs conversation SDK to the custom <VoiceChat> UI. Must be
 * rendered inside <ConversationProvider> (below) — this SDK version requires it.
 */
function LumiVoiceAgentInner() {
  const { t } = useLanguage();
  const conversation = useConversation({
    onError: (message) => console.error("[LumiVoice] error:", message),
  });

  const { status, isSpeaking } = conversation;

  // Map SDK state → UI props.
  const isProcessing = status === "connecting";
  const speaking = status === "connected" && isSpeaking;
  const isListening = status === "connected" && !isSpeaking;

  const statusText =
    status === "connecting"
      ? t.voice.connecting
      : status === "connected" && isSpeaking
        ? t.voice.speaking
        : status === "connected"
          ? t.voice.listening
          : t.voice.tapToSpeak; // disconnected / error

  const onToggle = useCallback(async () => {
    // Connected (or mid-connect) → hang up.
    if (status === "connected" || status === "connecting") {
      conversation.endSession();
      return;
    }
    // Idle → request mic first, then start the session. If the mic is blocked we
    // stay idle rather than starting a session that can't hear anything.
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      console.warn("[LumiVoice] microphone permission denied");
      return;
    }
    conversation.startSession({ agentId: AGENT_ID, connectionType: "webrtc" });
  }, [status, conversation]);

  return (
    <VoiceChat
      isListening={isListening}
      isProcessing={isProcessing}
      isSpeaking={speaking}
      onToggle={onToggle}
      statusText={statusText}
      assistantLabel={t.voice.label}
    />
  );
}

export function LumiVoiceAgent() {
  return (
    <ConversationProvider>
      <LumiVoiceAgentInner />
    </ConversationProvider>
  );
}
