import { useState, type FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "../../context/AdminAuthContext";

interface AdminLoginModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminLoginModal({ open, onClose, onSuccess }: AdminLoginModalProps) {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      setError(result.message ?? "Login failed.");
      return;
    }

    setEmail("");
    setPassword("");
    onSuccess();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="admin-modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="admin-modal"
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 12 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="admin-modal-glow" />
            <p className="admin-modal-eyebrow">Founder Access</p>
            <h2 className="admin-modal-title">Kalpanik Command</h2>
            <p className="admin-modal-sub">Authorized personnel only.</p>

            <form className="admin-modal-form" onSubmit={handleSubmit}>
              <label className="admin-field">
                <span>Email</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="username"
                  disabled={loading}
                />
              </label>
              <label className="admin-field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={loading}
                />
              </label>

              {error && <p className="admin-modal-error">{error}</p>}

              <div className="admin-modal-actions">
                <button type="button" className="admin-btn-ghost" onClick={onClose} disabled={loading}>
                  Cancel
                </button>
                <button type="submit" className="admin-btn-primary" disabled={loading}>
                  {loading ? "Authenticating…" : "Enter Dashboard"}
                </button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
