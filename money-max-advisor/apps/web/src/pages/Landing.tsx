import { Link } from 'react-router-dom'
import '../styles/landing.css'

const FEATURES = [
  {
    title: 'Intelligent Debt Strategy',
    desc: 'Ledgerline models every dollar of debt and finds the fastest path to zero.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    title: 'Action Plan',
    desc: 'Every recommendation is a clear, approved action. Money never moves without you.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    ),
  },
  {
    title: 'Cashflow Clarity',
    desc: 'See exactly where every dollar flows — income, bills, and discretionary spending.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
      </svg>
    ),
  },
  {
    title: 'Wealth Projection',
    desc: 'Watch your net worth grow and interest costs shrink with compound projections.',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
        <polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
  },
]

export default function Landing() {
  return (
    <div className="landing page-enter" role="main">
      <div className="landing__bg" aria-hidden="true" />

      {/* Nav */}
      <nav className="landing__nav" aria-label="Site navigation">
        <Link to="/" className="landing__wordmark" aria-label="Ledgerline home">
          <svg
            className="landing__wordmark-icon"
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect width="32" height="32" rx="6" fill="#061018"/>
            <path d="M6 22 L16 10 L26 22" stroke="#1AA68A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <line x1="4" y1="22" x2="28" y2="22" stroke="#E8E2D6" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          Ledgerline
        </Link>

        <ul className="landing__nav-links" role="list">
          <li><Link to="#features" className="landing__nav-link">Features</Link></li>
          <li><Link to="/app/setup" className="landing__nav-link">Get started</Link></li>
          <li>
            <Link to="/app" className="btn btn-primary btn-sm">Open App</Link>
          </li>
        </ul>
      </nav>

      {/* Hero — full-bleed atmosphere, brand first */}
      <section className="landing__hero" aria-labelledby="hero-headline">
        <div className="landing__eyebrow" aria-label="Category">
          <span className="landing__eyebrow-dot" aria-hidden="true" />
          Intelligent Financial Advisor
        </div>

        <h1 className="landing__headline" id="hero-headline">
          Get debt-free<br /><em>faster than you think</em>
        </h1>

        <p className="landing__subhead">
          Ledgerline analyses your accounts, models the fastest debt-elimination
          path, and hands you a clear action plan — with no money ever moving
          without your approval.
        </p>

        <div className="landing__cta-group">
          <Link to="/app" className="landing__cta-primary">
            Open Dashboard
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
          <Link to="/app/setup" className="landing__cta-secondary">
            Set up in 5 minutes
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12"/>
              <polyline points="12 5 19 12 12 19"/>
            </svg>
          </Link>
        </div>
      </section>

      {/* Feature cards */}
      <section className="landing__features" id="features" aria-label="Features">
        {FEATURES.map((f) => (
          <article key={f.title} className="landing__feature">
            <div className="landing__feature-icon" aria-hidden="true">
              {f.icon}
            </div>
            <h3 className="landing__feature-title">{f.title}</h3>
            <p className="landing__feature-desc">{f.desc}</p>
          </article>
        ))}
      </section>

      <footer className="landing__footer">
        <p>
          &copy; {new Date().getFullYear()} Ledgerline &mdash; Ledgerline is a financial
          advisor tool. It does not hold funds or execute transactions on your behalf.
        </p>
      </footer>
    </div>
  )
}
