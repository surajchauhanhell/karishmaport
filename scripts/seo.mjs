import fs from 'node:fs/promises';
import path from 'node:path';
import { loadEnv } from 'vite';
const env = { ...loadEnv('production', process.cwd(), ''), ...process.env };
const origin = (env.VITE_SITE_URL || 'http://localhost:5173').replace(/\/$/, '');
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
        `${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=*&limit=1000&offset=${offset}`,
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
        article: prefix === 'blog' ? r : null,
      });
    }
}
for (const r of routes) {
  const title = r.title ? `${r.title} | ${settings.name}` : settings.seo_title;
  const description = r.description || settings.seo_description;
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
            alternateName: '@itskarishma.chauhan',
            sameAs: [
              settings.instagram_url,
              ...(settings.youtube_url ? [settings.youtube_url] : []),
            ],
            address: { '@type': 'PostalAddress', addressLocality: 'Mumbai', addressCountry: 'IN' },
          },
        }
      : null;
  const meta = `<title>${esc(title)}</title><meta data-rh="true" name="description" content="${esc(description)}"><link data-rh="true" rel="canonical" href="${esc(url)}"><meta data-rh="true" name="robots" content="index,follow"><meta data-rh="true" property="og:title" content="${esc(title)}"><meta data-rh="true" property="og:description" content="${esc(description)}"><meta data-rh="true" property="og:url" content="${esc(url)}"><meta data-rh="true" property="og:type" content="${r.article ? 'article' : 'website'}"><meta data-rh="true" name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}"><meta data-rh="true" name="twitter:title" content="${esc(title)}"><meta data-rh="true" name="twitter:description" content="${esc(description)}">${image ? `<meta data-rh="true" property="og:image" content="${esc(image)}"><meta data-rh="true" name="twitter:image" content="${esc(image)}">` : ''}${env.VITE_GOOGLE_SITE_VERIFICATION ? `<meta data-rh="true" name="google-site-verification" content="${esc(env.VITE_GOOGLE_SITE_VERIFICATION)}">` : ''}${schema ? `<script data-rh="true" type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>` : ''}`;
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
  `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map((r) => `<url><loc>${esc(origin + r.url)}</loc></url>`).join('')}</urlset>`,
);
await fs.writeFile(
  'dist/robots.txt',
  `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /go/\nSitemap: ${origin}/sitemap.xml\n`,
);
console.log(`SEO: generated ${routes.length} route documents and sitemap.`);
