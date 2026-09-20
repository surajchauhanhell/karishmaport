import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const seo = JSON.parse(await fs.readFile('src/data/seo.json', 'utf8'));
const esc = s => s.replaceAll('&', '&amp;').replaceAll("'", '&#39;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const descriptions = new Set();
for (const [route, meta] of Object.entries(seo.pages)) {
  const html = await fs.readFile(`dist${route === '/' ? '' : route}/index.html`, 'utf8');
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.equal((html.match(/name="description"/g) || []).length, 1);
  assert.ok(html.includes(`<title>${esc(meta.title)}</title>`));
  assert.ok(html.includes(`rel="canonical" href="${seo.origin}${route}"`));
  assert.ok(html.includes(`property="og:title" content="${esc(meta.title)}"`));
  assert.ok(html.includes(`name="description" content="${esc(meta.description)}"`));
  assert.ok(!html.includes('sound-pike-0185.chatgpt.site'));
  const json = html.match(/type="application\/ld\+json">(.*?)<\/script>/s);
  assert.ok(json, `Missing structured data: ${route}`);
  assert.equal(JSON.parse(json[1])['@context'], 'https://schema.org');
  descriptions.add(meta.description);
}
assert.equal(descriptions.size, Object.keys(seo.pages).length);
const sitemap = await fs.readFile('dist/sitemap.xml', 'utf8');
const locations = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m => m[1]);
assert.equal(locations.length, new Set(locations).size);
assert.ok(locations.every(url => url.startsWith(seo.origin + '/') && !/\/(admin|go)(\/|$)/.test(url)));
assert.ok((await fs.readFile('dist/robots.txt', 'utf8')).includes(`Sitemap: ${seo.origin}/sitemap.xml`));
const config = JSON.parse(await fs.readFile('vercel.json','utf8'));
assert.ok(config.routes.some(r => r.src === '/(admin|go)(/.*)?' && r.headers['X-Robots-Tag'] === 'noindex, nofollow'));
console.log(`SEO checks passed: ${locations.length} canonical URLs, unique metadata, structured data, sitemap and private-route indexing rules.`);
