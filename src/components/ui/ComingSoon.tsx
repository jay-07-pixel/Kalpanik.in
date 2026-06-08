import { motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { useIsMobile } from "../../hooks/useMediaQuery";
import { SITE } from "../../constants/site";
import { WaitlistForm } from "./WaitlistForm";

interface ComingSoonProps {
  onSecretBadgeClick?: () => void;
}

export function ComingSoon({ onSecretBadgeClick }: ComingSoonProps) {
  const { theme, mouse } = useApp();
  const isMobile = useIsMobile();

  const parallaxX = isMobile ? 0 : mouse.normalizedX * -8;
  const parallaxY = isMobile ? 0 : mouse.normalizedY * -5;

  return (
    <section className="hero-section">
      <motion.div
        className="hero-inner"
        style={{ transform: `translate(${parallaxX}px, ${parallaxY}px)` }}
      >
        <motion.div
          className="coming-soon-badge"
          style={{
            color: theme.accent,
            borderColor: `${theme.accent}40`,
            background: `${theme.accent}10`,
          }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
        >
          <span className="coming-soon-badge-text" onClick={onSecretBadgeClick} role="presentation">
            Coming Soon
          </span>
          <span className="coming-soon-badge-sep"> · {SITE.launchYear}</span>
        </motion.div>

        <motion.div
          className="hero-title-wrap"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          <img
            src="/kalpanik-wordmark.png?v=3"
            alt="Kalpanik"
            className="hero-wordmark"
            draggable={false}
          />
        </motion.div>

        <motion.div
          className="hero-divider"
          style={{
            background: `linear-gradient(90deg, transparent, ${theme.accent}, transparent)`,
          }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
        />

        <motion.p
          className="hero-tagline"
          style={{ color: theme.accent }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.8 }}
        >
          We Deliver What You Imagine
        </motion.p>

        <motion.p
          className="hero-desc"
          style={{ color: theme.textMuted }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.7, duration: 1 }}
        >
          Building AI solutions, software products, automation systems, and digital experiences.
        </motion.p>

        <WaitlistForm />
      </motion.div>

      <motion.footer
        className="coming-soon-footer"
        style={{ color: theme.textMuted }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 3, duration: 0.8 }}
      >
        <span>© {new Date().getFullYear()} Kalpanik</span>
        <span className="footer-sep">·</span>
        <a href={`mailto:${SITE.email}`} style={{ color: theme.accent }}>
          {SITE.email}
        </a>
      </motion.footer>
    </section>
  );
}
