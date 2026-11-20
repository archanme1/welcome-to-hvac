DROP POLICY IF EXISTS "mkt photos public read" ON storage.objects;
CREATE POLICY "mkt photos scoped read" ON storage.objects FOR SELECT TO anon, authenticated
USING (
  bucket_id = 'marketplace' AND (
    (storage.foldername(name))[1] = (select auth.uid())::text
    OR public.is_staff((select auth.uid()))
    OR EXISTS (
      SELECT 1 FROM public.marketplace_listing_images i
      JOIN public.marketplace_listings l ON l.id = i.listing_id
      WHERE i.path = storage.objects.name AND l.status = 'active'
    )
  )
);