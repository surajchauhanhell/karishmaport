import { loadEnv } from 'vite';
const env = loadEnv('production', process.cwd(), '');
for (const table of ['creator_settings', 'products', 'portfolio_items', 'blog_posts']) {
  try {
    const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/${table}?select=id&limit=1`, {
      headers: { apikey: env.VITE_SUPABASE_ANON_KEY },
      signal: AbortSignal.timeout(12000),
    });
    const data = await r.json();
    console.log(JSON.stringify({table,status:r.status,code:data.code??null,message:data.message??null}));
  } catch (e) { console.log(JSON.stringify({table,error:e.message})); }
}
