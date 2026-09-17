import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { useCreator } from '../contexts/CreatorContext';
import { SocialLinks } from './common';
import { loadAnalytics, attribution, track } from '../services/analytics';
const navigation = [
  ['/', 'Home'],
  ['/about', 'About'],
  ['/portfolio', 'Portfolio'],
  ['/shop', 'Shop My Picks'],
  ['/work-with-me', 'Work With Me'],
  ['/blog', 'Blog'],
  ['/contact', 'Contact'],
];
export default function Layout({ children }: { children: ReactNode }) {
  const c = useCreator();
  const loc = useLocation();
  const [menu, setMenu] = useState(false);
  const [consent, setConsent] = useState(() => localStorage.getItem('analytics-consent'));
  useEffect(() => {
    setMenu(false);
    window.scrollTo(0, 0);
    attribution();
    loadAnalytics();
    track('page_view');
  }, [loc.pathname, loc.search]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(false);
    };
    window.addEventListener('keydown', f);
    return () => window.removeEventListener('keydown', f);
  }, []);
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <header className="navbar">
        <Link className="wordmark" to="/">
          {c.name}
          <span>BEAUTY · FASHION · LIFE</span>
        </Link>
        <button
          className="menu-toggle"
          onClick={() => setMenu(!menu)}
          aria-label={menu ? 'Close navigation' : 'Open navigation'}
          aria-expanded={menu}
          aria-controls="primary-nav"
        >
          {menu ? <X /> : <Menu />}
        </button>
        <nav id="primary-nav" className={menu ? 'open' : ''} aria-label="Main navigation">
          {navigation.map(([url, label]) => (
            <NavLink key={url} to={url} end>
              {label}
            </NavLink>
          ))}
        </nav>
        <Link className="button nav-cta" to="/work-with-me">
          Let’s collaborate <ArrowUpRight size={16} />
        </Link>
      </header>
      <main id="main">{children}</main>
      <footer>
        <div className="footer-top">
          <div>
            <Link className="wordmark" to="/">
              {c.name}
            </Link>
            <p>
              Mumbai-based beauty, fashion
              <br />
              and lifestyle creator.
            </p>
            <SocialLinks />
          </div>
          <div>
            <p className="eyebrow">EXPLORE</p>
            {navigation.slice(1).map(([url, label]) => (
              <Link key={url} to={url}>
                {label}
              </Link>
            ))}
          </div>
          <div>
            <p className="eyebrow">LET’S CONNECT</p>
            <Link to="/media-kit">View media kit</Link>
            <a href={`mailto:${c.email}`}>{c.email}</a>
            <p>Mumbai, Maharashtra, India</p>
          </div>
        </div>
        <div className="footer-bottom">
          <span>
            © {new Date().getFullYear()} {c.name}. All rights reserved.
          </span>
          <div>
            <Link to="/privacy">Privacy</Link>
            <Link to="/affiliate-disclosure">Affiliate disclosure</Link>
            <Link to="/admin">Creator login</Link>
            {import.meta.env.VITE_GA_MEASUREMENT_ID && (
              <button onClick={() => setConsent(null)}>Cookie preferences</button>
            )}
          </div>
        </div>
      </footer>
      {import.meta.env.VITE_GA_MEASUREMENT_ID && !consent && (
        <div className="cookie-banner" role="region" aria-label="Analytics preferences">
          <p>
            Allow optional Google Analytics to help understand visits? Essential enquiry and
            affiliate click records remain in use.
          </p>
          {['yes', 'no'].map((v) => (
            <button
              key={v}
              className="button secondary"
              onClick={() => {
                localStorage.setItem('analytics-consent', v);
                setConsent(v);
                if (v === 'yes') loadAnalytics();
                else if (window.gtag) {
                  window.gtag('consent', 'update', { analytics_storage: 'denied' });
                  location.reload();
                }
              }}
            >
              {v === 'yes' ? 'Allow analytics' : 'Decline'}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
