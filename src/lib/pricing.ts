import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CartItem } from "@/lib/cart";

export type Shipping = { firma: string; ucret: number; aktif: boolean };

export type Campaign = {
  id: string;
  ad: string;
  tip: string;
  esik: number;
  urun_a: string | null;
  urun_b: string | null;
  indirim_tutar: number;
  indirim_oran: number;
  baslangic: string | null;
  bitis: string | null;
  aktif: boolean;
};

export function useShipping() {
  return useQuery({
    queryKey: ["shipping"],
    queryFn: async (): Promise<Shipping> => {
      const { data, error } = await supabase
        .from("shipping_settings")
        .select("firma,ucret,aktif")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      return {
        firma: data?.firma ?? "Kargo",
        ucret: Number(data?.ucret ?? 0),
        aktif: data?.aktif ?? true,
      };
    },
  });
}

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns", "active"],
    queryFn: async (): Promise<Campaign[]> => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("aktif", true)
        .order("created_at");
      if (error) throw error;
      return (data ?? []).map((c) => ({
        ...c,
        esik: Number(c.esik ?? 0),
        indirim_tutar: Number(c.indirim_tutar ?? 0),
        indirim_oran: Number(c.indirim_oran ?? 0),
      })) as Campaign[];
    },
  });
}

function inWindow(c: Campaign) {
  const now = Date.now();
  if (c.baslangic && new Date(c.baslangic).getTime() > now) return false;
  if (c.bitis && new Date(c.bitis).getTime() < now) return false;
  return true;
}

export type PriceBreakdown = {
  subtotal: number;
  shippingLabel: string;
  shippingCost: number;
  freeShipping: boolean;
  discount: number;
  appliedCampaigns: string[];
  total: number;
};

export function computeTotals(
  items: CartItem[],
  shipping: Shipping | undefined,
  campaigns: Campaign[] | undefined,
): PriceBreakdown {
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const baseShipping = shipping?.aktif ? Number(shipping.ucret) || 0 : 0;
  const ids = new Set(items.map((i) => i.product_id));

  let discount = 0;
  let freeShipping = subtotal > 0 && baseShipping === 0;
  const applied: string[] = [];

  for (const c of campaigns ?? []) {
    if (!c.aktif || !inWindow(c) || subtotal <= 0) continue;
    if (c.tip === "ucretsiz_kargo") {
      if (subtotal >= c.esik) {
        freeShipping = true;
        applied.push(c.ad);
      }
    } else if (c.tip === "kombine_indirim") {
      if (c.urun_a && c.urun_b && ids.has(c.urun_a) && ids.has(c.urun_b)) {
        const amount = c.indirim_tutar > 0 ? c.indirim_tutar : (subtotal * c.indirim_oran) / 100;
        if (amount > 0) {
          discount += amount;
          applied.push(c.ad);
        }
      }
    }
  }

  discount = Math.min(discount, subtotal);
  const shippingCost = freeShipping ? 0 : baseShipping;

  return {
    subtotal,
    shippingLabel: shipping?.firma ?? "Kargo",
    shippingCost,
    freeShipping: shippingCost === 0,
    discount,
    appliedCampaigns: applied,
    total: Math.max(0, subtotal - discount + shippingCost),
  };
}

export function useTotals(items: CartItem[]): PriceBreakdown {
  const { data: shipping } = useShipping();
  const { data: campaigns } = useCampaigns();
  return computeTotals(items, shipping, campaigns);
}
