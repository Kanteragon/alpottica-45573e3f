ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS uye_zorunlu boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS kullanim_limiti integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS oneri_goster boolean NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  kod text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;

ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own redemptions"
  ON public.coupon_redemptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can insert own redemptions"
  ON public.coupon_redemptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS coupon_redemptions_user_campaign_idx
  ON public.coupon_redemptions (user_id, campaign_id);