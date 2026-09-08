import { useEffect, useState } from "react";
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
  kod: string | null;
  min_adet: number;
  max_indirim: number;
  hedef_tip: string;
  hedef_kategori_ids: string[];
  hedef_urun_ids: string[];
  grup_a_kategori_ids: string[];
  grup_a_urun_ids: string[];
  grup_b_kategori_ids: string[];
  grup_b_urun_ids: string[];
  kosul_tip: string;
  kosul_kategori_ids: string[];
  kosul_urun_ids: string[];
  uye_zorunlu: boolean;
  kullanim_limiti: number;
  oneri_goster: boolean;
};

/** product_id -> kategori id listesi */
export type CategoryMap = Record<string, string[]>;

export const CAMPAIGN_TYPES: { value: string; label: string }[] = [
  { value: "ucretsiz_kargo", label: "Ücretsiz Kargo (sepet tutarı eşiği)" },
  { value: "sepet_indirim", label: "Sepet İndirimi (eşik üzerinde otomatik)" },
  { value: "ikinci_urun", label: "2. Ürüne İndirim (X adet alana)" },
  { value: "kombine_indirim", label: "Kombine İndirim (iki ürün birlikte)" },
  { value: "kupon", label: "İndirim Kodu (kupon)" },
];

export function campaignTypeLabel(tip: string) {
  return CAMPAIGN_TYPES.find((t) => t.value === tip)?.label ?? tip;
}

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
        min_adet: Number((c as { min_adet?: number }).min_adet ?? 2),
        max_indirim: Number((c as { max_indirim?: number }).max_indirim ?? 0),
        kod: ((c as { kod?: string | null }).kod ?? null),
        kosul_tip: ((c as { kosul_tip?: string }).kosul_tip ?? "tumu"),
        kosul_kategori_ids: ((c as { kosul_kategori_ids?: string[] }).kosul_kategori_ids ?? []),
        kosul_urun_ids: ((c as { kosul_urun_ids?: string[] }).kosul_urun_ids ?? []),
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
  couponError: string | null;
};

function capped(amount: number, c: Campaign) {
  return c.max_indirim > 0 ? Math.min(amount, c.max_indirim) : amount;
}

function matches(
  productId: string,
  catMap: CategoryMap,
  kategoriIds: string[] | undefined,
  urunIds: string[] | undefined,
) {
  const cats = catMap[productId] ?? [];
  if ((kategoriIds ?? []).some((k) => cats.includes(k))) return true;
  if ((urunIds ?? []).includes(productId)) return true;
  return false;
}

function inKosul(item: CartItem, c: Campaign, catMap: CategoryMap) {
  const tip = c.kosul_tip || "tumu";
  if (tip === "tumu") return true;
  if (tip === "kategori") return matches(item.product_id, catMap, c.kosul_kategori_ids, []);
  if (tip === "urun") return matches(item.product_id, catMap, [], c.kosul_urun_ids);
  return true;
}

function inScope(item: CartItem, c: Campaign, catMap: CategoryMap) {
  if (!c.hedef_tip || c.hedef_tip === "tumu") return true;
  if (c.hedef_tip === "kategori") return matches(item.product_id, catMap, c.hedef_kategori_ids, []);
  if (c.hedef_tip === "urun") return matches(item.product_id, catMap, [], c.hedef_urun_ids);
  return true;
}

