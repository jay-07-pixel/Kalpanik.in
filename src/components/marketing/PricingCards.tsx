import { Link } from "react-router-dom";
import {
  BRAND,
  EXTRA_STORAGE_LIST_PRICE_PER_GB,
  EXTRA_STORAGE_PRICE_PER_GB,
  PLANS,
  SPECIAL_DISCOUNT_PERCENT,
  TRUST_POINTS,
  type PlanId,
  storageIncludedGb,
} from "../../constants/pricing";

interface PricingCardsProps {
  highlight?: PlanId;
  ctaTo?: string;
  ctaLabel?: string;
}

export function PricingCards({
  highlight = "task_attendance",
  ctaTo = "/renew",
  ctaLabel = "Choose Plan",
}: PricingCardsProps) {
  return (
    <div className="mkt-pricing-grid">
      {(Object.keys(PLANS) as PlanId[]).map((id) => {
        const plan = PLANS[id];
        const featured = id === highlight;
        return (
          <article key={id} className={`mkt-plan-card${featured ? " mkt-plan-card--featured" : ""}`}>
            <span className="mkt-offer-badge">{SPECIAL_DISCOUNT_PERCENT}% OFF</span>
            {featured && <span className="mkt-plan-badge">Most Popular</span>}
            <h3>{plan.name}</h3>
            <p className="mkt-plan-list-price">
              <s>₹{plan.listPricePerUser}</s>
              <span>/ user / month</span>
            </p>
            <p className="mkt-plan-price">
              ₹{plan.pricePerUser}
              <span>/ user / month</span>
            </p>
            <p className="mkt-offer-note">{BRAND.specialOffer}</p>
            <p className="mkt-plan-storage">1 GB per user · e.g. 5 users = {storageIncludedGb(5)} GB</p>
            <p className="mkt-plan-tagline">{plan.tagline}</p>
            {plan.includesPrevious && (
              <p className="mkt-plan-includes">Everything in Task Management, plus:</p>
            )}
            <ul className="mkt-plan-features">
              {plan.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
            <Link className="mkt-btn mkt-btn--primary" to={`${ctaTo}?plan=${id}`}>
              {ctaLabel}
            </Link>
          </article>
        );
      })}

      <aside className="mkt-storage-card">
        <span className="mkt-offer-badge">{SPECIAL_DISCOUNT_PERCENT}% OFF</span>
        <h3>Extra Storage</h3>
        <p className="mkt-plan-list-price">
          <s>₹{EXTRA_STORAGE_LIST_PRICE_PER_GB}</s>
          <span>/ GB / month</span>
        </p>
        <p className="mkt-plan-price">
          ₹{EXTRA_STORAGE_PRICE_PER_GB}
          <span>/ GB / month</span>
        </p>
        <p className="mkt-offer-note">Special price for lucky customers</p>
        <p>
          Used for chats, proof submissions, media & voice notes. Cancel anytime.
          When storage is full, new uploads are blocked until you delete files or buy more.
        </p>
      </aside>
    </div>
  );
}

export function TrustStrip() {
  return (
    <ul className="mkt-trust">
      {TRUST_POINTS.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  );
}

export function SiteFooter() {
  return (
    <footer className="mkt-footer">
      <div className="mkt-footer-inner">
        <div>
          <strong>{BRAND.name}</strong>
          <p>{BRAND.tagline}</p>
        </div>
        <div className="mkt-footer-links">
          <Link to="/pricing">Pricing</Link>
          <Link to="/renew">Renew Subscription</Link>
          <a href={`mailto:${BRAND.supportEmail}`}>{BRAND.supportEmail}</a>
        </div>
      </div>
      <p className="mkt-footer-copy">© {new Date().getFullYear()} Kalpanik. All rights reserved.</p>
    </footer>
  );
}
