// Mocked Auth integration contracts; this does not verify a live Supabase project.
import { chromium, expect } from '@playwright/test';
const browser = await chromium.launch({ headless: true, channel: 'msedge' });
try {
  const page = await browser.newPage();
  const user = {
    id: '00000000-0000-0000-0000-000000000010',
    email: 'admin@example.test',
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  const token = `${Buffer.from('{"alg":"HS256"}').toString('base64url')}.${Buffer.from(JSON.stringify({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600, role: 'authenticated' })).toString('base64url')}.fixture`;
  let member = true,
    valid = true,
    rpcFailure = false,
    protectedReads = 0;
  await page.route('https://fixture.supabase.co/**', async (route) => {
    const path = new URL(route.request().url()).pathname;
    const reply = (body, status = 200) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
    if (path.endsWith('/token'))
      return reply({
        access_token: token,
        refresh_token: 'fixture',
        expires_in: 3600,
        token_type: 'bearer',
        user,
      });
    if (path.endsWith('/user'))
      return valid ? reply(user) : reply({ message: 'Invalid JWT', code: 'bad_jwt' }, 401);
    if (path.endsWith('/logout')) return reply({});
    if (path.endsWith('/rpc/is_admin'))
      return rpcFailure ? reply({ message: 'Unavailable' }, 500) : reply(member);
    if (path.includes('/rest/v1/')) {
      if (!path.endsWith('/creator_settings')) protectedReads++;
      return reply([]);
    }
    return reply({});
  });
  const login = async () => {
    await page.getByLabel('Email', { exact: true }).fill(user.email);
    await page.getByLabel('Password').fill('fixture-password');
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  };
  await page.goto('http://127.0.0.1:5174/admin/products?filter=draft');
  await expect(page).toHaveURL(/\/admin\/login$/);
  expect(protectedReads).toBe(0);
  await login();
  await expect(page).toHaveURL(/\/admin\/products\?filter=draft$/);
  await expect(page.getByRole('heading', { name: 'Products', exact: true })).toBeVisible();
  // A focus or same-user token refresh must never unmount an in-progress editor.
  await page.getByRole('button', { name: 'Add new', exact: true }).click();
  const draft = page.getByLabel('Product name', { exact: true });
  await draft.fill('Unsaved tab-switch draft');
  await draft.evaluate((node) => {
    window.draftInput = node;
  });
  const readsBeforeFocus = protectedReads;
  for (let i = 0; i < 3; i++) {
    const response = page.waitForResponse((r) => r.url().endsWith('/rpc/is_admin'));
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await response;
    await expect(draft).toHaveValue('Unsaved tab-switch draft');
    expect(await draft.evaluate((node) => node === window.draftInput)).toBe(true);
  }
  await page.evaluate(async () => {
    const { supabase } = await import('/src/services/supabase.ts');
    await supabase.auth.refreshSession();
  });
  await expect(draft).toHaveValue('Unsaved tab-switch draft');
  expect(await draft.evaluate((node) => node === window.draftInput)).toBe(true);
  expect(protectedReads).toBe(readsBeforeFocus);
  // Revalidation still denies a revoked account even with the editor open.
  member = false;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('alert')).toContainText('not authorized');
  await expect(draft).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out of this account' }).click();
  member = true;
  await login();
  await expect(page.getByRole('heading', { name: 'Products', exact: true })).toBeVisible();
  // A new route rechecks membership, preventing access after revocation.
  member = false;
  await page.getByRole('link', { name: 'Blog', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('not authorized');
  await page.getByRole('button', { name: 'Sign out of this account' }).click();
  protectedReads = 0;
  await login();
  await expect(page.getByRole('alert')).toContainText('not authorized');
  expect(protectedReads).toBe(0);
  member = true;
  rpcFailure = true;
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('could not be verified');
  rpcFailure = false;
  await page.getByRole('button', { name: 'Retry verification' }).click();
  await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
  valid = false;
  await page.reload();
  await expect(page.getByRole('alert')).toContainText('session is no longer valid');
  await page.getByRole('button', { name: 'Sign out of this account' }).click();
  valid = true;
  await login();
  await expect(page.getByRole('heading', { name: 'Blog', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sign out', exact: true }).click();
  await page.goto('http://127.0.0.1:5174/admin/products');
  await expect(page).toHaveURL(/\/admin\/login$/);
  await expect(page.getByLabel('Email', { exact: true })).toBeVisible();
  console.log(
    'Auth contracts passed: anonymous denial, return path, membership revocation, non-admin denial, verification failure/retry, invalid session, sign-out.',
  );
} finally {
  await browser.close();
}
