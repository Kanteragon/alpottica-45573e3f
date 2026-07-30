ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS kod text,
  ADD COLUMN IF NOT EXISTS min_adet integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS kategori_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS max_indirim numeric NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS campaigns_kod_unique ON public.campaigns (lower(kod)) WHERE kod IS NOT NULL AND kod <> '';