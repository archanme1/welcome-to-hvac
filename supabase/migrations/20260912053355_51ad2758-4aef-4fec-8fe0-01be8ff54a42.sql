-- ENUMS
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');
CREATE TYPE public.content_type AS ENUM ('equipment','component','concept','procedure','troubleshooting','tool');
CREATE TYPE public.content_status AS ENUM ('draft','published','archived');
CREATE TYPE public.difficulty_level AS ENUM ('beginner','apprentice','technician','advanced');
CREATE TYPE public.question_type AS ENUM ('multiple_choice','true_false','multiple_select','short_answer','calculation','diagnostic_decision','identify_component','identify_problem','sequence_of_operation');
CREATE TYPE public.subscription_status AS ENUM ('active','canceled','past_due','trialing');
CREATE TYPE public.plan_interval AS ENUM ('monthly','annual');

-- UPDATED_AT HELPER
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ROLES
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor'));
$$;

CREATE POLICY "user_roles_own_select" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- SUBSCRIPTIONS
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.subscription_status NOT NULL DEFAULT 'active',
  plan_interval public.plan_interval NOT NULL DEFAULT 'monthly',
  current_period_end TIMESTAMPTZ,
  provider TEXT,
  provider_customer_id TEXT,
  provider_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_own_select" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.is_pro(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = _user_id
      AND status IN ('active','trialing')
      AND (current_period_end IS NULL OR current_period_end > now())
  ) OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','editor')
  );
$$;

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  content_type public.content_type,
  icon TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.categories TO authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT TO anon, authenticated USING (is_published OR public.is_staff(auth.uid()));
CREATE POLICY "categories_staff_write" ON public.categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CONTENT
CREATE TABLE public.content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  content_type public.content_type NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory TEXT,
  summary TEXT,
  body JSONB NOT NULL DEFAULT '[]'::jsonb,
  difficulty public.difficulty_level NOT NULL DEFAULT 'beginner',
  status public.content_status NOT NULL DEFAULT 'published',
  featured_image TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  safety_note TEXT,
  code_notice TEXT,
  diagram_key TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  source_name TEXT,
  source_url TEXT,
  source_reference TEXT,
  search_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_type, slug)
);
CREATE INDEX content_status_idx ON public.content (status);
CREATE INDEX content_type_idx ON public.content (content_type);
CREATE INDEX content_category_idx ON public.content (category_id);
CREATE INDEX content_tags_idx ON public.content USING GIN (tags);
GRANT SELECT ON public.content TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content TO authenticated;
GRANT ALL ON public.content TO service_role;
ALTER TABLE public.content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_public_read" ON public.content FOR SELECT TO anon, authenticated USING (status = 'published' OR public.is_staff(auth.uid()));
CREATE POLICY "content_staff_write" ON public.content FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER content_updated_at BEFORE UPDATE ON public.content FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- CONTENT RELATIONSHIPS
CREATE TABLE public.content_relationships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  related_content_id UUID NOT NULL REFERENCES public.content(id) ON DELETE CASCADE,
  relationship_type TEXT NOT NULL DEFAULT 'related',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_id, related_content_id, relationship_type)
);
CREATE INDEX content_rel_content_idx ON public.content_relationships (content_id);
GRANT SELECT ON public.content_relationships TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.content_relationships TO authenticated;
GRANT ALL ON public.content_relationships TO service_role;
ALTER TABLE public.content_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "content_rel_public_read" ON public.content_relationships FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "content_rel_staff_write" ON public.content_relationships FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- MEDIA
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'image',
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.media TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media TO authenticated;
GRANT ALL ON public.media TO service_role;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "media_public_read" ON public.media FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "media_staff_write" ON public.media FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

-- PRACTICE QUESTIONS
CREATE TABLE public.practice_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  question_type public.question_type NOT NULL DEFAULT 'multiple_choice',
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer JSONB,
  explanation TEXT NOT NULL DEFAULT '',
  difficulty public.difficulty_level NOT NULL DEFAULT 'apprentice',
  status public.content_status NOT NULL DEFAULT 'published',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX practice_questions_content_idx ON public.practice_questions (content_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_questions TO authenticated;
GRANT ALL ON public.practice_questions TO service_role;
ALTER TABLE public.practice_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pq_pro_read" ON public.practice_questions FOR SELECT TO authenticated USING ((status = 'published' AND public.is_pro(auth.uid())) OR public.is_staff(auth.uid()));
CREATE POLICY "pq_staff_write" ON public.practice_questions FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER practice_questions_updated_at BEFORE UPDATE ON public.practice_questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- QUIZZES
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  question_ids UUID[] NOT NULL DEFAULT '{}',
  status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.quizzes TO authenticated;
GRANT ALL ON public.quizzes TO service_role;
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quizzes_pro_read" ON public.quizzes FOR SELECT TO authenticated USING ((status = 'published' AND public.is_pro(auth.uid())) OR public.is_staff(auth.uid()));
CREATE POLICY "quizzes_staff_write" ON public.quizzes FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SCENARIOS (troubleshooting + equipment share one table with a kind flag)
CREATE TABLE public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'troubleshooting',
  title TEXT NOT NULL,
  setup TEXT NOT NULL DEFAULT '',
  symptoms JSONB NOT NULL DEFAULT '[]'::jsonb,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  safety_note TEXT,
  difficulty public.difficulty_level NOT NULL DEFAULT 'technician',
  status public.content_status NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX scenarios_content_idx ON public.scenarios (content_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scenarios TO authenticated;
GRANT ALL ON public.scenarios TO service_role;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scenarios_pro_read" ON public.scenarios FOR SELECT TO authenticated USING ((status = 'published' AND public.is_pro(auth.uid())) OR public.is_staff(auth.uid()));
CREATE POLICY "scenarios_staff_write" ON public.scenarios FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE TRIGGER scenarios_updated_at BEFORE UPDATE ON public.scenarios FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PRACTICE COUNTS (public, so free users see locked previews with real counts)
CREATE OR REPLACE FUNCTION public.practice_counts(_content_id UUID)
RETURNS TABLE (questions INTEGER, quizzes INTEGER, troubleshooting INTEGER, equipment INTEGER)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT
    (SELECT COUNT(*)::int FROM public.practice_questions q WHERE q.content_id = _content_id AND q.status = 'published'),
    (SELECT COUNT(*)::int FROM public.quizzes z WHERE z.content_id = _content_id AND z.status = 'published'),
    (SELECT COUNT(*)::int FROM public.scenarios s WHERE s.content_id = _content_id AND s.status = 'published' AND s.kind = 'troubleshooting'),
    (SELECT COUNT(*)::int FROM public.scenarios s WHERE s.content_id = _content_id AND s.status = 'published' AND s.kind = 'equipment');
$$;
GRANT EXECUTE ON FUNCTION public.practice_counts(UUID) TO anon, authenticated;

-- USER PROGRESS
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id UUID REFERENCES public.content(id) ON DELETE CASCADE,
  question_id UUID REFERENCES public.practice_questions(id) ON DELETE CASCADE,
  event TEXT NOT NULL DEFAULT 'viewed',
  is_correct BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX user_progress_user_idx ON public.user_progress (user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_progress TO authenticated;
GRANT ALL ON public.user_progress TO service_role;
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "progress_own_all" ON public.user_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);