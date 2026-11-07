import type { CartItem } from "@/lib/cart";
import type { Campaign, CategoryMap } from "@/lib/pricing";

export type SuggestionScope = { tip: string; cats: string[]; prods: string[] };
export type SuggestionTarget = {
  c: Campaign;
  scope: SuggestionScope;
  gap?: number;
  missingQuantity?: number;
};

function scopeOf(tip: string, cats: string[] | null, prods: string[] | null): SuggestionScope {
  return { tip: tip || "tumu", cats: cats ?? [], prods: prods ?? [] };
}

function inScope(productId: string, catMap: CategoryMap, s: SuggestionScope) {
  if (s.tip === "kategori") return (catMap[productId] ?? []).some((c) => s.cats.includes(c));
  if (s.tip === "urun") return s.prods.includes(productId);
  return true;
}

function scopeKey(s: SuggestionScope) {
  const ids = s.tip === "kategori" ? s.cats : s.tip === "urun" ? s.prods : [];
  return `${s.tip}:${[...new Set(ids)].sort().join("|")}`;
}

/** Select the nearest unmet tier once per product scope. Never use campaign names as group keys. */
export function getSuggestionTargets(
  items: CartItem[], campaigns: Campaign[], catMap: CategoryMap, now = Date.now(),
): SuggestionTarget[] {
  if (items.length === 0) return [];
  const targets: SuggestionTarget[] = [];
  const packages = new Map<string, SuggestionTarget>();
  const subtotal = items.reduce((n, i) => n + i.price * i.qty, 0);
  for (const c of campaigns) {
    if (!c.aktif || c.oneri_goster === false ||
      (c.baslangic && new Date(c.baslangic).getTime() > now) ||
      (c.bitis && new Date(c.bitis).getTime() < now)) continue;
    if ((c.tip === "sepet_indirim" || c.tip === "ucretsiz_kargo") && Number(c.esik) > subtotal) {
      targets.push({
        c,
        scope: c.tip === "sepet_indirim"
          ? scopeOf(c.hedef_tip, c.hedef_kategori_ids, c.hedef_urun_ids)
          : scopeOf("tumu", null, null),
        gap: Math.ceil(Number(c.esik) - subtotal),
      });
    } else if (c.tip === "paket_fiyat") {
      const scope = scopeOf(c.hedef_tip, c.hedef_kategori_ids, c.hedef_urun_ids);
      const quantity = items.filter((i) => inScope(i.product_id, catMap, scope))
        .reduce((n, i) => n + i.qty, 0);
      const missingQuantity = c.min_adet - quantity;
      if (c.min_adet < 2 || missingQuantity <= 0 || Number(c.esik) <= 0) continue;
      const key = scopeKey(scope);
      const previous = packages.get(key);
      if (!previous || missingQuantity < (previous.missingQuantity ?? Infinity) ||
        (missingQuantity === previous.missingQuantity && Number(c.esik) < Number(previous.c.esik))) {
        packages.set(key, { c, scope, missingQuantity });
      }
    } else if (c.tip === "ikinci_urun") {
      const condition = scopeOf(c.kosul_tip, c.kosul_kategori_ids, c.kosul_urun_ids);
      const target = scopeOf(c.hedef_tip, c.hedef_kategori_ids, c.hedef_urun_ids);
      const hasCondition = items.some((i) => inScope(i.product_id, catMap, condition));
      const hasTarget = items.some((i) => inScope(i.product_id, catMap, target));
      const quantity = items.filter((i) => inScope(i.product_id, catMap, condition) || inScope(i.product_id, catMap, target))
        .reduce((n, i) => n + i.qty, 0);
      const missingQuantity = Math.max(2, c.min_adet || 2) - quantity;
      if (hasCondition && hasTarget && missingQuantity <= 0) continue;
      targets.push({ c, scope: hasCondition ? target : condition, missingQuantity: Math.max(1, missingQuantity) });
    } else if (c.tip === "kombine_indirim") {
      const a = scopeOf(c.grup_a_kategori_ids?.length ? "kategori" : "urun",
        c.grup_a_kategori_ids, [...(c.grup_a_urun_ids ?? []), ...(c.urun_a ? [c.urun_a] : [])]);
      const b = scopeOf(c.grup_b_kategori_ids?.length ? "kategori" : "urun",
        c.grup_b_kategori_ids, [...(c.grup_b_urun_ids ?? []), ...(c.urun_b ? [c.urun_b] : [])]);
      const hasA = items.some((i) => inScope(i.product_id, catMap, a));
      const hasB = items.some((i) => inScope(i.product_id, catMap, b));
      if (hasA && !hasB) targets.push({ c, scope: b });
      else if (hasB && !hasA) targets.push({ c, scope: a });
      else if (!hasA && !hasB) targets.push({ c, scope: a });
    }
  }
  return [...targets, ...packages.values()];
}

export function suggestionMessage(target: SuggestionTarget, scopeLabel: string, discount: string) {
  const { c, gap, missingQuantity } = target;
  const quantity = missingQuantity === 1 ? "bir" : String(missingQuantity);
  if (c.tip === "paket_fiyat") {
    return `Sepetinize ${quantity} ürün daha eklediğinizde ${c.min_adet} ürünün toplam fiyatı ${Math.round(Number(c.esik))} ₺ olur.`;
  }
  if (gap) return `Sepetinize ${gap} ₺ tutarında ürün daha eklediğinizde ${discount} kazanırsınız.`;
  if (missingQuantity) return `${scopeLabel} arasından sepetinize ${quantity} ürün daha eklediğinizde ${discount} kazanırsınız.`;
  if (c.tip === "kombine_indirim") return `${scopeLabel} arasından sepetinize bir ürün ekleyerek birlikte alım kampanyasına yaklaşabilirsiniz.`;
  return `${scopeLabel} arasından sepetinize bir ürün daha eklediğinizde ${discount} kazanırsınız.`;
}