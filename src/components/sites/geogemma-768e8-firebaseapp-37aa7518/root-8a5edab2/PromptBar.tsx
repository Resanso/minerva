"use client";

import { useState } from "react";
import { MicIcon, SearchIcon, SendIcon } from "../shared/icons";
import { useGeoGemma } from "./geogemma-store";

export default function PromptBar() {
  const { submitQuery, typing, pushNotice } = useGeoGemma();
  const [value, setValue] = useState("");

  const voiceSupported =
    typeof window !== "undefined" &&
    ("webkitSpeechRecognition" in window || "SpeechRecognition" in window);

  const startVoice = () => {
    if (!voiceSupported) {
      pushNotice("Voice input not supported in this browser");
      return;
    }
    try {
      const Rec =
        (window as unknown as { webkitSpeechRecognition?: new () => WebSpeechRecognizer }).webkitSpeechRecognition ??
        (window as unknown as { SpeechRecognition?: new () => WebSpeechRecognizer }).SpeechRecognition;
      if (!Rec) {
        pushNotice("Voice input not supported in this browser");
        return;
      }
      const rec = new Rec();
      rec.lang = "en-US";
      rec.interimResults = false;
      rec.onresult = (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => {
        const text = e.results[0]?.[0]?.transcript;
        if (text) setValue(text);
      };
      rec.onerror = () => pushNotice("Voice search failed — type your query instead");
      rec.start();
      pushNotice("Listening… speak now");
    } catch {
      pushNotice("Voice input not supported in this browser");
    }
  };

  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center px-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuery(value);
          setValue("");
        }}
        className="pointer-events-auto flex w-full max-w-2xl items-center gap-1 rounded-full border border-white/10 bg-[#10192e]/95 py-2 pl-4 pr-2 shadow-2xl backdrop-blur"
      >
        <span className="shrink-0 text-slate-500">
          <SearchIcon width={18} height={18} />
        </span>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search for Earth imagery..."
          aria-label="Search for Earth imagery"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={startVoice}
          title="Voice search"
          aria-label="Voice search"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-white/10 hover:text-slate-200"
        >
          <MicIcon width={18} height={18} />
        </button>
        <button
          type="submit"
          title="Search"
          aria-label="Search"
          disabled={!value.trim() || typing}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-[0_0_18px_rgba(59,130,246,0.45)] transition-all hover:bg-blue-500 disabled:opacity-40 disabled:shadow-none"
        >
          <SendIcon width={16} height={16} />
        </button>
      </form>
    </div>
  );
}

interface WebSpeechRecognizer {
  lang: string;
  interimResults: boolean;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  start: () => void;
}
