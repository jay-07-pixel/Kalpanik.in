import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SiteNav } from "../components/marketing/SiteNav";
import { PricingCards, SiteFooter, TrustStrip } from "../components/marketing/PricingCards";
import { AdminLoginModal } from "../components/admin/AdminLoginModal";
import { useSecretAdmin } from "../hooks/useSecretAdmin";
import { usePageTracking } from "../hooks/usePageTracking";
import { ADMIN_LOGIN_PATH } from "../constants/admin";
import { BRAND } from "../constants/pricing";
import "../marketing.css";

export function MarketingHome() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  usePageTracking("/");
  const handleSecretUnlock = useSecretAdmin(() => setLoginOpen(true));

  return (
    <div className="mkt-shell">
      <SiteNav onLogoSecretClick={handleSecretUnlock} />

      <section className="mkt-hero">
        <div className="mkt-hero-bg" />
        <p className="mkt-trial-badge">{BRAND.trialBadge}</p>
        <h1>{BRAND.hero}</h1>
        <p className="mkt-hero-sub">
          Kalpanik Task Manager helps teams manage work, track attendance, and grow together —
          on Android and Web.
        </p>
        <div className="mkt-hero-actions">
          <a className="mkt-btn mkt-btn--primary" href="/pricing">
            View Pricing
          </a>
          <a className="mkt-btn mkt-btn--ghost" href="/renew">
            Renew Subscription
          </a>
        </div>
      </section>

      <section className="mkt-section">
        <div className="mkt-section-head">
          <h2>Choose Your Plan</h2>
          <p>{BRAND.specialOffer} — limited celebration pricing on every plan.</p>
        </div>
        <PricingCards />
      </section>

      <section className="mkt-section mkt-section--soft">
        <div className="mkt-section-head">
          <h2>Built for growing teams</h2>
          <p>Trust points your customers expect from a production work platform.</p>
        </div>
        <TrustStrip />
      </section>

      <SiteFooter />

      <AdminLoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onSuccess={() => {
          setLoginOpen(false);
          navigate(ADMIN_LOGIN_PATH);
        }}
      />
    </div>
  );
}
