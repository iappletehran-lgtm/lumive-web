import type React from "react";

// The ElevenLabs Conversational AI widget registers a custom element,
// <elevenlabs-convai agent-id="…">, via its embed script. Declare it so JSX/TSX
// can render it with type-checking (React 18 uses the global JSX namespace).
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "elevenlabs-convai": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement>,
        HTMLElement
      > & {
        "agent-id"?: string;
        variant?: string;
        placement?: string;
        "default-expanded"?: string;
      };
    }
  }
}

export {};
