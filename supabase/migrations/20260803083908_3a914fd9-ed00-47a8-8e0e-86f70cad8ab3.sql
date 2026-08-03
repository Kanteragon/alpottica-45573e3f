-- 1) Remove permissive insert policies; orders go through place_order (SECURITY DEFINER)
DROP POLICY IF EXISTS "orders insert any" ON public.orders;
DROP POLICY IF EXISTS "order_items insert any" ON public.order_items;

-- 2) Harden newsletter + analytics inserts
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.newsletter_subscribers;
CREATE POLICY "newsletter subscribe validated" ON public.newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email ~* '^[^@\s]+@[^@\s]+\.[a-z]{2,}$'
    AND length(email) <= 254
    AND kaynak IN ('footer','popup','checkout')
  );

DROP POLICY IF EXISTS "site_events insert any" ON public.site_events;
CREATE POLICY "site_events insert validated" ON public.site_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    tip IN ('visit','add_to_cart','product_view','signup','search')
    AND (user_id IS NULL OR user_id = auth.uid())
    AND (session_id IS NULL OR length(session_id) <= 100)
    AND (path IS NULL OR length(path) <= 500)
  );

-- 3) Server-side pricing in place_order
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
  subtotal numeric := 0;
  kargo numeric := 0;
  indirim numeric := 0;
BEGIN
  IF items IS NULL OR jsonb_array_length(items) = 0 THEN
    RAISE EXCEPTION 'Sepet bos';
  END IF;

  kargo := GREATEST(COALESCE((order_data->>'kargo_ucret')::numeric, 0), 0);
  indirim := GREATEST(COALESCE((order_data->>'indirim')::numeric, 0), 0);

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
    kargo,
    indirim
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

    subtotal := subtotal + (unit * qty);

    INSERT INTO public.order_items (order_id, product_id, adet, birim_fiyat, urun_adi_snapshot)
    VALUES (new_id, pid, qty, unit, COALESCE(pname, it->>'urun_adi_snapshot'));

    IF pid IS NOT NULL THEN
      UPDATE public.products
         SET stok_adedi = GREATEST(COALESCE(stok_adedi,0) - qty, 0),
             updated_at = now()
       WHERE id = pid;
    END IF;
  END LOOP;

  indirim := LEAST(indirim, subtotal);

  UPDATE public.orders
     SET indirim = indirim,
         toplam = GREATEST(subtotal - indirim + kargo, 0),
         updated_at = now()
   WHERE id = new_id;

  RETURN new_id;
END;
$function$;

-- 4) Restrict SECURITY DEFINER function execution
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.grant_admin_for_specific_email() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_log_stock_movement() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_orders_save_address() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.tg_set_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_attribute_rename(text[], text, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.apply_attribute_rename(text[], text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.place_order(jsonb, jsonb) TO anon, authenticated;