import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface RevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "article" | "li" | "blockquote";
}

export function Reveal({
  children,
  className,
  delay = 0,
  y = 36,
  as = "div",
}: RevealProps) {
  const reduce = useReducedMotion();
  const props = {
    className,
    initial: reduce ? false : { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.22, margin: "0px 0px -8% 0px" },
    transition: { duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] as const },
  };

  if (as === "section") return <motion.section {...props}>{children}</motion.section>;
  if (as === "article") return <motion.article {...props}>{children}</motion.article>;
  if (as === "li") return <motion.li {...props}>{children}</motion.li>;
  if (as === "blockquote") return <motion.blockquote {...props}>{children}</motion.blockquote>;
  return <motion.div {...props}>{children}</motion.div>;
}
