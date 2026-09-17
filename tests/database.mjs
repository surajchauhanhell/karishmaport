import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
const db = new PGlite();
await db.exec(
  `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create schema storage;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;grant usage on schema auth,public,storage to anon,authenticated,service_role;grant execute on function auth.uid() to anon,authenticated,service_role;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);alter table storage.objects enable row level security;grant select,insert,update,delete on storage.objects to anon,authenticated;`,
);
const sql = (await fs.readFile('supabase/schema.sql', 'utf8')).replace(
  'create extension if not exists pgcrypto;',
  '',
);
await db.exec(sql);
await db.exec(await fs.readFile('supabase/seed.sql', 'utf8'));
const upgrade = await fs.readFile('outputs/supabase-affiliate-update.sql', 'utf8');
await db.exec(upgrade);
await db.exec(upgrade);
await db.query("select affiliate_url,category from public.looks limit 0");
await db.exec(await fs.readFile('supabase/security-check.sql', 'utf8'));
await db.exec(
  `insert into auth.users values('00000000-0000-0000-0000-000000000010');insert into public.admin_users(user_id) values('00000000-0000-0000-0000-000000000010');set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000010',false);`,
);
const assert = async (query, expected) => {
  const { rows } = await db.query(query);
  if (rows[0].ok !== expected) throw new Error(`Assertion failed: ${query}`);
};
await assert('select public.is_admin() as ok', true);
await db.exec(
  `insert into public.products(name,slug,active,is_demo,affiliate_url) values('Test item','test-item',true,false,'https://retailer.example/product');update public.products set personal_review='Verified test review' where slug='test-item';insert into public.looks(title,slug,published) values('Test look','test-look',true);insert into public.look_products(look_id,product_id) select l.id,p.id from public.looks l,public.products p where l.slug='test-look' and p.slug='test-item';insert into public.blog_posts(title,slug,status,published_at) values('Test post','test-post','published',now());insert into storage.objects(bucket_id,name) values('creator-images','test.webp');`,
);
await assert('select count(*)=1 as ok from public.look_products', true);
await db.query('select public.admin_analytics()');
await db.exec(`reset role;set role anon;`);
await assert("select count(*)=1 as ok from public.products where slug='test-item'", true);
await assert('select count(*)=1 as ok from public.blog_posts', true);
await assert('select count(*)=1 as ok from public.look_products', true);
await db.exec(`reset role;delete from public.admin_users;set role authenticated;`);
await assert('select public.is_admin() as ok', false);
let denied = false;
try {
  await db.exec("insert into public.products(name,slug) values('Revoked','revoked')");
} catch {
  denied = true;
}
if (!denied) throw new Error('Revoked admin write was accepted');
await db.close();
console.log(
  'Database checks passed: migration, seed, public reads, draft privacy, denied anonymous writes, non-admin denial, admin CRUD, storage policy, look links, analytics and membership revocation.',
);
