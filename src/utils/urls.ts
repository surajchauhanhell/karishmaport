export function safeUrl(value: unknown): string {
  if (typeof value !== 'string' || !value) return '';
  try {
    const u = new URL(value);
    return ['https:', 'http:'].includes(u.protocol) ? u.href : '';
  } catch {
    return '';
  }
}
export function safeDestination(value: string): string {
  if (/[\u0000-\u0020\\]/.test(value)) return '';
  if (value.startsWith('/')) {
    try {
      const u = new URL(value, 'https://local.invalid');
      return u.origin === 'https://local.invalid' ? u.pathname + u.search + u.hash : '';
    } catch {
      return '';
    }
  }
  return safeUrl(value);
}
export function preserveUtm(
  destination: string,
  search: string,
  origin = window.location.origin,
): string {
  const u = new URL(destination, origin);
  const params = new URLSearchParams(search);
  for (const key of ['utm_source', 'utm_medium', 'utm_campaign']) {
    const v = params.get(key);
    if (v) u.searchParams.set(key, v.slice(0, 200));
  }
  return u.href;
}
export const slugify = (v: string) =>
  v
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
