
-- 1. Variant group on products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS variant_group_id UUID;
CREATE INDEX IF NOT EXISTS idx_products_variant_group ON public.products(variant_group_id);

-- 2. Order address fields
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS sehir TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS ilce TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS mahalle TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS posta_kodu TEXT;

-- 3. Auto-save shipping address to user's address book
CREATE OR REPLACE FUNCTION public.tg_orders_save_address()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.user_id IS NULL THEN RETURN NEW; END IF;
  INSERT INTO public.addresses (user_id, ad_soyad, telefon, adres, sehir, ilce, mahalle, posta_kodu, is_default)
  SELECT NEW.user_id, NEW.ad_soyad, NEW.telefon, NEW.adres, NEW.sehir, NEW.ilce, NEW.mahalle, NEW.posta_kodu, false
  WHERE NOT EXISTS (
    SELECT 1 FROM public.addresses a
    WHERE a.user_id = NEW.user_id
      AND COALESCE(a.adres,'') = COALESCE(NEW.adres,'')
      AND COALESCE(a.sehir,'') = COALESCE(NEW.sehir,'')
      AND COALESCE(a.ilce,'') = COALESCE(NEW.ilce,'')
  );
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_orders_save_address ON public.orders;
CREATE TRIGGER trg_orders_save_address AFTER INSERT ON public.orders
FOR EACH ROW EXECUTE FUNCTION public.tg_orders_save_address();

-- 4. Custom scripts
CREATE TABLE IF NOT EXISTS public.custom_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad TEXT NOT NULL,
  konum TEXT NOT NULL DEFAULT 'all',
  icerik TEXT NOT NULL DEFAULT '',
  aktif BOOLEAN NOT NULL DEFAULT true,
  sira INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.custom_scripts TO anon, authenticated;
GRANT ALL ON public.custom_scripts TO authenticated;
GRANT ALL ON public.custom_scripts TO service_role;
ALTER TABLE public.custom_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read active scripts" ON public.custom_scripts;
CREATE POLICY "read active scripts" ON public.custom_scripts FOR SELECT USING (aktif = true OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "admin manage scripts" ON public.custom_scripts;
CREATE POLICY "admin manage scripts" ON public.custom_scripts FOR ALL
USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP TRIGGER IF EXISTS trg_custom_scripts_updated_at ON public.custom_scripts;
CREATE TRIGGER trg_custom_scripts_updated_at BEFORE UPDATE ON public.custom_scripts
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 5. Seed static pages if missing
INSERT INTO public.pages (slug, title, content, aktif)
VALUES
  ('hakkimizda', 'Hakkımızda',
   '<p>Alpottica Istanbul; klipsli sistemleri, polarize camları ve zamansız tasarımlarıyla göz sağlığınızı öne alan bir gözlük markasıdır.</p><p>İstanbul''dan; kaliteyi ve estetiği bir araya getiriyoruz.</p>',
   true),
  ('iletisim', 'Bize Ulaşın',
   '<p><strong>Telefon:</strong> <a href="tel:+905466460244">0546 646 02 44</a></p><p><strong>Instagram:</strong> <a href="https://instagram.com/alpottica">@alpottica</a></p><p><strong>Adres:</strong> İstanbul, Türkiye</p>',
   true),
  ('uyelik-sozlesmesi', 'Üyelik Sözleşmesi',
   '<p>Bu sözleşme, Alpottica üyelik hizmetlerinden yararlanmak isteyen kullanıcıların uymakla yükümlü olduğu koşulları düzenler.</p>',
   true),
  ('gizlilik-sozlesmesi', 'Gizlilik Sözleşmesi',
   '<p>Alpottica olarak kişisel verilerinizin gizliliğine önem veriyoruz. Verileriniz yalnızca sipariş süreçleriniz için kullanılır.</p>',
   true),
  ('kullanim-kosullari', 'Kullanım Koşulları',
   '<p>Sitemizi kullanarak aşağıdaki koşulları kabul etmiş sayılırsınız.</p>',
   true)
ON CONFLICT (slug) DO NOTHING;
