import { useEffect, useId, useState } from "react";
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
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const close = () => setMenuOpen(false);

  const links = (
    <>
      {onHome ? (
        <a href="#products" onClick={close}>
          Products
        </a>
      ) : (
        <Link to={homeHash("#products")} onClick={close}>
          Products
        </Link>
      )}
      {onHome ? (
        <a href="#work" onClick={close}>
          Work
        </a>
      ) : (
        <Link to={homeHash("#work")} onClick={close}>
          Work
        </Link>
      )}
      <NavLink to="/pricing" onClick={close}>
        Pricing
      </NavLink>
      <NavLink to="/renew" onClick={close}>
        Renew
      </NavLink>
      {onHome ? (
        <a href="#contact" className="mkt-nav-cta" onClick={close}>
          Contact
        </a>
      ) : (
        <Link to={homeHash("#contact")} className="mkt-nav-cta" onClick={close}>
          Contact
        </Link>
      )}
    </>
  );

  return (
    <header className={`mkt-nav${menuOpen ? " mkt-nav--open" : ""}`}>
      <button type="button" className="mkt-nav-brand" onClick={onLogoSecretClick} aria-label="Kalpanik">
        <img src="/kalpanik-logo.png?v=3" alt="" className="mkt-nav-logo" draggable={false} />
        <span>
          <strong>{BRAND.name}</strong>
          <em>{COMPANY.tagline}</em>
        </span>
      </button>

      <nav className="mkt-nav-links mkt-nav-links--desktop" aria-label="Primary">
        {links}
      </nav>

      <button
        type="button"
        className="mkt-nav-toggle"
        aria-expanded={menuOpen}
        aria-controls={menuId}
        aria-label={menuOpen ? "Close menu" : "Open menu"}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span />
        <span />
        <span />
      </button>

      <div
        id={menuId}
        className={`mkt-nav-drawer${menuOpen ? " mkt-nav-drawer--open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <nav className="mkt-nav-links mkt-nav-links--mobile" aria-label="Mobile">
          {links}
        </nav>
      </div>
      {menuOpen && (
        <button type="button" className="mkt-nav-backdrop" aria-label="Close menu" onClick={close} />
      )}
    </header>
  );
}
