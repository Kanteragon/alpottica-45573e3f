ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS hedef_tip text NOT NULL DEFAULT 'tumu',
  ADD COLUMN IF NOT EXISTS hedef_kategori_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS hedef_urun_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grup_a_kategori_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grup_a_urun_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grup_b_kategori_ids uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS grup_b_urun_ids uuid[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tip text NOT NULL,
  session_id text,
  user_id uuid,
  product_id uuid,
  path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.site_events TO anon;
GRANT SELECT, INSERT ON public.site_events TO authenticated;
GRANT ALL ON public.site_events TO service_role;

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "site_events insert any" ON public.site_events
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "site_events admin read" ON public.site_events
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS site_events_created_at_idx ON public.site_events (created_at DESC);
CREATE INDEX IF NOT EXISTS site_events_tip_idx ON public.site_events (tip);