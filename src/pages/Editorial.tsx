import { Link, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useCreator } from '../contexts/CreatorContext';
import { useContent } from '../hooks/useContent';
import { SEO, Photo, Stats, SocialLinks, Heading, PortfolioCard } from '../components/common';
import EnquiryForm from '../components/EnquiryForm';
import { services } from '../data/defaults';
import { safeUrl } from '../utils/urls';
import { track } from '../services/analytics';
export default function Editorial() {
  const { pathname } = useLocation();
  const c = useCreator();
  const portfolio = useContent('portfolio_items');
  const brands = useContent('brand_collaborations');
  useEffect(() => {
    if (pathname === '/media-kit') track('media_kit_view');
  }, [pathname]);
  if (pathname === '/about')
    return (
      <div className="container page-body">
        <SEO title="Meet Karishma — Mumbai Beauty & Lifestyle Creator" />
        <div className="page-header">
          <p className="eyebrow">THE GIRL BEHIND THE CONTENT</p>
          <h1>
            A little glam.
            <br />
            <em>A lot of heart.</em>
          </h1>
        </div>
        <div className="about-preview" style={{ paddingTop: 15 }}>
          <div className="about-art">
            {c.profile_image ? (
              <Photo src={c.profile_image} alt={c.name} />
            ) : (
              <>
                <span className="monogram">kc.</span>
                <span className="signature">from Mumbai, with love</span>
              </>
            )}
          </div>
          <div>
            <h2>Hi, I’m {c.name.split(' ')[0]}.</h2>
            <p>{c.bio}</p>
            <SocialLinks />
          </div>
        </div>
        <div className="grid two">
          <section>
            <Heading title="My kind of beauty" />
            <p>
              Makeup is a way to express a mood. An outfit can hold a memory. And the best
              inspiration often comes from the small moments in an ordinary day.
            </p>
            <p>
              I bring modern beauty and Indian inspiration together through relatable, personal
              content.
            </p>
          </section>
          <section>
            <Heading title="In my world" />
            <p>
              Beauty tutorials and GRWM. Festive and traditional looks. Outfit inspiration,
              accessories, product discoveries, and a little glimpse of everyday life in Mumbai.
            </p>
            <Link className="text-link" to="/portfolio">
              Explore my content
            </Link>
          </section>
        </div>
      </div>
    );
  if (pathname === '/work-with-me')
    return (
      <div className="container page-body">
        <SEO title="Work With Me — Brand Collaborations" />
        <div className="page-header">
          <p className="eyebrow">YOUR BRAND. MY WORLD.</p>
          <h1>
            Let’s create something
            <br />
            <em>beautiful together.</em>
          </h1>
          <p>
            Beauty, fashion and lifestyle content that feels personal. Let’s find a thoughtful way
            to tell your brand’s story.
          </p>
          <a className="button" href="#collaboration">
            Start a collaboration
          </a>{' '}
          <Link className="text-link" to="/media-kit">
            View media kit
          </Link>
        </div>
        <div className="service-grid">
          {services.map((v, i) => (
            <div key={v}>
              <span>{String(i + 1).padStart(2, '0')}</span>
              <h3>{v}</h3>
            </div>
          ))}
        </div>
        <div id="collaboration" style={{ scrollMarginTop: 120 }}>
          <EnquiryForm collaboration />
        </div>
      </div>
    );
  if (pathname === '/contact')
    return (
      <div className="container">
        <SEO title="Contact Karishma" />
        <div className="page-header">
          <p className="eyebrow">A CONVERSATION STARTS HERE</p>
          <h1>
            Say hello<span className="rose">.</span>
          </h1>
          <p>A question, an idea, or just a little note — I’d love to hear from you.</p>
        </div>
        <div className="contact-grid">
          <div>
            <h2>Let’s connect.</h2>
            <p>{c.location}</p>
            <a className="text-link" href={`mailto:${c.email}`}>
              {c.email}
            </a>
            <SocialLinks />
            <h3 style={{ marginTop: 45 }}>For brands & collaborations</h3>
            <p>Share your campaign, timeline and vision.</p>
            <Link className="button secondary" to="/work-with-me">
              Work with me
            </Link>
          </div>
          <EnquiryForm />
        </div>
      </div>
    );
  if (pathname === '/media-kit')
    return (
      <div className="container page-body">
        <SEO title="Creator Media Kit" />
        <div className="detail">
          <div>
            {c.profile_image ? (
              <Photo src={c.profile_image} alt={c.name} />
            ) : (
              <div className="about-art">
                <span className="monogram">kc.</span>
                <span className="signature">creator media kit</span>
              </div>
            )}
          </div>
          <div>
            <p className="eyebrow">MUMBAI · BEAUTY · FASHION · LIFESTYLE</p>
            <h1>{c.name}</h1>
            <p>{c.bio}</p>
            <SocialLinks />
            {safeUrl(c.media_kit_url) && (
              <a
                className="button"
                style={{ marginTop: 30 }}
                href={safeUrl(c.media_kit_url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Download media kit (PDF)
              </a>
            )}
          </div>
        </div>
        <Stats />
        {c.audience_stats && (
          <section className="section">
            <Heading title="Audience insights" />
            <p style={{ whiteSpace: 'pre-line' }}>{c.audience_stats}</p>
          </section>
        )}
        <section className="section">
          <Heading
            title="What I create"
            text="Beauty · Fashion · Traditional looks · GRWM · Lifestyle"
          />
          <div className="service-grid">
            {services.map((x) => (
              <div key={x}>
                <h3>{x}</h3>
              </div>
            ))}
          </div>
        </section>
        {portfolio.data.some((x) => x.published) && (
          <section>
            <Heading title="Selected content" />
            <div className="grid three">
              {portfolio.data
                .filter((x) => x.published && x.featured)
                .slice(0, 3)
                .map((x) => (
                  <PortfolioCard key={x.id} item={x} />
                ))}
            </div>
            <Heading title="Top-performing content" />
            <div className="grid three">
              {portfolio.data
                .filter((x) => x.published && x.views !== null)
                .sort((a, b) => (b.views ?? 0) - (a.views ?? 0))
                .slice(0, 3)
                .map((x) => (
                  <PortfolioCard key={x.id} item={x} />
                ))}
            </div>
          </section>
        )}
        {brands.data.some((x) => x.published) && (
          <section className="section">
            <Heading title="Past collaborations" />
            <div className="brand-grid">
              {brands.data
                .filter((x) => x.published)
                .map((x) => (
                  <div key={x.id}>
                    <Photo src={x.logo_url} alt={x.name} />
                    <h3>{x.name}</h3>
                  </div>
                ))}
            </div>
          </section>
        )}
        <section className="collaboration-banner">
          <h2>Let’s bring your idea to life.</h2>
          <p>{c.email}</p>
          <Link className="button" to="/work-with-me">
            Start a collaboration
          </Link>
        </section>
      </div>
    );
  if (pathname === '/privacy' || pathname === '/affiliate-disclosure') {
    const privacy = pathname === '/privacy';
    return (
      <div className="container">
        <article className="article prose">
          <SEO title={privacy ? 'Privacy Policy' : 'Affiliate Disclosure'} />
          <p className="eyebrow">THE SMALL PRINT, SIMPLY PUT</p>
          <h1>{privacy ? 'Your privacy matters.' : 'A note on affiliate links.'}</h1>
          {privacy ? (
            <>
              <p>
                When you use a contact or collaboration form, the details you provide are stored
                securely through Supabase and used to respond to your message and discuss the
                proposed work. Only authorized administrators can read those messages.
              </p>
              <h2>Website analytics</h2>
              <p>
                This website can record basic events such as product views and affiliate clicks,
                including the page and campaign source. These are website activity records, not
                Instagram audience statistics. Google Analytics, if configured, loads only after you
                choose to allow optional analytics.
              </p>
              <h2>Cookies and local storage</h2>
              <p>
                Your analytics preference is saved in this browser. Campaign information is retained
                for the current browser session. Admin sign-in uses Supabase authentication storage.
                Optional analytics may use cookies after consent.
              </p>
              <h2>Enquiries and spam prevention</h2>
              <p>
                Security checks may process an IP address and a short-lived hashed rate-limit
                identifier to prevent spam. If Cloudflare Turnstile is enabled, its verification
                service is used when submitting a form. Message details are not sent to Google
                Analytics.
              </p>
              <h2>Affiliate links and third parties</h2>
              <p>
                Retailer and social links take you to other websites with their own privacy
                policies. Affiliate partners may track purchases according to their policies.
              </p>
              <h2>Your questions and requests</h2>
              <p>
                To ask about, correct or request deletion of information you shared, email{' '}
                <a href={`mailto:${c.email}`}>{c.email}</a>. Enquiry data should be retained only as
                long as it is needed to respond or manage the collaboration.
              </p>
              <p className="muted">
                This is a general policy draft. The site owner should review retention practices,
                service providers and this policy before public production launch.
              </p>
            </>
          ) : (
            <>
              <p>
                Some links on this website may be affiliate links. Karishma may earn a small
                commission if you make a purchase through these links, at no additional cost to you.
              </p>
              <p>
                Recommendations may be based on personal experience, use or genuine interest. Any
                personal-use claim should be stated on the individual product page. Demo products
                are clearly labelled and are not recommendations or endorsements.
              </p>
              <h2>A few things to know</h2>
              <p>
                Prices and availability can change. The retailer’s website shows the current price,
                shipping terms and returns policy. Affiliate clicks do not guarantee a purchase or
                commission.
              </p>
              <p>
                Sponsored collaborations, where applicable, should be disclosed with the relevant
                content.
              </p>
              <p>
                Questions? <a href={`mailto:${c.email}`}>Send Karishma a note</a>.
              </p>
            </>
          )}
        </article>
      </div>
    );
  }
  return (
    <div className="container section">
      <SEO title="Page not found" noindex />
      <p className="eyebrow">404 · A LITTLE DETOUR</p>
      <h1>
        Looks like this page
        <br />
        <em>missed the shoot.</em>
      </h1>
      <p>Let’s get you back to something beautiful.</p>
      <Link className="button" to="/">
        Back home
      </Link>
    </div>
  );
}
