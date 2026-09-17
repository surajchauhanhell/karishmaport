-- Run once in the Supabase SQL editor as the project owner.
-- Only public content is readable anonymously. All browser writes require an admin.
begin;
create extension if not exists pgcrypto;
create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz not null default now());
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$ select exists(select 1 from public.admin_users where user_id=auth.uid()); $$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon,authenticated;
create function public.touch_updated_at() returns trigger language plpgsql set search_path='' as $$ begin new.updated_at=now(); return new; end; $$;
create table public.products (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 200), slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),brand text not null default '',category text not null default 'Makeup',description text not null default '',personal_review text not null default '',best_for text not null default '',how_to_use text not null default '',image_url text not null default '' check(image_url='' or image_url ~ '^https?://'),affiliate_url text not null default '' check(affiliate_url='' or affiliate_url ~ '^https?://'),price numeric(12,2) check(price>=0),currency text not null default 'INR' check(currency ~ '^[A-Z]{3}$'),badge text not null default '',reel_url text not null default '' check(reel_url='' or reel_url ~ '^https?://'),featured boolean not null default false,active boolean not null default true,is_demo boolean not null default true,sort_order integer not null default 0 check(sort_order>=0),created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.portfolio_items (
 id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 250),slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),description text not null default '',thumbnail_url text not null default '' check(thumbnail_url='' or thumbnail_url ~ '^https?://'),content_url text not null default '' check(content_url='' or content_url ~ '^https?://'),platform text not null default 'Instagram',category text not null default 'Beauty',views bigint check(views>=0),likes bigint check(likes>=0),featured boolean not null default false,brand_name text not null default '',published_date date,published boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
