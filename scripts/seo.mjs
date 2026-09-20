import fs from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const seo = JSON.parse(await fs.readFile('src/data/seo.json', 'utf8'));
const origin = seo.origin;
if (new URL(origin).protocol !== 'https:') throw new Error('SEO origin must use HTTPS.');
const esc = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
const base = await fs.readFile('dist/index.html', 'utf8');
let settings = {
  og_image:
    'https://images.unsplash.com/photo-1571332298064-10f36c6232c9?auto=format&fit=crop&w=1200&q=85',
  name: 'Karishma Chauhan',
  seo_title: 'Karishma Chauhan | Mumbai Beauty, Fashion & Lifestyle Creator',
  seo_description:
    'Discover Karishma Chauhan, a Mumbai-based beauty, fashion and lifestyle creator sharing makeup, GRWM, traditional looks, fashion inspiration and everyday content.',
  instagram_url: 'https://www.instagram.com/itskarishma.chauhan/',
};
const routes = [
  ['/', ''],
  ['/about', 'Meet Karishma'],
  ['/portfolio', 'My Content'],
  ['/shop', 'Shop My Picks'],
  ['/work-with-me', 'Work With Me'],
  ['/media-kit', 'Creator Media Kit'],
  ['/blog', 'The Journal'],
  ['/contact', 'Contact Karishma'],
  ['/privacy', 'Privacy Policy'],
  ['/affiliate-disclosure', 'Affiliate Disclosure'],
].map(([url, title]) => ({ url, title }));
if (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY) {
  async function get(table) {
    const out = [];
    for (let offset = 0; ; offset += 1000) {
      const response = await fetch(
        `${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=*&order=created_at.asc,id.asc&limit=1000&offset=${offset}`,
        {
          headers: {
            apikey: env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
          },
        },
      );
      if (!response.ok)
        throw new Error(`SEO content fetch failed: ${table}, HTTP ${response.status}`);
      const rows = await response.json();
      out.push(...rows);
      if (rows.length < 1000) return out;
    }
  }
  const [s, products, posts, portfolio, looks] = await Promise.all(
    ['creator_settings', 'products', 'blog_posts', 'portfolio_items', 'looks'].map(get),
  );
  settings = { ...settings, ...s[0] };
  settings.youtube_url ||= 'https://www.youtube.com/@Karishmachauhan2z';
  for (const [prefix, rows] of [
    ['shop', products.filter((x) => x.active && !x.is_demo)],
    ['blog', posts.filter((x) => x.status === 'published')],
    ['portfolio', portfolio.filter((x) => x.published)],
    ['looks', looks.filter((x) => x.published)],
  ])
    for (const r of rows) {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(r.slug)) continue;
      routes.push({
        url: `/${prefix}/${r.slug}`,
        title: r.seo_title || r.title || r.name,
        description: r.seo_description || r.excerpt || r.description,
        image: r.featured_image || r.thumbnail_url || r.image_url,
        modified: r.updated_at || r.published_at || r.created_at,
        article: prefix === 'blog' ? r : null,
      });
    }
}
for (const r of routes) {
  const title =
    seo.pages[r.url]?.title ||
    (r.title?.includes(settings.name) ? r.title : `${r.title} | ${settings.name}`);
  const description = r.description || seo.pages[r.url]?.description || settings.seo_description;
  const image = r.image || settings.og_image || settings.profile_image;
  const url = origin + r.url;
  const schema = r.article
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: r.article.title,
        datePublished: r.article.published_at,
        dateModified: r.article.updated_at,
        author: { '@type': 'Person', name: r.article.author },
        image: r.image || undefined,
        mainEntityOfPage: url,
      }
    : r.url === '/'
      ? {
          '@context': 'https://schema.org',
          '@type': 'ProfilePage',
          mainEntity: {
            '@type': 'Person',
            name: settings.name,
            url: origin + '/',
            jobTitle: 'Beauty, Fashion & Lifestyle Content Creator',
            alternateName: '@itskarishma.chauhan',
            sameAs: [
              settings.instagram_url,
              ...(settings.youtube_url ? [settings.youtube_url] : []),
            ],
            address: { '@type': 'PostalAddress', addressLocality: 'Mumbai', addressCountry: 'IN' },
          },
        }
      : {
          '@context': 'https://schema.org',
          '@type': ['/portfolio', '/shop', '/blog'].includes(r.url) ? 'CollectionPage' : 'WebPage',
          name: title,
          description,
          url,
          isPartOf: { '@type': 'WebSite', name: settings.name, url: origin + '/' },
        };
  const meta = `<title>${esc(title)}</title><meta data-rh="true" name="description" content="${esc(description)}"><link data-rh="true" rel="canonical" href="${esc(url)}"><meta data-rh="true" name="robots" content="index,follow"><meta data-rh="true" property="og:site_name" content="${esc(settings.name)}"><meta data-rh="true" property="og:locale" content="en_IN"><meta data-rh="true" property="og:title" content="${esc(title)}"><meta data-rh="true" property="og:description" content="${esc(description)}"><meta data-rh="true" property="og:url" content="${esc(url)}"><meta data-rh="true" property="og:type" content="${r.article ? 'article' : 'website'}"><meta data-rh="true" name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}"><meta data-rh="true" name="twitter:title" content="${esc(title)}"><meta data-rh="true" name="twitter:description" content="${esc(description)}">${image ? `<meta data-rh="true" property="og:image" content="${esc(image)}"><meta data-rh="true" name="twitter:image" content="${esc(image)}">` : ''}${env.VITE_GOOGLE_SITE_VERIFICATION ? `<meta data-rh="true" name="google-site-verification" content="${esc(env.VITE_GOOGLE_SITE_VERIFICATION)}">` : ''}${schema ? `<script data-rh="true" type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : ''}`;
  const html = base
    .replace(/<title>.*?<\/title>/s, '')
    .replace(/<meta name="description"[^>]*\/>/, '')
    .replace('</head>', `${meta}</head>`);
  const output =
    r.url === '/' ? 'dist/index.html' : path.join('dist', r.url.slice(1), 'index.html');
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.writeFile(output, html);
}
await fs.writeFile(
  'dist/sitemap.xml',
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((r) => `<url><loc>${esc(origin + r.url)}</loc>${r.modified && !Number.isNaN(Date.parse(r.modified)) ? `<lastmod>${new Date(r.modified).toISOString()}</lastmod>` : ''}</url>`).join('')}</urlset>`,
);
await fs.writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`SEO: generated ${routes.length} route documents and sitemap.`);
