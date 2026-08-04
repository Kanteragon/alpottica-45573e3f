-- campaigns: split anon/authenticated read so anon path never calls has_role
DROP POLICY IF EXISTS "campaigns read" ON public.campaigns;
CREATE POLICY "campaigns read anon" ON public.campaigns FOR SELECT TO anon USING (aktif = true);
CREATE POLICY "campaigns read auth" ON public.campaigns FOR SELECT TO authenticated USING (aktif = true OR public.has_role(auth.uid(), 'admin'));

-- custom_scripts: remove public-role policies calling has_role
DROP POLICY IF EXISTS "read active scripts" ON public.custom_scripts;
DROP POLICY IF EXISTS "admin manage scripts" ON public.custom_scripts;
CREATE POLICY "scripts read anon" ON public.custom_scripts FOR SELECT TO anon USING (aktif = true);
CREATE POLICY "scripts read auth" ON public.custom_scripts FOR SELECT TO authenticated USING (aktif = true OR public.has_role(auth.uid(), 'admin'));

-- product_categories: admin management limited to authenticated
DROP POLICY IF EXISTS "Admins can manage product categories" ON public.product_categories;
CREATE POLICY "product_categories admin write" ON public.product_categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- has_role must not be callable by signed-out visitors
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;

-- apply_attribute_rename: admin-only helper, never for anon
REVOKE EXECUTE ON FUNCTION public.apply_attribute_rename(text[], text, jsonb) FROM PUBLIC, anon;

-- orders: explicit, safe client insert path scoped to own user id
CREATE POLICY "orders insert own" ON public.orders FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
