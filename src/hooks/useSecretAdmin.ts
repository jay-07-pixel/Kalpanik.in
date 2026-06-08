import { useCallback, useRef } from "react";

const REQUIRED_CLICKS = 5;
const WINDOW_MS = 5000;

export function useSecretAdmin(onUnlock: () => void) {
  const timestamps = useRef<number[]>([]);

  const handleSecretClick = useCallback(() => {
    const now = Date.now();
    timestamps.current = timestamps.current.filter((t) => now - t < WINDOW_MS);
    timestamps.current.push(now);

    if (timestamps.current.length >= REQUIRED_CLICKS) {
      timestamps.current = [];
      onUnlock();
    }
  }, [onUnlock]);

  return handleSecretClick;
}
