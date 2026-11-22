-- Security advisor 0028/0029: the auth trigger function must not be callable through /rest/v1/rpc.
begin;
select plan(3);

select ok(not has_function_privilege('anon', 'public.handle_new_user()', 'EXECUTE'),
  'anon cannot execute handle_new_user');
select ok(not has_function_privilege('authenticated', 'public.handle_new_user()', 'EXECUTE'),
  'authenticated cannot execute handle_new_user');
select ok(
  exists (select 1 from pg_trigger where tgname = 'on_auth_user_created' and not tgisinternal),
  'the auth trigger still exists');

select * from finish();
rollback;
