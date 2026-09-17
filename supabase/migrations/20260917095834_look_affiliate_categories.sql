-- Run in Supabase SQL Editor on the existing portfolio database.
-- Adds fields only; preserves all existing products, looks and enquiries.
begin;
alter table public.looks add column if not exists affiliate_url text not null default '' check (affiliate_url = '' or affiliate_url ~ '^https?://');
alter table public.looks add column if not exists category text not null default '';
notify pgrst, 'reload schema';
commit;
