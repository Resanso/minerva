"use client";

import SimulationScene from "@/components/simulation/simulation";
import {
  SimulationProvider,
  useSimulation,
} from "@/components/simulation/SimulationProvider";
import BottomBar from "@/components/bottom-bar";
import SimulationConfiguratorModal from "@/components/simulation/SimulationConfiguratorModal";
import TopBar from "@/components/top-bar";
import { HeroUIProvider } from "@heroui/react";
import { usePathname } from "next/navigation";

type AppShellProps = {
  children: React.ReactNode;
};

function SimulationAwareContent({ children }: { children: React.ReactNode }) {
  const { isSimulationMode } = useSimulation();
  return (
    <main className="relative h-full w-full">
      {isSimulationMode ? <SimulationScene /> : children}
    </main>
  );
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  // Immersive full-viewport pages (`/` factory shell, `/geogemma` clone)
  // own their header + floating controls, so the global chrome stays out
  // of their way. All other routes keep TopBar/BottomBar.
  const hideChrome = pathname === "/" || pathname === "/geogemma";
  return (
    <HeroUIProvider className="dark">
      <SimulationProvider>
        <div className="relative min-h-screen bg-slate-950 pb-24">
          {!hideChrome && <TopBar />}
          <div className="pt-0">
            <SimulationAwareContent>{children}</SimulationAwareContent>
          </div>
          {!hideChrome && <BottomBar />}
          <SimulationConfiguratorModal />
        </div>
      </SimulationProvider>
    </HeroUIProvider>
  );
}
