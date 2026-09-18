# Contact and collaboration inbox update

1. Run all of `supabase-inbox-update.sql` in your existing Supabase project's SQL Editor. It preserves existing messages and can be run again.
2. Deploy the updated GitHub main branch to Vercel.
3. Submit a Contact message and a Work With Me enquiry, then open the corresponding admin inboxes.

Visitors submit directly through Supabase's Data API. The inbox lists sender, subject/campaign, date and actions. Admins can view full details and delete with confirmation; they cannot edit messages, including through database API requests. Inboxes refresh every 30 seconds.

This form flow does not need the public-api Edge Function or Turnstile keys. It uses database validation and a frontend honeypot, but does not provide server-side CAPTCHA or rate limiting; public forms may receive spam. Analytics still uses the separate Edge Function.

Run only the inbox update on an existing database, not the complete setup. GitHub deployment does not automatically apply Supabase SQL.
