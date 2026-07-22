-- Consolidate duplicate Klipsli Modeller category; keep the older 'klipsli' as canonical
UPDATE public.products SET kategori_id = 'a4cb041a-db25-49e1-84b0-28ed045409fd'
  WHERE kategori_id = '8b18c221-7e64-4beb-8c0f-9c1452264908';
DELETE FROM public.categories WHERE id = '8b18c221-7e64-4beb-8c0f-9c1452264908';
UPDATE public.categories SET name='Klipsli Modeller' WHERE id='a4cb041a-db25-49e1-84b0-28ed045409fd';