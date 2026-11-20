CREATE OR REPLACE FUNCTION public.marketplace_sellers(_ids uuid[])
 RETURNS TABLE(id uuid, name text, rating_avg numeric, rating_count integer, member_since timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT u.id, coalesce(p.username, 'Member'),
    (SELECT round(avg(r.stars)::numeric, 1) FROM marketplace_ratings r WHERE r.seller_id = u.id),
    (SELECT count(*)::int FROM marketplace_ratings r WHERE r.seller_id = u.id),
    p.created_at
  FROM unnest(_ids) AS u(id) LEFT JOIN profiles p ON p.id = u.id
  WHERE EXISTS (SELECT 1 FROM marketplace_listings l WHERE l.seller_id = u.id)
     OR EXISTS (SELECT 1 FROM marketplace_conversations c WHERE c.buyer_id = u.id AND auth.uid() IN (c.buyer_id, c.seller_id));
$function$;

GRANT EXECUTE ON FUNCTION public.marketplace_sellers(uuid[]) TO anon, authenticated, service_role;