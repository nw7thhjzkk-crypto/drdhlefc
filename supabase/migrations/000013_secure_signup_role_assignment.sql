-- 000013_secure_signup_role_assignment.sql

-- 1) Replace public.handle_new_user() so it ALWAYS inserts role = 'member' (cast to user_role).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, full_name, email)
  VALUES (
    NEW.id,
    'member'::public.user_role,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

-- Ensure the on_auth_user_created trigger still exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Replace public.prevent_role_update() to allow Owners to change roles.
CREATE OR REPLACE FUNCTION public.prevent_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role AND NOT public.is_owner() THEN
        RAISE EXCEPTION 'Cannot update role';
    END IF;
    RETURN NEW;
END;
$$;

-- Ensure the trg_prevent_role_update trigger on profiles still exists
DROP TRIGGER IF EXISTS trg_prevent_role_update ON public.profiles;
CREATE TRIGGER trg_prevent_role_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_role_update();

-- 3) REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
