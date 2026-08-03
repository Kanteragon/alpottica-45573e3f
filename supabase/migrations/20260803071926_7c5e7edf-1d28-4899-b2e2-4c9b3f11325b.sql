-- 1) Newsletter subscribers
CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  kaynak text NOT NULL DEFAULT 'footer',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.newsletter_subscribers TO authenticated;
GRANT INSERT ON public.newsletter_subscribers TO anon, authenticated;
GRANT ALL ON public.newsletter_subscribers TO service_role;

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can read subscribers"
  ON public.newsletter_subscribers FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Category random ordering toggle
ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS rastgele_sirala boolean NOT NULL DEFAULT false;

-- 3) Decrement stock when an order is placed
CREATE OR REPLACE FUNCTION public.place_order(order_data jsonb, items jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  new_id uuid;
  it jsonb;
  pid uuid;
  qty int;
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
    pid := NULLIF(it->>'product_id','')::uuid;
    qty := GREATEST(COALESCE((it->>'adet')::int, 1), 0);

    INSERT INTO public.order_items (order_id, product_id, adet, birim_fiyat, urun_adi_snapshot)
    VALUES (
      new_id,
      pid,
      COALESCE((it->>'adet')::int, 1),
      COALESCE((it->>'birim_fiyat')::numeric, 0),
      it->>'urun_adi_snapshot'
    );

    IF pid IS NOT NULL AND qty > 0 THEN
      UPDATE public.products
         SET stok_adedi = GREATEST(COALESCE(stok_adedi,0) - qty, 0),
             updated_at = now()
       WHERE id = pid;
    END IF;
  END LOOP;

  RETURN new_id;
END;
$function$;