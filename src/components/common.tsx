import { Helmet } from 'react-helmet-async';
import { Link, useLocation } from 'react-router-dom';
import { ArrowUpRight, Instagram, Mail, Play, Copy } from 'lucide-react';
import { useCreator } from '../contexts/CreatorContext';
import { useToast } from '../contexts/ToastContext';
import { safeUrl } from '../utils/urls';
import { track } from '../services/analytics';
import type { Product, PortfolioItem, BlogPost } from '../types';
import { useState, useEffect, type ReactNode } from 'react';
import seo from '../data/seo.json';
import { identityGraph } from '../utils/identity.mjs';
export function SEO({
  title,
  description,
  image,
  noindex = false,
  json,
}: {
  title: string;
  description?: string;
  image?: string;
  noindex?: boolean;
  json?: object;
}) {
  const c = useCreator();
  const l = useLocation();
  const origin = seo.origin;
  const page = seo.pages[(l.pathname.replace(/\/$/, '') || '/') as keyof typeof seo.pages] as
    { title: string; description: string } | undefined;
  const fullTitle = page?.title || (title.includes(c.name) ? title : `${title} | ${c.name}`);
  const summary = description || page?.description || c.seo_description;
  const url = new URL(l.pathname.replace(/\/$/, '') || '/', origin).href;
  const pic = safeUrl(image || c.og_image || c.profile_image);
  const structured =
    json ||
    (!noindex
      ? identityGraph(c, origin, l.pathname.replace(/\/$/, '') || '/', fullTitle, summary)
      : undefined);
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={summary} />
      <link rel="canonical" href={url} />
      <meta
        name="robots"
        content={
          noindex
            ? 'noindex,nofollow'
            : 'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1'
        }
      />
      <meta property="og:type" content={l.pathname.startsWith('/blog/') ? 'article' : 'website'} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={summary} />
      <meta property="og:site_name" content="Its Karishma" />
      <meta property="og:locale" content="en_IN" />
      <meta property="og:url" content={url} />
      {pic && <meta property="og:image" content={pic} />}
      <meta name="twitter:card" content={pic ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={summary} />
      {pic && <meta name="twitter:image" content={pic} />}{' '}
      {import.meta.env.VITE_GOOGLE_SITE_VERIFICATION && (
        <meta
          name="google-site-verification"
          content={import.meta.env.VITE_GOOGLE_SITE_VERIFICATION}
        />
      )}{' '}
      {structured && (
        <script type="application/ld+json">
          {JSON.stringify(structured).replace(/</g, '\\u003c')}
        </script>
      )}
    </Helmet>
  );
}
export function Heading({
  eyebrow,
  title,
  text,
  children,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-heading">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2>{title}</h2>
        {text && <p>{text}</p>}
      </div>
      {children}
    </div>
  );
}
export function Photo({
  src,
  alt,
  className = '',
  eager = false,
}: {
  src?: string;
  alt: string;
  className?: string;
  eager?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return safeUrl(src) && !failed ? (
    <img
      className={className}
      src={safeUrl(src)}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      onError={() => setFailed(true)}
    />
  ) : (
    <div className={`image-fallback ${className}`} role="img" aria-label={alt}>
      <span>KC</span>
    </div>
  );
}
export function SocialLinks() {
  const c = useCreator();
  return (
    <div className="social-links">
      <a
        href={safeUrl(c.instagram_url)}
        target="_blank"
        rel="me noopener noreferrer"
        onClick={() => track('instagram_click')}
      >
        <Instagram size={17} />
        Instagram
      </a>
      {safeUrl(c.youtube_url) && (
        <a
          href={safeUrl(c.youtube_url)}
          target="_blank"
          rel="me noopener noreferrer"
          onClick={() => track('youtube_click')}
        >
          <Play size={17} />
          YouTube
        </a>
      )}
      <a href={`mailto:${c.email}`}>
        <Mail size={17} />
        Email
      </a>
    </div>
  );
}
export function CreatorProfiles() {
  const c = useCreator();
  return (
    <section className="container section" aria-labelledby="official-profiles">
      <Heading eyebrow="ITS KARISHMA" title="Find Karishma online" />
      <h3 id="official-profiles">{c.name} · Official Instagram & YouTube</h3>
      <p>
        Its Karishma is the home of {c.name}, a beauty, fashion and lifestyle creator based in{' '}
        {c.location}. Explore makeup, GRWM, traditional looks and everyday inspiration, or get in
        touch for a brand collaboration.
      </p>
      <div className="social-links">
        {[
          ['Instagram', c.instagram_url],
          ['YouTube', c.youtube_url],
        ].map(([label, url]) =>
          safeUrl(url) ? (
            <a key={label} href={safeUrl(url)} target="_blank" rel="me noopener noreferrer">
              {label}: {new URL(safeUrl(url)).pathname.replace(/^\//, '').replace(/\/$/, '')}
            </a>
          ) : null,
        )}
      </div>
      <p>
        <Link to="/portfolio">Explore the portfolio</Link> ·{' '}
        <Link to="/work-with-me">Collaborate with Karishma</Link>
      </p>
    </section>
  );
}
export function Stats() {
  const c = useCreator();
  return (
    <>
      <div className="stats">
        <div>
          <strong>{c.followers.toLocaleString()}+</strong>
          <span>Instagram community</span>
        </div>
        <div>
          <strong>{c.posts}+</strong>
          <span>Published posts</span>
        </div>
        <div>
          <strong>{c.location.split(',')[0]}</strong>
          <span>Home & inspiration</span>
        </div>
        <div>
          <strong>Beauty & fashion</strong>
          <span>With a desi soul</span>
        </div>
      </div>
      <p className="stats-note">
        Social numbers supplied by the creator and updated manually
        {c.stats_updated_at ? ` · Updated ${c.stats_updated_at}` : ''}.
      </p>
    </>
  );
}
export function State({
  loading,
  error,
  empty,
  retry,
}: {
  loading?: boolean;
  error?: string;
  empty?: string;
  retry?: () => void;
}) {
  return loading ? (
    <div className="skeleton" aria-label="Loading content" role="status" />
  ) : error ? (
    <div className="empty" role="alert">
      <p>{error}</p>
      <button className="button secondary" onClick={retry}>
        Try again
      </button>
    </div>
  ) : empty ? (
    <div className="empty">
      <p>{empty}</p>
    </div>
  ) : null;
}
export function Disclosure() {
  return (
    <p className="disclosure">
      Some links may be affiliate links. Karishma may earn a small commission, at no extra cost to
      you. <Link to="/affiliate-disclosure">Read the disclosure</Link>.
    </p>
  );
}
export function AffiliateButton({ product }: { product: Product }) {
  const url = safeUrl(product.affiliate_url);
  return url && !product.is_demo ? (
    <a
      className="button"
      href={url}
      target="_blank"
      rel="sponsored noopener noreferrer"
      onClick={() => track('affiliate_click', product.id)}
    >
      Shop now <ArrowUpRight size={17} />
    </a>
  ) : (
    <span className="muted">
      {product.is_demo ? 'Demo product · not available to shop' : 'Shopping link coming soon'}
    </span>
  );
}
export function ProductCard({ item }: { item: Product }) {
  return (
    <article className="product-card">
      <Link to={`/shop/${item.slug}`} className="product-image">
        <Photo src={item.image_url} alt={item.name} />
        {(item.is_demo || item.badge) && (
          <span className="badge">{item.is_demo ? 'Demo product' : item.badge}</span>
        )}
      </Link>
      <p className="eyebrow">{item.brand || item.category}</p>
      <h3>
        <Link to={`/shop/${item.slug}`}>{item.name}</Link>
      </h3>
      <p>{item.description}</p>
      {item.price !== null && (
        <p>
          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: item.currency }).format(
            item.price,
          )}
        </p>
      )}
      <AffiliateButton product={item} />
      {safeUrl(item.reel_url) && (
        <a
          className="text-link"
          href={safeUrl(item.reel_url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Watch my Reel
        </a>
      )}
    </article>
  );
}
export function PortfolioCard({ item }: { item: PortfolioItem }) {
  return (
    <article className="portfolio-card">
      <Link to={`/portfolio/${item.slug}`} className="portfolio-image">
        <Photo src={item.thumbnail_url} alt={item.title} />
        <span className="play-icon">
          <Play size={19} />
        </span>
      </Link>
      <p className="eyebrow">
        {item.category} · {item.platform}
      </p>
      <h3>
        <Link to={`/portfolio/${item.slug}`}>{item.title}</Link>
      </h3>
      {item.views !== null && <p className="muted">{item.views.toLocaleString()} views</p>}
      <Link to={`/portfolio/${item.slug}`} className="text-link">
        View content <ArrowUpRight size={15} />
      </Link>
    </article>
  );
}
export function BlogCard({ item }: { item: BlogPost }) {
  return (
    <article className="blog-card">
      <Link to={`/blog/${item.slug}`}>
        <Photo src={item.featured_image} alt={item.title} />
      </Link>
      <p className="eyebrow">{item.category}</p>
      <h3>
        <Link to={`/blog/${item.slug}`}>{item.title}</Link>
      </h3>
      <p>{item.excerpt}</p>
      <Link className="text-link" to={`/blog/${item.slug}`}>
        Read the story <ArrowUpRight size={15} />
      </Link>
    </article>
  );
}
export function Share() {
  const toast = useToast();
  const url = location.href;
  return (
    <div className="share">
      <button
        onClick={() =>
          navigator.clipboard
            .writeText(url)
            .then(() => toast('Link copied'))
            .catch(() => toast('Could not copy. You can copy the address from your browser.'))
        }
      >
        <Copy size={16} />
        Copy link
      </button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        WhatsApp
      </a>
      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        Facebook
      </a>
    </div>
  );
}
