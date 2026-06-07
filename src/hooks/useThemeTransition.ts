import { useState, useEffect, useRef } from "react";
import { themes, type TimeMode, type ThemeColors } from "../theme/colors";

function lerpColor(a: string, b: string, t: number): string {
  const parse = (hex: string) => {
    if (hex.startsWith("rgba")) {
      const m = hex.match(/[\d.]+/g);
      return m ? m.map(Number) : [0, 0, 0, 1];
    }
    const h = hex.replace("#", "");
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16),
      1,
    ];
  };

  const ca = parse(a);
  const cb = parse(b);
  const r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
  const g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
  const bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
  const alpha = ca[3] + (cb[3] - ca[3]) * t;

  if (alpha < 1) return `rgba(${r},${g},${bl},${alpha.toFixed(2)})`;
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${bl.toString(16).padStart(2, "0")}`;
}

function lerpTheme(from: ThemeColors, to: ThemeColors, t: number): ThemeColors {
  return {
    bg: lerpColor(from.bg, to.bg, t),
    surface: from.surface,
    accent: lerpColor(from.accent, to.accent, t),
    accentSoft: lerpColor(from.accentSoft, to.accentSoft, t),
    text: lerpColor(from.text, to.text, t),
    textMuted: lerpColor(from.textMuted, to.textMuted, t),
    glow: from.glow,
    particlePrimary: lerpColor(from.particlePrimary, to.particlePrimary, t),
    particleSecondary: lerpColor(from.particleSecondary, to.particleSecondary, t),
    lineColor: lerpColor(from.lineColor, to.lineColor, t),
    fogColor: lerpColor(from.fogColor, to.fogColor, t),
    ambientIntensity: from.ambientIntensity + (to.ambientIntensity - from.ambientIntensity) * t,
    pointLightColor: lerpColor(from.pointLightColor, to.pointLightColor, t),
  };
}

const DURATION = 3000;

export function useThemeTransition(mode: TimeMode) {
  const [displayTheme, setDisplayTheme] = useState<ThemeColors>(themes[mode]);
  const prevMode = useRef(mode);
  const animRef = useRef<number>(0);
  const startRef = useRef(0);

  useEffect(() => {
    if (prevMode.current === mode) {
      setDisplayTheme(themes[mode]);
      return;
    }

    const from = themes[prevMode.current];
    const to = themes[mode];
    startRef.current = performance.now();
    prevMode.current = mode;

    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / DURATION, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setDisplayTheme(lerpTheme(from, to, eased));

      if (t < 1) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayTheme(to);
      }
    };

    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [mode]);

  return displayTheme;
}
