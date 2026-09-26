"use client";

import { useEffect, useState } from "react";
import { Mic, Search, Send } from "lucide-react";
import { AskAiButton } from "@/components/AskAiButton";
import { openAskAi } from "./FactoryTopBar";

export default function FactoryPromptBar() {
  const [value, setValue] = useState("");
  // Client-only capability check (after hydration) to avoid SSR mismatch:
  // `window` does not exist during prerender.
  const [voiceSupported, setVoiceSupported] = useState(false);
  useEffect(() => {
    setVoiceSupported(
      "webkitSpeechRecognition" in window || "SpeechRecognition" in window
    );
  }, []);

  const submit = () => {
    const q = value.trim();
    if (!q) return;
    openAskAi(q);
    setValue("");
  };

  return (
    <>
      <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="pointer-events-auto flex w-full max-w-3xl items-center gap-1 rounded-full border border-[#3c4043] bg-[#303134] py-2 pl-4 pr-2 shadow-2xl"
        >
          <span className="shrink-0 text-[#9aa0a6]">
            <Search className="h-[18px] w-[18px]" />
          </span>
          <input
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Ask Minerva AI about the factory…"
            aria-label="Ask Minerva AI about the factory"
            className="min-w-0 flex-1 bg-transparent text-[15px] text-[#e8eaed] placeholder:text-[#9aa0a6] focus:outline-none"
          />
          <button
            type="button"
            title={voiceSupported ? "Voice search" : "Voice input not supported in this browser"}
            aria-label="Voice search"
            disabled={!voiceSupported}
            onClick={() => openAskAi()}
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
      <AskAiButton hideTrigger />
    </>
  );
}
