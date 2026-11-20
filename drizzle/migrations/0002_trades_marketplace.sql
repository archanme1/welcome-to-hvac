
CREATE TABLE public.marketplace_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  parent_id uuid REFERENCES public.marketplace_categories(id) ON DELETE CASCADE,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.marketplace_categories TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplace_categories TO authenticated;
GRANT ALL ON public.marketplace_categories TO service_role;
ALTER TABLE public.marketplace_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt cats read" ON public.marketplace_categories FOR SELECT TO anon, authenticated USING (is_active OR public.is_staff(auth.uid()));
CREATE POLICY "mkt cats staff write" ON public.marketplace_categories FOR ALL TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE public.marketplace_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid NOT NULL,
  slug text NOT NULL UNIQUE DEFAULT '',
  title text NOT NULL CHECK (char_length(title) BETWEEN 5 AND 120),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 5000),
  category_id uuid NOT NULL REFERENCES public.marketplace_categories(id),
  price numeric(12,2) NOT NULL DEFAULT 0 CHECK (price >= 0 AND price <= 10000000),
  currency text NOT NULL DEFAULT 'CAD' CHECK (currency ~ '^[A-Z]{3}$'),
  negotiable boolean NOT NULL DEFAULT false,
  condition text NOT NULL CHECK (condition IN ('new','used','refurbished','for_parts')),
  listing_type text NOT NULL CHECK (listing_type IN ('for_sale','free','wanted')),
  country text NOT NULL CHECK (country ~ '^[A-Z]{2}$'),
  region text NOT NULL CHECK (char_length(region) BETWEEN 1 AND 80),
  city text NOT NULL CHECK (char_length(city) BETWEEN 1 AND 80),
  brand text CHECK (brand IS NULL OR char_length(brand) <= 80),
  model_number text CHECK (model_number IS NULL OR char_length(model_number) <= 80),
  approx_age text CHECK (approx_age IS NULL OR char_length(approx_age) <= 40),
  pickup boolean NOT NULL DEFAULT true,
  delivery boolean NOT NULL DEFAULT false,
  specs text CHECK (specs IS NULL OR char_length(specs) <= 2000),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('draft','active','sold','unavailable','removed')),
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mkt_list_status_created ON public.marketplace_listings(status, created_at DESC);
CREATE INDEX mkt_list_cat ON public.marketplace_listings(category_id, status);
CREATE INDEX mkt_list_loc ON public.marketplace_listings(country, region, status);
CREATE INDEX mkt_list_price ON public.marketplace_listings(price);
CREATE INDEX mkt_list_seller ON public.marketplace_listings(seller_id);
CREATE INDEX mkt_list_search ON public.marketplace_listings USING gin(search_vector);
GRANT SELECT ON public.marketplace_listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplace_listings TO authenticated;
GRANT ALL ON public.marketplace_listings TO service_role;
ALTER TABLE public.marketplace_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt list public read" ON public.marketplace_listings FOR SELECT TO anon, authenticated USING (status = 'active' OR seller_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "mkt list pro insert" ON public.marketplace_listings FOR INSERT TO authenticated WITH CHECK (seller_id = auth.uid() AND public.is_pro(auth.uid()) AND status IN ('draft','active'));
CREATE POLICY "mkt list owner update" ON public.marketplace_listings FOR UPDATE TO authenticated USING (seller_id = auth.uid() AND public.is_pro(auth.uid())) WITH CHECK (seller_id = auth.uid() AND status <> 'removed');
CREATE POLICY "mkt list owner delete" ON public.marketplace_listings FOR DELETE TO authenticated USING (seller_id = auth.uid() AND public.is_pro(auth.uid()));
CREATE POLICY "mkt list staff moderate" ON public.marketplace_listings FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));
CREATE POLICY "mkt list staff delete" ON public.marketplace_listings FOR DELETE TO authenticated USING (public.is_staff(auth.uid()));

