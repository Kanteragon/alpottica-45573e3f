CREATE TABLE public.shipping_settings (
  id integer PRIMARY KEY DEFAULT 1,
  firma text NOT NULL DEFAULT 'Kargo',
  ucret numeric NOT NULL DEFAULT 0,
  aktif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.shipping_settings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shipping_settings TO authenticated;
GRANT ALL ON public.shipping_settings TO service_role;
ALTER TABLE public.shipping_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "shipping read" ON public.shipping_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "shipping admin write" ON public.shipping_settings FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER shipping_settings_updated_at BEFORE UPDATE ON public.shipping_settings FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
INSERT INTO public.shipping_settings (id, firma, ucret, aktif) VALUES (1, 'Yurtiçi Kargo', 0, true);
CREATE TABLE public.campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad text NOT NULL,
  tip text NOT NULL DEFAULT 'ucretsiz_kargo',
  esik numeric NOT NULL DEFAULT 0,
  urun_a uuid,
  urun_b uuid,
  indirim_tutar numeric NOT NULL DEFAULT 0,
  indirim_oran numeric NOT NULL DEFAULT 0,
  baslangic timestamptz,
  bitis timestamptz,
  aktif boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns read" ON public.campaigns FOR SELECT TO anon, authenticated USING (aktif = true OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "campaigns admin write" ON public.campaigns FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER campaigns_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS kargo_firma text,
  ADD COLUMN IF NOT EXISTS kargo_ucret numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS indirim numeric NOT NULL DEFAULT 0;
CREATE OR REPLACE FUNCTION public.place_order(order_data jsonb, items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  it jsonb;
BEGIN
  IF items IS NULL OR jsonb_array_length(items) = 0 THEN
    RAISE EXCEPTION 'Sepet bos';
  END IF;
  INSERT INTO public.orders (
    user_id, ad_soyad, telefon, email, adres, sehir, ilce, mahalle, posta_kodu,
    odeme_tipi, toplam, notlar, kargo_firma, kargo_ucret, indirim
  ) VALUES (
    auth.uid(),
    order_data->>'ad_soyad',
    order_data->>'telefon',
    NULLIF(order_data->>'email',''),
    order_data->>'adres',
    order_data->>'sehir',
    order_data->>'ilce',
    NULLIF(order_data->>'mahalle',''),
    NULLIF(order_data->>'posta_kodu',''),
    COALESCE(order_data->>'odeme_tipi','nakit'),
    COALESCE((order_data->>'toplam')::numeric, 0),
    NULLIF(order_data->>'notlar',''),
    NULLIF(order_data->>'kargo_firma',''),
    COALESCE((order_data->>'kargo_ucret')::numeric, 0),
    COALESCE((order_data->>'indirim')::numeric, 0)
  ) RETURNING id INTO new_id;
  FOR it IN SELECT * FROM jsonb_array_elements(items) LOOP
    INSERT INTO public.order_items (order_id, product_id, adet, birim_fiyat, urun_adi_snapshot)
    VALUES (
      new_id,
      NULLIF(it->>'product_id','')::uuid,
      COALESCE((it->>'adet')::int, 1),
      COALESCE((it->>'birim_fiyat')::numeric, 0),
      it->>'urun_adi_snapshot'
    );
  END LOOP;
  RETURN new_id;
END;
$function$
