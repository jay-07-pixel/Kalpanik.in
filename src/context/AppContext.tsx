import { createContext, useContext, type ReactNode } from "react";
import { useTimeMode } from "../hooks/useTimeMode";
import { useThemeTransition } from "../hooks/useThemeTransition";
import { useMouse } from "../hooks/useMouse";
import { useScroll } from "../hooks/useScroll";
import { useNetworkInteractions } from "../hooks/useNetworkInteractions";
import { type TimeMode, type ThemeColors } from "../theme/colors";

interface AppContextValue {
  mode: TimeMode;
  autoMode: TimeMode;
  isManual: boolean;
  theme: ThemeColors;
  isTransitioning: boolean;
  toggleMode: () => void;
  resetToAuto: () => void;
  mouse: ReturnType<typeof useMouse>;
  scroll: ReturnType<typeof useScroll>;
  registerInteraction: () => void;
  interactionCount: number;
  easterEggShown: boolean;
  dismissEasterEgg: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { mode, autoMode, isManual, isTransitioning, toggleMode, resetToAuto } =
    useTimeMode();
  const theme = useThemeTransition(mode);
  const mouse = useMouse();
  const scroll = useScroll();
  const { registerInteraction, interactionCount, easterEggShown, dismissEasterEgg } =
    useNetworkInteractions();

  return (
    <AppContext.Provider
      value={{
        mode,
        autoMode,
        isManual,
        theme,
        isTransitioning,
        toggleMode,
        resetToAuto,
        mouse,
        scroll,
        registerInteraction,
        interactionCount,
        easterEggShown,
        dismissEasterEgg,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
