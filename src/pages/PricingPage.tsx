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

export function PricingPage() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  usePageTracking("/pricing");
  const handleSecretUnlock = useSecretAdmin(() => setLoginOpen(true));

  return (
    <div className="mkt-shell">
      <SiteNav onLogoSecretClick={handleSecretUnlock} />
      <section className="mkt-hero mkt-hero--compact">
        <div className="mkt-hero-bg" />
        <p className="mkt-trial-badge">{BRAND.trialBadge}</p>
        <h1>Pricing</h1>
        <p className="mkt-hero-sub">{BRAND.specialOffer}</p>
      </section>
      <section className="mkt-section">
        <PricingCards ctaLabel="Continue to Renew" />
      </section>
      <section className="mkt-section mkt-section--soft">
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
