CREATE TABLE public.stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  tip text NOT NULL DEFAULT 'guncelleme',
  miktar integer NOT NULL DEFAULT 0,
  onceki integer NOT NULL DEFAULT 0,
  sonraki integer NOT NULL DEFAULT 0,
  aciklama text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_stock_movements_product ON public.stock_movements(product_id, created_at DESC);

GRANT SELECT ON public.stock_movements TO authenticated;
GRANT ALL ON public.stock_movements TO service_role;

ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view stock movements"
ON public.stock_movements FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.tg_log_stock_movement()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  prev integer := 0;
  diff integer;
BEGIN
  IF TG_OP = 'INSERT' THEN
    prev := 0;
  ELSE
    prev := COALESCE(OLD.stok_adedi, 0);
    IF prev = COALESCE(NEW.stok_adedi, 0) THEN
      RETURN NEW;
    END IF;
  END IF;
  diff := COALESCE(NEW.stok_adedi, 0) - prev;
  INSERT INTO public.stock_movements (product_id, tip, miktar, onceki, sonraki, aciklama)
  VALUES (
    NEW.id,
    CASE WHEN TG_OP = 'INSERT' THEN 'giris' WHEN diff > 0 THEN 'giris' ELSE 'cikis' END,
    diff,
    prev,
    COALESCE(NEW.stok_adedi, 0),
    CASE WHEN TG_OP = 'INSERT' THEN 'Ürün oluşturuldu' ELSE 'Stok güncellendi' END
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_stock_movement
AFTER INSERT OR UPDATE OF stok_adedi ON public.products
FOR EACH ROW EXECUTE FUNCTION public.tg_log_stock_movement();