import type { Metadata } from "next";
import { Inter, Lora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ChatWidget } from "@/components/assistant/ChatWidget";
import { ExperienceLayer } from "@/components/system/ExperienceLayer";
import { SoundController } from "@/components/system/SoundController";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lumive AI — AI implementation for growing businesses, live in 90 days",
  description:
    "We design and build the AI systems growing companies need, working inside your operations in 90 days. Not a strategy deck. A system your team runs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${lora.variable} ${mono.variable} font-sans`}>
        {/* The cinematic experience layer — sync clock + perceptual lighting/depth
            + pointer FX + unified feedback, fused as one coordinated environment */}
        <ExperienceLayer />
        {/* Sound: global [data-sound] click delegation (silent until user opts in) */}
        <SoundController />
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}
