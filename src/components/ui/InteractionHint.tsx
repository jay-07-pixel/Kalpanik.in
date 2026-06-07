import { useApp } from "../../context/AppContext";
import { useIsMobile } from "../../hooks/useMediaQuery";

const HINTS = {
  day: {
    desktop: "✦ Move cursor to pull nodes · Drag to reshape the network",
    mobile: "✦ Touch & drag the network",
  },
  night: {
    desktop: "✦ Move cursor to pull stars · Drag to reshape the constellation",
    mobile: "✦ Touch & drag the constellation",
  },
};

export function InteractionHint() {
  const { mode, theme } = useApp();
  const isMobile = useIsMobile();

  return (
    <div
      className="interaction-hint"
      style={{
        background: theme.surface,
        border: `1px solid ${theme.accent}30`,
        color: theme.textMuted,
      }}
    >
      {isMobile ? HINTS[mode].mobile : HINTS[mode].desktop}
    </div>
  );
}
