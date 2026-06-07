import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { useIsMobile } from "../../hooks/useMediaQuery";

export function ImaginationCounter() {
  const { theme, interactionCount, mode } = useApp();
  const isMobile = useIsMobile();
  const nodeCount = mode === "day" ? (isMobile ? 40 : 55) : isMobile ? 45 : 65;

  return (
    <motion.div
      className="interaction-counter"
      style={{
        background: theme.surface,
        borderColor: `${theme.accent}35`,
        boxShadow: `0 4px 24px ${theme.glow}`,
      }}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 2, duration: 0.6 }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={interactionCount}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          {interactionCount === 0 ? (
            <p className="interaction-counter-text" style={{ color: theme.textMuted }}>
              <span className="font-display interaction-counter-num" style={{ color: theme.accent }}>
                {nodeCount}
              </span>
              {" "}nodes in the network
              <br />
              <span className="interaction-counter-hint">
                {isMobile ? "Touch & drag in open areas" : "Move cursor — click or drag nodes"}
              </span>
            </p>
          ) : (
            <p className="interaction-counter-text" style={{ color: theme.text }}>
              <span className="font-display interaction-counter-count" style={{ color: theme.accent }}>
                {interactionCount}
              </span>
              <span style={{ color: theme.textMuted }}>
                {interactionCount === 1
                  ? " connection shaped by you"
                  : " connections shaped by you"}
              </span>
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
