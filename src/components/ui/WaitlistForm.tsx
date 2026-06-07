import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { SITE, WAITLIST_ENDPOINT } from "../../constants/site";

type Status = "idle" | "loading" | "success" | "error" | "duplicate";

interface ApiResponse {
  success: boolean;
  error?: string;
  message?: string;
}

export function WaitlistForm() {
  const { theme } = useApp();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  const resetFeedback = () => {
    if (status === "error" || status === "duplicate") {
      setStatus("idle");
      setMessage("");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) return;

    setStatus("loading");
    setMessage("");

    try {
      const res = await fetch(WAITLIST_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      let data: ApiResponse | null = null;
      try {
        data = (await res.json()) as ApiResponse;
      } catch {
        setStatus("error");
        setMessage(
          res.status >= 500
            ? "Waitlist server is unavailable. Make sure the API is running (npm run dev:api)."
            : "Unexpected response from the server. Please try again."
        );
        return;
      }

      if (res.status === 409 || data.error === "DUPLICATE_EMAIL") {
        setStatus("duplicate");
        setMessage(data.message ?? "This email is already on the waitlist.");
        return;
      }

      if (!res.ok || !data.success) {
        setStatus("error");
        setMessage(data.message ?? "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(data.message ?? "You're on the list. Imagination awaits.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Unable to reach the server. Please try again.");
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
            ✦ {message}
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
              onChange={(e) => {
                setEmail(e.target.value);
                resetFeedback();
              }}
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

      {(status === "error" || status === "duplicate") && (
        <p
          className={`waitlist-error${status === "duplicate" ? " waitlist-error--duplicate" : ""}`}
          style={{ color: status === "duplicate" ? theme.accentSoft : "#f87171" }}
        >
          {message}{" "}
          {status === "error" && (
            <>
              Or email{" "}
              <a href={`mailto:${SITE.email}?subject=Waitlist`} style={{ color: theme.accent }}>
                {SITE.email}
              </a>
            </>
          )}
        </p>
      )}
    </motion.div>
  );
}
