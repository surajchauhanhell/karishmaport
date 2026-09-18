-- Run this entire file in Supabase SQL Editor on your existing portfolio database.
-- Preserves existing messages. Visitors can submit; only admins can read/delete.
begin;
do $$
declare t text; p record;
begin
  foreach t in array array['contact_messages','collaboration_inquiries'] loop
    execute format('alter table public.%I enable row level security', t);
    for p in select policyname from pg_policies where schemaname='public' and tablename=t loop
      execute format('drop policy %I on public.%I', p.policyname, t);
    end loop;
    execute format('revoke all on public.%I from anon, authenticated', t);
    execute format('grant select,delete on public.%I to authenticated', t);
    execute format('create policy inbox_admin_read on public.%I for select to authenticated using ((select public.is_admin()))', t);
    execute format('create policy inbox_admin_delete on public.%I for delete to authenticated using ((select public.is_admin()))', t);
    execute format('create policy inbox_public_submit on public.%I for insert to anon,authenticated with check (consent is true and status = ''new'')', t);
  end loop;
end $$;
-- Column permissions prevent visitors from supplying IDs, timestamps or status.
-- Existing table constraints validate required fields and maximum lengths.
grant insert(request_id,name,email,subject,message,consent)
  on public.contact_messages to anon,authenticated;
grant insert(request_id,brand_name,contact_name,email,phone,website,campaign_type,product,budget_range,deliverables,target_date,message,consent)
  on public.collaboration_inquiries to anon,authenticated;
notify pgrst, 'reload schema';
commit;