export function computeTotals(
  items: CartItem[],
  shipping: Shipping | undefined,
  campaigns: Campaign[] | undefined,
  couponCode?: string,
  catMap: CategoryMap = {},
): PriceBreakdown {
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  const baseShipping = shipping?.aktif ? Number(shipping.ucret) || 0 : 0;
  const unitsOf = (list: CartItem[]) =>
    list.flatMap((i) => Array.from({ length: Math.max(0, i.qty) }, () => i.price)).sort((a, b) => a - b);
  const code = (couponCode ?? "").trim().toLowerCase();
  let couponError: string | null = code ? "Geçersiz indirim kodu" : null;

  let discount = 0;
  let freeShipping = subtotal > 0 && baseShipping === 0;
  const applied: string[] = [];

  for (const c of campaigns ?? []) {
    if (!c.aktif || !inWindow(c) || subtotal <= 0) continue;
    const scoped = items.filter((i) => inScope(i, c, catMap));
    const scopedSubtotal = scoped.reduce((n, i) => n + i.price * i.qty, 0);
    if (c.tip === "ucretsiz_kargo") {
      if (subtotal >= c.esik) {
        freeShipping = true;
        applied.push(c.ad);
      }
    } else if (c.tip === "sepet_indirim") {
      if (subtotal >= c.esik && scopedSubtotal > 0) {
        const amount = capped(c.indirim_tutar > 0 ? c.indirim_tutar : (scopedSubtotal * c.indirim_oran) / 100, c);
        if (amount > 0) { discount += amount; applied.push(c.ad); }
      }
    } else if (c.tip === "ikinci_urun") {
      const need = Math.max(2, c.min_adet || 2);
      // koşul grubu (sepette bulunması gereken ürünler) ile indirim grubu ayrı değerlendirilir
      const kosulItems = items.filter((i) => inKosul(i, c, catMap));
      const unionItems = Array.from(new Set([...kosulItems, ...scoped]));
      const unionUnits = unionItems.reduce((n, i) => n + Math.max(0, i.qty), 0);
      const targetUnits = unitsOf(scoped);
      if (kosulItems.length > 0 && targetUnits.length > 0 && unionUnits >= need) {
        const sets = Math.min(Math.floor(unionUnits / need), targetUnits.length);
        let amount = 0;
        for (let s = 0; s < sets; s++) {
          const unit = targetUnits[s] ?? 0;
          amount += c.indirim_tutar > 0 ? Math.min(c.indirim_tutar, unit) : (unit * c.indirim_oran) / 100;
        }
        amount = capped(amount, c);
        if (amount > 0) { discount += amount; applied.push(c.ad); }
      }
    } else if (c.tip === "kupon") {
      if (!c.kod || !code || c.kod.trim().toLowerCase() !== code) continue;
      if (subtotal < c.esik) {
        couponError = `Bu kod en az ${c.esik} ₺ sepet tutarında geçerli`;
        continue;
      }
      const base = c.hedef_tip && c.hedef_tip !== "tumu" ? scopedSubtotal : subtotal;
      if (base <= 0) { couponError = "Bu kod sepetinizdeki ürünler için geçerli değil"; continue; }
      const amount = capped(c.indirim_tutar > 0 ? c.indirim_tutar : (base * c.indirim_oran) / 100, c);
      couponError = null;
      if (amount > 0) { discount += amount; applied.push(c.ad); }
      else { freeShipping = true; applied.push(c.ad); }
    } else if (c.tip === "kombine_indirim") {
      const aList = [...(c.grup_a_urun_ids ?? []), ...(c.urun_a ? [c.urun_a] : [])];
      const bList = [...(c.grup_b_urun_ids ?? []), ...(c.urun_b ? [c.urun_b] : [])];
      const aItems = items.filter((i) => matches(i.product_id, catMap, c.grup_a_kategori_ids, aList));
      const bItems = items.filter((i) => matches(i.product_id, catMap, c.grup_b_kategori_ids, bList));
      const hasA = aItems.length > 0;
      const hasB = bItems.length > 0;
      const distinct = aItems.some((a) => bItems.some((b) => b.product_id !== a.product_id)) || aItems.some((a) => a.qty > 1);
      if (hasA && hasB && distinct) {
        const base = [...new Set([...aItems, ...bItems])].reduce((n, i) => n + i.price * i.qty, 0);
        const amount = capped(c.indirim_tutar > 0 ? c.indirim_tutar : (base * c.indirim_oran) / 100, c);
        if (amount > 0) { discount += amount; applied.push(c.ad); }
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
    couponError,
  };
}

const COUPON_KEY = "alpottica_kupon";

export function useCoupon() {
  const [code, setCode] = useState("");
  useEffect(() => {
    try { setCode(localStorage.getItem(COUPON_KEY) ?? ""); } catch { /* ignore */ }
  }, []);
  const apply = (v: string) => {
    setCode(v);
    try { localStorage.setItem(COUPON_KEY, v); } catch { /* ignore */ }
  };
  return { code, apply, clear: () => apply("") };
}

export function useCartCategoryMap(items: CartItem[]) {
  const ids = items.map((i) => i.product_id).sort();
  return useQuery({
    queryKey: ["cart-cats", ids.join(",")],
    enabled: ids.length > 0,
    queryFn: async (): Promise<CategoryMap> => {
      const map: CategoryMap = {};
      const [pc, pr] = await Promise.all([
        supabase.from("product_categories").select("product_id,category_id").in("product_id", ids),
        supabase.from("products").select("id,kategori_id").in("id", ids),
      ]);
      for (const r of pc.data ?? []) {
        (map[r.product_id] ??= []).push(r.category_id);
      }
      for (const r of pr.data ?? []) {
        if (r.kategori_id) (map[r.id] ??= []).push(r.kategori_id);
      }
      return map;
    },
  });
}

export function useTotals(items: CartItem[]): PriceBreakdown {
  const { data: shipping } = useShipping();
  const { data: campaigns } = useCampaigns();
  const { data: catMap } = useCartCategoryMap(items);
  const { code } = useCoupon();
  return computeTotals(items, shipping, campaigns, code, catMap ?? {});
}
