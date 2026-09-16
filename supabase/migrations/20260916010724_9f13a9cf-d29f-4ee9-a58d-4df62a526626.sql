CREATE TABLE IF NOT EXISTS public.visitor_presence (
  session_id text PRIMARY KEY,
  user_id uuid,
  path text,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.visitor_presence TO service_role;
ALTER TABLE public.visitor_presence ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS visitor_presence_last_seen_idx ON public.visitor_presence (last_seen DESC);
CREATE INDEX IF NOT EXISTS analytics_events_created_idx ON public.analytics_events (created_at DESC);
CREATE INDEX IF NOT EXISTS analytics_events_event_created_idx ON public.analytics_events (event, created_at DESC);

CREATE OR REPLACE FUNCTION public.presence_ping(_session_id text, _path text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _session_id IS NULL OR length(_session_id) < 8 OR length(_session_id) > 64 THEN
    RETURN;
  END IF;

  INSERT INTO public.visitor_presence (session_id, user_id, path)
  VALUES (_session_id, auth.uid(), left(coalesce(_path, '/'), 300))
  ON CONFLICT (session_id) DO UPDATE
    SET last_seen = now(),
        path = EXCLUDED.path,
        user_id = COALESCE(EXCLUDED.user_id, public.visitor_presence.user_id);

  DELETE FROM public.visitor_presence WHERE last_seen < now() - interval '1 day';
END;
$$;

REVOKE ALL ON FUNCTION public.presence_ping(text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.presence_ping(text, text) TO anon, authenticated;