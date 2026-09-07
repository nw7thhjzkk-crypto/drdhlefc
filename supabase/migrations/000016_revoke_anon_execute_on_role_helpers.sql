-- SoT: revoke anon EXECUTE on role helpers; lock down rls_auto_enable; pin get_role search_path.
-- Live applied 2026-09-07 as revoke_anon_execute_on_role_helpers.

REVOKE EXECUTE ON FUNCTION public.is_owner() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_trainer() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_member() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.current_role() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_role() FROM PUBLIC, anon;

-- Internal DDL helper must not be callable via PostgREST
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.rls_auto_enable() TO postgres, service_role;

-- Keep authenticated EXECUTE on role helpers (RLS + app checks)
GRANT EXECUTE ON FUNCTION public.is_owner() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_trainer() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_member() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_role() TO authenticated, service_role;

ALTER FUNCTION public.get_role() SET search_path = public, pg_temp;
