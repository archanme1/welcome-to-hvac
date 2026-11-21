REVOKE EXECUTE ON FUNCTION public.marketplace_sellers(uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.marketplace_sellers(uuid[]) TO service_role;
DROP POLICY IF EXISTS "mkt photos scoped read" ON storage.objects;
CREATE POLICY "mkt photos owner read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'marketplace' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
CREATE POLICY "mkt photos staff read" ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'marketplace' AND public.is_staff((SELECT auth.uid())));