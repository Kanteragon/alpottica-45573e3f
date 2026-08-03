ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS brand_name text NOT NULL DEFAULT 'Alpottica';

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE u.id = p.id AND p.email IS DISTINCT FROM u.email;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  RETURN NEW;
END; $function$;