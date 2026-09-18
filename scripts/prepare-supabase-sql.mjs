import fs from 'node:fs/promises';

const schema = (await fs.readFile('supabase/schema.sql', 'utf8'))
  .replace(/^begin;\s*$/m, '')
  .replace(/^commit;\s*$/m, '');
const inbox = (await fs.readFile('outputs/supabase-inbox-update.sql', 'utf8')).replace(/^begin;$/m, '').replace(/^commit;$/m, '');
const seed = await fs.readFile('supabase/seed.sql', 'utf8');
const admin = await fs.readFile('supabase/admin.sql', 'utf8');
const header = `-- KARISHMA CHAUHAN: COMPLETE SUPABASE SETUP
-- Admin email: surajchauhan76604@gmail.com
-- 1. Create this user in Authentication > Users. Set its password there and confirm its email.
-- 2. Paste this ENTIRE file into the project's SQL Editor and run as postgres.
-- 3. Sign in to the website at /admin/login using that email and password.
-- Run ONCE on a fresh project; it rolls back if any step fails.
-- If schema.sql was already installed, run supabase/admin.sql only.
-- Contains tables, indexes, RLS, storage buckets/policies, safe seed data and admin access.
-- Edge Function deployment and Turnstile configuration are separate from SQL.

begin;
`;
await fs.mkdir('outputs', { recursive: true });
await fs.writeFile('outputs/supabase-setup.sql', `${header}\n${schema}\n${seed}\n${inbox}\n${admin}\ncommit;\n`);
await fs.copyFile('supabase/admin.sql', 'outputs/supabase-admin-only.sql');
console.log('Prepared outputs/supabase-setup.sql and outputs/supabase-admin-only.sql');
