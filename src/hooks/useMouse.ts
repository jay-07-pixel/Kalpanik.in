import { useState, useEffect, useRef } from "react";

interface PointerState {
  x: number;
  y: number;
  normalizedX: number;
  normalizedY: number;
}

function getNormalized(x: number, y: number) {
  return {
    x,
    y,
    normalizedX: (x / window.innerWidth) * 2 - 1,
    normalizedY: -(y / window.innerHeight) * 2 + 1,
  };
}

export function useMouse() {
  const [mouse, setMouse] = useState<PointerState>(() => {
    const cx = typeof window !== "undefined" ? window.innerWidth / 2 : 0;
    const cy = typeof window !== "undefined" ? window.innerHeight / 2 : 0;
    return getNormalized(cx, cy);
  });
  const rafRef = useRef<number>(0);
  const targetRef = useRef({
    x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
    y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
  });

  useEffect(() => {
    const setTarget = (x: number, y: number) => {
      targetRef.current = { x, y };
    };

    const handleMouse = (e: MouseEvent) => setTarget(e.clientX, e.clientY);

    const handleTouch = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setTarget(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    const animate = () => {
      setMouse((prev) => {
        const dx = targetRef.current.x - prev.x;
        const dy = targetRef.current.y - prev.y;
        const x = prev.x + dx * 0.08;
        const y = prev.y + dy * 0.08;
        return getNormalized(x, y);
      });
      rafRef.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", handleMouse, { passive: true });
    window.addEventListener("touchstart", handleTouch, { passive: true });
    window.addEventListener("touchmove", handleTouch, { passive: true });
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", handleMouse);
      window.removeEventListener("touchstart", handleTouch);
      window.removeEventListener("touchmove", handleTouch);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return mouse;
}
