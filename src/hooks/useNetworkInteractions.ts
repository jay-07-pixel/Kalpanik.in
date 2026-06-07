import { useState, useCallback, useRef } from "react";

const EASTER_EGG_THRESHOLD = 8;

export function useNetworkInteractions() {
  const [count, setCount] = useState(0);
  const [easterEggShown, setEasterEggShown] = useState(false);
  const hasShown = useRef(false);

  const registerInteraction = useCallback(() => {
    setCount((c) => {
      const next = c + 1;
      if (next >= EASTER_EGG_THRESHOLD && !hasShown.current) {
        hasShown.current = true;
        setEasterEggShown(true);
      }
      return next;
    });
  }, []);

  const dismissEasterEgg = useCallback(() => setEasterEggShown(false), []);

  return { interactionCount: count, easterEggShown, registerInteraction, dismissEasterEgg };
}
