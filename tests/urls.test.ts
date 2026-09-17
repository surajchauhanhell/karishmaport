import { describe, it, expect } from 'vitest';
import { safeUrl, safeDestination, preserveUtm, slugify } from '../src/utils/urls';
describe('outbound URL safety', () => {
  it('rejects executable and protocol-relative URLs', () => {
    for (const input of ['javascript:alert(1)', 'data:text/html,hello', '//evil.example'])
      expect(safeUrl(input)).toBe('');
    expect(safeDestination('//evil.example')).toBe('');
    expect(safeDestination('/\\evil.example')).toBe('');
  });
  it('accepts supported links', () => {
    expect(safeUrl('https://retailer.example/item')).toBe('https://retailer.example/item');
    expect(safeDestination('/shop?category=Hair')).toBe('/shop?category=Hair');
  });
  it('retains collection filters while carrying attribution', () => {
    const output = new URL(
      preserveUtm(
        '/shop?category=Makeup',
        '?utm_source=instagram&utm_campaign=green_saree&token=secret',
        'https://creator.example',
      ),
    );
    expect(output.searchParams.get('category')).toBe('Makeup');
    expect(output.searchParams.get('utm_campaign')).toBe('green_saree');
    expect(output.searchParams.has('token')).toBe(false);
  });
  it('normalizes slugs', () => expect(slugify(' Green Saree Glam! ')).toBe('green-saree-glam'));
});
