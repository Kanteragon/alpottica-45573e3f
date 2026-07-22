import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, useCategories, useBrands, useAttributes } from "@/lib/queries";
import { Search, Filter, X } from "lucide-react";

const searchSchema = z.object({
  tag: z.string().optional(),
  q: z.string().optional(),
  kategori: z.string().optional(),
  marka: z.string().optional(),
  renk: z.string().optional(),
  ekartman: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  ozellik: z.string().optional(), // "slug:value|slug2:value2"
});

export const Route = createFileRoute("/urunler")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Tüm Ürünler — Alpottica Istanbul" },
      { name: "description", content: "Alpottica'nın tüm güneş gözlüğü ve klipsli modelleri." },
      { property: "og:title", content: "Ürünler — Alpottica" },
      { property: "og:description", content: "Alpottica'nın tüm güneş gözlüğü ve klipsli modelleri." },
    ],
  }),
  component: Products,
});

function Products() {
  const search = Route.useSearch();
  const [query, setQuery] = useState(search.q ?? "");
  const [visible, setVisible] = useState(24);

  const { data: cats } = useCategories();
  const { data: brands } = useBrands();
  const { data: attrs = [] } = useAttributes();

  const { data: products = [], isLoading } = useProducts({
    tag: search.tag,
    q: query,
    kategori_id: search.kategori,
    marka_id: search.marka,
    color: search.renk,
    size: search.ekartman,
    minPrice: search.min,
    maxPrice: search.max,
  });

  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

  // Parse "slug:value|slug:value" search param
  const activeAttrFilters = useMemo(() => {
    const out: Record<string, string> = {};
    if (!search.ozellik) return out;
    for (const chunk of search.ozellik.split("|")) {
      const [k, v] = chunk.split(":");
      if (k && v) out[k] = v;
    }
    return out;
  }, [search.ozellik]);

  const list = useMemo(() => {
    return products.filter((p) => {
      if (p.stock <= 0) return false;
      for (const [slug, val] of Object.entries(activeAttrFilters)) {
        const oz = p.ozellikler ?? {};
        // find matching key by slug or normalized ad
        const hit = Object.entries(oz).find(([k]) => norm(k) === norm(slug));
        if (!hit || String(hit[1]).toLowerCase() !== val.toLowerCase()) return false;
      }
      return true;
    });
  }, [products, activeAttrFilters]);

  const shown = list.slice(0, visible);

  const colors = useMemo(() => Array.from(new Set(products.map((p) => p.color).filter(Boolean))).sort(), [products]);
  const sizes = useMemo(() => Array.from(new Set(products.map((p) => p.size).filter(Boolean))).sort(), [products]);

  // Dynamic filterable attribute values pulled from ALL products' ozellikler
  const filterableAttrs = useMemo(() => {
    const filterable = attrs.filter((a) => a.filterable);
    return filterable.map((a) => {
      const values = new Set<string>();
      for (const p of products) {
        const oz = p.ozellikler ?? {};
        for (const [k, v] of Object.entries(oz)) {
          if (norm(k) === norm(a.slug) || norm(k) === norm(a.ad)) {
            if (v && String(v).trim()) values.add(String(v));
          }
        }
      }
      // include any predefined degerler too
      for (const d of a.degerler ?? []) values.add(d);
      return { attr: a, values: Array.from(values).sort() };
    }).filter((x) => x.values.length > 0);
  }, [attrs, products]);

  const setSearchParam = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) params.delete(k); else params.set(k, v);
    });
    window.location.search = params.toString();
  };

  const toggleAttrFilter = (slug: string, value: string) => {
    const next = { ...activeAttrFilters };
    if (next[slug] === value) delete next[slug];
    else next[slug] = value;
    const enc = Object.entries(next).map(([k, v]) => `${k}:${v}`).join("|");
    setSearchParam({ ozellik: enc || undefined });
  };

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <div className="h-20" />

      <section className="bg-brand-sand/40 border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-14">
          <p className="text-xs tracking-[0.4em] text-muted-foreground mb-3">KOLEKSİYON</p>
          <h1 className="font-display text-5xl md:text-7xl text-brand-ink mb-6">Alpottica Modelleri</h1>
          <p className="text-muted-foreground max-w-2xl">
            {isLoading ? "Yükleniyor..." : `${list.length} ürün · Polarize, antifar ve klipsli seçenekler.`}
          </p>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-6 sticky top-20 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="flex flex-wrap gap-2">
            <a href="/urunler" className={`px-5 py-2.5 text-xs tracking-[0.2em] rounded-full border transition ${!search.tag ? "bg-brand-ink text-white border-brand-ink" : "border-border text-brand-ink"}`}>TÜM MODELLER</a>
            <a href="/urunler?tag=klipsli" className={`px-5 py-2.5 text-xs tracking-[0.2em] rounded-full border transition ${search.tag === "klipsli" ? "bg-brand-ink text-white border-brand-ink" : "border-border text-brand-ink"}`}>KLİPSLİ</a>
            <a href="/urunler?tag=outlet" className={`px-5 py-2.5 text-xs tracking-[0.2em] rounded-full border transition ${search.tag === "outlet" ? "bg-brand-ink text-white border-brand-ink" : "border-border text-brand-ink"}`}>OUTLET</a>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setVisible(24); }}
              placeholder="Ürün ara..."
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-full border border-border bg-white focus:outline-none focus:border-brand-ink"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4 text-xs items-center">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select value={search.kategori ?? ""} onChange={(e) => setSearchParam({ kategori: e.target.value || undefined })} className="border border-border rounded-full px-3 py-1.5 bg-white">
            <option value="">Tüm Kategoriler</option>
            {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={search.marka ?? ""} onChange={(e) => setSearchParam({ marka: e.target.value || undefined })} className="border border-border rounded-full px-3 py-1.5 bg-white">
            <option value="">Tüm Markalar</option>
            {brands?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <select value={search.renk ?? ""} onChange={(e) => setSearchParam({ renk: e.target.value || undefined })} className="border border-border rounded-full px-3 py-1.5 bg-white">
            <option value="">Tüm Renkler</option>
            {colors.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={search.ekartman ?? ""} onChange={(e) => setSearchParam({ ekartman: e.target.value || undefined })} className="border border-border rounded-full px-3 py-1.5 bg-white">
            <option value="">Tüm Ekartmanlar</option>
            {sizes.map((s) => <option key={s} value={s}>{s} mm</option>)}
          </select>
          <input type="number" placeholder="Min ₺" value={search.min ?? ""} onChange={(e) => setSearchParam({ min: e.target.value || undefined })} className="w-24 border border-border rounded-full px-3 py-1.5 bg-white" />
          <input type="number" placeholder="Max ₺" value={search.max ?? ""} onChange={(e) => setSearchParam({ max: e.target.value || undefined })} className="w-24 border border-border rounded-full px-3 py-1.5 bg-white" />
          {(search.kategori || search.marka || search.renk || search.ekartman || search.min || search.max) && (
            <a href="/urunler" className="text-brand-cta underline">Filtreleri temizle</a>
          )}
        </div>
      </div>

      <section className="max-w-[1600px] mx-auto px-6 lg:px-10 py-12">
        {shown.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            {isLoading ? "Yükleniyor..." : "Sonuç bulunamadı."}
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
            {shown.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        )}

        {visible < list.length && (
          <div className="text-center mt-14">
            <button
              onClick={() => setVisible((v) => v + 24)}
              className="px-8 py-3 rounded-full border border-brand-ink text-brand-ink text-sm tracking-widest hover:bg-brand-ink hover:text-white transition"
            >
              DAHA FAZLA GÖSTER ({list.length - visible})
            </button>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}
