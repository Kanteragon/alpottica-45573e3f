GRANT SELECT, INSERT ON public.orders TO anon, authenticated;
GRANT UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO anon, authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT ALL ON public.order_items TO service_role;

ALTER TABLE public.orders ALTER COLUMN email DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.place_order(order_data jsonb, items jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id uuid;
  it jsonb;
BEGIN
  IF items IS NULL OR jsonb_array_length(items) = 0 THEN
    RAISE EXCEPTION 'Sepet boş';
  END IF;

  INSERT INTO public.orders (
    user_id, ad_soyad, telefon, email, adres, sehir, ilce, mahalle, posta_kodu,
    odeme_tipi, toplam, notlar
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
    NULLIF(order_data->>'notlar','')
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
$$;

REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb) TO anon, authenticated;