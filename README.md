# Karishma Chauhan — Creator Platform

A complete Vite / React / TypeScript creator platform with Tailwind CSS, React Router, Supabase Auth, Postgres, Storage and Edge Functions. Public content includes portfolio, affiliate products, looks, journal, media kit and collaboration enquiries. The protected creator studio manages all collections, images, settings and website analytics.

## Run locally

**Latest inbox update:** Contact and collaboration forms now insert directly into Supabase. On an existing database, run `outputs/supabase-inbox-update.sql` and deploy this source. Admin inboxes support viewing and deletion only. See `outputs/INBOX-SETUP.md`. Earlier Edge Function/Turnstile form instructions below are superseded; that function is still used for analytics. This direct form flow has database validation but no server-side CAPTCHA or rate limiting.

Requires Node.js 22+ and npm.

```sh
npm install
cp .env.example .env
npm run dev
```

On Windows use `Copy-Item .env.example .env`. Without Supabase credentials, the public site opens with the supplied profile and honest empty collections. Forms and admin sign-in are unavailable until configured; there is no fake persistence or demo login.

```sh
npm run build
npm test
npm run preview
```

The production build runs strict TypeScript, Vite, then generates route-specific HTML metadata, robots.txt and sitemap.xml. Public detail routes are included when Supabase credentials are present at build time. Rebuild after publishing, unpublishing or changing slugs to refresh the sitemap and social-preview HTML. The React app fetches current content on each page visit independently of these build snapshots.

## Supabase setup

**Prepared SQL for your administrator:** Create and confirm `surajchauhan76604@gmail.com` in Supabase Authentication → Users and set its password there. For a fresh database, run the complete `outputs/supabase-setup.sql` once in SQL Editor. This combines the schema, seed data and admin grant. If you already ran `schema.sql`, run only `outputs/supabase-admin-only.sql`. The admin-only script is safe to rerun. Sign in at `/admin/login`. The grant stores the user's UUID; it does not allow future signups to grant themselves access. No password is included in SQL. To regenerate the combined files after SQL edits, run `node scripts/prepare-supabase-sql.mjs`.

The numbered steps below describe the equivalent separate-file setup. Do not run `schema.sql` again after successfully running the combined setup.

1. Create a Supabase project. Run `supabase/schema.sql` once in the SQL editor, then run `supabase/seed.sql`. The seed can be safely rerun. It adds ten **draft titles**, two **inactive demo products**, the supplied profile and starter smart links. It does not fabricate creator work, endorsements or personal product use.
2. Put the project URL and public anon key in `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never use a service-role key in any `VITE_` variable. These public values are embedded in the frontend; RLS provides authorization.
3. Set the canonical origin in `src/data/seo.json` when changing domains. Set Auth → URL configuration to the production origin and local development origin as appropriate. Disable public signups; create admin accounts through the Supabase dashboard.
4. Create the administrator in Authentication → Users. Use its UUID, not an email, in the SQL editor:

```sql
insert into public.admin_users(user_id) values ('YOUR_AUTH_USER_UUID');
```

There is no public method to grant administrator status. The route guard calls `is_admin()`, and every content mutation is also enforced by RLS. Revoking membership removes database access even if the session remains signed in. Passwords remain in Supabase Auth. Use the dashboard's password reset tools for account recovery.

5. Deploy the public endpoint with the Supabase CLI:

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy public-api --no-verify-jwt
```

The endpoint intentionally accepts unauthenticated visitors. It validates every action, verifies origin and form CAPTCHA, rate limits requests, ignores client-provided admin fields, and writes using the server-only service role. Browser clients have **no anonymous INSERT policy**, including on enquiry and analytics tables.

6. Create a Cloudflare Turnstile widget for your production and local hostnames. Set `VITE_TURNSTILE_SITE_KEY` in the frontend environment. In Supabase Edge Function secrets set:

