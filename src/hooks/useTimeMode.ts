import { useState, useEffect, useCallback } from "react";
import { getTimeMode, type TimeMode } from "../theme/colors";

export function useTimeMode() {
  const [autoMode, setAutoMode] = useState<TimeMode>("day");
  const [manualMode, setManualMode] = useState<TimeMode | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const mode = manualMode ?? autoMode;

  const triggerTransition = useCallback(() => {
    setIsTransitioning(true);
    const timer = setTimeout(() => setIsTransitioning(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const checkAutoMode = useCallback(() => {
    const next = getTimeMode();
    setAutoMode((prev) => {
      if (prev !== next && manualMode === null) {
        triggerTransition();
      }
      return next;
    });
  }, [manualMode, triggerTransition]);

  useEffect(() => {
    const interval = setInterval(checkAutoMode, 30_000);
    return () => clearInterval(interval);
  }, [checkAutoMode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-mode", mode);
  }, [mode]);

  const toggleMode = useCallback(() => {
    setManualMode((prev) => {
      const current = prev ?? autoMode;
      const next = current === "day" ? "night" : "day";
      triggerTransition();
      return next;
    });
  }, [autoMode, triggerTransition]);

  const resetToAuto = useCallback(() => {
    const next = getTimeMode();
    setManualMode(null);
    setAutoMode(next);
    triggerTransition();
  }, [triggerTransition]);

  return {
    mode,
    autoMode,
    isManual: manualMode !== null,
    isTransitioning,
    toggleMode,
    resetToAuto,
  };
}
