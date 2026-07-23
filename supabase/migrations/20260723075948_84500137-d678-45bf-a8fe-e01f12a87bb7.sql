ALTER TABLE public.addresses ALTER COLUMN baslik DROP NOT NULL;
ALTER TABLE public.addresses ALTER COLUMN baslik SET DEFAULT 'Teslimat Adresi';
UPDATE public.addresses SET baslik = 'Teslimat Adresi' WHERE baslik IS NULL;