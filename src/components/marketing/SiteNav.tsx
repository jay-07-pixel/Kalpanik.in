import { Link, NavLink } from "react-router-dom";
import { BRAND } from "../../constants/pricing";

interface SiteNavProps {
  onLogoSecretClick?: () => void;
}

export function SiteNav({ onLogoSecretClick }: SiteNavProps) {
  return (
    <header className="mkt-nav">
      <button type="button" className="mkt-nav-brand" onClick={onLogoSecretClick} aria-label="Kalpanik">
        <img src="/kalpanik-logo.png?v=3" alt="" className="mkt-nav-logo" draggable={false} />
        <span>
          <strong>{BRAND.name}</strong>
          <em>{BRAND.tagline}</em>
        </span>
      </button>
      <nav className="mkt-nav-links">
        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/renew">Renew</NavLink>
        <Link to="/renew" className="mkt-nav-cta">
          Start Free Trial
        </Link>
      </nav>
    </header>
  );
}
