import type { MouseEvent } from "react";
import { motion } from "framer-motion";

interface LogoProps {
  onSecretClick?: () => void;
}

export function Logo({ onSecretClick }: LogoProps) {
  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSecretClick?.();
  };

  return (
    <motion.button
      type="button"
      className="site-logo"
      onClick={handleClick}
      aria-label="Kalpanik"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
    >
      <img src="/kalpanik-logo.png?v=3" alt="" draggable={false} />
    </motion.button>
  );
}
