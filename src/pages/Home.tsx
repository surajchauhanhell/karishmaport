import { Link } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Sparkles } from 'lucide-react';
import { useCreator } from '../contexts/CreatorContext';
import { useContent } from '../hooks/useContent';
import {
  SEO,
  Photo,
  SocialLinks,
  Stats,
  Heading,
  PortfolioCard,
  ProductCard,
  BlogCard,
  Disclosure,
  State,
} from '../components/common';
import { editorialImage } from '../data/defaults';
import { safeUrl } from '../utils/urls';
export default function Home() {
  const c = useCreator();
  const p = useContent('portfolio_items');
  const products = useContent('products');
  const b = useContent('blog_posts');
  const testimonials = useContent('testimonials');
  const brands = useContent('brand_collaborations');
  const featured = p.data.filter((x) => x.featured && x.published).slice(0, 6);
  const picks = products.data
    .filter((x) => x.featured && x.active)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 4);
  const posts = b.data.filter((x) => x.status === 'published').slice(0, 3);
  return (
    <>
      <SEO
        title={c.seo_title}
        json={{
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: c.name,
            alternateName: '@itskarishma.chauhan',
            jobTitle: 'Beauty, Fashion & Lifestyle Content Creator',
            sameAs: [c.instagram_url, ...(safeUrl(c.youtube_url) ? [c.youtube_url] : [])],
            address: { '@type': 'PostalAddress', addressLocality: 'Mumbai', addressCountry: 'IN' },
          },
        }}
      />
      <section className="hero container">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-star">✳</span> MUMBAI · BEAUTY · FASHION · LIFESTYLE
          </p>
          <h1>
            Karishma
            <br />
            <em>Chauhan.</em>
          </h1>
          <p className="hero-sub">{c.headline}</p>
          <p className="hero-description">{c.intro}</p>
          <div className="actions">
            <Link className="button" to="/portfolio">
              View my work <ArrowUpRight size={18} />
            </Link>
            <Link className="button secondary" to="/shop">
              Shop my picks <ArrowUpRight size={18} />
            </Link>
          </div>
          <SocialLinks />
        </div>
        <div className="hero-visual">
          <div className="image-outline" />
          <Photo
            src={c.profile_image || editorialImage}
            alt={
              c.profile_image
                ? 'Karishma Chauhan'
                : 'Editorial beauty still life with makeup and brushes'
            }
            eager
          />
          <div className="hero-caption">
            <span>
              {c.profile_image ? 'A LITTLE BEAUTY. A LITTLE EVERYDAY MAGIC.' : 'THE BEAUTY EDIT'}
            </span>
            <em>made of everyday moments</em>
          </div>
          <span className="hero-stamp">
            BEAUTY
            <br />
            WITH A<br />
            <i>desi soul</i>
          </span>
          {!c.profile_image && (
            <span className="photo-credit">Editorial photograph · Jamie Coupaud / Unsplash</span>
          )}
        </div>
      </section>
      <div className="container stats-wrap">
        <Stats />
      </div>
      <section className="container about-preview">
        <div className="about-art">
          {c.profile_image ? (
            <Photo src={c.profile_image} alt={c.name} />
          ) : (
            <>
              <span className="eyebrow">A NOTE FROM MUMBAI</span>
              <span className="monogram">kc.</span>
              <span className="signature">beauty in the everyday</span>
            </>
          )}
        </div>
        <div>
          <p className="eyebrow">THE GIRL BEHIND THE CONTENT</p>
          <h2>
            Hi, I’m Karishma<span className="rose">.</span>
          </h2>
          <p>{c.bio}</p>
          <Link className="text-link" to="/about">
            A little more about me <ArrowRight size={18} />
          </Link>
        </div>
      </section>
      <section className="section blush">
        <div className="container">
          <Heading eyebrow="MY LITTLE WORLD" title="A little glam. A lot of me." />
          <div className="category-grid">
            {[
              ['01', 'Beauty', 'Makeup, GRWM & discoveries', 'Beauty'],
              ['02', 'Fashion', 'Outfits, accessories & inspiration', 'Fashion'],
              ['03', 'Desi glam', 'Festive looks & Indian style', 'Traditional'],
              ['04', 'Lifestyle', 'Mumbai, vlogs & everyday moments', 'Lifestyle'],
            ].map(([n, title, copy, cat]) => (
              <Link key={title} to={`/portfolio?category=${cat}`} className="category">
                <span className="category-number">{n}</span>
                {safeUrl(String(c[`${cat.toLowerCase()}_image`] || '')) && (
                  <Photo
                    className="category-photo"
                    src={String(c[`${cat.toLowerCase()}_image`])}
                    alt={`${title} content by Karishma`}
                  />
                )}
                <h3>{title}</h3>
                <p>{copy}</p>
                <ArrowUpRight size={23} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="container section">
        <Heading eyebrow="THROUGH MY LENS" title="The content edit">
          <Link className="text-link" to="/portfolio">
            View all content <ArrowUpRight size={17} />
          </Link>
        </Heading>
        <div className="grid three">
          {featured.map((item) => (
            <PortfolioCard key={item.id} item={item} />
          ))}
        </div>
        <State
          loading={p.loading}
          error={p.error}
          retry={p.reload}
          empty={
            !featured.length
              ? 'The latest content lives on Instagram. Selected Reels will be added here soon.'
              : undefined
          }
        />
        <a
          className="text-link"
          href={safeUrl(c.instagram_url)}
          target="_blank"
          rel="noopener noreferrer"
        >
          Explore @itskarishma.chauhan <ArrowUpRight size={16} />
        </a>
      </section>
      <section className="desi-section">
        <div className="container desi-inner">
          {c.traditional_image && (
            <Photo src={c.traditional_image} alt="Karishma’s traditional look" />
          )}
          <div>
            <p className="eyebrow">ROOTED IN TRADITION. STYLED FOR TODAY.</p>
            <h2>
              Modern beauty.
              <br />
              <em>Desi soul.</em>
            </h2>
            <p>
              From everyday makeup to festive and traditional looks, Karishma blends modern beauty
              inspiration with the colours, textures and elegance of Indian style.
            </p>
            <Link className="button cream" to="/portfolio?category=Traditional">
              Explore traditional looks <ArrowUpRight size={18} />
            </Link>
          </div>
          <span className="desi-mark" aria-hidden="true">
            ✳
          </span>
        </div>
      </section>
      <section className="container section">
        <Heading
          eyebrow="THE BEAUTY SHELF"
          title="Karishma’s picks"
          text="A home for beauty, fashion and everyday discoveries."
        >
          <Link className="text-link" to="/shop">
            View all picks <ArrowUpRight size={17} />
          </Link>
        </Heading>
        <div className="grid four">
          {picks.map((item) => (
            <ProductCard key={item.id} item={item} />
          ))}
        </div>
        <State
          loading={products.loading}
          error={products.error}
          retry={products.reload}
          empty={
            !picks.length
              ? 'The shelf is being curated. Verified recommendations are coming soon.'
              : undefined
          }
        />
        <Disclosure />
      </section>
      <section className="container collaboration-banner">
        <Sparkles size={27} />
        <p className="eyebrow">FOR BRANDS WITH A STORY TO TELL</p>
        <h2>
          Let’s create something
          <br />
          <em>beautiful together.</em>
        </h2>
        <p>Thoughtful content. A personal touch. Your brand, in my world.</p>
        <Link className="button" to="/work-with-me">
          Work with me <ArrowUpRight size={18} />
        </Link>
        <Link className="text-link" to="/media-kit">
          View media kit
        </Link>
      </section>
      {brands.data.some((x) => x.published) && (
        <section className="container section">
          <Heading title="Brands I’ve worked with" />
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
      {testimonials.data.some((x) => x.published) && (
        <section className="container section">
          <Heading title="Kind words" />
          {testimonials.data
            .filter((x) => x.published)
            .map((x) => (
              <blockquote key={x.id}>
                <p>“{x.quote}”</p>
                <cite>
                  {x.name} · {x.company}
                </cite>
              </blockquote>
            ))}
        </section>
      )}
      <section className="container section">
        <Heading eyebrow="NOTES FROM MY WORLD" title="The journal">
          <Link className="text-link" to="/blog">
            All stories <ArrowUpRight size={17} />
          </Link>
        </Heading>
        <div className="grid three">
          {posts.map((item) => (
            <BlogCard key={item.id} item={item} />
          ))}
        </div>
        <State
          loading={b.loading}
          error={b.error}
          retry={b.reload}
          empty={
            !posts.length
              ? 'Beauty notes, styling ideas and everyday inspiration — new stories coming soon.'
              : undefined
          }
        />
      </section>
      <section className="instagram-band">
        <p className="eyebrow">LET’S MAKE EVERYDAY A LITTLE MORE BEAUTIFUL</p>
        <h2>Meet me on Instagram.</h2>
        <a href={safeUrl(c.instagram_url)} target="_blank" rel="noopener noreferrer">
          @itskarishma.chauhan <ArrowUpRight size={20} />
        </a>
      </section>
    </>
  );
}
