-- Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

-- Review status
ALTER TYPE public.content_status ADD VALUE IF NOT EXISTS 'review' BEFORE 'published';

-- ---------------------------------------------------------------- content
ALTER TABLE public.content
  ADD COLUMN IF NOT EXISTS search_vector tsvector,
  ADD COLUMN IF NOT EXISTS view_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reading_minutes integer,
  ADD COLUMN IF NOT EXISTS next_content_id uuid REFERENCES public.content(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------- symptoms
CREATE TABLE IF NOT EXISTS public.symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  category text,
  severity text NOT NULL DEFAULT 'normal',
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.symptoms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptoms TO authenticated;
GRANT ALL ON public.symptoms TO service_role;
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;
CREATE POLICY symptoms_public_read ON public.symptoms FOR SELECT TO anon, authenticated
  USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY symptoms_staff_write ON public.symptoms FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER symptoms_updated_at BEFORE UPDATE ON public.symptoms
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.content_symptoms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  symptom_id uuid NOT NULL REFERENCES public.symptoms(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'related',
  note text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, symptom_id, role)
);
GRANT SELECT ON public.content_symptoms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.content_symptoms TO authenticated;
GRANT ALL ON public.content_symptoms TO service_role;
ALTER TABLE public.content_symptoms ENABLE ROW LEVEL SECURITY;
CREATE POLICY content_symptoms_public_read ON public.content_symptoms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY content_symptoms_staff_write ON public.content_symptoms FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ---------------------------------------------------------- learning paths
CREATE TABLE IF NOT EXISTS public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  level public.difficulty_level NOT NULL DEFAULT 'beginner',
  is_published boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.learning_paths TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_paths TO authenticated;
GRANT ALL ON public.learning_paths TO service_role;
ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
CREATE POLICY learning_paths_public_read ON public.learning_paths FOR SELECT TO anon, authenticated
  USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY learning_paths_staff_write ON public.learning_paths FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER learning_paths_updated_at BEFORE UPDATE ON public.learning_paths
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.learning_path_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (path_id, content_id)
);
GRANT SELECT ON public.learning_path_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_path_items TO authenticated;
GRANT ALL ON public.learning_path_items TO service_role;
ALTER TABLE public.learning_path_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY learning_path_items_public_read ON public.learning_path_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY learning_path_items_staff_write ON public.learning_path_items FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- ------------------------------------------------------------ topic levels
CREATE TABLE IF NOT EXISTS public.topic_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  level public.difficulty_level NOT NULL,
  summary text,
  body jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (content_id, level)
);
GRANT SELECT ON public.topic_levels TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topic_levels TO authenticated;
GRANT ALL ON public.topic_levels TO service_role;
ALTER TABLE public.topic_levels ENABLE ROW LEVEL SECURITY;
CREATE POLICY topic_levels_public_read ON public.topic_levels FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY topic_levels_staff_write ON public.topic_levels FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER topic_levels_updated_at BEFORE UPDATE ON public.topic_levels
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- -------------------------------------------------------- diagnostic trees
CREATE TABLE IF NOT EXISTS public.diagnostic_trees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id uuid REFERENCES public.content(id) ON DELETE CASCADE,
  symptom_id uuid REFERENCES public.symptoms(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  intro text,
  safety_note text,
  status public.content_status NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.diagnostic_trees TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_trees TO authenticated;
GRANT ALL ON public.diagnostic_trees TO service_role;
ALTER TABLE public.diagnostic_trees ENABLE ROW LEVEL SECURITY;
CREATE POLICY diagnostic_trees_public_read ON public.diagnostic_trees FOR SELECT TO anon, authenticated
  USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY diagnostic_trees_staff_write ON public.diagnostic_trees FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER diagnostic_trees_updated_at BEFORE UPDATE ON public.diagnostic_trees
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE IF NOT EXISTS public.diagnostic_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tree_id uuid NOT NULL REFERENCES public.diagnostic_trees(id) ON DELETE CASCADE,
  key text NOT NULL,
  is_root boolean NOT NULL DEFAULT false,
  question text NOT NULL,
  observation text,
  safety_note text,
  possible_causes jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  related_content_id uuid REFERENCES public.content(id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (tree_id, key)
);
GRANT SELECT ON public.diagnostic_nodes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.diagnostic_nodes TO authenticated;
GRANT ALL ON public.diagnostic_nodes TO service_role;
ALTER TABLE public.diagnostic_nodes ENABLE ROW LEVEL SECURITY;
CREATE POLICY diagnostic_nodes_public_read ON public.diagnostic_nodes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY diagnostic_nodes_staff_write ON public.diagnostic_nodes FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER diagnostic_nodes_updated_at BEFORE UPDATE ON public.diagnostic_nodes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ------------------------------------------------------------- analytics
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event text NOT NULL,
  content_id uuid REFERENCES public.content(id) ON DELETE SET NULL,
  query text,
  result_count integer,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.analytics_events TO anon;
GRANT SELECT, INSERT ON public.analytics_events TO authenticated;
GRANT ALL ON public.analytics_events TO service_role;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY analytics_public_insert ON public.analytics_events FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY analytics_staff_read ON public.analytics_events FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

-- ------------------------------------------------------------- synonyms
CREATE TABLE IF NOT EXISTS public.search_synonyms (
  term text PRIMARY KEY,
  expansion text NOT NULL
);
GRANT SELECT ON public.search_synonyms TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.search_synonyms TO authenticated;
GRANT ALL ON public.search_synonyms TO service_role;
ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY search_synonyms_public_read ON public.search_synonyms FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY search_synonyms_staff_write ON public.search_synonyms FOR ALL TO authenticated
  USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- -------------------------------------------------------- search vectors
CREATE OR REPLACE FUNCTION public.jsonb_plain_text(_body jsonb)
RETURNS text LANGUAGE sql IMMUTABLE AS $$
  SELECT left(regexp_replace(coalesce(_body, '[]'::jsonb)::text, '[\[\]{}",:]+', ' ', 'g'), 20000);
$$;

CREATE OR REPLACE FUNCTION public.content_search_refresh()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector :=
      setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(NEW.summary, '')), 'B')
    || setweight(to_tsvector('english', array_to_string(coalesce(NEW.tags, '{}'), ' ')), 'B')
    || setweight(to_tsvector('english', coalesce(NEW.subcategory, '')), 'C')
    || setweight(to_tsvector('english', public.jsonb_plain_text(NEW.body)), 'D');
  NEW.reading_minutes := GREATEST(1, (length(public.jsonb_plain_text(NEW.body)) / 1100)::int);
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS content_search_refresh ON public.content;
CREATE TRIGGER content_search_refresh BEFORE INSERT OR UPDATE ON public.content
  FOR EACH ROW EXECUTE FUNCTION public.content_search_refresh();

