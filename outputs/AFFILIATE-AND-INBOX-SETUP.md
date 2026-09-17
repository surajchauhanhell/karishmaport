# Affiliate shopping and inbox setup

## Database update

Copy all of `outputs/supabase-affiliate-update.sql` into Supabase SQL Editor and Run. It adds affiliate link and category fields to existing looks and preserves your content. It is repeat-safe. Do not rerun the full setup on your existing database.

## Adding products and looks

- Products: enter the name, Affiliate link and Product category, then add a photo and optional Reel URL. New products are active and not demos. Existing demos keep their setting; disable Demo product when ready to share a real affiliate link.
- Shop the Look: enter the title, Affiliate link, Product category, photo and optional Reel URL, then enable Published. Buy now appears beside Watch Reel. Without a direct affiliate link, looks with assigned products offer Shop products.
- Page slugs are generated automatically. Editing preserves existing page URLs. Admin lists support search and category filtering; shop category filters apply to products and looks.
- Paste the exact link issued by your affiliate program, including tracking parameters. Customers buy on the retailer's site. Your affiliate program determines eligible commission and payment; this website does not process purchases or guarantee commission. Direct look affiliate clicks are not included in the product-click report.

## Activate contact and collaboration delivery

In the app `.env`, set your public Turnstile key, then restart Vite or rebuild production:

```env
VITE_TURNSTILE_SITE_KEY=your-public-site-key
```

Allow your local and production hostnames in the Turnstile widget. In Supabase Edge Functions Secrets, set:

```env
TURNSTILE_SECRET_KEY=your-turnstile-secret-key
RATE_LIMIT_SALT=a-long-random-secret
ALLOWED_ORIGINS=http://127.0.0.1:5173,http://localhost:5173,https://your-actual-domain
```

Replace the example domain with your real origin, without a trailing slash. Keep secrets out of frontend variables. Supabase supplies SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the hosted function.

From PowerShell in `D:\Project\Karishma Portfolio`:

```powershell
npx supabase login
npx supabase functions deploy public-api --project-ref lbsuvbrafeztyjgqyarg --no-verify-jwt --use-api
```

The function accepts signed-out enquiries and validates origin, Turnstile, inputs and rate limits before saving. Database inbox reads remain admin-only. See [Supabase deployment documentation](https://supabase.com/docs/guides/functions/deploy).

After deploying, submit one Contact message and one Work With Me enquiry. Sign in at `/admin/login`, open **Contact messages** and **Work with me enquiries**, read the details and update their statuses. Inboxes refresh every 30 seconds and have a Refresh inbox button. Recent contact messages also appear on the dashboard.

## Verification

Production build including SEO, 13 unit tests, database policy/setup tests, mocked admin CRUD/affiliate tests and mocked form-to-inbox tests passed. Long-title look pages were checked at desktop and mobile sizes. The live database responds successfully. The new SQL update has not been applied remotely. The form function was absent at the live check, and the CLI requires login before deployment. Live delivery still needs testing after deployment and key configuration.
