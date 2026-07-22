import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, X } from "lucide-react";
import { useProducts } from "@/lib/queries";
import { formatTL } from "@/lib/products";

export function SearchBox({ solid }: { solid: boolean }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [debounced, setDebounced] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(q.trim()), 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const { data: results = [], isFetching } = useProducts(
    debounced.length >= 2 ? { q: debounced } : {},
  );
  const list = debounced.length >= 2 ? results.filter((p) => p.stock > 0).slice(0, 8) : [];

  return (
    <>
      <button
        aria-label="Ara"
        onClick={() => setOpen(true)}
        className={`hover:opacity-70 transition ${solid ? "text-brand-ink" : "text-white"}`}
      >
        <Search className="w-5 h-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)}>
          <div
            className="absolute top-0 inset-x-0 bg-white shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="max-w-[900px] mx-auto px-6 py-6">
              <div className="flex items-center gap-3 border-b-2 border-brand-ink pb-3">
                <Search className="w-6 h-6 text-brand-ink" />
                <input
                  ref={inputRef}
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Ürün adı veya model kodu ile arayın..."
                  className="flex-1 text-lg outline-none bg-transparent text-brand-ink placeholder:text-muted-foreground"
                />
                <button onClick={() => setOpen(false)} aria-label="Kapat" className="text-brand-ink hover:opacity-70">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="max-h-[70vh] overflow-y-auto mt-4">
                {debounced.length < 2 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">En az 2 karakter yazın.</p>
                )}
                {debounced.length >= 2 && isFetching && list.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">Aranıyor…</p>
                )}
                {debounced.length >= 2 && !isFetching && list.length === 0 && (
                  <p className="text-sm text-muted-foreground py-6 text-center">Sonuç bulunamadı.</p>
                )}

                {list.length > 0 && (
                  <div className="grid gap-2">
                    {list.map((p) => (
                      <Link
                        key={p.id}
                        to="/urun/$slug"
                        params={{ slug: p.slug }}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-brand-sand/40 transition"
                      >
                        <div className="w-16 h-16 bg-brand-sand/40 rounded-lg overflow-hidden shrink-0">
                          {p.image && <img src={p.image} alt="" className="w-full h-full object-contain p-1" />}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-brand-ink truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">{p.sku}</p>
                        </div>
                        <span className="text-sm font-semibold text-brand-ink shrink-0">{formatTL(p.price)}</span>
                      </Link>
                    ))}
                    <Link
                      to="/urunler"
                      search={{ q: debounced }}
                      onClick={() => setOpen(false)}
                      className="text-center text-sm text-brand-cta hover:underline py-3"
                    >
                      Tüm sonuçları göster →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
