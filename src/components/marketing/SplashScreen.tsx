import { useEffect, useState } from "react";
import { COMPANY } from "../../constants/company";

interface SplashScreenProps {
  /** Minimum time the splash stays visible (ms). */
  minDurationMs?: number;
}

export function SplashScreen({ minDurationMs = 1800 }: SplashScreenProps) {
  const [phase, setPhase] = useState<"in" | "out" | "done">("in");

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const hold = reduce ? 400 : minDurationMs;
    const fade = reduce ? 200 : 550;

    const outTimer = window.setTimeout(() => setPhase("out"), hold);
    const doneTimer = window.setTimeout(() => setPhase("done"), hold + fade);

    return () => {
      window.clearTimeout(outTimer);
      window.clearTimeout(doneTimer);
    };
  }, [minDurationMs]);

  useEffect(() => {
    if (phase === "done") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={`mkt-splash${phase === "out" ? " mkt-splash--out" : ""}`}
      role="presentation"
      aria-hidden={phase === "out"}
    >
      <div className="mkt-splash-glow" aria-hidden />
      <div className="mkt-splash-mark">
        <img src="/kalpanik-logo.png?v=3" alt="" draggable={false} />
      </div>
      <p className="mkt-splash-brand">{COMPANY.brand}</p>
      <p className="mkt-splash-tag">{COMPANY.tagline}</p>
    </div>
  );
}
