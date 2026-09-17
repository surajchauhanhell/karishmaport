import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';

const setup = (await fs.readFile('outputs/supabase-setup.sql', 'utf8')).replace(
  'create extension if not exists pgcrypto;', '',
);
const admin = await fs.readFile('supabase/admin.sql', 'utf8');
async function fixture() {
  const db = new PGlite();
  await db.exec(`
    create role anon;
    create role authenticated;
    create role service_role bypassrls;
    create schema auth;
    create schema storage;
    create table auth.users(id uuid primary key, email text, email_confirmed_at timestamptz);
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    grant usage on schema auth,public,storage to anon,authenticated,service_role;
    grant execute on function auth.uid() to anon,authenticated,service_role;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
    alter table storage.objects enable row level security;
    grant select,insert,update,delete on storage.objects to anon,authenticated;
  `);
  return db;
}
for (const state of ['missing', 'unconfirmed', 'confirmed']) {
  const db = await fixture();
  if (state !== 'missing') {
    await db.query('insert into auth.users values ($1,$2,$3)', [
      '00000000-0000-0000-0000-000000000020', 'surajchauhan76604@gmail.com',
      state === 'confirmed' ? new Date().toISOString() : null,
    ]);
  }
  if (state === 'confirmed') {
    await db.exec(setup);
    await db.exec(admin);
    await db.exec(admin);
    assert.equal((await db.query('select count(*)::integer as count from public.admin_users')).rows[0].count, 1);
    assert.equal((await db.query('select count(*)::integer as count from storage.buckets')).rows[0].count, 5);
    await db.exec(`set role authenticated;select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000020',false);`);
    assert.equal((await db.query('select public.is_admin() as allowed')).rows[0].allowed, true);
    await db.exec(`select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000021',false);`);
    assert.equal((await db.query('select public.is_admin() as allowed')).rows[0].allowed, false);
  } else {
    await assert.rejects(() => db.exec(setup), state === 'missing' ? /Create the user/ : /Confirm the email/);
    await db.exec('rollback;');
    assert.equal((await db.query("select to_regclass('public.products') as table_name")).rows[0].table_name, null);
  }
  await db.close();
}
console.log('PASS: complete setup, confirmed admin grant, repeat-safe grant, ordinary-user denial, missing/unconfirmed-user rejection and atomic rollback.');
