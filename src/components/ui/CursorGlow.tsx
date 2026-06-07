import { motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { useIsTouchDevice } from "../../hooks/useMediaQuery";

export function CursorGlow() {
  const { theme, mouse } = useApp();
  const isTouch = useIsTouchDevice();

  if (isTouch) return null;

  return (
    <motion.div
      className="cursor-glow"
      style={{
        width: 400,
        height: 400,
        left: mouse.x - 200,
        top: mouse.y - 200,
        background: `radial-gradient(circle, ${theme.glow} 0%, transparent 70%)`,
        opacity: 0.4,
      }}
      animate={{
        left: mouse.x - 200,
        top: mouse.y - 200,
      }}
      transition={{ type: "spring", damping: 30, stiffness: 200, mass: 0.5 }}
    />
  );
}
