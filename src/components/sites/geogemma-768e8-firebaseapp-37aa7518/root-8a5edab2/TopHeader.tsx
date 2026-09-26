"use client";

import { GlobeLogoIcon, GridIcon } from "../shared/icons";
import { useGeoGemma } from "./geogemma-store";

export default function TopHeader() {
  const { leftExpanded, toggleRight, user } = useGeoGemma();

  return (
    <header
      className="fixed top-0 right-0 z-40 flex h-14 items-center justify-between border-b border-white/10 bg-[#0c1220] px-4 transition-all duration-300"
      style={{ left: leftExpanded ? 260 : 60 }}
    >
      <div className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
          <GlobeLogoIcon width={20} height={20} />
        </span>
        <h1 className="hidden text-lg font-semibold tracking-tight text-slate-100 sm:block">
          GeoGemma
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => toggleRight("layers")}
          title="Open Dataset Explorer"
          className="flex items-center gap-2 whitespace-nowrap rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
        >
          <GridIcon width={18} height={18} />
          <span className="hidden md:inline">Dataset Explorer</span>
        </button>
        <span
          title={user ? user.name : "Guest session"}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white"
        >
          {user ? user.initial : "U"}
        </span>
      </div>
    </header>
  );
}
