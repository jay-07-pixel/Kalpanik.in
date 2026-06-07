import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { SITE, WAITLIST_KEY, WAITLIST_ENDPOINT } from "../../constants/site";

type Status = "idle" | "loading" | "success" | "error";

export function WaitlistForm() {
  const { theme } = useApp();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    setStatus("loading");

    try {
      if (WAITLIST_ENDPOINT) {
        const res = await fetch(WAITLIST_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        });
        if (!res.ok) throw new Error("Request failed");
      } else {
        const existing: string[] = JSON.parse(localStorage.getItem(WAITLIST_KEY) || "[]");
        if (!existing.includes(email.trim())) {
          localStorage.setItem(WAITLIST_KEY, JSON.stringify([...existing, email.trim()]));
        }
        await new Promise((r) => setTimeout(r, 600));
      }
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <motion.div
      className="waitlist-panel"
      style={{
        background: theme.surface,
        borderColor: `${theme.accent}25`,
        boxShadow: `0 8px 40px ${theme.glow}`,
      }}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 2.0, duration: 0.8 }}
    >
      <p className="waitlist-label" style={{ color: theme.textMuted }}>
        Be the first to know when we launch
      </p>

      <AnimatePresence mode="wait">
        {status === "success" ? (
          <motion.div
            key="success"
            className="waitlist-success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ color: theme.accent }}
          >
            ✦ You're on the list. Imagination awaits.
          </motion.div>
        ) : (
          <motion.form
            key="form"
            className="waitlist-form"
            onSubmit={handleSubmit}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              disabled={status === "loading"}
              className="waitlist-input"
              style={{
                color: theme.text,
                background: `${theme.accent}08`,
                borderColor: `${theme.accent}30`,
              }}
            />
            <motion.button
              type="submit"
              disabled={status === "loading"}
              className="waitlist-btn"
              style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.accentSoft})`,
                boxShadow: `0 4px 20px ${theme.glow}`,
              }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              {status === "loading" ? "Joining…" : "Join Waitlist"}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>

      {status === "error" && (
        <p className="waitlist-error" style={{ color: "#f87171" }}>
          Something went wrong — try{" "}
          <a href={`mailto:${SITE.email}?subject=Waitlist`} style={{ color: theme.accent }}>
            {SITE.email}
          </a>
        </p>
      )}
    </motion.div>
  );
}
