CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Signed-in members can read settings"
  ON public.app_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

INSERT INTO public.app_settings (key, value) VALUES ('ai_tutor_daily_limit', '3'::jsonb);

CREATE TABLE public.ai_tutor_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day date NOT NULL DEFAULT (now() AT TIME ZONE 'utc')::date,
  count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, day)
);

GRANT SELECT ON public.ai_tutor_usage TO authenticated;
GRANT ALL ON public.ai_tutor_usage TO service_role;

ALTER TABLE public.ai_tutor_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their own tutor usage"
  ON public.ai_tutor_usage FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE TRIGGER ai_tutor_usage_updated_at
  BEFORE UPDATE ON public.ai_tutor_usage
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.ai_tutor_consume(_user_id uuid)
RETURNS TABLE(allowed boolean, used integer, daily_limit integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _limit integer;
  _today date := (now() AT TIME ZONE 'utc')::date;
  _used integer;
BEGIN
  SELECT COALESCE((value)::text::integer, 3) INTO _limit
  FROM public.app_settings WHERE key = 'ai_tutor_daily_limit';
  IF _limit IS NULL THEN _limit := 3; END IF;

  INSERT INTO public.ai_tutor_usage (user_id, day, count)
  VALUES (_user_id, _today, 0)
  ON CONFLICT (user_id, day) DO NOTHING;

  SELECT u.count INTO _used FROM public.ai_tutor_usage u
  WHERE u.user_id = _user_id AND u.day = _today;

  IF _limit >= 0 AND _used >= _limit THEN
    RETURN QUERY SELECT false, _used, _limit;
    RETURN;
  END IF;

  UPDATE public.ai_tutor_usage u SET count = u.count + 1
  WHERE u.user_id = _user_id AND u.day = _today
  RETURNING u.count INTO _used;

  RETURN QUERY SELECT true, _used, _limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.ai_tutor_consume(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ai_tutor_consume(uuid) TO service_role;