import { Link, NavLink, useLocation } from "react-router-dom";
import { BRAND } from "../../constants/pricing";
import { COMPANY } from "../../constants/company";

interface SiteNavProps {
  onLogoSecretClick?: () => void;
}

function homeHash(hash: string) {
  return `/${hash}`;
}

export function SiteNav({ onLogoSecretClick }: SiteNavProps) {
  const { pathname } = useLocation();
  const onHome = pathname === "/";

  return (
    <header className="mkt-nav">
      <button type="button" className="mkt-nav-brand" onClick={onLogoSecretClick} aria-label="Kalpanik">
        <img src="/kalpanik-logo.png?v=3" alt="" className="mkt-nav-logo" draggable={false} />
        <span>
          <strong>{BRAND.name}</strong>
          <em>{COMPANY.tagline}</em>
        </span>
      </button>
      <nav className="mkt-nav-links" aria-label="Primary">
        {onHome ? (
          <a href="#products">Products</a>
        ) : (
          <Link to={homeHash("#products")}>Products</Link>
        )}
        {onHome ? <a href="#work">Work</a> : <Link to={homeHash("#work")}>Work</Link>}
        <NavLink to="/pricing">Pricing</NavLink>
        <NavLink to="/renew">Renew</NavLink>
        {onHome ? (
          <a href="#contact" className="mkt-nav-cta">
            Contact
          </a>
        ) : (
          <Link to={homeHash("#contact")} className="mkt-nav-cta">
            Contact
          </Link>
        )}
      </nav>
    </header>
  );
}
