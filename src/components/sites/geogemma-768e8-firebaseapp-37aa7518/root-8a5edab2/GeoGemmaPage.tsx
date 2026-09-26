"use client";

import ChatPanel from "./ChatPanel";
import LeftSidebar from "./LeftSidebar";
import MapView from "./MapView";
import PromptBar from "./PromptBar";
import RightSidebar from "./RightSidebar";
import SignInModal from "./SignInModal";
import TopHeader from "./TopHeader";
import { GeoGemmaProvider, useGeoGemma } from "./geogemma-store";
import { cn } from "@/lib/utils";

function Notices() {
  const { notices } = useGeoGemma();
  if (notices.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-24 z-30 flex flex-col items-center gap-2 px-4">
      {notices.map((n) => (
        <p
          key={n.id}
          className="animate-[fadeIn_.25s_ease-out] rounded-full border border-white/10 bg-[#10192e]/95 px-4 py-1.5 text-xs text-slate-200 shadow-xl"
        >
          {n.text}
        </p>
      ))}
    </div>
  );
}

function Shell() {
  const { leftExpanded } = useGeoGemma();
  return (
    <div className="fixed inset-0 overflow-hidden bg-[#0c1220] text-slate-100">
      <TopHeader />
      <LeftSidebar />
      <main
        className={cn(
          "absolute bottom-0 right-[60px] top-14 transition-all duration-300",
          leftExpanded ? "left-[260px]" : "left-[60px]"
        )}
      >
        <MapView />
        <ChatPanel />
        <PromptBar />
        <Notices />
      </main>
      <RightSidebar />
      <SignInModal />
    </div>
  );
}

export default function GeoGemmaPage() {
  return (
    <GeoGemmaProvider>
      <Shell />
    </GeoGemmaProvider>
  );
}
