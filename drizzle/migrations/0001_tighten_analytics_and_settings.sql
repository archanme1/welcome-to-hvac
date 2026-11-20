DROP POLICY IF EXISTS analytics_public_insert ON public.analytics_events;
CREATE POLICY analytics_page_view_insert ON public.analytics_events
FOR INSERT TO anon, authenticated
WITH CHECK (
  event = 'page_view'
  AND content_id IS NULL AND query IS NULL AND result_count IS NULL
  AND (user_id IS NULL OR user_id = auth.uid())
  AND pg_column_size(metadata) < 2048
);
DROP POLICY IF EXISTS "Signed-in members can read settings" ON public.app_settings;