CREATE OR REPLACE FUNCTION public.symptom_search_refresh()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_vector :=
      setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A')
    || setweight(to_tsvector('english', coalesce(NEW.description, '')), 'B')
    || setweight(to_tsvector('english', coalesce(NEW.category, '')), 'C');
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS symptom_search_refresh ON public.symptoms;
CREATE TRIGGER symptom_search_refresh BEFORE INSERT OR UPDATE ON public.symptoms
  FOR EACH ROW EXECUTE FUNCTION public.symptom_search_refresh();

UPDATE public.content SET updated_at = updated_at;

-- ---------------------------------------------------------------- indexes
CREATE INDEX IF NOT EXISTS content_search_vector_idx ON public.content USING gin (search_vector);
CREATE INDEX IF NOT EXISTS content_title_trgm_idx ON public.content USING gin (lower(title) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS content_slug_idx ON public.content (slug);
CREATE INDEX IF NOT EXISTS content_next_idx ON public.content (next_content_id);
CREATE INDEX IF NOT EXISTS symptoms_search_vector_idx ON public.symptoms USING gin (search_vector);
CREATE INDEX IF NOT EXISTS symptoms_title_trgm_idx ON public.symptoms USING gin (lower(title) extensions.gin_trgm_ops);
CREATE INDEX IF NOT EXISTS content_symptoms_content_idx ON public.content_symptoms (content_id);
CREATE INDEX IF NOT EXISTS content_symptoms_symptom_idx ON public.content_symptoms (symptom_id);
CREATE INDEX IF NOT EXISTS learning_path_items_path_idx ON public.learning_path_items (path_id, sort_order);
CREATE INDEX IF NOT EXISTS learning_path_items_content_idx ON public.learning_path_items (content_id);
CREATE INDEX IF NOT EXISTS topic_levels_content_idx ON public.topic_levels (content_id);
CREATE INDEX IF NOT EXISTS diagnostic_trees_content_idx ON public.diagnostic_trees (content_id);
CREATE INDEX IF NOT EXISTS diagnostic_nodes_tree_idx ON public.diagnostic_nodes (tree_id, sort_order);
CREATE INDEX IF NOT EXISTS content_rel_related_idx ON public.content_relationships (related_content_id);
CREATE INDEX IF NOT EXISTS user_progress_content_idx ON public.user_progress (user_id, content_id);
CREATE INDEX IF NOT EXISTS analytics_events_event_idx ON public.analytics_events (event, created_at DESC);
