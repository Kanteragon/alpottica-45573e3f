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
  unit numeric;
  pname text;
  v_subtotal numeric := 0;
  v_kargo numeric := 0;
  v_indirim numeric := 0;
BEGIN
  IF items IS NULL OR jsonb_array_length(items) = 0 THEN
    RAISE EXCEPTION 'Sepet bos';
  END IF;

  v_kargo := GREATEST(COALESCE((order_data->>'kargo_ucret')::numeric, 0), 0);
  v_indirim := GREATEST(COALESCE((order_data->>'indirim')::numeric, 0), 0);

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
    0,
    NULLIF(order_data->>'notlar',''),
    NULLIF(order_data->>'kargo_firma',''),
    v_kargo,
    v_indirim
  ) RETURNING id INTO new_id;

  FOR it IN SELECT * FROM jsonb_array_elements(items) LOOP
    pid := NULLIF(it->>'product_id','')::uuid;
    qty := GREATEST(COALESCE((it->>'adet')::int, 1), 1);

    unit := NULL;
    pname := NULL;
    IF pid IS NOT NULL THEN
      SELECT p.satis_fiyati, p.urun_adi INTO unit, pname
      FROM public.products p WHERE p.id = pid;
    END IF;

    IF unit IS NULL THEN
      unit := GREATEST(COALESCE((it->>'birim_fiyat')::numeric, 0), 0);
    END IF;

    v_subtotal := v_subtotal + (unit * qty);

    INSERT INTO public.order_items (order_id, product_id, adet, birim_fiyat, urun_adi_snapshot)
    VALUES (new_id, pid, qty, unit, COALESCE(pname, it->>'urun_adi_snapshot'));

    IF pid IS NOT NULL THEN
      UPDATE public.products
         SET stok_adedi = GREATEST(COALESCE(stok_adedi,0) - qty, 0),
             updated_at = now()
       WHERE id = pid;
    END IF;
  END LOOP;

  v_indirim := LEAST(v_indirim, v_subtotal);

  UPDATE public.orders o
     SET indirim = v_indirim,
         toplam = GREATEST(v_subtotal - v_indirim + v_kargo, 0),
         updated_at = now()
   WHERE o.id = new_id;

  RETURN new_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.place_order(jsonb, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb) TO anon, authenticated;