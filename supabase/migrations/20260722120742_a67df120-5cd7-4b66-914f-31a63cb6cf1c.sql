
-- Slider device visibility flags
ALTER TABLE public.sliders
  ADD COLUMN IF NOT EXISTS show_mobile boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_tablet boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS show_desktop boolean NOT NULL DEFAULT true;

-- Product attribute definitions (managed centrally)
CREATE TABLE IF NOT EXISTS public.product_attributes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad text NOT NULL,
  slug text NOT NULL UNIQUE,
  degerler text[] NOT NULL DEFAULT '{}',
  filterable boolean NOT NULL DEFAULT true,
  show_in_detail boolean NOT NULL DEFAULT true,
  sira integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.product_attributes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_attributes TO authenticated;
GRANT ALL ON public.product_attributes TO service_role;

ALTER TABLE public.product_attributes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attrs public read" ON public.product_attributes
  FOR SELECT USING (true);
CREATE POLICY "attrs admin write" ON public.product_attributes
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_attrs_updated ON public.product_attributes;
CREATE TRIGGER trg_attrs_updated BEFORE UPDATE ON public.product_attributes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Seed default attributes
INSERT INTO public.product_attributes (ad, slug, degerler, filterable, show_in_detail, sira) VALUES
  ('Çerçeve Rengi', 'renk', ARRAY['Siyah','Kahve','Altın','Gümüş','Şeffaf'], true, true, 1),
  ('Cam Rengi', 'cam_rengi', ARRAY['Siyah','Kahve','Yeşil','Mavi','Şeffaf'], true, true, 2),
  ('Ekartman', 'ekartman', ARRAY['52','54','56','58','60'], true, true, 3),
  ('Cam Materyali', 'cam_materyali', ARRAY['Cam','Polikarbon','CR-39'], true, true, 4),
  ('Cam Tipi', 'cam_tipi', ARRAY['Polarize','UV400','Aynalı'], true, true, 5)
ON CONFLICT (slug) DO NOTHING;

-- Ensure Klipsli Modeller category exists
INSERT INTO public.categories (name, slug, sort)
VALUES ('Klipsli Modeller', 'klipsli-modeller', 1)
ON CONFLICT (slug) DO NOTHING;
