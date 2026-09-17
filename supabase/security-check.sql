-- Run against the provisioned schema in SQL Editor. Everything rolls back.
begin;
insert into public.products(name,slug,active) values('Private test','security-test-private',false),('Public test','security-test-public',true);
insert into public.blog_posts(title,slug,status) values('Private draft','security-test-draft','draft');
set local role anon;
do $$ begin
 if exists(select 1 from public.products where slug='security-test-private') then raise exception 'FAIL: inactive product exposed';end if;
 if not exists(select 1 from public.products where slug='security-test-public') then raise exception 'FAIL: public product unavailable';end if;
 if exists(select 1 from public.blog_posts where slug='security-test-draft') then raise exception 'FAIL: draft exposed';end if;
 if exists(select 1 from public.contact_messages) or exists(select 1 from public.collaboration_inquiries) then raise exception 'FAIL: private enquiries exposed';end if;
 begin insert into public.products(name,slug) values('Unauthorized','security-test-write');raise exception 'FAIL: public content write permitted';exception when insufficient_privilege then null;end;
 begin insert into public.contact_messages(request_id,name,email,subject,message,consent) values(gen_random_uuid(),'Tester','t@example.com','test','test',true);raise exception 'FAIL: direct public form write permitted';exception when insufficient_privilege then null;end;
 begin perform public.check_rate_limit('test',1);raise exception 'FAIL: public rate limiter access permitted';exception when insufficient_privilege then null;end;
end $$;
reset role;
set local role authenticated;
select set_config('request.jwt.claim.sub','00000000-0000-0000-0000-000000000099',true);
do $$ begin
 if public.is_admin() then raise exception 'FAIL: unknown account is admin';end if;
 begin insert into public.products(name,slug) values('Unauthorized','security-test-user-write');raise exception 'FAIL: non-admin content write permitted';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
