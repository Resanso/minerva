"use client";

import SimulationScene from "@/components/simulation/simulation";
import {
  SimulationProvider,
  useSimulation,
} from "@/components/simulation/SimulationProvider";
import BottomBar from "@/components/bottom-bar";
import SimulationConfiguratorModal from "@/components/simulation/SimulationConfiguratorModal";
import RealtimeResultModal from "@/components/simulation/RealtimeResultModal";
import TopBar from "@/components/top-bar";
import { HeroUIProvider } from "@heroui/react";

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
  return (
    <HeroUIProvider className="dark">
      <SimulationProvider>
        <div className="relative min-h-screen bg-slate-950 pb-24">
          <TopBar />
          <div className="pt-0">
            <SimulationAwareContent>{children}</SimulationAwareContent>
          </div>
          <BottomBar />
          <SimulationConfiguratorModal />
          <RealtimeResultModal />
        </div>
      </SimulationProvider>
    </HeroUIProvider>
  );
}
