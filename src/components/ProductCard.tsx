import { Link } from "@tanstack/react-router";
import { Heart, ShoppingCart } from "lucide-react";
import type { Product } from "@/lib/products";
import { discountPct, formatTL } from "@/lib/products";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export function ProductCard({ product }: { product: Product }) {
  const disc = discountPct(product);
  const { add } = useCart();

  return (
    <Link
      to="/urun/$slug"
      params={{ slug: product.slug }}
      className="group block rounded-2xl overflow-hidden bg-white border border-border hover:shadow-[0_20px_50px_-20px_rgba(0,0,0,0.15)] hover:-translate-y-1 transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-brand-sand/40">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            className="absolute inset-0 w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-xs">Görsel yok</div>
        )}
        {disc && (
          <span className="absolute top-3 left-3 bg-brand-cta text-white text-[11px] font-semibold tracking-wider px-2.5 py-1 rounded-full">
            %{disc} İNDİRİM
          </span>
        )}
        <button
          onClick={(e) => { e.preventDefault(); }}
          aria-label="Favori"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center text-brand-ink hover:text-brand-cta transition opacity-0 group-hover:opacity-100"
        >
          <Heart className="w-4 h-4" />
        </button>
      </div>
      <div className="p-5">
        <p className="text-[11px] tracking-[0.25em] text-muted-foreground mb-2 uppercase">Alpottica</p>
        <h3 className="text-lg md:text-xl font-semibold text-brand-ink line-clamp-2 min-h-[3.5rem] leading-snug">
          {product.name.replace("Alpottica ", "")}
        </h3>
        <div className="mt-3 flex items-baseline gap-2">
          <span className="text-xl font-bold text-brand-ink">{formatTL(product.price)}</span>
          {disc && (
            <span className="text-base text-muted-foreground line-through">{formatTL(product.listPrice)}</span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.preventDefault();
            add({
              product_id: product.id,
              slug: product.slug,
              name: product.name,
              image: product.image,
              price: product.price,
              stock: product.stock,
            });
            toast.success("Sepete eklendi");
          }}
          className="mt-3 w-full flex items-center justify-center gap-2 text-xs tracking-widest font-semibold text-brand-ink border border-brand-ink/20 rounded-full py-2.5 hover:bg-brand-ink hover:text-white transition"
        >
          <ShoppingCart className="w-3.5 h-3.5" /> SEPETE EKLE
        </button>
      </div>
    </Link>
  );
}
