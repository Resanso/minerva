"use client";

import { useState } from "react";
import GLTFViewer from "@/components/GLTFViewer";
import BottomBar from "@/components/bottom-bar";
import FactoryTopBar from "./FactoryTopBar";
import FactoryLeftRail from "./FactoryLeftRail";
import FactoryRightRail from "./FactoryRightRail";
import FactoryPromptBar from "./FactoryPromptBar";
import { cn } from "@/lib/utils";

// Factory dashboard (monitoring + 3D twin + simulation) in GeoGemma-style
// Google-dark chrome: Roboto (applied by the route), #181818 surfaces,
// #8ab4f8 accents. Reuses existing Minerva logic (viewer, simulation
// provider, modals, notifications) untouched.
export default function FactoryShell() {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fixed inset-0 overflow-hidden bg-[#181818] text-[#e8eaed]">
      <FactoryTopBar leftOffset={expanded ? 260 : 60} />
      <FactoryLeftRail expanded={expanded} onToggle={() => setExpanded((v) => !v)} />
      <main
        className={cn(
          "absolute bottom-0 right-[60px] top-14 transition-all duration-300",
          expanded ? "left-[260px]" : "left-[60px]"
        )}
      >
        <div className="absolute inset-0">
          <GLTFViewer />
        </div>
        <FactoryPromptBar />
      </main>
      <FactoryRightRail />
      {/* Simulation transport docks above the prompt pill on this route. */}
      <BottomBar />
    </div>
  );
}
