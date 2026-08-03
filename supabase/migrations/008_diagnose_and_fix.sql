-- DIAGNOSTIC: Check what exists
SELECT 'trigger_exists' AS name, (EXISTS(SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created'))::text AS value
UNION ALL
SELECT 'function_exists', (EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'handle_new_user'))::text
UNION ALL
SELECT 'auth_users_count', (SELECT count(*) FROM auth.users)::text
UNION ALL
SELECT 'public_users_count', (SELECT count(*) FROM public.users)::text;