create table public.blog_posts (
 id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 250),slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),excerpt text not null default '',content text not null default '',featured_image text not null default '' check(featured_image='' or featured_image ~ '^https?://'),category text not null default 'Beauty',author text not null default 'Karishma Chauhan',seo_title text not null default '',seo_description text not null default '',keywords text not null default '',status text not null default 'draft' check(status in ('draft','published')),featured boolean not null default false,published_at timestamptz,product_ids uuid[] not null default '{}',portfolio_ids uuid[] not null default '{}',created_at timestamptz not null default now(),updated_at timestamptz not null default now(),check(status<>'published' or published_at is not null)
);
create table public.creator_settings (
 id uuid primary key default '00000000-0000-0000-0000-000000000001' check(id='00000000-0000-0000-0000-000000000001'),name text not null default 'Karishma Chauhan',bio text not null default '',instagram_url text not null default 'https://www.instagram.com/itskarishma.chauhan/' check(instagram_url='' or instagram_url ~ '^https?://'),youtube_url text not null default '' check(youtube_url='' or youtube_url ~ '^https?://'),email text not null default 'karishma.1706chauhan@gmail.com',location text not null default 'Mumbai, India',followers integer not null default 628 check(followers>=0),posts integer not null default 68 check(posts>=0),stats_updated_at date,headline text not null default 'Beauty, style & everyday inspiration with a modern desi touch.',intro text not null default '',profile_image text not null default '' check(profile_image='' or profile_image ~ '^https?://'),traditional_image text not null default '' check(traditional_image='' or traditional_image ~ '^https?://'),media_kit_url text not null default '' check(media_kit_url='' or media_kit_url ~ '^https?://'),seo_title text not null default 'Karishma Chauhan | Mumbai Beauty, Fashion & Lifestyle Creator',seo_description text not null default '',og_image text not null default '' check(og_image='' or og_image ~ '^https?://'),social_cta text not null default 'Follow on Instagram',audience_stats text not null default '',created_at timestamptz not null default now(),updated_at timestamptz not null default now()
);
alter table public.creator_settings add column beauty_image text not null default '' check(beauty_image='' or beauty_image ~ '^https?://'), add column fashion_image text not null default '' check(fashion_image='' or fashion_image ~ '^https?://'), add column lifestyle_image text not null default '' check(lifestyle_image='' or lifestyle_image ~ '^https?://');
create table public.collaboration_inquiries (
 id uuid primary key default gen_random_uuid(),request_id uuid not null unique,brand_name text not null check(length(brand_name) between 2 and 150),contact_name text not null check(length(contact_name) between 2 and 120),email text not null check(length(email)<=254 and email like '%@%'),phone text not null default '' check(length(phone)<=40),website text not null default '' check(website='' or website ~ '^https?://'),campaign_type text not null check(length(campaign_type) between 2 and 100),product text not null check(length(product) between 2 and 200),budget_range text not null default '' check(length(budget_range)<=100),deliverables text not null check(length(deliverables) between 2 and 3000),target_date date,message text not null check(length(message) between 2 and 3000),consent boolean not null check(consent),status text not null default 'new' check(status in ('new','contacted','negotiating','confirmed','completed','declined')),created_at timestamptz not null default now()
);
create table public.contact_messages (
 id uuid primary key default gen_random_uuid(),request_id uuid not null unique,name text not null check(length(name) between 2 and 120),email text not null check(length(email)<=254 and email like '%@%'),subject text not null check(length(subject) between 2 and 200),message text not null check(length(message) between 2 and 3000),consent boolean not null check(consent),status text not null default 'new' check(status in ('new','read','replied','archived')),created_at timestamptz not null default now()
);
create table public.looks (id uuid primary key default gen_random_uuid(),title text not null check(length(title) between 1 and 250),slug text not null unique check(slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),description text not null default '',image_url text not null default '' check(image_url='' or image_url ~ '^https?://'),reel_url text not null default '' check(reel_url='' or reel_url ~ '^https?://'),affiliate_url text not null default '' check(affiliate_url='' or affiliate_url ~ '^https?://'),category text not null default '',featured boolean not null default false,published boolean not null default false,created_at timestamptz not null default now(),updated_at timestamptz not null default now());
create table public.look_products (id uuid primary key default gen_random_uuid(),look_id uuid not null references public.looks(id) on delete cascade,product_id uuid not null references public.products(id) on delete cascade,sort_order integer not null default 0 check(sort_order>=0),created_at timestamptz not null default now(),unique(look_id,product_id));
create table public.smart_links (id uuid primary key default gen_random_uuid(),keyword text not null check(keyword ~ '^[a-zA-Z0-9-]+$'),title text not null,destination_url text not null check(destination_url ~ '^https?://' or (destination_url ~ '^/[^/]' and position(chr(92) in destination_url)=0)),active boolean not null default true,click_count bigint not null default 0,created_at timestamptz not null default now());
create unique index smart_links_keyword_idx on public.smart_links(lower(keyword));
create table public.affiliate_clicks (id uuid primary key default gen_random_uuid(),product_id uuid references public.products(id) on delete set null,source_page text not null default '',utm_source text not null default '',utm_medium text not null default '',utm_campaign text not null default '',referrer text not null default '',created_at timestamptz not null default now());
create table public.analytics_events (id uuid primary key default gen_random_uuid(),event_name text not null,entity_id uuid,source_page text not null default '',utm_source text not null default '',utm_medium text not null default '',utm_campaign text not null default '',created_at timestamptz not null default now());
create table public.testimonials (id uuid primary key default gen_random_uuid(),name text not null,quote text not null,company text not null default '',published boolean not null default false,created_at timestamptz not null default now());
create table public.brand_collaborations (id uuid primary key default gen_random_uuid(),name text not null,logo_url text not null default '' check(logo_url='' or logo_url ~ '^https?://'),website text not null default '' check(website='' or website ~ '^https?://'),published boolean not null default false,created_at timestamptz not null default now());
create table public.rate_limits (key text primary key,window_start timestamptz not null default now(),hits integer not null default 1);
alter table public.rate_limits enable row level security;
revoke all on public.rate_limits from anon,authenticated;
create function public.check_rate_limit(rate_key text,max_hits integer) returns boolean language plpgsql security definer set search_path='' as $$ declare n integer; begin insert into public.rate_limits(key) values(rate_key) on conflict(key) do update set hits=case when public.rate_limits.window_start < now()-interval '1 hour' then 1 else public.rate_limits.hits+1 end,window_start=case when public.rate_limits.window_start < now()-interval '1 hour' then now() else public.rate_limits.window_start end returning hits into n; delete from public.rate_limits where window_start<now()-interval '2 hours';return n<=max_hits;end; $$;
revoke all on function public.check_rate_limit(text,integer) from public,anon,authenticated;
grant execute on function public.check_rate_limit(text,integer) to service_role;
create function public.increment_smart_link(link_id uuid) returns void language sql security definer set search_path='' as $$ update public.smart_links set click_count=click_count+1 where id=link_id and active; $$;
revoke all on function public.increment_smart_link(uuid) from public,anon,authenticated;
grant execute on function public.increment_smart_link(uuid) to service_role;
do $$ declare t text; begin
 foreach t in array array['products','portfolio_items','blog_posts','creator_settings','collaboration_inquiries','contact_messages','looks','look_products','smart_links','affiliate_clicks','analytics_events','testimonials','brand_collaborations'] loop
 execute format('alter table public.%I enable row level security',t);
 execute format('revoke all on public.%I from anon, authenticated',t);
 execute format('grant select on public.%I to anon',t);
 execute format('grant select,insert,update,delete on public.%I to authenticated',t);
 execute format('create policy admin_manage on public.%I for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))',t);
 end loop;
 foreach t in array array['products','portfolio_items','blog_posts','creator_settings','looks'] loop
 execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.touch_updated_at()',t);
 end loop;
