ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text;

ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_keywords text;

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS aciklama text;

ALTER TABLE public.product_categories
  ADD COLUMN IF NOT EXISTS sira integer NOT NULL DEFAULT 0;

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS kosul_tip text NOT NULL DEFAULT 'tumu',
  ADD COLUMN IF NOT EXISTS kosul_kategori_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS kosul_urun_ids uuid[] NOT NULL DEFAULT '{}';