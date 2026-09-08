import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbProduct, type DbProduct, type Product } from "@/lib/products";
import type { CartItem } from "@/lib/cart";
import {
  useCampaigns,
  useCartCategoryMap,
  type Campaign,
  type CategoryMap,
} from "@/lib/pricing";

export type SuggestionGroup = {
  campaignId: string;
  campaignName: string;
  /** "Klipsli Modeller" gibi hedef grubun adı */
  scopeLabel: string;
  discountLabel: string;
  products: Product[];
};

type Scope = { tip: string; cats: string[]; prods: string[] };

function scopeOf(tip: string, cats: string[] | null, prods: string[] | null): Scope {
  return { tip: tip || "tumu", cats: cats ?? [], prods: prods ?? [] };
}

function inScope(productId: string, catMap: CategoryMap, s: Scope) {
  if (s.tip === "tumu") return true;
  if (s.tip === "kategori") return (catMap[productId] ?? []).some((c) => s.cats.includes(c));
  if (s.tip === "urun") return s.prods.includes(productId);
  return true;
}

function discountLabel(c: Campaign) {
  if (Number(c.indirim_tutar) > 0) return `${Math.round(Number(c.indirim_tutar))} ₺ indirim`;
  if (Number(c.indirim_oran) > 0) return `%${Math.round(Number(c.indirim_oran))} indirim`;
  return "ekstra indirim";
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Sepet içeriğine göre "şunu da eklersen şu indirim" kombinasyonları */
export function useCartSuggestions(items: CartItem[], limitPerGroup = 6) {
  const { data: campaigns = [] } = useCampaigns();
  const { data: catMap = {} } = useCartCategoryMap(items);

  // hangi kampanya için hangi hedef scope önerilecek
  const targets: { c: Campaign; scope: Scope }[] = [];
  if (items.length > 0) {
    for (const c of campaigns) {
      if (!c.aktif || c.oneri_goster === false) continue;
      if (c.tip === "ikinci_urun") {
        const kosul = scopeOf(c.kosul_tip, c.kosul_kategori_ids, c.kosul_urun_ids);
        const hedef = scopeOf(c.hedef_tip, c.hedef_kategori_ids, c.hedef_urun_ids);
        if (items.some((i) => inScope(i.product_id, catMap, kosul))) {
          targets.push({ c, scope: hedef });
        }
      } else if (c.tip === "kombine_indirim") {
        const a = scopeOf(
          (c.grup_a_kategori_ids?.length ?? 0) > 0 ? "kategori" : "urun",
          c.grup_a_kategori_ids,
          [...(c.grup_a_urun_ids ?? []), ...(c.urun_a ? [c.urun_a] : [])],
        );
        const b = scopeOf(
          (c.grup_b_kategori_ids?.length ?? 0) > 0 ? "kategori" : "urun",
          c.grup_b_kategori_ids,
          [...(c.grup_b_urun_ids ?? []), ...(c.urun_b ? [c.urun_b] : [])],
        );
        const hasA = items.some((i) => inScope(i.product_id, catMap, a));
        const hasB = items.some((i) => inScope(i.product_id, catMap, b));
        if (hasA && !hasB) targets.push({ c, scope: b });
        else if (hasB && !hasA) targets.push({ c, scope: a });
      }
    }
  }

  const inCart = items.map((i) => i.product_id);
  const key = targets
    .map((t) => `${t.c.id}:${t.scope.tip}:${t.scope.cats.join("|")}:${t.scope.prods.join("|")}`)
    .join(";");

  return useQuery({
    queryKey: ["cart-suggestions", key, inCart.sort().join(",")],
    enabled: targets.length > 0,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<SuggestionGroup[]> => {
      // gerekli kategori adları
      const allCatIds = Array.from(new Set(targets.flatMap((t) => t.scope.cats)));
      const catNames: Record<string, string> = {};
      if (allCatIds.length > 0) {
        const { data } = await supabase.from("categories").select("id,name").in("id", allCatIds);
        for (const c of data ?? []) catNames[c.id] = c.name;
      }

      const groups: SuggestionGroup[] = [];
      for (const { c, scope } of targets) {
        let ids: string[] | null = null;
        if (scope.tip === "urun") {
          ids = scope.prods.filter((p) => !inCart.includes(p));
          if (ids.length === 0) continue;
        } else if (scope.tip === "kategori") {
          if (scope.cats.length === 0) continue;
          const [junction, direct] = await Promise.all([
            supabase.from("product_categories").select("product_id").in("category_id", scope.cats).limit(400),
            supabase.from("products").select("id").in("kategori_id", scope.cats).limit(400),
          ]);
          const set = new Set<string>();
          for (const r of junction.data ?? []) set.add(r.product_id);
          for (const r of direct.data ?? []) set.add(r.id);
          ids = Array.from(set).filter((p) => !inCart.includes(p));
          if (ids.length === 0) continue;
        }

        let q = supabase
          .from("products")
          .select("id,slug,stok_kodu,urun_adi,aciklama,satis_fiyati,liste_fiyati,stok_adedi,resimler,ozellikler,etiketler,kategori_id,marka_id,variant_group_id")
          .eq("aktif", true)
          .gt("stok_adedi", 0)
          .limit(60);
        if (ids) q = q.in("id", shuffle(ids).slice(0, 60));
        else q = q.not("id", "in", `(${inCart.join(",") || "00000000-0000-0000-0000-000000000000"})`);

        const { data } = await q;
        const products = shuffle(((data ?? []) as unknown as DbProduct[]).map(mapDbProduct))
          .filter((p) => !inCart.includes(p.id))
          .slice(0, limitPerGroup);
        if (products.length === 0) continue;

        const scopeLabel =
          scope.tip === "kategori"
            ? scope.cats.map((id) => catNames[id]).filter(Boolean).join(", ")
            : scope.tip === "urun"
              ? "Seçili ürünler"
              : "Tüm modeller";

        groups.push({
          campaignId: c.id,
          campaignName: c.ad,
          scopeLabel: scopeLabel || "Tüm modeller",
          discountLabel: discountLabel(c),
          products,
        });
      }
      return groups;
    },
  });
}
