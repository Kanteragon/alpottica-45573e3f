import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { useProducts, useCategories, useBrands, useAttributes } from "@/lib/queries";
import { Search, SlidersHorizontal, X } from "lucide-react";

const searchSchema = z.object({
  tag: z.string().optional(),
  q: z.string().optional(),
  kategori: z.string().optional(),
  marka: z.string().optional(),
  renk: z.string().optional(),
  ekartman: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  ozellik: z.string().optional(),
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

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

function Products() {
  const search = Route.useSearch();
  const [query, setQuery] = useState(search.q ?? "");
  const [visible, setVisible] = useState(24);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
        const hit = Object.entries(oz).find(([k]) => norm(k) === norm(slug));
        if (!hit || String(hit[1]).toLowerCase() !== val.toLowerCase()) return false;
      }
      return true;
    });
  }, [products, activeAttrFilters]);

  const shown = list.slice(0, visible);

  const colors = useMemo(() => Array.from(new Set(products.map((p) => p.color).filter(Boolean))).sort(), [products]);
  const sizes = useMemo(() => Array.from(new Set(products.map((p) => p.size).filter(Boolean))).sort(), [products]);

  const filterableAttrs = useMemo(() => {
    const registered = attrs.filter((a) => a.filterable);
    const byNorm = new Map<string, { ad: string; slug: string; values: Set<string> }>();
    for (const a of registered) byNorm.set(norm(a.slug), { ad: a.ad, slug: a.slug, values: new Set(a.degerler ?? []) });
    const HIDE = new Set(["aciklama", "description", "url", "resim", "resimler"]);
    for (const p of products) {
      const oz = p.ozellikler ?? {};
      for (const [k, v] of Object.entries(oz)) {
        if (!v || !String(v).trim()) continue;
        const n = norm(k);
        if (HIDE.has(n)) continue;
        let entry = byNorm.get(n);
        if (!entry) {
          const regMatch = registered.find((a) => norm(a.ad) === n);
          if (regMatch) entry = byNorm.get(norm(regMatch.slug));
        }
        if (!entry) {
          entry = { ad: k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()), slug: n, values: new Set() };
          byNorm.set(n, entry);
        }
        entry.values.add(String(v));
      }
    }
    return Array.from(byNorm.values())
      .filter((x) => x.values.size > 0 && x.values.size <= 40)
      .map((x) => ({ ad: x.ad, slug: x.slug, values: Array.from(x.values).sort() }));
  }, [attrs, products]);

  const setSearchParam = (patch: Record<string, string | undefined>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) params.delete(k);
      else params.set(k, v);
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

  const activeFilterCount =
    (search.kategori ? 1 : 0) +
    (search.marka ? 1 : 0) +
    (search.renk ? 1 : 0) +
    (search.ekartman ? 1 : 0) +
    (search.min ? 1 : 0) +
    (search.max ? 1 : 0) +
    Object.keys(activeAttrFilters).length;

  // Lock body scroll while drawer open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <div className="h-20" />

      <section className="bg-brand-sand/40 border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-14">
          <p className="text-xs tracking-[0.4em] text-muted-foreground mb-2 sm:mb-3">KOLEKSİYON</p>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl text-brand-ink mb-3 sm:mb-6">Alpottica Modelleri</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">
            {isLoading ? "Yükleniyor..." : `${list.length} ürün · Polarize, antifar ve klipsli seçenekler.`}
          </p>
        </div>
      </section>

      {/* Compact top bar */}
      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center gap-2 sm:gap-3">
          {/* Horizontal scroll category chips */}
          <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 w-max">
              <a href="/urunler" className={`px-4 py-2 text-[11px] tracking-[0.2em] rounded-full border shrink-0 transition ${!search.tag ? "bg-brand-ink text-white border-brand-ink" : "border-border text-brand-ink bg-white"}`}>TÜM</a>
              <a href="/urunler?tag=klipsli" className={`px-4 py-2 text-[11px] tracking-[0.2em] rounded-full border shrink-0 transition ${search.tag === "klipsli" ? "bg-brand-ink text-white border-brand-ink" : "border-border text-brand-ink bg-white"}`}>KLİPSLİ</a>
              <a href="/urunler?tag=outlet" className={`px-4 py-2 text-[11px] tracking-[0.2em] rounded-full border shrink-0 transition ${search.tag === "outlet" ? "bg-brand-ink text-white border-brand-ink" : "border-border text-brand-ink bg-white"}`}>OUTLET</a>
              {cats?.slice(0, 6).map((c) => (
                <a
                  key={c.id}
                  href={`/urunler?kategori=${c.id}`}
                  className={`px-4 py-2 text-[11px] tracking-[0.2em] rounded-full border shrink-0 transition uppercase ${search.kategori === c.id ? "bg-brand-ink text-white border-brand-ink" : "border-border text-brand-ink bg-white"}`}
                >
                  {c.name}
                </a>
              ))}
            </div>
          </div>

          <button
            onClick={() => setDrawerOpen(true)}
            className="shrink-0 relative flex items-center gap-2 px-4 py-2 rounded-full border border-brand-ink text-brand-ink text-xs tracking-widest bg-white hover:bg-brand-ink hover:text-white transition"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="hidden sm:inline">FİLTRELE</span>
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-brand-cta text-white text-[10px] flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>

        {/* Search */}
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pb-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setVisible(24); }}
              placeholder="Ürün ara..."
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-full border border-border bg-white focus:outline-none focus:border-brand-ink"
            />
          </div>
        </div>
      </div>

      {/* Grid */}
      <section className="max-w-[1600px] mx-auto px-3 sm:px-6 lg:px-10 py-8 sm:py-12">
        {shown.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            {isLoading ? "Yükleniyor..." : "Sonuç bulunamadı."}
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
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

      {/* Filter Drawer: bottom sheet on mobile, right panel on desktop */}
      {drawerOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/50 animate-in fade-in"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[420px] bg-white shadow-2xl rounded-t-3xl sm:rounded-none flex flex-col max-h-[90vh] sm:max-h-none animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
            {/* Handle bar on mobile */}
            <div className="sm:hidden pt-2 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-border" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-display text-xl text-brand-ink">Filtrele</h2>
              <button
                onClick={() => setDrawerOpen(false)}
                aria-label="Kapat"
                className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-brand-sand/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              <FilterField label="Kategori">
                <select value={search.kategori ?? ""} onChange={(e) => setSearchParam({ kategori: e.target.value || undefined })} className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm">
                  <option value="">Tümü</option>
                  {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FilterField>

              <FilterField label="Marka">
                <select value={search.marka ?? ""} onChange={(e) => setSearchParam({ marka: e.target.value || undefined })} className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm">
                  <option value="">Tümü</option>
                  {brands?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </FilterField>

              {colors.length > 0 && (
                <FilterField label="Çerçeve Rengi">
                  <select value={search.renk ?? ""} onChange={(e) => setSearchParam({ renk: e.target.value || undefined })} className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm">
                    <option value="">Tümü</option>
                    {colors.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </FilterField>
              )}

              {sizes.length > 0 && (
                <FilterField label="Ekartman">
                  <select value={search.ekartman ?? ""} onChange={(e) => setSearchParam({ ekartman: e.target.value || undefined })} className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm">
                    <option value="">Tümü</option>
                    {sizes.map((s) => <option key={s} value={s}>{s} mm</option>)}
                  </select>
                </FilterField>
              )}

              <FilterField label="Fiyat Aralığı (₺)">
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" defaultValue={search.min ?? ""} onBlur={(e) => setSearchParam({ min: e.target.value || undefined })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
                  <input type="number" placeholder="Max" defaultValue={search.max ?? ""} onBlur={(e) => setSearchParam({ max: e.target.value || undefined })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
                </div>
              </FilterField>

              {filterableAttrs.map((attr) => (
                <FilterField key={attr.slug} label={attr.ad}>
                  <div className="flex flex-wrap gap-2">
                    {attr.values.slice(0, 30).map((v) => {
                      const active = activeAttrFilters[attr.slug]?.toLowerCase() === v.toLowerCase();
                      return (
                        <button
                          key={v}
                          onClick={() => toggleAttrFilter(attr.slug, v)}
                          className={`px-3 py-1.5 rounded-full border text-xs transition ${active ? "bg-brand-ink text-white border-brand-ink" : "bg-white border-border text-brand-ink hover:border-brand-ink"}`}
                        >
                          {v}
                        </button>
                      );
                    })}
                  </div>
                </FilterField>
              ))}
            </div>

            {/* Sticky footer */}
            <div className="border-t border-border p-4 flex gap-3 bg-white">
              <a
                href="/urunler"
                className="flex-1 text-center px-4 py-3 rounded-full border border-border text-brand-ink text-xs tracking-widest hover:bg-brand-sand/40 transition"
              >
                TEMİZLE
              </a>
              <button
                onClick={() => setDrawerOpen(false)}
                className="flex-[2] px-4 py-3 rounded-full bg-brand-ink text-white text-xs tracking-widest hover:bg-brand-ink/90 transition"
              >
                UYGULA{list.length ? ` (${list.length})` : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground mb-2">{label}</p>
      {children}
    </div>
  );
}
