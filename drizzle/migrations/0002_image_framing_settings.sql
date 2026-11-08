ALTER TABLE public.showcase_categories ADD COLUMN IF NOT EXISTS image_position_x integer NOT NULL DEFAULT 50 CHECK (image_position_x BETWEEN 0 AND 100);
ALTER TABLE public.showcase_categories ADD COLUMN IF NOT EXISTS image_position_y integer NOT NULL DEFAULT 50 CHECK (image_position_y BETWEEN 0 AND 100);
ALTER TABLE public.site_settings ADD COLUMN IF NOT EXISTS product_image_fit text NOT NULL DEFAULT 'current' CHECK (product_image_fit IN ('current', 'contain', 'cover'));
NOTIFY pgrst, 'reload schema';