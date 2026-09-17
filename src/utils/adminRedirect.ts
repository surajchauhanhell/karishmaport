export function adminReturnPath(value: unknown): string {
  if (typeof value !== 'string' || /[\u0000-\u0020\\]/.test(value)) return '/admin';
  try {
    const url = new URL(value, 'https://admin.invalid');
    if (
      url.origin !== 'https://admin.invalid' ||
      !(url.pathname === '/admin' || url.pathname.startsWith('/admin/')) ||
      /^\/admin\/login\/?$/.test(url.pathname)
    )
      return '/admin';
    return url.pathname + url.search;
  } catch {
    return '/admin';
  }
}
