import { createFileRoute, useSearch } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { filterProducts } from "@/lib/products";
import { Search } from "lucide-react";

const searchSchema = z.object({
  tag: z.enum(["tumu", "klipsli", "outlet"]).optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/urunler")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Tüm Ürünler — Alpottica Istanbul" },
      {
        name: "description",
        content: "Alpottica'nın tüm güneş gözlüğü ve klipsli modelleri.",
      },
    ],
  }),
  component: Products,
});

const TABS: { key: "tumu" | "klipsli" | "outlet"; label: string }[] = [
  { key: "tumu", label: "TÜM MODELLER" },
  { key: "klipsli", label: "KLİPSLİ MODELLER" },
  { key: "outlet", label: "OUTLET" },
];

function Products() {
  const search = useSearch({ from: "/urunler" });
  const activeTag = search.tag ?? "tumu";
  const [query, setQuery] = useState(search.q ?? "");
  const [visible, setVisible] = useState(24);

  const list = useMemo(() => filterProducts(activeTag, query), [activeTag, query]);
  const shown = list.slice(0, visible);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navbar />
      <div className="h-20" />

      <section className="bg-brand-sand/40 border-b border-border">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-14">
          <p className="text-xs tracking-[0.4em] text-muted-foreground mb-3">
            KOLEKSİYON
          </p>
          <h1 className="font-display text-5xl md:text-7xl text-brand-ink mb-6">
            Alpottica Modelleri
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            {list.length} ürün · Polarize, antifar ve klipsli seçenekler.
          </p>
        </div>
      </section>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-8 sticky top-20 z-30 bg-background/95 backdrop-blur border-b border-border">
        <div className="flex flex-wrap items-center gap-4 justify-between">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <a
                key={t.key}
                href={`/urunler?tag=${t.key}`}
                className={`px-5 py-2.5 text-xs tracking-[0.2em] rounded-full border transition ${
                  activeTag === t.key
                    ? "bg-brand-ink text-white border-brand-ink"
                    : "border-border text-brand-ink hover:border-brand-ink"
                }`}
              >
                {t.label}
              </a>
            ))}
          </div>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setVisible(24);
              }}
              placeholder="Ürün ara..."
              className="w-full pl-11 pr-4 py-2.5 text-sm rounded-full border border-border bg-white focus:outline-none focus:border-brand-ink transition"
            />
          </div>
        </div>
      </div>

      <section className="max-w-[1600px] mx-auto px-6 lg:px-10 py-12">
        {shown.length === 0 ? (
          <p className="text-center text-muted-foreground py-20">
            Sonuç bulunamadı.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
            {shown.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
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
