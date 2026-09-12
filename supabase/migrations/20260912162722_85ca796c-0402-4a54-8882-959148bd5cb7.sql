CREATE OR REPLACE FUNCTION public.jsonb_plain_text(_body jsonb)
RETURNS text LANGUAGE sql IMMUTABLE SET search_path = public AS $$
  SELECT left(regexp_replace(coalesce(_body, '[]'::jsonb)::text, '[\[\]{}",:]+', ' ', 'g'), 20000);
$$;

CREATE OR REPLACE FUNCTION public.search_tokens(_q text)
RETURNS text[] LANGUAGE sql STABLE SET search_path = public AS $$
  WITH raw AS (
    SELECT array_remove(string_to_array(trim(lower(regexp_replace(coalesce(_q, ''), '[^a-zA-Z0-9 ]+', ' ', 'g'))), ' '), '') AS toks
  )
  SELECT array_agg(DISTINCT x) FROM (
    SELECT unnest(toks) AS x FROM raw
    UNION
    SELECT unnest(string_to_array(s.expansion, ' '))
      FROM public.search_synonyms s, raw
     WHERE s.term = ANY(raw.toks)
  ) u WHERE length(x) > 1;
$$;

CREATE OR REPLACE FUNCTION public.search_all(
  _q text,
  _limit integer DEFAULT 20,
  _offset integer DEFAULT 0,
  _kind text DEFAULT NULL
)
RETURNS TABLE(
  kind text,
  id uuid,
  slug text,
  title text,
  summary text,
  content_type text,
  difficulty text,
  rank real
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  cleaned text := trim(lower(regexp_replace(coalesce(_q, ''), '[^a-zA-Z0-9 ]+', ' ', 'g')));
  toks text[] := public.search_tokens(_q);
  tsq tsquery;
BEGIN
  IF toks IS NULL OR array_length(toks, 1) IS NULL THEN RETURN; END IF;
  tsq := to_tsquery('english', array_to_string(ARRAY(SELECT format('%L', t) || ':*' FROM unnest(toks) t), ' | '));

  RETURN QUERY
  SELECT * FROM (
    SELECT 'topic'::text AS kind, c.id, c.slug, c.title, c.summary,
           c.content_type::text, c.difficulty::text,
           (ts_rank_cd(c.search_vector, tsq) * 4
             + similarity(lower(c.title), cleaned) * 3
             + CASE WHEN lower(c.title) = cleaned THEN 6 ELSE 0 END)::real AS rank
      FROM public.content c
     WHERE c.status = 'published'
       AND (_kind IS NULL OR c.content_type::text = _kind)
       AND (c.search_vector @@ tsq OR lower(c.title) % cleaned)
    UNION ALL
    SELECT 'symptom'::text, s.id, s.slug, s.title, s.description,
           'symptom'::text, NULL::text,
           (ts_rank_cd(s.search_vector, tsq) * 4
             + similarity(lower(s.title), cleaned) * 3
             + CASE WHEN lower(s.title) = cleaned THEN 6 ELSE 0 END)::real
      FROM public.symptoms s
     WHERE s.is_published
       AND (_kind IS NULL OR _kind = 'symptom')
       AND (s.search_vector @@ tsq OR lower(s.title) % cleaned)
  ) r
  ORDER BY r.rank DESC, r.title
  LIMIT LEAST(GREATEST(coalesce(_limit, 20), 1), 100)
  OFFSET GREATEST(coalesce(_offset, 0), 0);
END; $$;

REVOKE EXECUTE ON FUNCTION public.search_all(text, integer, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_all(text, integer, integer, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.search_count(_q text, _kind text DEFAULT NULL)
RETURNS integer
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  cleaned text := trim(lower(regexp_replace(coalesce(_q, ''), '[^a-zA-Z0-9 ]+', ' ', 'g')));
  toks text[] := public.search_tokens(_q);
  tsq tsquery;
  n integer;
BEGIN
  IF toks IS NULL OR array_length(toks, 1) IS NULL THEN RETURN 0; END IF;
  tsq := to_tsquery('english', array_to_string(ARRAY(SELECT format('%L', t) || ':*' FROM unnest(toks) t), ' | '));
  SELECT count(*) INTO n FROM (
    SELECT 1 FROM public.content c
      WHERE c.status = 'published' AND (_kind IS NULL OR c.content_type::text = _kind)
        AND (c.search_vector @@ tsq OR lower(c.title) % cleaned)
    UNION ALL
    SELECT 1 FROM public.symptoms s
      WHERE s.is_published AND (_kind IS NULL OR _kind = 'symptom')
        AND (s.search_vector @@ tsq OR lower(s.title) % cleaned)
  ) t;
  RETURN n;
END; $$;

REVOKE EXECUTE ON FUNCTION public.search_count(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_count(text, text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.record_topic_view(_content_id uuid)
RETURNS void
LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.content SET view_count = view_count + 1 WHERE id = _content_id;
END; $$;

REVOKE EXECUTE ON FUNCTION public.record_topic_view(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_topic_view(uuid) TO anon, authenticated, service_role;

-- Compact navigation tree: categories + topic counts only (no full topic list).
CREATE OR REPLACE FUNCTION public.nav_tree()
RETURNS TABLE(
  id uuid, slug text, title text, parent_id uuid,
  content_type text, sort_order integer, topic_count integer
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT c.id, c.slug, c.title, c.parent_id, c.content_type::text, c.sort_order,
         (SELECT count(*)::int FROM public.content t
           WHERE t.category_id = c.id AND t.status = 'published')
    FROM public.categories c
   WHERE c.is_published
   ORDER BY c.sort_order, c.title;
$$;

REVOKE EXECUTE ON FUNCTION public.nav_tree() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.nav_tree() TO anon, authenticated, service_role;
