import { createFileRoute, useNavigate } from "@tanstack/react-router";
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
  min: z.number().optional(),
  max: z.number().optional(),
  ozellik: z.string().optional(),
});

export const Route = createFileRoute("/urunler")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Tüm Modeller | Klipsli ve Güneş Gözlüğü — Alpottica Istanbul" },
      {
        name: "description",
        content:
          "Alpottica Istanbul klipsli modeller, polarize güneş gözlükleri ve outlet fırsatları. Kapıda ödeme ve şeffaf kargo ile hemen sipariş verin.",
      },
      {
        name: "keywords",
        content: "klipsli modeller, klipsli gözlük, güneş gözlüğü modelleri, polarize gözlük, outlet gözlük, alpottica",
      },
      { property: "og:title", content: "Tüm Modeller — Alpottica Istanbul" },
      {
        property: "og:description",
        content: "Klipsli modeller, polarize güneş gözlükleri ve outlet fırsatları — Alpottica Istanbul.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://alpottica.lovable.app/urunler" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://alpottica.lovable.app/urunler" }],
  }),
  component: Products,
});

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

/** Türkçe uyumlu büyük harf (i → İ, ı → I) */
const trUpper = (s: string) => s.replace(/i/g, "İ").replace(/ı/g, "I").toUpperCase();

const TAG_LABELS: Record<string, string> = {
  tumu: "Tüm Modeller",
  tümü: "Tüm Modeller",
  klipsli: "Klipsli Modeller",
  outlet: "Outlet Modeller",
};

type AttrFilters = Record<string, string[]>;

function decodeAttrs(raw?: string): AttrFilters {
  const out: AttrFilters = {};
  if (!raw) return out;
  for (const chunk of raw.split("|")) {
    const idx = chunk.indexOf(":");
    if (idx <= 0) continue;
    const k = chunk.slice(0, idx);
    const vals = chunk.slice(idx + 1).split("~").filter(Boolean);
    if (vals.length) out[k] = vals;
  }
  return out;
}

function encodeAttrs(f: AttrFilters): string | undefined {
  const enc = Object.entries(f)
    .filter(([, v]) => v.length > 0)
    .map(([k, v]) => `${k}:${v.join("~")}`)
    .join("|");
  return enc || undefined;
}

