"use client";

import { useState } from "react";
import {
  ChatIcon,
  ChevronRightIcon,
  EarthAgentIcon,
  NewChatIcon,
  TrashIcon,
} from "../shared/icons";
import { useGeoGemma } from "./geogemma-store";
import { cn } from "@/lib/utils";

const COMING_SOON = [
  { label: "Time Series Analysis" },
  { label: "Comparison Analysis" },
  { label: "Add Custom GeoJSON" },
  { label: "Export Data" },
];

function RailButton({
  title,
  active,
  onClick,
  children,
  disabled,
}: {
  title: string;
  active?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={disabled ? `${title} (Coming Soon)` : title}
      aria-label={disabled ? `${title} (Coming Soon)` : title}
      aria-disabled={disabled}
      onClick={disabled ? undefined : onClick}
      className={cn(
        "flex h-10 w-10 items-center justify-center rounded-md transition-all duration-200",
        active
          ? "bg-blue-600/20 text-blue-400"
          : "text-slate-400 hover:bg-white/5 hover:text-slate-200",
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-slate-400"
      )}
    >
      {children}
    </button>
  );
}

export default function LeftSidebar() {
  const {
    leftExpanded,
    toggleLeft,
    leftMode,
    setLeftMode,
    sessions,
    activeSessionId,
    selectChat,
    renameChat,
    deleteChat,
    newChat,
    setChatOpen,
  } = useGeoGemma();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const openMode = (mode: "chat" | "agent") => {
    setLeftMode(mode);
    if (!leftExpanded) toggleLeft();
    setChatOpen(true);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-50 flex h-full flex-col border-r border-white/10 bg-[#0c1220] transition-all duration-300",
        leftExpanded ? "w-[260px]" : "w-[60px]"
      )}
    >
      <div className="flex h-14 items-center justify-center border-b border-white/10">
        <RailButton title={leftExpanded ? "Collapse sidebar" : "Expand sidebar"} onClick={toggleLeft}>
          <span className={cn("transition-transform duration-300", leftExpanded && "rotate-180")}>
            <ChevronRightIcon width={20} height={20} />
          </span>
        </RailButton>
      </div>

      <div className="flex flex-col items-center gap-1.5 py-3">
        <RailButton title="Chat" active={leftExpanded && leftMode === "chat"} onClick={() => openMode("chat")}>
          <ChatIcon width={20} height={20} />
        </RailButton>
        <RailButton title="Earth Agent" active={leftExpanded && leftMode === "agent"} onClick={() => openMode("agent")}>
          <EarthAgentIcon width={20} height={20} />
        </RailButton>
        <RailButton title="New chat" onClick={newChat}>
          <NewChatIcon width={20} height={20} />
        </RailButton>
      </div>

      {leftExpanded && (
        <div className="flex min-h-0 flex-1 flex-col px-3 pb-2">
          <button
            type="button"
            onClick={newChat}
            className="mb-2 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
          >
            <NewChatIcon width={16} height={16} />
            New chat
          </button>
          <p className="mb-1 px-1 text-xs font-medium uppercase tracking-wider text-slate-500">
            Chats
          </p>
          <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto pr-0.5">
            {sessions.map((s) => (
              <div
                key={s.id}
                className={cn(
                  "group flex items-center gap-1 rounded-md px-2 py-2 transition-colors",
                  s.id === activeSessionId ? "bg-white/10" : "hover:bg-white/5"
                )}
              >
                {editingId === s.id ? (
                  <input
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onBlur={() => {
                      renameChat(s.id, draft);
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        renameChat(s.id, draft);
                        setEditingId(null);
                      }
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="w-full rounded bg-white/10 px-1.5 py-0.5 text-sm text-slate-100 outline-none ring-1 ring-blue-500/50"
                  />
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => selectChat(s.id)}
                      onDoubleClick={() => {
                        setEditingId(s.id);
                        setDraft(s.title);
                      }}
                      title="Open chat (double-click to rename)"
                      className="min-w-0 flex-1 truncate text-left text-sm text-slate-200"
                    >
                      {s.title}
                    </button>
                    <button
                      type="button"
                      title="Delete chat"
                      aria-label={`Delete ${s.title}`}
                      onClick={() => deleteChat(s.id)}
                      className="hidden shrink-0 rounded p-1 text-slate-500 hover:bg-white/10 hover:text-red-400 group-hover:block"
                    >
                      <TrashIcon width={14} height={14} />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-1.5 border-t border-white/10 py-3">
        {COMING_SOON.map((b) => (
          <RailButton key={b.label} title={b.label} disabled>
            <span className="flex h-2.5 w-2.5 rounded-full bg-slate-600" />
          </RailButton>
        ))}
      </div>
    </aside>
  );
}