end $$;
-- No public INSERT policy: forms and events are written through the validated Edge Function.
create policy public_products on public.products for select to anon,authenticated using(active);
create policy public_portfolio on public.portfolio_items for select to anon,authenticated using(published);
create policy public_blog on public.blog_posts for select to anon,authenticated using(status='published' and published_at<=now());
create policy public_settings on public.creator_settings for select to anon,authenticated using(true);
create policy public_looks on public.looks for select to anon,authenticated using(published);
create policy public_look_products on public.look_products for select to anon,authenticated using(exists(select 1 from public.looks where id=look_id and published) and exists(select 1 from public.products where id=product_id and active));
create policy public_smart_links on public.smart_links for select to anon,authenticated using(active);
create policy public_testimonials on public.testimonials for select to anon,authenticated using(published);
create policy public_brands on public.brand_collaborations for select to anon,authenticated using(published);
create index products_category_idx on public.products(category,active,featured,sort_order);
create index portfolio_category_idx on public.portfolio_items(category,published,featured);
create index blog_published_idx on public.blog_posts(status,published_at desc);
create index inquiries_status_idx on public.collaboration_inquiries(status,created_at desc);
create index contact_status_idx on public.contact_messages(status,created_at desc);
create index affiliate_product_idx on public.affiliate_clicks(product_id,created_at desc);
create index affiliate_campaign_idx on public.affiliate_clicks(utm_campaign,utm_source);
create index events_name_entity_idx on public.analytics_events(event_name,entity_id,created_at desc);
create index look_products_product_idx on public.look_products(product_id);
create function public.admin_analytics() returns jsonb language plpgsql security definer set search_path='' as $$ declare result jsonb;begin
 if not public.is_admin() then raise exception 'Not authorized';end if;
 select jsonb_build_object(
 'product_clicks',coalesce((select jsonb_agg(x) from (select coalesce(p.name,'Deleted product') label,count(*) count from public.affiliate_clicks a left join public.products p on p.id=a.product_id group by p.name order by count(*) desc limit 30)x),'[]'::jsonb),
 'campaign_clicks',coalesce((select jsonb_agg(x) from (select utm_campaign label,count(*) count from public.affiliate_clicks group by utm_campaign order by count(*) desc limit 30)x),'[]'::jsonb),
 'source_clicks',coalesce((select jsonb_agg(x) from (select utm_source label,count(*) count from public.affiliate_clicks group by utm_source order by count(*) desc limit 30)x),'[]'::jsonb),
 'product_views',coalesce((select jsonb_agg(x) from (select coalesce(p.name,'Deleted product') label,count(*) count from public.analytics_events a left join public.products p on p.id=a.entity_id where a.event_name='product_view' group by p.name order by count(*) desc limit 30)x),'[]'::jsonb),
 'brand_enquiries',coalesce((select jsonb_agg(x) from (select status label,count(*) count from public.collaboration_inquiries group by status)x),'[]'::jsonb)) into result;
 return result;end; $$;
revoke all on function public.admin_analytics() from public,anon;
grant execute on function public.admin_analytics() to authenticated;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('creator-images','creator-images',true,8388608,array['image/jpeg','image/png','image/webp','image/avif']),
 ('product-images','product-images',true,8388608,array['image/jpeg','image/png','image/webp','image/avif']),
 ('portfolio-images','portfolio-images',true,8388608,array['image/jpeg','image/png','image/webp','image/avif']),
 ('blog-images','blog-images',true,8388608,array['image/jpeg','image/png','image/webp','image/avif']),
 ('media-kit','media-kit',true,8388608,array['application/pdf']) on conflict(id) do nothing;
create policy creator_asset_read on storage.objects for select to anon,authenticated using(bucket_id in ('creator-images','product-images','portfolio-images','blog-images','media-kit'));
create policy creator_asset_admin_insert on storage.objects for insert to authenticated with check(bucket_id in ('creator-images','product-images','portfolio-images','blog-images','media-kit') and (select public.is_admin()));
create policy creator_asset_admin_update on storage.objects for update to authenticated using(bucket_id in ('creator-images','product-images','portfolio-images','blog-images','media-kit') and (select public.is_admin())) with check(bucket_id in ('creator-images','product-images','portfolio-images','blog-images','media-kit') and (select public.is_admin()));
create policy creator_asset_admin_delete on storage.objects for delete to authenticated using(bucket_id in ('creator-images','product-images','portfolio-images','blog-images','media-kit') and (select public.is_admin()));
comment on table public.creator_settings is 'Public profile only. Social numbers manually updated unless a verified API is configured. Never store secrets here.';
commit;