function Products() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/urunler" });
  const [query, setQuery] = useState(search.q ?? "");
  const [visible, setVisible] = useState(24);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // URL'deki arama terimi değişince (navbar aramasından Enter ile gelince) listeyi güncelle
  useEffect(() => {
    setQuery(search.q ?? "");
    setVisible(24);
  }, [search.q]);


  const { data: cats } = useCategories();
  const { data: brands } = useBrands();
  const { data: attrs = [] } = useAttributes();

  const activeAttrFilters = useMemo(() => decodeAttrs(search.ozellik), [search.ozellik]);

  // Products scoped by category/brand/price (not by attributes) — used for filter option pools
  const { data: products = [], isLoading } = useProducts({
    tag: search.tag,
    q: query,
    kategori_id: search.kategori,
    marka_id: search.marka,
    minPrice: search.min,
    maxPrice: search.max,
  });

  const inStock = useMemo(() => products.filter((p) => p.stock > 0), [products]);

  const matches = (p: (typeof inStock)[number], filters: AttrFilters) => {
    for (const [slug, vals] of Object.entries(filters)) {
      if (!vals.length) continue;
      const oz = p.ozellikler ?? {};
      const hit = Object.entries(oz).find(([k]) => norm(k) === norm(slug));
      if (!hit) return false;
      const cur = String(hit[1]).toLowerCase();
      if (!vals.some((v) => v.toLowerCase() === cur)) return false;
    }
    return true;
  };

  const list = useMemo(
    () => inStock.filter((p) => matches(p, activeAttrFilters)),
    [inStock, activeAttrFilters],
  );

  const shown = list.slice(0, visible);

  // Filter option pool: only attributes/values present in in-stock products of the current category
  const filterableAttrs = useMemo(() => {
    const registered = attrs.filter((a) => a.filterable);
    const labelBy = new Map<string, string>();
    for (const a of registered) {
      labelBy.set(norm(a.slug), a.ad);
      labelBy.set(norm(a.ad), a.ad);
    }
    const HIDE = new Set(["aciklama", "description", "url", "resim", "resimler", "stok", "stok_kodu", "barkod"]);
    // Attributes explicitly marked as non-filterable in settings must never appear
    for (const a of attrs) {
      if (a.filterable) continue;
      HIDE.add(norm(a.slug));
      HIDE.add(norm(a.ad));
    }
    const byNorm = new Map<string, { ad: string; slug: string; values: Set<string> }>();
    for (const p of inStock) {
      const oz = p.ozellikler ?? {};
      for (const [k, v] of Object.entries(oz)) {
        if (!v || !String(v).trim()) continue;
        const n = norm(k);
        if (HIDE.has(n)) continue;
        let entry = byNorm.get(n);
        if (!entry) {
          entry = {
            ad: labelBy.get(n) ?? k.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            slug: n,
            values: new Set<string>(),
          };
          byNorm.set(n, entry);
        }
        entry.values.add(String(v).trim());
      }
    }
    return Array.from(byNorm.values())
      .filter((x) => x.values.size > 0 && x.values.size <= 60)
      .sort((a, b) => a.ad.localeCompare(b.ad, "tr"))
      .map((x) => ({ ad: x.ad, slug: x.slug, values: Array.from(x.values).sort((a, b) => a.localeCompare(b, "tr")) }));
  }, [attrs, inStock]);

  // ---- Draft filters (applied only on "UYGULA") ----
  const [draft, setDraft] = useState({
    kategori: search.kategori ?? "",
    marka: search.marka ?? "",
    min: search.min != null ? String(search.min) : "",
    max: search.max != null ? String(search.max) : "",
    attrs: activeAttrFilters as AttrFilters,
  });

  const openDrawer = () => {
    setDraft({
      kategori: search.kategori ?? "",
      marka: search.marka ?? "",
      min: search.min != null ? String(search.min) : "",
      max: search.max != null ? String(search.max) : "",
      attrs: activeAttrFilters,
    });
    setDrawerOpen(true);
  };

  const addDraftValue = (slug: string, value: string) => {
    if (!value) return;
    setDraft((d) => {
      const cur = d.attrs[slug] ?? [];
      if (cur.some((v) => v.toLowerCase() === value.toLowerCase())) return d;
      return { ...d, attrs: { ...d.attrs, [slug]: [...cur, value] } };
    });
  };

  const removeDraftValue = (slug: string, value: string) => {
    setDraft((d) => {
      const cur = (d.attrs[slug] ?? []).filter((v) => v !== value);
      const next = { ...d.attrs };
      if (cur.length) next[slug] = cur;
      else delete next[slug];
      return { ...d, attrs: next };
    });
  };

  const applyDraft = () => {
    navigate({
      search: (prev: Record<string, unknown>) => ({
        ...prev,
        kategori: draft.kategori || undefined,
        marka: draft.marka || undefined,
        min: draft.min ? Number(draft.min) : undefined,
        max: draft.max ? Number(draft.max) : undefined,
        ozellik: encodeAttrs(draft.attrs),
      }),
    });
    setVisible(24);
    setDrawerOpen(false);
  };

  const clearDraft = () =>
    setDraft({ kategori: "", marka: "", min: "", max: "", attrs: {} });

  // Live preview count inside the drawer
  const draftCount = useMemo(() => {
    const min = draft.min ? Number(draft.min) : undefined;
    const max = draft.max ? Number(draft.max) : undefined;
    return inStock.filter((p) => {
      if (draft.marka && p.marka_id !== draft.marka) return false;
      if (min != null && p.price < min) return false;
      if (max != null && p.price > max) return false;
      return matches(p, draft.attrs);
    }).length;
  }, [inStock, draft]);

  const activeFilterCount =
    (search.kategori ? 1 : 0) +
    (search.marka ? 1 : 0) +
    (search.min ? 1 : 0) +
    (search.max ? 1 : 0) +
    Object.values(activeAttrFilters).reduce((n, v) => n + v.length, 0);

  const pageTitle = useMemo(() => {
    if (search.q?.trim()) return `"${search.q.trim()}" için sonuçlar`;
    if (search.kategori) return cats?.find((c) => c.id === search.kategori)?.name ?? "Modeller";
    if (search.marka) return brands?.find((b) => b.id === search.marka)?.name ?? "Modeller";
    if (search.tag) return search.tag.replace(/[-_]/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
    return "Tüm Modeller";
  }, [search.q, search.kategori, search.marka, search.tag, cats, brands]);

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
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-5 sm:py-7">
          <h1 className="font-display text-2xl sm:text-3xl text-brand-ink">{pageTitle}</h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {isLoading ? "Yükleniyor..." : `${list.length} ürün`}
          </p>
        </div>
      </section>


      <div className="sticky top-20 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 py-3 flex items-center gap-2 sm:gap-3">
          <div className="flex-1 min-w-0 overflow-x-auto no-scrollbar">
            <div className="flex gap-2 w-max">
              <a href="/urunler" className={`px-4 py-2 text-[11px] tracking-[0.2em] rounded-full border shrink-0 transition ${!search.tag && !search.kategori ? "bg-brand-ink text-white border-brand-ink" : "border-border text-brand-ink bg-white"}`}>TÜM</a>
              {cats?.slice(0, 4).map((c) => (
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
            onClick={openDrawer}
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

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-10 pt-4 flex flex-wrap gap-2">
          {Object.entries(activeAttrFilters).flatMap(([slug, vals]) =>
            vals.map((v) => (
              <button
                key={`${slug}-${v}`}
                onClick={() => {
                  const next = { ...activeAttrFilters, [slug]: vals.filter((x) => x !== v) };
                  if (!next[slug].length) delete next[slug];
                  navigate({ search: (prev: Record<string, unknown>) => ({ ...prev, ozellik: encodeAttrs(next) }) });
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-ink text-white text-xs"
              >
                {v} <X className="w-3 h-3" />
              </button>
            )),
          )}
          <a href="/urunler" className="px-3 py-1.5 rounded-full border border-border text-xs text-brand-ink">Tümünü temizle</a>
        </div>
      )}

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

      {drawerOpen && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-black/50 animate-in fade-in" onClick={() => setDrawerOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 sm:inset-y-0 sm:right-0 sm:left-auto sm:w-[420px] bg-white shadow-2xl rounded-t-3xl sm:rounded-none flex flex-col max-h-[90vh] sm:max-h-none animate-in slide-in-from-bottom sm:slide-in-from-right duration-300">
            <div className="sm:hidden pt-2 pb-1 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-display text-xl text-brand-ink">Filtrele</h2>
              <button onClick={() => setDrawerOpen(false)} aria-label="Kapat" className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-brand-sand/50">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
              <FilterField label="Kategori">
                <select value={draft.kategori} onChange={(e) => setDraft({ ...draft, kategori: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm">
                  <option value="">Tümü</option>
                  {cats?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </FilterField>

              <FilterField label="Marka">
                <select value={draft.marka} onChange={(e) => setDraft({ ...draft, marka: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm">
                  <option value="">Tümü</option>
                  {brands?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
              </FilterField>

              <FilterField label="Fiyat Aralığı (₺)">
                <div className="flex gap-2">
                  <input type="number" placeholder="Min" value={draft.min} onChange={(e) => setDraft({ ...draft, min: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
                  <input type="number" placeholder="Max" value={draft.max} onChange={(e) => setDraft({ ...draft, max: e.target.value })} className="w-full border border-border rounded-xl px-3 py-2.5 text-sm" />
                </div>
              </FilterField>

              {filterableAttrs.map((attr) => {
                const selected = draft.attrs[attr.slug] ?? [];
                return (
                  <FilterField key={attr.slug} label={attr.ad}>
                    <select
                      value=""
                      onChange={(e) => { addDraftValue(attr.slug, e.target.value); e.currentTarget.value = ""; }}
                      className="w-full border border-border rounded-xl px-3 py-2.5 bg-white text-sm"
                    >
                      <option value="">{selected.length ? "Başka değer ekle..." : "Tümü"}</option>
                      {attr.values
                        .filter((v) => !selected.some((s) => s.toLowerCase() === v.toLowerCase()))
                        .map((v) => <option key={v} value={v}>{v}</option>)}
                    </select>
                    {selected.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {selected.map((v) => (
                          <button key={v} onClick={() => removeDraftValue(attr.slug, v)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-ink text-white text-xs">
                            {v} <X className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </FilterField>
                );
              })}
            </div>

            <div className="border-t border-border p-4 flex gap-3 bg-white">
              <button onClick={clearDraft} className="flex-1 text-center px-4 py-3 rounded-full border border-border text-brand-ink text-xs tracking-widest hover:bg-brand-sand/40 transition">
                TEMİZLE
              </button>
              <button onClick={applyDraft} className="flex-[2] px-4 py-3 rounded-full bg-brand-ink text-white text-xs tracking-widest hover:bg-brand-ink/90 transition">
                UYGULA ({draftCount})
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
