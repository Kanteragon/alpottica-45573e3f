
CREATE TABLE public.site_settings (
  id INT PRIMARY KEY DEFAULT 1,
  logo_url TEXT,
  logo_max_width INT NOT NULL DEFAULT 180,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT single_row CHECK (id = 1)
);
GRANT SELECT ON public.site_settings TO anon, authenticated;
GRANT ALL ON public.site_settings TO authenticated, service_role;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_settings_read" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "site_settings_admin_write" ON public.site_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.site_settings (id, logo_max_width) VALUES (1, 180) ON CONFLICT DO NOTHING;
