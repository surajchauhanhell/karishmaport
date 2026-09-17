import { describe, expect, it } from 'vitest';
import { adminReturnPath } from '../src/utils/adminRedirect';
describe('admin login destination', () => {
  it('preserves protected paths and queries', () => {
    expect(adminReturnPath('/admin/products?filter=draft')).toBe('/admin/products?filter=draft');
  });
  it.each([
    undefined,
    'https://evil.test/admin',
    '//evil.test/admin',
    '/shop',
    '/admin/login',
    '/admin/../shop',
    '/admin/\\evil',
    '/admin\n/products',
  ])('rejects unsafe or recursive destination %s', (value) => {
    expect(adminReturnPath(value)).toBe('/admin');
  });
});
