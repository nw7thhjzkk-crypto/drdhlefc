-- SoT for one-time first-owner bootstrap (already live on production).
-- Also provides owner_exists() so claim UI can detect zero owners under RLS
-- (members can only SELECT their own profile row).

CREATE OR REPLACE FUNCTION public.owner_exists()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'owner');
$$;

REVOKE ALL ON FUNCTION public.owner_exists() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.owner_exists() FROM anon;
GRANT EXECUTE ON FUNCTION public.owner_exists() TO authenticated;

CREATE OR REPLACE FUNCTION public.bootstrap_first_owner()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM profiles WHERE role = 'owner') THEN RAISE EXCEPTION 'An owner already exists'; END IF;
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid()) THEN RAISE EXCEPTION 'Profile not found for current user'; END IF;
  ALTER TABLE public.profiles DISABLE TRIGGER trg_prevent_role_update;
  UPDATE public.profiles SET role = 'owner' WHERE id = auth.uid();
  ALTER TABLE public.profiles ENABLE TRIGGER trg_prevent_role_update;
  PERFORM public.insert_audit_log('BOOTSTRAP_FIRST_OWNER','profile',auth.uid(),NULL,jsonb_build_object('note','one-time first owner claim'));
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bootstrap_first_owner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_owner() FROM anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_owner() TO authenticated;
