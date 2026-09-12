CREATE OR REPLACE FUNCTION public.practice_catalog()
RETURNS TABLE(content_id uuid, questions integer, quizzes integer, troubleshooting integer, equipment integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id,
    (SELECT COUNT(*)::int FROM public.practice_questions q WHERE q.content_id = c.id AND q.status = 'published'),
    (SELECT COUNT(*)::int FROM public.quizzes z WHERE z.content_id = c.id AND z.status = 'published'),
    (SELECT COUNT(*)::int FROM public.scenarios s WHERE s.content_id = c.id AND s.status = 'published' AND s.kind = 'troubleshooting'),
    (SELECT COUNT(*)::int FROM public.scenarios s WHERE s.content_id = c.id AND s.status = 'published' AND s.kind = 'equipment')
  FROM public.content c
  WHERE c.status = 'published'
    AND (
      EXISTS (SELECT 1 FROM public.practice_questions q WHERE q.content_id = c.id AND q.status = 'published')
      OR EXISTS (SELECT 1 FROM public.quizzes z WHERE z.content_id = c.id AND z.status = 'published')
      OR EXISTS (SELECT 1 FROM public.scenarios s WHERE s.content_id = c.id AND s.status = 'published')
    );
$$;

REVOKE ALL ON FUNCTION public.practice_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.practice_catalog() TO anon, authenticated, service_role;