"use client";

import { Mic, Volume2, VolumeX, Sparkles, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface VoiceChatProps {
  isListening?: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
  onToggle?: () => void;
  statusText?: string;
  assistantLabel?: string;
  className?: string;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  velocity: { x: number; y: number };
}

export function VoiceChat({
  isListening = false,
  isProcessing = false,
  isSpeaking = false,
  onToggle,
  statusText = "Tap to speak",
  assistantLabel = "AI Voice Assistant",
  className
}: VoiceChatProps) {
  const [duration, setDuration] = useState(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [waveformData, setWaveformData] = useState<number[]>(Array(32).fill(0));
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  const animationRef = useRef<number>();

  const active = isListening || isSpeaking || isProcessing;

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: i,
        x: Math.random() * 400,
        y: Math.random() * 400,
        size: Math.random() * 3 + 1,
        opacity: Math.random() * 0.3 + 0.1,
        velocity: {
          x: (Math.random() - 0.5) * 0.5,
          y: (Math.random() - 0.5) * 0.5
        }
      });
    }
    setParticles(newParticles);
  }, []);

  useEffect(() => {
    const animateParticles = () => {
      setParticles(prev => prev.map(p => ({
        ...p,
        x: (p.x + p.velocity.x + 400) % 400,
        y: (p.y + p.velocity.y + 400) % 400,
      })));
      animationRef.current = requestAnimationFrame(animateParticles);
    };
    animationRef.current = requestAnimationFrame(animateParticles);
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  useEffect(() => {
    if (active) {
      intervalRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
        setWaveformData(
          Array(32).fill(0).map(() => Math.random() * 100)
        );
      }, 100);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setWaveformData(Array(32).fill(0));
      setDuration(0);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [active]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2,"0")}:${secs.toString().padStart(2,"0")}`;
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center relative overflow-hidden py-12",
      className
    )}>
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <motion.div
            key={p.id}
            className="absolute w-1 h-1 rounded-full"
            style={{
              left: p.x,
              top: p.y,
              opacity: p.opacity,
              background: "#1B3F72"
            }}
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center space-y-8">
        <motion.div
          className="relative"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <motion.button
            onClick={onToggle}
            className="relative w-32 h-32 rounded-full flex items-center
                       justify-center transition-all duration-300 border-2"
            style={{
              background: "rgba(232,239,249,0.6)",
              borderColor: isListening ? "#1B3F72"
                : isSpeaking ? "#1A8C6B"
                : isProcessing ? "#C9A84C"
                : "#CBD5E0"
            }}
          >
            <AnimatePresence mode="wait">
              {isProcessing ? (
                <motion.div key="p" initial={{opacity:0,scale:0.8}}
                  animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}>
                  <Loader2 className="w-12 h-12 animate-spin"
                    style={{color:"#C9A84C"}}/>
                </motion.div>
              ) : isSpeaking ? (
                <motion.div key="s" initial={{opacity:0,scale:0.8}}
                  animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}>
                  <Volume2 className="w-12 h-12" style={{color:"#1A8C6B"}}/>
                </motion.div>
              ) : isListening ? (
                <motion.div key="l" initial={{opacity:0,scale:0.8}}
                  animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}>
                  <Mic className="w-12 h-12" style={{color:"#1B3F72"}}/>
                </motion.div>
              ) : (
                <motion.div key="i" initial={{opacity:0,scale:0.8}}
                  animate={{opacity:1,scale:1}} exit={{opacity:0,scale:0.8}}>
                  <Mic className="w-12 h-12" style={{color:"#4A5568"}}/>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          <AnimatePresence>
            {active && (
              <>
                <motion.div
                  className="absolute inset-0 rounded-full border-2"
                  style={{borderColor: isSpeaking ? "#1A8C6B" : "#1B3F72"}}
                  initial={{ scale: 1, opacity: 0.6 }}
                  animate={{ scale: 1.5, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full border-2"
                  style={{borderColor: isSpeaking ? "#1A8C6B" : "#1B3F72"}}
                  initial={{ scale: 1, opacity: 0.4 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1.5, repeat: Infinity,
                    ease: "easeOut", delay: 0.5 }}
                />
              </>
            )}
          </AnimatePresence>
        </motion.div>

        <div className="flex items-center justify-center space-x-1 h-16">
          {waveformData.map((h, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full transition-colors duration-300"
              style={{
                background: isSpeaking ? "#1A8C6B"
                  : isListening ? "#1B3F72"
                  : isProcessing ? "#C9A84C"
                  : "#CBD5E0"
              }}
              animate={{
                height: `${Math.max(4, h * 0.6)}px`,
                opacity: active ? 1 : 0.3
              }}
              transition={{ duration: 0.1, ease: "easeOut" }}
            />
          ))}
        </div>

        <div className="text-center space-y-2">
          <motion.p
            className="text-lg font-medium"
            style={{
              color: isSpeaking ? "#1A8C6B"
                : isListening ? "#1B3F72"
                : isProcessing ? "#C9A84C"
                : "#4A5568"
            }}
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: active ? Infinity : 0 }}
          >
            {statusText}
          </motion.p>
          <p className="text-sm font-mono" style={{color:"#4A5568"}}>
            {formatTime(duration)}
          </p>
        </div>

        <motion.div
          className="flex items-center space-x-2 text-sm"
          style={{color:"#4A5568"}}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Sparkles className="w-4 h-4" />
          <span>{assistantLabel}</span>
        </motion.div>
      </div>
    </div>
  );
}
