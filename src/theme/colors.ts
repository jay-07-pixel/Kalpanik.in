export type TimeMode = "day" | "night";

export interface ThemeColors {
  bg: string;
  surface: string;
  accent: string;
  accentSoft: string;
  text: string;
  textMuted: string;
  glow: string;
  particlePrimary: string;
  particleSecondary: string;
  lineColor: string;
  fogColor: string;
  ambientIntensity: number;
  pointLightColor: string;
}

export const themes: Record<TimeMode, ThemeColors> = {
  day: {
    bg: "#eef2f7",
    surface: "rgba(255, 255, 255, 0.55)",
    accent: "#0ea5e9",
    accentSoft: "#38bdf8",
    text: "#0f172a",
    textMuted: "#64748b",
    glow: "rgba(14, 165, 233, 0.35)",
    particlePrimary: "#0ea5e9",
    particleSecondary: "#7dd3fc",
    lineColor: "#38bdf8",
    fogColor: "#eef2f7",
    ambientIntensity: 0.8,
    pointLightColor: "#bae6fd",
  },
  night: {
    bg: "#030712",
    surface: "rgba(15, 23, 42, 0.5)",
    accent: "#818cf8",
    accentSoft: "#c084fc",
    text: "#f1f5f9",
    textMuted: "#94a3b8",
    glow: "rgba(129, 140, 248, 0.45)",
    particlePrimary: "#818cf8",
    particleSecondary: "#c084fc",
    lineColor: "#6366f1",
    fogColor: "#030712",
    ambientIntensity: 0.3,
    pointLightColor: "#a78bfa",
  },
};

export function getTimeMode(): TimeMode {
  return "day";
}

export function getModeLabel(mode: TimeMode): string {
  return mode === "day" ? "Day Mode" : "Night Mode";
}

export function getModeDescription(mode: TimeMode): string {
  return mode === "day"
    ? "Innovation · Creativity · Possibility"
    : "Intelligence · Power · Technology";
}
