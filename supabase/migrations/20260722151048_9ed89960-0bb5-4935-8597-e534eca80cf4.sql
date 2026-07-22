
-- 1) ORDERS: teslimat adresi ayrıntı alanları
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sehir text,
  ADD COLUMN IF NOT EXISTS ilce text,
  ADD COLUMN IF NOT EXISTS mahalle text,
  ADD COLUMN IF NOT EXISTS posta_kodu text;

-- 2) PRODUCTS: varyasyon grubu (aynı grup = birbirinin renk/model varyasyonu)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS variant_group_id uuid;
CREATE INDEX IF NOT EXISTS products_variant_group_idx ON public.products(variant_group_id);

-- 3) CUSTOM SCRIPTS
CREATE TABLE IF NOT EXISTS public.custom_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad text NOT NULL,
  konum text NOT NULL DEFAULT 'all',      -- all | home | product | category | cart | checkout
  icerik text NOT NULL DEFAULT '',
  aktif boolean NOT NULL DEFAULT true,
  sira integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_scripts TO anon, authenticated;
GRANT ALL ON public.custom_scripts TO authenticated, service_role;
ALTER TABLE public.custom_scripts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "scripts read" ON public.custom_scripts;
CREATE POLICY "scripts read" ON public.custom_scripts FOR SELECT
  TO anon, authenticated USING (aktif = true);
DROP POLICY IF EXISTS "scripts admin write" ON public.custom_scripts;
CREATE POLICY "scripts admin write" ON public.custom_scripts
  TO authenticated USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_scripts_updated ON public.custom_scripts;
CREATE TRIGGER trg_scripts_updated BEFORE UPDATE ON public.custom_scripts
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 4) Sipariş verilince adresi otomatik olarak müşterinin adres defterine ekle
CREATE OR REPLACE FUNCTION public.tg_orders_save_address()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE dup int;
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  SELECT count(*) INTO dup FROM public.addresses
    WHERE user_id = NEW.user_id AND adres = NEW.adres;
  IF dup = 0 THEN
    INSERT INTO public.addresses (user_id, baslik, ad_soyad, telefon, adres, sehir, ilce, is_default)
    VALUES (
      NEW.user_id,
      COALESCE(NULLIF(NEW.sehir,'') || ' Adresi','Sipariş Adresi'),
      NEW.ad_soyad, NEW.telefon, NEW.adres, NEW.sehir, NEW.ilce,
      NOT EXISTS (SELECT 1 FROM public.addresses WHERE user_id = NEW.user_id)
    );
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_orders_save_address ON public.orders;
CREATE TRIGGER trg_orders_save_address AFTER INSERT ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.tg_orders_save_address();

-- 5) Statik sayfaları hazırla (yoksa)
INSERT INTO public.pages (slug, title, content, aktif) VALUES
  ('hakkimizda','Hakkımızda','<h2>Alpottica Istanbul</h2><p>İstanbul’dan; zamansız çerçeveler, polarize ve antifar klips sistemleriyle her ortamda tek gözlükte tam koruma sunuyoruz.</p>', true),
  ('iletisim','Bize Ulaşın','<p>Telefon: 0546 646 02 44<br/>Instagram: @alpottica<br/>Adres: İstanbul, Türkiye</p>', true),
  ('uyelik-sozlesmesi','Üyelik Sözleşmesi','<p>Üyelik sözleşmesi metni buraya girilecektir.</p>', true),
  ('gizlilik-sozlesmesi','Gizlilik Sözleşmesi','<p>Gizlilik politikası metni buraya girilecektir.</p>', true),
  ('kullanim-kosullari','Kullanım Koşulları','<p>Kullanım koşulları metni buraya girilecektir.</p>', true)
ON CONFLICT (slug) DO NOTHING;
