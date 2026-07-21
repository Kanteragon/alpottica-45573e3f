import { products } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { Link } from "@tanstack/react-router";

export function FeaturedProducts() {
  const picks = products.slice(0, 8);
  return (
    <section className="bg-brand-sand/30 py-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs tracking-[0.4em] text-muted-foreground mb-3">
              ÇOK SATANLAR
            </p>
            <h2 className="font-display text-5xl md:text-6xl text-brand-ink">
              Öne Çıkan Ürünler
            </h2>
          </div>
          <Link
            to="/urunler"
            className="hidden md:inline text-sm tracking-widest text-brand-ink hover:text-brand-cta transition"
          >
            TÜMÜNÜ GÖR →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 lg:gap-6">
          {picks.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="text-center mt-12 md:hidden">
          <Link
            to="/urunler"
            className="inline-block px-8 py-3 rounded-full bg-brand-ink text-white text-sm tracking-widest"
          >
            TÜM ÜRÜNLERİ GÖR
          </Link>
        </div>
      </div>
    </section>
  );
}
