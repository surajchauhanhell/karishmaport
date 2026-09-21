import { supabase } from './supabase';
type Gtag = (...args: unknown[]) => void;
declare global {
  interface Window {
    dataLayer: unknown[];
    gtag?: Gtag;
  }
}
let gaLoaded = false;
export function loadAnalytics() {
  if (/^\/admin(?:\/|$)/.test(location.pathname)) return;
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID;
  if (
    gaLoaded ||
    !/^G-[A-Z0-9]+$/.test(id ?? '') ||
    localStorage.getItem('analytics-consent') !== 'yes'
  )
    return;
  gaLoaded = true;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: false });
  const s = document.createElement('script');
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${id}`;
  document.head.appendChild(s);
}
export function attribution() {
  const keys = ['utm_source', 'utm_medium', 'utm_campaign'];
  const params = new URLSearchParams(location.search);
  try {
    if (keys.some((k) => params.has(k)))
      sessionStorage.setItem(
        'attribution',
        JSON.stringify(
          Object.fromEntries(keys.map((k) => [k, (params.get(k) ?? '').slice(0, 200)])),
        ),
      );
    return JSON.parse(sessionStorage.getItem('attribution') ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}
export function track(event_name: string, entity_id?: string) {
  // Creator/authentication pages are not public visitor analytics.
  if (/^\/admin(?:\/|$)/.test(location.pathname)) return;
  if (localStorage.getItem('analytics-consent') === 'yes')
    window.gtag?.('event', event_name, { entity_id, page_path: location.pathname });
  if (!supabase) return;
  void supabase.functions
    .invoke('public-api', {
      body: {
        action: 'event',
        event_name,
        entity_id,
        source_page: location.pathname,
        referrer: document.referrer ? new URL(document.referrer).origin : '',
        ...attribution(),
      },
    })
    .catch(() => {});
}
