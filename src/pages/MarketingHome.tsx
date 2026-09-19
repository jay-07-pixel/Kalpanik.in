import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteNav } from "../components/marketing/SiteNav";
import { SiteFooter } from "../components/marketing/PricingCards";
import { Reveal } from "../components/marketing/Reveal";
import { AdminLoginModal } from "../components/admin/AdminLoginModal";
import { useSecretAdmin } from "../hooks/useSecretAdmin";
import { usePageTracking } from "../hooks/usePageTracking";
import { ADMIN_LOGIN_PATH } from "../constants/admin";
import {
  COMPANY,
  CUSTOM_SOLUTIONS,
  PRODUCTS,
  TESTIMONIALS,
  TRUSTED_BY,
  WORK_CASES,
} from "../constants/company";
import "../marketing.css";

export function MarketingHome() {
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  usePageTracking("/");
  const handleSecretUnlock = useSecretAdmin(() => setLoginOpen(true));

  const trustLoop = [...TRUSTED_BY, ...TRUSTED_BY];

  return (
    <div className="mkt-shell">
      <SiteNav onLogoSecretClick={handleSecretUnlock} />

      <section className="mkt-hero mkt-hero--company" aria-labelledby="mkt-hero-brand">
        <div className="mkt-hero-bg" aria-hidden />

        <div className="mkt-hero-copy">
          <p className="mkt-hero-kicker">{"< imagination />"}</p>
          <p id="mkt-hero-brand" className="mkt-hero-brand">
            {COMPANY.brand}
          </p>
          <h1 className="mkt-hero-headline">{COMPANY.headline}</h1>
          <p className="mkt-hero-sub">{COMPANY.supporting}</p>
          <div className="mkt-hero-actions">
            <a className="mkt-btn mkt-btn--primary" href="#products">
              Explore products
            </a>
            <a className="mkt-btn mkt-btn--ghost" href="#contact">
              Talk about a custom build
            </a>
            <Link className="mkt-hero-renew" to="/renew">
              Renew
            </Link>
          </div>
        </div>

        <div className="mkt-hero-visual" aria-hidden>
          <div className="mkt-hero-mark">
            <span className="mkt-hero-mark-ring" />
            <span className="mkt-hero-mark-ring mkt-hero-mark-ring--inner" />
            <img src="/kalpanik-logo.png?v=3" alt="" draggable={false} />
          </div>
        </div>
      </section>

      <section className="mkt-trust-strip" aria-label="Trusted by">
        <p className="mkt-trust-label">Trusted by</p>
        <div className="mkt-trust-marquee">
          <ul className="mkt-trust-names">
            {trustLoop.map((name, i) => (
              <li key={`${name}-${i}`}>{name}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="products" className="mkt-section">
        <Reveal className="mkt-section-head">
          <h2>Our products</h2>
          <p>Ready platforms you can buy and renew—plus systems we productize with you.</p>
        </Reveal>
        <div className="mkt-product-list">
          {PRODUCTS.map((product, i) => (
            <Reveal key={product.id} className="mkt-product-row" delay={i * 0.08} as="article">
              <div>
                {product.platforms && (
                  <span className="mkt-product-platforms">{product.platforms}</span>
                )}
                <h3>{product.name}</h3>
                <p>{product.blurb}</p>
              </div>
              <div className="mkt-product-actions">
                {product.primaryHref.startsWith("#") ? (
                  <a className="mkt-btn mkt-btn--primary" href={product.primaryHref}>
                    {product.primaryLabel}
                  </a>
                ) : (
                  <Link className="mkt-btn mkt-btn--primary" to={product.primaryHref}>
                    {product.primaryLabel}
                  </Link>
                )}
                {product.secondaryHref && product.secondaryLabel && (
                  <Link className="mkt-btn mkt-btn--ghost" to={product.secondaryHref}>
                    {product.secondaryLabel}
                  </Link>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="custom" className="mkt-section mkt-section--soft">
        <Reveal className="mkt-section-head">
          <h2>{CUSTOM_SOLUTIONS.headline}</h2>
          <p>{CUSTOM_SOLUTIONS.supporting}</p>
        </Reveal>
        <ul className="mkt-custom-list">
          {CUSTOM_SOLUTIONS.items.map((item, i) => (
            <Reveal key={item} as="li" delay={i * 0.06}>
              {item}
            </Reveal>
          ))}
        </ul>
        <Reveal className="mkt-section-cta" delay={0.18}>
          <a className="mkt-btn mkt-btn--primary" href="#contact">
            Start a custom conversation
          </a>
        </Reveal>
      </section>

      <section id="work" className="mkt-section">
        <Reveal className="mkt-section-head">
          <h2>Selected client work</h2>
          <p>Company deliveries—outcomes first, stack in one line.</p>
        </Reveal>
        <div className="mkt-work-list">
          {WORK_CASES.map((work, i) => (
            <Reveal key={work.id} className="mkt-work-item" delay={i * 0.06} as="article">
              <header>
                <h3>{work.title}</h3>
                <p className="mkt-work-client">Delivered for {work.client}</p>
              </header>
              <p className="mkt-work-outcome">{work.outcome}</p>
              <p className="mkt-work-stack">{work.stack}</p>
              {work.href && (
                <a
                  className="mkt-work-link"
                  href={work.href}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {work.hrefLabel ?? work.href}
                </a>
              )}
            </Reveal>
          ))}
        </div>
      </section>

      <section id="say" className="mkt-section mkt-section--soft">
        <Reveal className="mkt-section-head">
          <h2>What clients say</h2>
          <p>Short notes from teams we ship with.</p>
        </Reveal>
        <div className="mkt-say-list">
          {TESTIMONIALS.map((t, i) => (
            <Reveal key={t.context} as="blockquote" className="mkt-say-item" delay={i * 0.1}>
              <p>“{t.quote}”</p>
              <footer>
                <cite>{t.attribution}</cite>
                <span>{t.context}</span>
              </footer>
            </Reveal>
          ))}
        </div>
      </section>

      <section id="contact" className="mkt-section mkt-contact">
        <Reveal className="mkt-section-head">
          <h2>Imagine it. We’ll build it.</h2>
          <p>
            Tell us what you have in mind—a product fit or a custom workflow—and we’ll get back to
            you.
          </p>
        </Reveal>
        <Reveal className="mkt-contact-actions" delay={0.12}>
          {COMPANY.emails.map((email) => (
            <a key={email} className="mkt-btn mkt-btn--primary" href={`mailto:${email}`}>
              {email}
            </a>
          ))}
          <a className="mkt-btn mkt-btn--ghost" href={COMPANY.phoneHref}>
            {COMPANY.phone}
          </a>
        </Reveal>
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