```text
ALLOWED_ORIGINS=https://your-domain.example,http://localhost:5173,http://127.0.0.1:5173
TURNSTILE_SECRET_KEY=your-turnstile-secret
RATE_LIMIT_SALT=a-long-random-secret
```

Supabase supplies `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to Edge Functions. Do not copy them into browser code. Form submissions fail closed until Turnstile and the rate-limit salt are configured. The client keeps an idempotency UUID until a successful submission; retries cannot create duplicate enquiries. The rate limit is 8 forms and 300 events per network address per hour. This basic control does not replace platform abuse monitoring. Hash identifiers expire after two hours and are cleaned on requests. Event counts are directional, not audited conversion or sales figures.

## Storage and admin workflow

The migration creates `creator-images`, `product-images`, `portfolio-images`, `blog-images`, and `media-kit`. Public reading is allowed; uploading, overwriting and deleting require a verified admin. Image buckets accept JPEG, PNG, WebP and AVIF; the media-kit bucket accepts PDF. Files are capped at 8 MB. SVG and HTML uploads are rejected. Use compressed images around 1,600 px wide; current UI preserves aspect ratios and defers offscreen image loading.

Visit `/admin/login` to sign in. Manage products, portfolio items, articles, looks, smart links, enquiries, contact messages, testimonials, brand logos and settings. Save a look before editing its associated products; each product assignment has an editable ordering value. Blog content uses Markdown with raw HTML disabled. Related products and creator content can be selected in the blog editor. Delete actions require an accessible confirmation. Media kit PDFs and profile images can be uploaded in Settings.

Public profile: supplied follower count 628 and post count 68 are **manually maintained**, not verified live. Enter a statistics update date when checked. Unknown YouTube, demographics, testimonials and brand partnerships stay hidden. No person is substituted for Karishma: the initial hero is an editorial beauty still life; add her own portrait in Settings. Product demo flags suppress affiliate shopping links.

## Analytics, affiliate tracking and smart links

`/go/LOOK`, `/go/LIPSTICK` and `/go/HAIR` resolve admin-managed destinations and preserve `utm_source`, `utm_medium` and `utm_campaign`. Attribution is kept for the current browser session and added to affiliate click records. Use `/looks/your-look-slug` as a smart-link destination for multi-product looks. This does not implement Instagram comment-to-DM automation; connect your approved Meta integration or external automation service to these URLs.

Affiliate links open directly without waiting for logging. The public Edge Function validates the active product and records clicks. Logging is best effort and may be blocked by network conditions, browser shutdown or ad blockers. A click does not confirm a purchase or commission. The admin analytics RPC aggregates product clicks, campaigns, sources, product views and enquiries across stored records, avoiding browser row-limit aggregation errors. It requires admin membership.

Optional GA4: set `VITE_GA_MEASUREMENT_ID=G-...`. GA loads only after visitor consent; footer Cookie preferences lets visitors change that choice. Basic first-party website events remain active as described in the privacy draft. No form messages, email addresses or full referring URLs are sent to analytics. Review the privacy policy and your retention process before public launch; delete old enquiries and event records according to your documented retention schedule.

## SEO and deployment to Vercel

1. Import this directory as a Vercel project; framework Vite, build `npm run build`, output `dist`.
2. Add public `VITE_` variables in project settings before building. The canonical production origin and static page metadata are maintained in `src/data/seo.json`. Keep Edge Function secrets only in Supabase.
3. Deploy, add your domain, and update Supabase Auth, `ALLOWED_ORIGINS`, and Turnstile allowed hostnames.
4. Upload a real profile/social image in Settings. Open Graph and Twitter images are emitted when supplied; no fake portrait is generated. Set `VITE_GOOGLE_SITE_VERIFICATION` for Search Console, then submit `/sitemap.xml`.
5. Redeploy after public content changes to refresh static SEO metadata. Static route files take precedence over the SPA fallback; `vercel.json` uses filesystem routing first. Publish a new build after adding or removing public routes: unknown URLs return HTTP 404 until their route document is generated.

Public routes: `/`, `/about`, `/portfolio`, `/portfolio/:slug`, `/shop`, `/shop/:slug`, `/looks/:slug`, `/work-with-me`, `/media-kit`, `/blog`, `/blog/:slug`, `/contact`, `/privacy`, `/affiliate-disclosure`, `/go/:keyword`. Unknown routes return HTTP 404 on Vercel with a noindex header and a custom 404 view. Admin pages use `noindex,nofollow`; Vercel sends `X-Robots-Tag: noindex, nofollow` for `/admin` and `/go/`; robots allows crawling so these directives can be read. Metadata and schemas are available both in rendered React and build-generated route heads. Build-generated HTML includes visible page summaries, public profile links, collection links and published article bodies before React loads. React replaces this initial snapshot with the interactive page. Rebuild after CMS changes to keep both versions aligned. See outputs/SEO-LAUNCH.md for the indexing workflow.

## Verification

`npm test` checks unsafe URL rejection, safe redirect paths and attribution preservation. `npm run build` checks all frontend types and emits production assets. `tests/browser.mjs` exercises public routes, mobile menu, collection filters, login protection, metadata, unknown routes and horizontal overflow at 320, 375, 390, 430, 768, 1024, 1280 and 1440 px. It needs a running local preview and Playwright Chromium.

Live backend acceptance must be performed after supplying your own project credentials: admin login, membership revocation, CRUD, bucket uploads, form delivery, CAPTCHA failure and affiliate tracking. `supabase/security-check.sql` contains rollback-only database authorization assertions for a provisioned project. Do not claim live integration verification from an unconfigured preview.

## Image credit

For the latest affiliate shopping and inbox changes, see `outputs/AFFILIATE-AND-INBOX-SETUP.md`. Apply only `outputs/supabase-affiliate-update.sql` to an existing database. Products and looks now generate slugs automatically, offer affiliate links and category selection, and the two inboxes refresh every 30 seconds.

Editorial beauty still life: [Jamie Coupaud / Unsplash](https://unsplash.com/photos/womens-assorted-make-up-dUYWHuFJiJI), used under the [Unsplash License](https://unsplash.com/license). It illustrates beauty content and does not depict Karishma or imply ownership of the products.

## Supabase Auth and protected routes

All `/admin/*` routes except `/admin/login` sit behind `RequireAdmin`. The provider verifies the user with Supabase Auth `getUser()` and then checks the database `is_admin()` RPC. A stored session alone never grants access. Verification runs on route changes, Auth events, and window focus; errors deny access and offer retry. Sign-out clears the current browser session. Login returns to the requested admin path, with external and login-loop destinations rejected.

Authorization remains enforced by the database RLS and Storage policies, independent of browser route guards. There is no public signup or client-side email allowlist. Create a confirmed Auth user for `surajchauhan76604@gmail.com` in the Supabase dashboard, choosing a password there, then run `outputs/supabase-setup.sql` once on a new database. For an already installed schema, use `outputs/supabase-admin-only.sql` instead. The admin script grants membership to the existing confirmed user's UUID; it does not set a password.

Current delivery is locally verified; remote tables were missing at the last check and live login has not been verified. After provisioning, test login at `/admin/login`, open `/admin/products` directly, and verify a separate non-admin account cannot edit data. Configure your deployment URL in Supabase Auth settings.

`tests/auth-browser.mjs` covers anonymous access, login return paths, membership revocation, non-admin denial, verification failure/retry, invalid sessions and sign-out using mocked Supabase responses. Run it against Vite on port 5174 with `VITE_SUPABASE_URL=https://fixture.supabase.co` and `VITE_SUPABASE_ANON_KEY=fixture-public-key`; it uses installed Microsoft Edge. `tests/admin-browser.mjs` verifies existing CMS flows with the same fixture setup. These tests do not establish live backend readiness.
