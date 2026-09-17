-- Run in Supabase SQL Editor as the project owner, AFTER schema.sql.
-- First create/confirm this user in Authentication > Users and set a password there.
-- This script does not create Auth users, store passwords, or auto-promote future signups.
-- It can be rerun safely and does not remove existing administrators.

do $grant_admin$
declare
  target_user_id uuid;
  matching_users integer;
begin
  select count(*) into matching_users
  from auth.users
  where lower(email) = 'surajchauhan76604@gmail.com';

  if matching_users <> 1 then
    raise exception 'Expected exactly one Auth user for surajchauhan76604@gmail.com. Create the user in Authentication > Users first, then run this script again.';
  end if;

  select id into target_user_id
  from auth.users
  where lower(email) = 'surajchauhan76604@gmail.com'
    and email_confirmed_at is not null;

  if target_user_id is null then
    raise exception 'Confirm the email for surajchauhan76604@gmail.com in Supabase Auth before granting administrator access.';
  end if;

  insert into public.admin_users(user_id)
  values (target_user_id)
  on conflict (user_id) do nothing;
end;
$grant_admin$;

-- Expect one row with is_admin = true.
select u.email, a.user_id, true as is_admin
from public.admin_users a
join auth.users u on u.id = a.user_id
where lower(u.email) = 'surajchauhan76604@gmail.com';