CREATE OR REPLACE FUNCTION public.marketplace_listing_before() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
DECLARE recent int;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO recent FROM marketplace_listings WHERE seller_id = NEW.seller_id AND created_at > now() - interval '1 day';
    IF recent >= 20 THEN RAISE EXCEPTION 'Daily listing limit reached. Try again tomorrow.'; END IF;
    NEW.slug := trim(both '-' from left(regexp_replace(lower(NEW.title), '[^a-z0-9]+', '-', 'g'), 70)) || '-' || left(replace(NEW.id::text,'-',''), 8);
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.seller_id := OLD.seller_id;
    NEW.slug := OLD.slug;
    NEW.created_at := OLD.created_at;
    -- owners cannot un-remove a moderated listing
    IF OLD.status = 'removed' AND NOT public.is_staff(auth.uid()) THEN NEW.status := 'removed'; END IF;
  END IF;
  IF NEW.listing_type = 'free' THEN NEW.price := 0; END IF;
  NEW.updated_at := now();
  NEW.search_vector := setweight(to_tsvector('simple', coalesce(NEW.title,'')), 'A')
    || setweight(to_tsvector('simple', coalesce(NEW.brand,'') || ' ' || coalesce(NEW.model_number,'')), 'A')
    || setweight(to_tsvector('simple', coalesce(NEW.city,'') || ' ' || coalesce(NEW.region,'')), 'B')
    || setweight(to_tsvector('english', coalesce(NEW.description,'') || ' ' || coalesce(NEW.specs,'')), 'C');
  RETURN NEW;
END $$;
CREATE TRIGGER mkt_listing_before BEFORE INSERT OR UPDATE ON public.marketplace_listings FOR EACH ROW EXECUTE FUNCTION public.marketplace_listing_before();

CREATE TABLE public.marketplace_listing_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  path text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mkt_img_listing ON public.marketplace_listing_images(listing_id, sort_order);
GRANT SELECT ON public.marketplace_listing_images TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.marketplace_listing_images TO authenticated;
GRANT ALL ON public.marketplace_listing_images TO service_role;
ALTER TABLE public.marketplace_listing_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt img read" ON public.marketplace_listing_images FOR SELECT TO anon, authenticated USING (EXISTS (SELECT 1 FROM public.marketplace_listings l WHERE l.id = listing_id AND (l.status = 'active' OR l.seller_id = auth.uid() OR public.is_staff(auth.uid()))));
CREATE POLICY "mkt img owner write" ON public.marketplace_listing_images FOR ALL TO authenticated
  USING (public.is_pro(auth.uid()) AND EXISTS (SELECT 1 FROM public.marketplace_listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()))
  WITH CHECK (public.is_pro(auth.uid()) AND path LIKE auth.uid()::text || '/%' AND EXISTS (SELECT 1 FROM public.marketplace_listings l WHERE l.id = listing_id AND l.seller_id = auth.uid()));

CREATE TABLE public.marketplace_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  seller_id uuid NOT NULL,
  buyer_last_read timestamptz NOT NULL DEFAULT now(),
  seller_last_read timestamptz NOT NULL DEFAULT 'epoch',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, buyer_id)
);
CREATE INDEX mkt_conv_buyer ON public.marketplace_conversations(buyer_id, last_message_at DESC);
CREATE INDEX mkt_conv_seller ON public.marketplace_conversations(seller_id, last_message_at DESC);
GRANT SELECT, INSERT ON public.marketplace_conversations TO authenticated;
GRANT ALL ON public.marketplace_conversations TO service_role;
ALTER TABLE public.marketplace_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt conv participants read" ON public.marketplace_conversations FOR SELECT TO authenticated USING (auth.uid() IN (buyer_id, seller_id));
CREATE POLICY "mkt conv pro buyer start" ON public.marketplace_conversations FOR INSERT TO authenticated WITH CHECK (
  buyer_id = auth.uid() AND buyer_id <> seller_id AND public.is_pro(auth.uid())
  AND EXISTS (SELECT 1 FROM public.marketplace_listings l WHERE l.id = listing_id AND l.seller_id = marketplace_conversations.seller_id AND l.status = 'active'));

