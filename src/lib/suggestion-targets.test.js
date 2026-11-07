import { describe, expect, it } from "bun:test";
import { getSuggestionTargets } from "./suggestion-targets";

const campaign = (overrides) => ({
  id: "two", ad: "Outlet", tip: "paket_fiyat", esik: 700, min_adet: 2,
  aktif: true, oneri_goster: true, baslangic: null, bitis: null,
  hedef_tip: "kategori", hedef_kategori_ids: ["outlet"], hedef_urun_ids: [],
  kosul_tip: "tumu", kosul_kategori_ids: [], kosul_urun_ids: [],
  indirim_tutar: 0, indirim_oran: 0, max_indirim: 0,
  urun_a: null, urun_b: null, grup_a_kategori_ids: [], grup_a_urun_ids: [],
  grup_b_kategori_ids: [], grup_b_urun_ids: [], kod: null,
  uye_zorunlu: false, kullanim_limiti: 0, ...overrides,
});
const tiers = [campaign({ id: "three", min_adet: 3, esik: 900 }), campaign({})];
const item = (qty) => ({
  product_id: "outlet-product", qty, price: 400, stock: 10,
  slug: "outlet-product", name: "Outlet", image: "",
});
const cats = { "outlet-product": ["outlet"] };

describe("nearest unmet outlet tier", () => {
  it("offers only the two-product tier when two products are missing", () => {
    const result = getSuggestionTargets([{ ...item(1), product_id: "other" }], tiers, cats);
    expect(result.map((t) => [t.c.id, t.missingQuantity])).toEqual([["two", 2]]);
  });
  it("needs one more outlet product for the 700 tier with one in the cart", () => {
    expect(getSuggestionTargets([item(1)], tiers, cats).map((t) => [t.c.esik, t.missingQuantity]))
      .toEqual([[700, 1]]);
  });
  it("needs one more product for the 900 tier with two in the cart", () => {
    expect(getSuggestionTargets([item(2)], tiers, cats).map((t) => [t.c.esik, t.missingQuantity]))
      .toEqual([[900, 1]]);
  });
  it("does not suggest already met tiers with three in the cart", () => {
    expect(getSuggestionTargets([item(3)], tiers, cats)).toEqual([]);
  });
  it("groups equivalent scopes regardless of category order", () => {
    const result = getSuggestionTargets([item(1)], [
      campaign({ hedef_kategori_ids: ["outlet", "extra"] }),
      campaign({ id: "three", min_adet: 3, esik: 900, hedef_kategori_ids: ["extra", "outlet"] }),
    ], cats);
    expect(result.map((t) => t.c.id)).toEqual(["two"]);
  });
  it("keeps separate product groups separate", () => {
    expect(getSuggestionTargets([item(1)], [campaign({}), campaign({ id: "clips", hedef_kategori_ids: ["clips"] })], cats)).toHaveLength(2);
  });
  it("excludes disabled, future, expired and hidden campaigns", () => {
    expect(getSuggestionTargets([item(1)], [
      campaign({ aktif: false }), campaign({ oneri_goster: false }),
      campaign({ baslangic: "2026-11-08" }), campaign({ bitis: "2026-11-06" }),
    ], cats, Date.parse("2026-11-07"))).toEqual([]);
  });
  it("counts missing units for a two-product discount and hides it once met", () => {
    const c = campaign({ tip: "ikinci_urun", indirim_tutar: 100 });
    expect(getSuggestionTargets([item(1)], [c], cats)[0]?.missingQuantity).toBe(1);
    expect(getSuggestionTargets([item(2)], [c], cats)).toEqual([]);
  });
});