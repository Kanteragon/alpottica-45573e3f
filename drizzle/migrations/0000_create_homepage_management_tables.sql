CREATE TABLE IF NOT EXISTS public.homepage_sections (
 key text PRIMARY KEY,
 label text NOT NULL,
 sort_order integer NOT NULL DEFAULT 0,
 is_active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.homepage_sections TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.homepage_sections TO authenticated;
GRANT ALL ON public.homepage_sections TO service_role;
ALTER TABLE public.homepage_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "homepage_sections public read" ON public.homepage_sections FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "homepage_sections admin write" ON public.homepage_sections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TABLE IF NOT EXISTS public.showcase_categories (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL,
 tag text NOT NULL DEFAULT '',
 image_url text NOT NULL DEFAULT '',
 href text NOT NULL DEFAULT '/urunler',
 sort_order integer NOT NULL DEFAULT 0,
 is_active boolean NOT NULL DEFAULT true
);
GRANT SELECT ON public.showcase_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.showcase_categories TO authenticated;
GRANT ALL ON public.showcase_categories TO service_role;
ALTER TABLE public.showcase_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "showcase_categories public read" ON public.showcase_categories FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "showcase_categories admin write" ON public.showcase_categories FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));