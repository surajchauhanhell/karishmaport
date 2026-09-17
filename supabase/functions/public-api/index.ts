// Deployed only to Supabase Edge Functions. Service role never enters the frontend.
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3';
const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const allowed = (Deno.env.get('ALLOWED_ORIGINS') ?? '')
  .split(',')
  .map((x) => x.trim())
  .filter(Boolean);
const str = (max: number) => z.string().trim().min(2).max(max);
const common = z.object({
  email: z.string().email().max(254),
  message: str(3000),
  consent: z.literal(true),
  website_trap: z.literal(''),
});
const contact = common.extend({ name: str(120), subject: str(200) });
const collaboration = common.extend({
  brand_name: str(150),
  contact_name: str(120),
  phone: z.string().max(40).default(''),
  website: z
    .union([
      z.literal(''),
      z
        .string()
        .url()
        .max(500)
        .refine((x) => /^https?:\/\//.test(x)),
    ])
    .default(''),
  campaign_type: str(100),
  product: str(200),
  budget_range: z.string().max(100).default(''),
  deliverables: str(3000),
  target_date: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]).default(''),
});
const event = z.object({
  event_name: z.enum([
    'page_view',
    'portfolio_view',
    'instagram_click',
    'youtube_click',
    'affiliate_click',
    'product_view',
    'brand_inquiry_start',
    'brand_inquiry_submit',
    'media_kit_view',
    'shop_view',
    'blog_view',
    'smart_link_click',
  ]),
  entity_id: z.string().uuid().optional(),
  source_page: z.string().max(500).regex(/^\//),
  utm_source: z.string().max(200).default(''),
  utm_medium: z.string().max(200).default(''),
  utm_campaign: z.string().max(200).default(''),
  referrer: z.string().max(500).default(''),
});
Deno.serve(async (req: Request) => {
  const origin = req.headers.get('origin') ?? '';
  const headers = {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    Vary: 'Origin',
    'Content-Type': 'application/json',
  };
  const reply = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (!allowed.includes(origin)) return reply({ error: 'Origin not allowed.' }, 403);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);
  try {
    if (Number(req.headers.get('content-length') ?? 0) > 20000)
      return reply({ error: 'Request too large.' }, 413);
    const reader = req.body?.getReader();
    if (!reader) return reply({ error: 'Empty request.' }, 400);
    const chunks: Uint8Array[] = [];
    let total = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.length;
      if (total > 20000) {
        await reader.cancel();
        return reply({ error: 'Request too large.' }, 413);
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let at = 0;
    for (const c of chunks) {
      bytes.set(c, at);
      at += c.length;
    }
    const body = JSON.parse(new TextDecoder().decode(bytes));
    const isEvent = body.action === 'event';
    if (!['event', 'contact', 'collaboration'].includes(body.action))
      return reply({ error: 'Unknown action.' }, 400);
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const salt = Deno.env.get('RATE_LIMIT_SALT');
    if (!salt)
      return reply(
        { error: 'The enquiry service is being configured. Please email Karishma.' },
        503,
      );
    const hash = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(`${salt}:${ip}:${isEvent ? 'event' : 'form'}`),
    );
    const key = Array.from(new Uint8Array(hash), (x) => x.toString(16).padStart(2, '0')).join('');
    const limit = await db.rpc('check_rate_limit', { rate_key: key, max_hits: isEvent ? 300 : 8 });
    if (limit.error) throw limit.error;
    if (!limit.data) return reply({ error: 'Too many requests. Please try again later.' }, 429);
    if (isEvent) {
      const parsed = event.safeParse(body);
      if (!parsed.success) return reply({ error: 'Invalid event.' }, 400);
      const e = parsed.data;
      const { referrer, ...record } = e;
      if (e.event_name === 'affiliate_click' || e.event_name === 'product_view') {
        if (!e.entity_id) return reply({ error: 'Product required.' }, 400);
        const { data: p, error } = await db
          .from('products')
          .select('id,is_demo,affiliate_url')
          .eq('id', e.entity_id)
          .eq('active', true)
          .maybeSingle();
        if (error) throw error;
        if (!p || p.is_demo) return reply({ ok: true });
        if (e.event_name === 'affiliate_click') {
          if (!p.affiliate_url) return reply({ ok: true });
          const { error } = await db
            .from('affiliate_clicks')
            .insert({
              product_id: p.id,
              source_page: e.source_page,
              utm_source: e.utm_source,
              utm_medium: e.utm_medium,
              utm_campaign: e.utm_campaign,
              referrer,
            });
          if (error) throw error;
        }
      }
      if (e.event_name === 'smart_link_click' && e.entity_id) {
        const { error } = await db.rpc('increment_smart_link', { link_id: e.entity_id });
        if (error) throw error;
      }
      const { error } = await db.from('analytics_events').insert(record);
      if (error) throw error;
      return reply({ ok: true });
    }
    const parsed = (body.action === 'contact' ? contact : collaboration).safeParse(body.values);
    if (!parsed.success)
      return reply({ error: 'Please check the form fields and your consent.' }, 400);
    if (!z.string().uuid().safeParse(body.request_id).success)
      return reply({ error: 'Invalid submission identifier.' }, 400);
    const table = body.action === 'contact' ? 'contact_messages' : 'collaboration_inquiries';
    const { data: existing, error: lookupError } = await db
      .from(table)
      .select('id')
      .eq('request_id', body.request_id)
      .maybeSingle();
    if (lookupError) throw lookupError;
    if (existing) return reply({ ok: true });
    const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (!secret)
      return reply({ error: 'Spam protection is being configured. Please email Karishma.' }, 503);
    const verify = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: String(body.token ?? '') }),
    }).then((r) => r.json());
    const hostnames = allowed.map((x) => new URL(x).hostname);
    if (!verify.success || !hostnames.includes(verify.hostname))
      return reply({ error: 'Please complete the security check again.' }, 400);
    const { website_trap, ...values } = parsed.data;
    void website_trap;
    const record: Record<string, unknown> = {
      ...values,
      request_id: body.request_id,
      status: 'new',
    };
    if ('target_date' in record && !record.target_date) record.target_date = null;
    const { error } = await db.from(table).insert(record);
    if (error && error.code !== '23505') throw error;
    return reply({ ok: true });
  } catch (error) {
    console.error(
      'Public API failure',
      error instanceof Error ? error.name : 'Database/request error',
    );
    return reply(
      { error: 'Your request could not be processed. Please try again or email Karishma.' },
      500,
    );
  }
});
