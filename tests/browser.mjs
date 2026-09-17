import { chromium } from '@playwright/test';
import fs from 'node:fs/promises';
const origin = process.env.TEST_ORIGIN || 'http://127.0.0.1:5173';
const browser = await chromium.launch({
  headless: true,
  channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge',
});
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(origin, { waitUntil: 'networkidle' });
await page.locator('h1').waitFor();
await fs.mkdir('../../work/qa', { recursive: true });
await page.screenshot({ path: '../../work/qa/home-desktop.png', fullPage: true });
const checks = [];
for (const width of [320, 375, 390, 430, 768, 1024, 1280, 1440]) {
  await page.setViewportSize({ width, height: 900 });
  for (const route of [
    '/',
    '/about',
    '/portfolio',
    '/shop',
    '/work-with-me',
    '/media-kit',
    '/blog',
    '/contact',
    '/privacy',
    '/affiliate-disclosure',
    '/admin',
    '/missing-page',
  ]) {
    await page.goto(origin + route, { waitUntil: 'networkidle' });
    await page.locator('h1').waitFor();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    );
    if (overflow) throw new Error(`Horizontal overflow: ${route} at ${width}`);
    checks.push(`${width} ${route}`);
  }
}
await page.setViewportSize({ width: 390, height: 844 });
await page.goto(origin);
await page.getByRole('button', { name: 'Open navigation' }).click();
await page
  .getByRole('navigation', { name: 'Main navigation' })
  .getByRole('link', { name: 'Shop My Picks' })
  .click();
await page.getByRole('heading', { name: 'Shop my picks.' }).waitFor();
await page.getByRole('button', { name: 'Hair', exact: true }).click();
if (!page.url().includes('category=Hair')) throw new Error('Category URL was not updated');
await page.getByLabel('Search products').fill('nothing');
await page.getByText('No picks found.').waitFor();
await page.goto(origin + '/admin/products');
await page.waitForURL('**/admin/login');
if ((await page.locator('meta[name=robots]').getAttribute('content')) !== 'noindex,nofollow')
  throw new Error('Admin noindex missing');
await page.goto(origin + '/shop/does-not-exist');
await page.getByRole('heading', { name: /missed the shoot/ }).waitFor();
await page.goto(origin + '/');
await page.screenshot({ path: '../../work/qa/home-mobile.png', fullPage: true });
const images = await page
  .locator('img')
  .evaluateAll((imgs) =>
    imgs.map((i) => ({ src: i.src, loaded: i.complete && i.naturalWidth > 0 })),
  );
if (images.some((i) => !i.loaded)) throw new Error(`Unloaded image: ${JSON.stringify(images)}`);
const schema = JSON.parse(
  await page.locator('script[type="application/ld+json"]').first().textContent(),
);
if (schema.mainEntity.name !== 'Karishma Chauhan') throw new Error('Profile schema missing');
if (errors.length) throw new Error(`Browser exceptions: ${errors.join('; ')}`);
await fs.writeFile(
  '../../work/qa/browser-results.json',
  JSON.stringify(
    {
      checks: checks.length,
      widths: [320, 375, 390, 430, 768, 1024, 1280, 1440],
      errors,
      images,
      passed: true,
    },
    null,
    2,
  ),
);
console.log(
  `Passed ${checks.length} route/viewport checks, mobile navigation, filters, search, protected routing, metadata, images and schema.`,
);
await browser.close();
