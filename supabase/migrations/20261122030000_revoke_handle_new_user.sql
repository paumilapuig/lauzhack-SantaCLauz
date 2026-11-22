-- Security advisor 0028/0029: handle_new_user() is SECURITY DEFINER and only meant for the
-- on_auth_user_created trigger. Postgres checks EXECUTE when the trigger is created, not when it
-- fires, so revoking it keeps sign-ups working and closes /rest/v1/rpc/handle_new_user.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
