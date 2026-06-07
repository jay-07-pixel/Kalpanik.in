import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../context/AppContext";

export function EasterEggToast() {
  const { theme, easterEggShown, dismissEasterEgg } = useApp();

  return (
    <AnimatePresence>
      {easterEggShown && (
        <motion.div
          className="easter-egg"
          style={{
            background: theme.surface,
            borderColor: `${theme.accent}40`,
            boxShadow: `0 12px 48px ${theme.glow}`,
          }}
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
        >
          <button
            type="button"
            className="easter-egg-close"
            onClick={dismissEasterEgg}
            style={{ color: theme.textMuted }}
            aria-label="Dismiss"
          >
            ×
          </button>
          <p className="font-display" style={{ color: theme.accent, fontSize: "0.8rem", letterSpacing: "0.15em" }}>
            EARLY ACCESS
          </p>
          <p style={{ color: theme.text, fontWeight: 500, marginTop: 6 }}>
            You think like us. You're early.
          </p>
          <p style={{ color: theme.textMuted, fontSize: "0.8rem", marginTop: 4 }}>
            Keep playing with the network — you're one of us.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
