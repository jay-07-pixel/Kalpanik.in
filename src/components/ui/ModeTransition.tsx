import { motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { getModeLabel } from "../../theme/colors";

export function ModeTransition() {
  const { mode, isTransitioning, isManual, theme, toggleMode, resetToAuto } = useApp();

  return (
    <>
      <motion.div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          pointerEvents: "none",
        }}
        initial={false}
        animate={{
          opacity: isTransitioning ? 1 : 0,
          background:
            mode === "day"
              ? "radial-gradient(circle at 50% 50%, rgba(186,230,253,0.4) 0%, transparent 70%)"
              : "radial-gradient(circle at 50% 50%, rgba(99,102,241,0.3) 0%, transparent 70%)",
        }}
        transition={{ duration: 1.5, ease: "easeInOut" }}
      />

      <motion.button
        type="button"
        className="mode-badge"
        onClick={toggleMode}
        onDoubleClick={resetToAuto}
        title="Tap to switch mode · Double-tap to reset to auto"
        style={{
          background: theme.surface,
          borderColor: `${theme.accent}30`,
          cursor: "pointer",
          border: `1px solid ${theme.accent}30`,
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.8 }}
        whileHover={{ scale: 1.04, borderColor: theme.accent }}
        whileTap={{ scale: 0.97 }}
      >
        <motion.div
          className="mode-badge-dot"
          style={{
            backgroundColor: theme.accent,
            boxShadow: `0 0 12px ${theme.glow}`,
          }}
          animate={{
            backgroundColor: theme.accent,
            boxShadow: `0 0 16px ${theme.glow}`,
          }}
          transition={{ duration: 3 }}
        />
        <div className="mode-badge-text">
          <span style={{ color: theme.text, fontWeight: 500 }}>
            {getModeLabel(mode)}
            {isManual && (
              <span className="mode-badge-manual" style={{ color: theme.accentSoft }}>
                (manual)
              </span>
            )}
          </span>
          <span className="mode-badge-subtitle" style={{ color: theme.textMuted }}>
            Drag nodes · Tap to pulse
          </span>
        </div>
      </motion.button>
    </>
  );
}
