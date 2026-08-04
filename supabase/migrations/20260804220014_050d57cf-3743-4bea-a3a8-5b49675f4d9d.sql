ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS color_primary text,
  ADD COLUMN IF NOT EXISTS color_secondary text,
  ADD COLUMN IF NOT EXISTS color_success text,
  ADD COLUMN IF NOT EXISTS color_danger text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS whatsapp text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS instagram text;