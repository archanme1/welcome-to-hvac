
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_username_format
  CHECK (username IS NULL OR username ~ '^[A-Za-z0-9_-]{3,24}$');

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_lower_key
  ON public.profiles (lower(username)) WHERE username IS NOT NULL;

-- Username is set once by the owner; later changes are blocked for non-privileged roles.
CREATE OR REPLACE FUNCTION public.profiles_guard_username()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.username IS NOT NULL AND NEW.username IS DISTINCT FROM OLD.username THEN
    RAISE EXCEPTION 'Username cannot be changed.';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_guard_username ON public.profiles;
CREATE TRIGGER profiles_guard_username
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.profiles_guard_username();

-- Private approved-administrator list. No API grants at all: server/trigger use only.
CREATE TABLE IF NOT EXISTS public.admin_emails (
  email text PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_emails TO service_role;
ALTER TABLE public.admin_emails ENABLE ROW LEVEL SECURITY;

INSERT INTO public.admin_emails (email) VALUES
  ('welcometohvac@gmail.com'),
  ('archanme1@gmail.com')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _username text;
BEGIN
  _username := nullif(btrim(NEW.raw_user_meta_data->>'username'), '');
  IF _username IS NOT NULL AND _username !~ '^[A-Za-z0-9_-]{3,24}$' THEN
    _username := NULL;
  END IF;
  IF _username IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.profiles p WHERE lower(p.username) = lower(_username)
  ) THEN
    _username := NULL;
  END IF;

  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', _username, split_part(NEW.email, '@', 1)),
    _username
  )
  ON CONFLICT (id) DO NOTHING;

  IF EXISTS (SELECT 1 FROM public.admin_emails a WHERE lower(a.email) = lower(NEW.email)) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Availability check that exposes nothing but a boolean.
CREATE OR REPLACE FUNCTION public.username_available(_username text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT btrim(_username) ~ '^[A-Za-z0-9_-]{3,24}$'
     AND NOT EXISTS (
       SELECT 1 FROM public.profiles p
       WHERE lower(p.username) = lower(btrim(_username))
     );
$$;

REVOKE ALL ON FUNCTION public.username_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.username_available(text) TO anon, authenticated, service_role;
