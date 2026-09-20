import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowUpRight } from 'lucide-react';
import { useContent } from '../hooks/useContent';
import { useCreator } from '../contexts/CreatorContext';
import {
  SEO,
  Heading,
  State,
  ProductCard,
  PortfolioCard,
  BlogCard,
  Photo,
  AffiliateButton,
  Disclosure,
  Share,
  SocialLinks,
} from '../components/common';
import { portfolioCategories, productCategories } from '../data/defaults';
import { safeUrl, safeDestination, preserveUtm } from '../utils/urls';
import { track } from '../services/analytics';
function Filters({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="filters" aria-label="Categories">
      {items.map((v) => (
        <button
          key={v}
          className={v.toLowerCase() === value.toLowerCase() ? 'active' : ''}
          onClick={() => onChange(v)}
          aria-pressed={v.toLowerCase() === value.toLowerCase()}
        >
          {v}
        </button>
      ))}
    </div>
  );
}
function Missing({ name = 'page' }: { name?: string }) {
  return (
    <div className="container section">
      <SEO title={`${name} not found`} noindex />
      <h1>
        Looks like this {name}
        <br />
        missed the shoot.
      </h1>
      <p>It may have moved or isn’t available yet.</p>
      <Link className="button" to="/">
        Back home
      </Link>
    </div>
  );
}
export default function Content() {
  const { pathname } = useLocation();
  if (pathname.startsWith('/go/')) return <SmartRedirect />;
  if (pathname.startsWith('/looks/')) return <LookPage />;
  if (pathname.startsWith('/shop')) return <Shop />;
  if (pathname.startsWith('/blog')) return <Blog />;
  return <Portfolio />;
}
function Portfolio() {
  const { slug } = useParams();
  const result = useContent('portfolio_items');
  const [params, setParams] = useSearchParams();
  const cat = params.get('category') || 'All';
  const items = result.data.filter((x) => x.published);
  const item = items.find((x) => x.slug === slug);
  useEffect(() => {
    track('portfolio_view', item?.id);
  }, [slug, item?.id]);
  if (slug) {
    if (result.loading || result.error)
      return (
        <div className="container section">
          <State {...result} retry={result.reload} />
        </div>
      );
    if (!item) return <Missing name="content" />;
    return (
      <div className="container page-body">
        <SEO title={item.title} description={item.description} image={item.thumbnail_url} />
        <div className="breadcrumbs">
          <Link to="/portfolio">Portfolio</Link> / {item.title}
        </div>
        <div className="detail">
          <div>
            <Photo src={item.thumbnail_url} alt={item.title} />
          </div>
          <div>
            <p className="eyebrow">
              {item.category} · {item.platform}
            </p>
            <h1>{item.title}</h1>
            <p>{item.description}</p>
            {item.brand_name && <p>Created with {item.brand_name}</p>}
            {item.views !== null && <p>{item.views.toLocaleString()} public views</p>}
            {safeUrl(item.content_url) && (
              <a
                className="button"
                href={safeUrl(item.content_url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch Reel <ArrowUpRight size={17} />
              </a>
            )}
            <Share />
          </div>
        </div>
      </div>
    );
  }
  const filtered = items.filter(
    (x) => cat === 'All' || x.category.toLowerCase() === cat.toLowerCase(),
  );
  return (
    <div className="container page-body">
      <SEO title="My Content" />
      <div className="page-header">
        <p className="eyebrow">A LITTLE BEAUTY. A LITTLE EVERYDAY MAGIC.</p>
        <h1>
          My content<span className="rose">.</span>
        </h1>
        <p>Beauty, fashion, lifestyle and traditional content, created with a personal touch.</p>
        <SocialLinks />
      </div>
      <Filters
        items={portfolioCategories}
        value={cat}
        onChange={(v) => setParams(v === 'All' ? {} : { category: v })}
      />
      <div className="grid three">
        {filtered.map((item) => (
          <PortfolioCard key={item.id} item={item} />
        ))}
      </div>
      <State
        {...result}
        retry={result.reload}
        empty={!filtered.length ? 'No content in this category yet.' : undefined}
      />
    </div>
  );
}
function Shop() {
  const { slug } = useParams();
  const result = useContent('products');
  const looks = useContent('looks');
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || 'All';
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('featured');
  const items = result.data.filter((x) => x.active);
  const item = items.find((x) => x.slug === slug);
  useEffect(() => {
    track(slug ? 'product_view' : 'shop_view', item?.id);
  }, [slug, item?.id]);
  const filtered = items
    .filter(
      (x) =>
        (category === 'All' || x.category.toLowerCase() === category.toLowerCase()) &&
        `${x.name} ${x.brand} ${x.category} ${x.description}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort((a, b) =>
      sort === 'newest'
        ? b.created_at.localeCompare(a.created_at)
        : Number(b.featured) - Number(a.featured) || a.sort_order - b.sort_order,
    );
  if (slug) {
    if (result.loading || result.error)
      return (
        <div className="container section">
          <State {...result} retry={result.reload} />
        </div>
      );
    if (!item) return <Missing name="product" />;
    return (
      <div className="container page-body">
        <SEO
          title={item.name}
          description={item.description}
          image={item.image_url}
          noindex={item.is_demo}
        />
        <div className="breadcrumbs">
          <Link to="/shop">Shop my picks</Link> / {item.name}
        </div>
        <div className="detail">
          <div>
            <Photo src={item.image_url} alt={item.name} />
          </div>
          <div>
            <p className="eyebrow">
              {item.brand} · {item.category}
              {item.is_demo ? ' · DEMO PRODUCT' : ''}
            </p>
            <h1>{item.name}</h1>
            <p>{item.description}</p>
            {item.price !== null && (
              <p>
                {new Intl.NumberFormat('en-IN', {
                  style: 'currency',
                  currency: item.currency,
                }).format(item.price)}{' '}
                <small>Price may change at the retailer.</small>
              </p>
            )}
            {item.personal_review && (
              <>
                <h2>Why I like it</h2>
                <p>{item.personal_review}</p>
              </>
            )}
            {item.best_for && (
              <>
                <h2>Best for</h2>
                <p>{item.best_for}</p>
              </>
            )}
            {item.how_to_use && (
              <>
                <h2>How I use it</h2>
                <p>{item.how_to_use}</p>
              </>
            )}
            <div className="actions">
              {safeUrl(item.reel_url) && (
                <a
                  className="button secondary"
                  href={safeUrl(item.reel_url)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Watch Reel <ArrowUpRight size={17} />
                </a>
              )}
              <AffiliateButton product={item} />
            </div>
            <Disclosure />
            <Share />
          </div>
        </div>
        <Heading title="More from the shelf" />
        <div className="grid four">
          {items
            .filter((p) => p.id !== item.id && p.category === item.category)
            .slice(0, 4)
            .map((p) => (
              <ProductCard key={p.id} item={p} />
            ))}
        </div>
      </div>
    );
  }
  return (
    <div className="container page-body">
      <SEO title="Shop My Picks" />
      <div className="page-header">
        <p className="eyebrow">THE BEAUTY SHELF</p>
        <h1>
          Shop my picks<span className="rose">.</span>
        </h1>
        <p>Beauty, fashion and lifestyle discoveries, all in one little corner.</p>
      </div>
      <Disclosure />
      <div className="toolbar">
        <label className="sr-only" htmlFor="shop-search">
          Search products
        </label>
        <input
          id="shop-search"
          placeholder="Search a product, brand or discovery…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="sr-only" htmlFor="shop-sort">
          Sort products
        </label>
        <select id="shop-sort" value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="featured">Featured first</option>
          <option value="newest">Newest first</option>
        </select>
      </div>
      <Filters
        items={productCategories}
        value={category}
        onChange={(v) => setParams(v === 'All' ? {} : { category: v })}
      />
      <p className="count">{filtered.length} discoveries</p>
      <div className="grid four">
        {filtered.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
      <State
        {...result}
        retry={result.reload}
        empty={
          !filtered.length
            ? 'No picks found. Try another search, or check back as the shelf grows.'
            : undefined
        }
      />
      {looks.data.some((x) => x.published) && (
        <section className="section">
          <Heading title="Shop the look" />
          <div className="grid three">
            {looks.data
              .filter(
                (x) =>
                  x.published &&
                  (category === 'All' || x.category?.toLowerCase() === category.toLowerCase()) &&
                  `${x.title} ${x.description}`.toLowerCase().includes(query.toLowerCase()),
              )
              .map((x) => (
                <Link key={x.id} to={`/looks/${x.slug}`}>
                  <Photo src={x.image_url} alt={x.title} />
                  <h3>{x.title}</h3>
                </Link>
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
function Blog() {
  const { slug } = useParams();
  const c = useCreator();
  const result = useContent('blog_posts');
  const products = useContent('products');
  const portfolio = useContent('portfolio_items');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const posts = result.data.filter((p) => p.status === 'published');
  const item = posts.find((p) => p.slug === slug);
  useEffect(() => {
    track('blog_view', item?.id);
  }, [slug, item?.id]);
  if (slug) {
    if (result.loading || result.error)
      return (
        <div className="container section">
          <State {...result} retry={result.reload} />
        </div>
      );
    if (!item) return <Missing name="story" />;
    const url = new URL(`/blog/${item.slug}`, import.meta.env.VITE_SITE_URL || location.origin)
      .href;
    return (
      <div className="container">
        <SEO
          title={item.seo_title || item.title}
          description={item.seo_description || item.excerpt}
          image={item.featured_image}
          json={{
            '@context': 'https://schema.org',
            '@graph': [
              {
                '@type': 'BlogPosting',
                headline: item.title,
                description: item.excerpt,
                datePublished: item.published_at,
                dateModified: item.updated_at,
                author: { '@type': 'Person', name: item.author || c.name },
                image: safeUrl(item.featured_image) || undefined,
                mainEntityOfPage: url,
              },
              {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  {
                    '@type': 'ListItem',
                    position: 1,
                    name: 'Blog',
                    item: new URL('/blog', url).href,
                  },
                  { '@type': 'ListItem', position: 2, name: item.title, item: url },
                ],
              },
            ],
          }}
        />
        <div className="breadcrumbs">
          <Link to="/">Home</Link> / <Link to="/blog">Journal</Link> / {item.title}
        </div>
        <article className="article">
          <p className="eyebrow">{item.category}</p>
          <h1>{item.title}</h1>
          <p>
            {item.published_at &&
              new Date(item.published_at).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}{' '}
            · {item.author || c.name}
          </p>
          <Photo className="article-image" src={item.featured_image} alt={item.title} />
          <div className="prose">
            <ReactMarkdown>{item.content}</ReactMarkdown>
          </div>
          <Share />
          <div className="author">
            <h3>{c.name}</h3>
            <p>Mumbai Beauty & Lifestyle Creator</p>
            <Link className="text-link" to="/about">
              Meet Karishma
            </Link>
          </div>
        </article>
        {products.data.some((x) => item.product_ids?.includes(x.id)) && (
          <section className="section">
            <Heading title="From the beauty shelf" />
            <div className="grid four">
              {products.data
                .filter((x) => x.active && item.product_ids?.includes(x.id))
                .map((x) => (
                  <ProductCard key={x.id} item={x} />
                ))}
            </div>
            <Disclosure />
          </section>
        )}
        {portfolio.data.some((x) => item.portfolio_ids?.includes(x.id)) && (
          <section className="section">
            <Heading title="See it in action" />
            <div className="grid three">
              {portfolio.data
                .filter((x) => x.published && item.portfolio_ids?.includes(x.id))
                .map((x) => (
                  <PortfolioCard key={x.id} item={x} />
                ))}
            </div>
          </section>
        )}
        <section className="section">
          <Heading title="Keep reading" />
          <div className="grid three">
            {posts
              .filter((p) => p.id !== item.id && p.category === item.category)
              .slice(0, 3)
              .map((p) => (
                <BlogCard key={p.id} item={p} />
              ))}
          </div>
        </section>
      </div>
    );
  }
  const filtered = posts.filter(
    (p) =>
      (category === 'All' || p.category === category) &&
      `${p.title} ${p.category} ${p.keywords}`.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <div className="container page-body">
      <SEO title="The Journal — Beauty, Fashion & Everyday Life" />
      <div className="page-header">
        <p className="eyebrow">NOTES FROM MY WORLD</p>
        <h1>
          The journal<span className="rose">.</span>
        </h1>
        <p>Beauty notes, desi styling and stories from everyday life.</p>
      </div>
      <div className="toolbar">
        <label className="sr-only" htmlFor="blog-search">
          Search stories
        </label>
        <input
          id="blog-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Find a story…"
        />
      </div>
      <Filters
        items={[
          'All',
          'Beauty',
          'Makeup',
          'Fashion',
          'Traditional Looks',
          'Hair',
          'Product Reviews',
          'Lifestyle',
        ]}
        value={category}
        onChange={setCategory}
      />
      <div className="grid three">
        {filtered.map((p) => (
          <BlogCard key={p.id} item={p} />
        ))}
      </div>
      <State
        {...result}
        retry={result.reload}
        empty={
          !filtered.length
            ? 'No published stories here yet. Come back for the next chapter.'
            : undefined
        }
      />
    </div>
  );
}
function LookPage() {
  const { slug } = useParams();
  const looks = useContent('looks');
  const links = useContent('look_products');
  const products = useContent('products');
  const item = looks.data.find((x) => x.slug === slug && x.published);
  if (looks.loading || looks.error)
    return (
      <div className="container section">
        <State {...looks} retry={looks.reload} />
      </div>
    );
  if (!item) return <Missing name="look" />;
  const ids = links.data
    .filter((x) => x.look_id === item.id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((x) => x.product_id);
  return (
    <div className="container page-body">
      <SEO title={item.title} description={item.description} image={item.image_url} />
      <div className="breadcrumbs">
        <Link to="/shop">Shop</Link> / Shop the look
      </div>
      <div className="detail">
        <div>
          <Photo src={item.image_url} alt={item.title} />
        </div>
        <div>
          <p className="eyebrow">SHOP THE LOOK{item.category ? ` - ${item.category}` : ''}</p>
          <h1>{item.title}</h1>
          <p>{item.description}</p>
          <div className="actions">
            {safeUrl(item.reel_url) && (
              <a
                className="button"
                href={safeUrl(item.reel_url)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Watch Reel
              </a>
            )}
            {safeUrl(item.affiliate_url) ? (
              <a
                className="button"
                href={safeUrl(item.affiliate_url)}
                target="_blank"
                rel="sponsored noopener noreferrer"
              >
                Buy now <ArrowUpRight size={17} />
              </a>
            ) : ids.length > 0 ? (
              <a className="button secondary" href="#look-products">
                Shop products <ArrowUpRight size={17} />
              </a>
            ) : null}
          </div>
          {safeUrl(item.affiliate_url) && <Disclosure />}
          <Share />
        </div>
      </div>
      <div id="look-products">
        <Heading title="The details that make the look" />
      </div>
      <Disclosure />
      <State
        loading={products.loading || links.loading}
        error={products.error || links.error}
        retry={() => {
          products.reload();
          links.reload();
        }}
        empty={!ids.length ? 'Products for this look are coming soon.' : undefined}
      />
      <div className="grid four">
        {ids
          .map((id) => products.data.find((x) => x.id === id && x.active))
          .filter((x) => !!x)
          .map((x) => (
            <ProductCard key={x.id} item={x} />
          ))}
      </div>
      <section className="section">
        <Heading title="More looks to love" />
        <div className="grid three">
          {looks.data
            .filter((x) => x.published && x.id !== item.id)
            .slice(0, 3)
            .map((x) => (
              <Link to={`/looks/${x.slug}`} key={x.id}>
                <Photo src={x.image_url} alt={x.title} />
                <h3>{x.title}</h3>
              </Link>
            ))}
        </div>
      </section>
    </div>
  );
}
function SmartRedirect() {
  const { keyword } = useParams();
  const result = useContent('smart_links');
  const { search } = useLocation();
  const item = useMemo(
    () => result.data.find((x) => x.active && x.keyword.toLowerCase() === keyword?.toLowerCase()),
    [result.data, keyword],
  );
  const target = item ? safeDestination(item.destination_url) : '';
  useEffect(() => {
    if (!item || !target) return;
    track('smart_link_click', item.id);
    const timer = setTimeout(() => location.replace(preserveUtm(target, search)), 150);
    return () => clearTimeout(timer);
  }, [item, target, search]);
  return (
    <div className="container section">
      <SEO title="Opening your discovery" noindex />
      {result.loading || result.error ? (
        <State {...result} retry={result.reload} />
      ) : item && target ? (
        <>
          <h1>Your discovery awaits.</h1>
          <p>Opening {item.title}…</p>
          <a className="button" href={preserveUtm(target, search)}>
            Continue
          </a>
        </>
      ) : (
        <>
          <h1>This link has moved.</h1>
          <Link className="button" to="/shop">
            Explore the shop
          </Link>
        </>
      )}
    </div>
  );
}
