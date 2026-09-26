"use client";

import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { EarthAgentIcon, XIcon } from "../shared/icons";
import { useGeoGemma } from "./geogemma-store";
import { GREETING, SUGGESTIONS } from "./mock-data";
import { cn } from "@/lib/utils";

export default function ChatPanel() {
  const {
    chatOpen,
    setChatOpen,
    sessions,
    activeSessionId,
    submitQuery,
    typing,
    leftMode,
    user,
  } = useGeoGemma();
  const [draft, setDraft] = useState("");
  const threadRef = useRef<HTMLDivElement | null>(null);
  const session = sessions.find((s) => s.id === activeSessionId) ?? sessions[0];

  useEffect(() => {
    const el = threadRef.current;
    if (el && chatOpen) el.scrollTop = el.scrollHeight;
  }, [session.messages.length, typing, chatOpen]);

  if (!chatOpen) return null;

  return (
    <section
      aria-label="Conversation"
      className="absolute bottom-24 left-4 z-20 flex max-h-[60vh] w-[420px] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0c1220]/95 shadow-2xl backdrop-blur"
    >
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
        <p className="text-sm font-semibold text-slate-100">
          GeoGemma{" "}
          <span className="ml-1 rounded-full bg-blue-600/20 px-2 py-0.5 text-[11px] font-medium text-blue-300">
            {leftMode === "agent" ? "Earth Agent" : "Chat"}
          </span>
        </p>
        <button
          type="button"
          onClick={() => setChatOpen(false)}
          aria-label="Close conversation"
          className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-slate-200"
        >
          <XIcon width={16} height={16} />
        </button>
      </div>

      <div ref={threadRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {session.messages.length === 0 ? (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-slate-100">Welcome to GeoGemma</h3>
            <p className="text-sm leading-relaxed text-slate-300">{GREETING}</p>
            <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Try asking:</p>
            <ul className="space-y-2">
              {SUGGESTIONS.map((s) => (
                <li key={s}>
                  <button
                    type="button"
                    onClick={() => submitQuery(s)}
                    className="w-full rounded-full border border-blue-500/40 px-3 py-1.5 text-left text-xs text-blue-300 transition-colors hover:bg-blue-600/20"
                  >
                    &ldquo;{s}&rdquo;
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-slate-500">
              Powered by{" "}
              <a
                href="https://datacommons.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 hover:text-blue-300"
              >
                Data Commons
              </a>
            </p>
          </div>
        ) : (
          session.messages.map((m) =>
            m.role === "user" ? (
              <div key={m.id} className="flex animate-[fadeIn_.3s_ease-out] justify-end">
                <div className="flex max-w-[85%] items-start gap-2">
                  <div className="rounded-2xl rounded-br-sm bg-blue-600 px-3.5 py-2.5 text-sm leading-relaxed text-white">
                    {m.content}
                  </div>
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-semibold text-white">
                    {user ? user.initial : "U"}
                  </span>
                </div>
              </div>
            ) : (
              <div key={m.id} className="flex animate-[fadeIn_.3s_ease-out] justify-start">
                <div className="flex max-w-[92%] items-start gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-300">
                    <EarthAgentIcon width={16} height={16} />
                  </span>
                  <div className="markdown rounded-2xl rounded-bl-sm bg-white/5 px-3.5 py-2.5 text-sm leading-relaxed text-slate-200 [&_a]:text-blue-400 [&_a]:underline [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:font-mono [&_code]:text-[13px] [&_li]:ml-4 [&_li]:list-disc [&_p]:my-1 [&_strong]:text-slate-100 [&_ul]:my-1">
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )
          )
        )}
        {typing && (
          <div className="flex items-center gap-1.5 pl-10 text-slate-400">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submitQuery(draft);
          setDraft("");
        }}
        className="flex items-center gap-2 border-t border-white/10 p-2.5"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ask about Earth data…"
          aria-label="Ask about Earth data"
          className={cn(
            "min-w-0 flex-1 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-sm text-slate-100",
            "placeholder:text-slate-500 focus:border-blue-500/60 focus:outline-none"
          )}
        />
        <button
          type="submit"
          disabled={!draft.trim() || typing}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-40"
        >
          Send
        </button>
      </form>
    </section>
  );
}
