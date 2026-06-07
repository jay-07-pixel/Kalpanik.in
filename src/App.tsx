import { LivingScene } from "./components/scene/LivingScene";
import { ComingSoon } from "./components/ui/ComingSoon";
import { Logo } from "./components/ui/Logo";
import { ModeTransition } from "./components/ui/ModeTransition";
import { InteractionHint } from "./components/ui/InteractionHint";
import { EasterEggToast } from "./components/ui/EasterEggToast";
import { ImaginationCounter } from "./components/ui/ImaginationCounter";
import { CursorGlow } from "./components/ui/CursorGlow";
import { AppProvider, useApp } from "./context/AppContext";

function AppContent() {
  const { theme } = useApp();

  return (
    <div
      className="app-shell"
      style={{
        color: theme.text,
        transition: "color 3s ease",
      }}
    >
      <LivingScene />
      <CursorGlow />
      <Logo />
      <ModeTransition />
      <InteractionHint />
      <ImaginationCounter />
      <EasterEggToast />

      <main className="content-layer">
        <ComingSoon />
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
