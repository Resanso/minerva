import { Roboto } from "next/font/google";
import FactoryShell from "@/components/factory-shell/FactoryShell";

const roboto = Roboto({
  weight: ["300", "400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

// Minerva factory dashboard (monitoring + 3D digital twin + simulation)
// presented in Google-dark chrome (Roboto + #181818 surfaces). AppShell
// global TopBar/BottomBar are suppressed on this route; the shell below
// owns the full viewport.
export default function Home() {
  return (
    <div className={roboto.className}>
      <FactoryShell />
    </div>
  );
}
