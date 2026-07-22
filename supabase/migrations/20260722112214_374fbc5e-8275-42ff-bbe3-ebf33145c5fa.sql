
-- Auto-promote known admin email(s) to admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'phone')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  IF lower(NEW.email) IN ('adminalpottica@alpottica.com','adminalpottica@alpottica.local') THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END; $$;

-- Seed sliders (idempotent via title dedupe)
INSERT INTO public.sliders (baslik, alt_baslik, gorsel, buton_yazi, buton_link, sira, aktif)
SELECT * FROM (VALUES
  ('KLİPSLİLER'::text, 'Yeni seri klipsli koleksiyon'::text, '/hero-klips.jpg'::text, 'HEMEN İNCELE'::text, '/urunler?tag=klipsli'::text, 1, true),
  ('PİLOTA'::text, 'Yeni ürün — havayı kes'::text, '/hero-pilota.jpg'::text, 'KEŞFET'::text, '/urunler'::text, 2, true),
  ('OUTLET'::text, '%30''a varan indirim'::text, '/hero-outlet.jpg'::text, 'OUTLETİ GÖR'::text, '/urunler?tag=outlet'::text, 3, true)
) v(baslik,alt_baslik,gorsel,buton_yazi,buton_link,sira,aktif)
WHERE NOT EXISTS (SELECT 1 FROM public.sliders);

-- Seed showcase from first 8 available products
INSERT INTO public.showcase_items (product_id, sira)
SELECT id, row_number() OVER (ORDER BY random()) FROM public.products WHERE aktif AND stok_adedi > 0
LIMIT 8
ON CONFLICT DO NOTHING;