CREATE TABLE public.marketplace_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.marketplace_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL CHECK (char_length(btrim(body)) BETWEEN 1 AND 2000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX mkt_msg_conv ON public.marketplace_messages(conversation_id, created_at);
CREATE INDEX mkt_msg_sender ON public.marketplace_messages(sender_id, created_at DESC);
GRANT SELECT, INSERT ON public.marketplace_messages TO authenticated;
GRANT ALL ON public.marketplace_messages TO service_role;
ALTER TABLE public.marketplace_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt msg participants read" ON public.marketplace_messages FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.marketplace_conversations c WHERE c.id = conversation_id AND auth.uid() IN (c.buyer_id, c.seller_id)));
CREATE POLICY "mkt msg pro participants send" ON public.marketplace_messages FOR INSERT TO authenticated WITH CHECK (
  sender_id = auth.uid() AND public.is_pro(auth.uid())
  AND EXISTS (SELECT 1 FROM public.marketplace_conversations c WHERE c.id = conversation_id AND auth.uid() IN (c.buyer_id, c.seller_id)));

CREATE OR REPLACE FUNCTION public.marketplace_message_after() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE recent int;
BEGIN
  SELECT count(*) INTO recent FROM marketplace_messages WHERE sender_id = NEW.sender_id AND created_at > now() - interval '10 minutes';
  IF recent > 30 THEN RAISE EXCEPTION 'You are sending messages too quickly. Please wait a few minutes.'; END IF;
  UPDATE marketplace_conversations SET last_message_at = NEW.created_at,
    buyer_last_read = CASE WHEN buyer_id = NEW.sender_id THEN NEW.created_at ELSE buyer_last_read END,
    seller_last_read = CASE WHEN seller_id = NEW.sender_id THEN NEW.created_at ELSE seller_last_read END
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END $$;
CREATE TRIGGER mkt_message_after AFTER INSERT ON public.marketplace_messages FOR EACH ROW EXECUTE FUNCTION public.marketplace_message_after();

CREATE OR REPLACE FUNCTION public.marketplace_mark_read(_conversation_id uuid) RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  UPDATE marketplace_conversations SET
    buyer_last_read = CASE WHEN buyer_id = auth.uid() THEN now() ELSE buyer_last_read END,
    seller_last_read = CASE WHEN seller_id = auth.uid() THEN now() ELSE seller_last_read END
  WHERE id = _conversation_id AND auth.uid() IN (buyer_id, seller_id);
$$;

CREATE TABLE public.marketplace_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  seller_id uuid NOT NULL,
  rater_id uuid NOT NULL,
  stars smallint NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, rater_id)
);
CREATE INDEX mkt_rating_seller ON public.marketplace_ratings(seller_id);
GRANT SELECT, INSERT, UPDATE ON public.marketplace_ratings TO authenticated;
GRANT ALL ON public.marketplace_ratings TO service_role;
ALTER TABLE public.marketplace_ratings ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.marketplace_can_rate(_rater uuid, _listing uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_pro(_rater) AND EXISTS (
    SELECT 1 FROM marketplace_conversations c
    WHERE c.listing_id = _listing AND c.buyer_id = _rater AND c.seller_id <> _rater
      AND EXISTS (SELECT 1 FROM marketplace_messages m WHERE m.conversation_id = c.id AND m.sender_id = c.seller_id)
  );
$$;
CREATE POLICY "mkt rating own read" ON public.marketplace_ratings FOR SELECT TO authenticated USING (rater_id = auth.uid());
CREATE POLICY "mkt rating eligible insert" ON public.marketplace_ratings FOR INSERT TO authenticated WITH CHECK (
  rater_id = auth.uid() AND public.marketplace_can_rate(auth.uid(), listing_id)
  AND seller_id = (SELECT l.seller_id FROM public.marketplace_listings l WHERE l.id = listing_id));
CREATE POLICY "mkt rating own update" ON public.marketplace_ratings FOR UPDATE TO authenticated USING (rater_id = auth.uid() AND public.marketplace_can_rate(auth.uid(), listing_id)) WITH CHECK (rater_id = auth.uid());

CREATE OR REPLACE FUNCTION public.marketplace_rating_before() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN NEW.seller_id := OLD.seller_id; NEW.listing_id := OLD.listing_id; NEW.rater_id := OLD.rater_id; NEW.created_at := OLD.created_at; END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;
CREATE TRIGGER mkt_rating_before BEFORE INSERT OR UPDATE ON public.marketplace_ratings FOR EACH ROW EXECUTE FUNCTION public.marketplace_rating_before();

CREATE TABLE public.marketplace_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.marketplace_listings(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL,
  reason text NOT NULL CHECK (reason IN ('prohibited','stolen','scam','unsafe','spam','wrong_category','other')),
  details text CHECK (details IS NULL OR char_length(details) <= 1000),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','resolved','dismissed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (listing_id, reporter_id)
);
GRANT SELECT, INSERT, UPDATE ON public.marketplace_reports TO authenticated;
GRANT ALL ON public.marketplace_reports TO service_role;
ALTER TABLE public.marketplace_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt report insert" ON public.marketplace_reports FOR INSERT TO authenticated WITH CHECK (reporter_id = auth.uid() AND status = 'open');
CREATE POLICY "mkt report staff read" ON public.marketplace_reports FOR SELECT TO authenticated USING (public.is_staff(auth.uid()) OR reporter_id = auth.uid());
CREATE POLICY "mkt report staff update" ON public.marketplace_reports FOR UPDATE TO authenticated USING (public.is_staff(auth.uid())) WITH CHECK (public.is_staff(auth.uid()));

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS marketplace_country text CHECK (marketplace_country IS NULL OR marketplace_country ~ '^[A-Z]{2}$');

-- Public seller name + rating summary. Never returns email.
CREATE OR REPLACE FUNCTION public.marketplace_sellers(_ids uuid[]) RETURNS TABLE(id uuid, name text, rating_avg numeric, rating_count integer, member_since timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, coalesce(p.username, p.display_name, 'Member'),
    (SELECT round(avg(r.stars)::numeric, 1) FROM marketplace_ratings r WHERE r.seller_id = u.id),
    (SELECT count(*)::int FROM marketplace_ratings r WHERE r.seller_id = u.id),
    p.created_at
  FROM unnest(_ids) AS u(id) LEFT JOIN profiles p ON p.id = u.id
  WHERE EXISTS (SELECT 1 FROM marketplace_listings l WHERE l.seller_id = u.id)
     OR EXISTS (SELECT 1 FROM marketplace_conversations c WHERE c.buyer_id = u.id AND auth.uid() IN (c.buyer_id, c.seller_id));
$$;
GRANT EXECUTE ON FUNCTION public.marketplace_sellers(uuid[]) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.marketplace_search(_q text, _category uuid, _min numeric, _max numeric, _condition text, _type text, _country text, _region text, _city text, _sort text, _limit int, _offset int)
RETURNS TABLE(id uuid, slug text, title text, price numeric, currency text, condition text, listing_type text, category_id uuid, country text, region text, city text, created_at timestamptz, seller_id uuid, image_path text, total bigint)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH cats AS (
    SELECT c.id FROM marketplace_categories c WHERE _category IS NULL OR c.id = _category OR c.parent_id = _category
  ), q AS (
    SELECT CASE WHEN coalesce(btrim(_q),'') = '' THEN NULL ELSE websearch_to_tsquery('simple', _q) END AS tsq
  )
  SELECT l.id, l.slug, l.title, l.price, l.currency, l.condition, l.listing_type, l.category_id, l.country, l.region, l.city, l.created_at, l.seller_id,
    (SELECT i.path FROM marketplace_listing_images i WHERE i.listing_id = l.id ORDER BY i.sort_order LIMIT 1),
    count(*) OVER ()
  FROM marketplace_listings l, q
  WHERE l.status = 'active'
    AND l.category_id IN (SELECT id FROM cats)
    AND (q.tsq IS NULL OR l.search_vector @@ q.tsq OR l.search_vector @@ websearch_to_tsquery('english', _q))
    AND (_min IS NULL OR l.price >= _min) AND (_max IS NULL OR l.price <= _max)
    AND (_condition IS NULL OR l.condition = _condition)
    AND (_type IS NULL OR l.listing_type = _type)
    AND (_country IS NULL OR l.country = _country)
    AND (_region IS NULL OR l.region ILIKE _region)
    AND (_city IS NULL OR l.city ILIKE '%' || _city || '%')
  ORDER BY
    CASE WHEN _sort = 'price_asc' THEN l.price END ASC,
    CASE WHEN _sort = 'price_desc' THEN l.price END DESC,
    CASE WHEN _sort = 'oldest' THEN l.created_at END ASC,
    l.created_at DESC
  LIMIT least(coalesce(_limit, 24), 60) OFFSET greatest(coalesce(_offset, 0), 0);
$$;
GRANT EXECUTE ON FUNCTION public.marketplace_search(text, uuid, numeric, numeric, text, text, text, text, text, text, int, int) TO anon, authenticated;

INSERT INTO public.marketplace_categories (slug, title, sort_order) VALUES
 ('hvac-refrigeration','HVAC & Refrigeration',1),('electrical','Electrical',2),('plumbing','Plumbing',3),
 ('sheet-metal-ventilation','Sheet Metal & Ventilation',4),('construction-general','Construction & General Trades',5),
 ('industrial-mechanical','Industrial & Mechanical',6),('tools-test-equipment','Tools & Test Equipment',7),
 ('materials-supplies','Materials & Supplies',8),('other-trades','Other Trades',9);
INSERT INTO public.marketplace_categories (slug, title, parent_id, sort_order)
SELECT v.slug, v.title, p.id, v.ord FROM (VALUES
 ('heat-pumps','Heat Pumps','hvac-refrigeration',1),('furnaces','Furnaces','hvac-refrigeration',2),('air-conditioners','Air Conditioners','hvac-refrigeration',3),
 ('boilers','Boilers','hvac-refrigeration',4),('water-heaters','Water Heaters','hvac-refrigeration',5),('refrigeration-equipment','Refrigeration Equipment','hvac-refrigeration',6),
 ('compressors','Compressors','hvac-refrigeration',7),('motors-blowers','Motors and Blowers','hvac-refrigeration',8),('thermostats-controls','Thermostats and Controls','hvac-refrigeration',9),
 ('hvac-parts','HVAC Parts and Components','hvac-refrigeration',10),('refrigerants-supplies','Refrigerants and Supplies','hvac-refrigeration',11),
 ('electrical-test-equipment','Electrical Tools and Test Equipment','electrical',1),('panels-breakers','Electrical Panels and Breakers','electrical',2),
 ('motors-transformers','Motors and Transformers','electrical',3),('wiring-cables','Wiring and Cables','electrical',4),('electrical-components','Electrical Components','electrical',5),
 ('pumps','Pumps','plumbing',1),('pipes-fittings','Pipes and Fittings','plumbing',2),('valves','Valves','plumbing',3),('plumbing-tools','Plumbing Tools','plumbing',4),
 ('ductwork','Ductwork','sheet-metal-ventilation',1),('ventilation-equipment','Ventilation Equipment','sheet-metal-ventilation',2),
 ('fabrication-tools','Fabrication Tools','sheet-metal-ventilation',3),('duct-fittings-accessories','Fittings and Accessories','sheet-metal-ventilation',4),
 ('power-tools','Power Tools','construction-general',1),('hand-tools','Hand Tools','construction-general',2),('ladders-equipment','Ladders and Equipment','construction-general',3),
 ('safety-ppe','Safety Equipment and PPE','construction-general',4),('construction-materials','Construction Materials','construction-general',5),
 ('industrial-machinery','Industrial Machinery','industrial-mechanical',1),('bearings-components','Bearings and Components','industrial-mechanical',2),
 ('industrial-pumps-motors','Pumps and Motors','industrial-mechanical',3),('mechanical-equipment','Mechanical Equipment','industrial-mechanical',4)
) AS v(slug,title,parent,ord) JOIN public.marketplace_categories p ON p.slug = v.parent;

CREATE POLICY "mkt photos public read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'marketplace');
CREATE POLICY "mkt photos pro upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'marketplace' AND (storage.foldername(name))[1] = auth.uid()::text AND public.is_pro(auth.uid()));
CREATE POLICY "mkt photos owner delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'marketplace' AND (storage.foldername(name))[1] = auth.uid()::text);
