-- 1) Mevcut misafir siparişlerini e-posta eşleşmesiyle bağla
UPDATE public.orders o
SET user_id = p.id, updated_at = now()
FROM public.profiles p
WHERE o.user_id IS NULL
  AND o.email IS NOT NULL
  AND lower(o.email) = lower(p.email);

-- 2) E-postası olmayanları benzersiz telefon eşleşmesiyle bağla (son 10 hane, yalnızca tek profil eşleşiyorsa)
UPDATE public.orders o
SET user_id = p.id, updated_at = now()
FROM public.profiles p
WHERE o.user_id IS NULL
  AND length(regexp_replace(coalesce(o.telefon, ''), '\D', '', 'g')) >= 10
  AND length(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g')) >= 10
  AND right(regexp_replace(o.telefon, '\D', '', 'g'), 10) = right(regexp_replace(p.phone, '\D', '', 'g'), 10)
  AND (
    SELECT count(*) FROM public.profiles p2
    WHERE length(regexp_replace(coalesce(p2.phone, ''), '\D', '', 'g')) >= 10
      AND right(regexp_replace(p2.phone, '\D', '', 'g'), 10) = right(regexp_replace(o.telefon, '\D', '', 'g'), 10)
  ) = 1;

-- 3) Yeni kayıtlarda geçmiş misafir siparişlerini otomatik bağla
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_phone text := regexp_replace(coalesce(NEW.raw_user_meta_data->>'phone', ''), '\D', '', 'g');
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone', NEW.email)
  ON CONFLICT (id) DO UPDATE SET email = EXCLUDED.email;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF lower(NEW.email) IN ('adminalpottica@alpottica.com','adminalpottica@alpottica.local') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Geçmiş misafir siparişlerini bu hesaba bağla (e-posta)
  UPDATE public.orders o
  SET user_id = NEW.id
  WHERE o.user_id IS NULL
    AND o.email IS NOT NULL
    AND lower(o.email) = lower(NEW.email);

  -- Telefon ile bağla (yalnızca bu numaraya sahip başka hesap yoksa)
  IF length(v_phone) >= 10 THEN
    UPDATE public.orders o
    SET user_id = NEW.id
    WHERE o.user_id IS NULL
      AND length(regexp_replace(coalesce(o.telefon, ''), '\D', '', 'g')) >= 10
      AND right(regexp_replace(o.telefon, '\D', '', 'g'), 10) = right(v_phone, 10)
      AND NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id <> NEW.id
          AND length(regexp_replace(coalesce(p.phone, ''), '\D', '', 'g')) >= 10
          AND right(regexp_replace(p.phone, '\D', '', 'g'), 10) = right(v_phone, 10)
      );
  END IF;

  RETURN NEW;
END;
$function$