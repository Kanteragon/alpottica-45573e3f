
CREATE POLICY "public read images" ON storage.objects FOR SELECT
  USING (bucket_id IN ('product-images','slider-images'));

CREATE POLICY "admin upload images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('product-images','slider-images') AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin update images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('product-images','slider-images') AND public.has_role(auth.uid(),'admin'));

CREATE POLICY "admin delete images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('product-images','slider-images') AND public.has_role(auth.uid(),'admin'));
