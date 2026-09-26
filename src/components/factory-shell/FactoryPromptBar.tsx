"use client";

import { useEffect, useState } from "react";
import { Mic, Search, Send } from "lucide-react";
import { AskAiChatPanel, useAskAiChat } from "@/components/AskAiChat";
import BottomBar from "@/components/bottom-bar";

export default function FactoryPromptBar() {
  const [value, setValue] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const chat = useAskAiChat();
  // Client-only capability check (after hydration) to avoid SSR mismatch:
  // `window` does not exist during prerender.
  const [voiceSupported, setVoiceSupported] = useState(false);
  useEffect(() => {
    setVoiceSupported(
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window
    );
  }, []);

  // Global opener (top bar / left rail): buka panel anchored + kirim
  // pertanyaan bila ada, tanpa overlay.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ question?: string }>).detail;
      setChatOpen(true);
      if (typeof detail?.question === "string" && detail.question.trim()) {
        void chat.ask(detail.question);
      }
    };
    window.addEventListener("__openAskAi", handler as EventListener);
    return () => window.removeEventListener("__openAskAi", handler as EventListener);
  }, [chat.ask]);

  const submit = () => {
    const q = value.trim();
    if (!q) return;
    setChatOpen(true);
    void chat.ask(q);
    setValue("");
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-4">
      <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-2">
        <div className="flex w-full justify-center">
          <BottomBar embedded />
        </div>
        {chatOpen && (
          <AskAiChatPanel chat={chat} onClose={() => setChatOpen(false)} />
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="flex w-full items-center gap-1 rounded-full border border-[#3c4043] bg-[#303134] py-2 pl-4 pr-2 shadow-2xl"
        >
          <span className="shrink-0 text-[#9aa0a6]">
            <Search className="h-[18px] w-[18px]" />
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => setChatOpen(true)}
            placeholder="Ask Minerva AI about the factory…"
            aria-label="Ask Minerva AI about the factory"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[#e8eaed] placeholder:text-[#9aa0a6] focus:outline-none"
          />
          <button
            type="button"
            title={voiceSupported ? "Voice search" : "Voice input not supported in this browser"}
            aria-label="Voice search"
            disabled={!voiceSupported}
            onClick={() => setChatOpen(true)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#8ab4f8] transition-all hover:scale-105 hover:bg-[rgba(138,180,248,0.1)] disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-transparent"
          >
            <Mic className="h-[18px] w-[18px]" />
          </button>
          <button
            type="submit"
            title="Ask AI"
            aria-label="Ask AI"
            disabled={!value.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#a8c8ff] text-[#202124] transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
