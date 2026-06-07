import { motion } from "framer-motion";

export function Logo() {
  return (
    <motion.a
      href="/"
      className="site-logo"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.8 }}
      aria-label="Kalpanik home"
    >
      <img src="/kalpanik-logo.png?v=3" alt="Kalpanik" draggable={false} />
    </motion.a>
  );
}
