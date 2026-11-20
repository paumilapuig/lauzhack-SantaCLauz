-- The project does not auto-grant new public tables to the API roles; RLS still restricts rows.
grant select, update on table public.profiles to authenticated;
grant all on table public.profiles to service_role;
