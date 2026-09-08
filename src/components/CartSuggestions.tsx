import { Link } from "@tanstack/react-router";
import { Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart";
import { formatTL } from "@/lib/products";
import { useCartSuggestions } from "@/lib/suggestions";

export function CartSuggestions() {
  const { items, add } = useCart();
  const { data: groups = [], isLoading } = useCartSuggestions(items);

  if (items.length === 0 || isLoading || groups.length === 0) return null;

  return (
    <div className="space-y-5 mt-6">
      {groups.map((g) => (
        <section key={g.campaignId} className="bg-white rounded-2xl border border-border p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-brand-cta" />
            <h3 className="font-semibold text-brand-ink">{g.campaignName}</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Sepetine <strong className="text-brand-ink">{g.scopeLabel}</strong> arasından bir ürün eklersen{" "}
            <span className="text-brand-cta font-semibold">{g.discountLabel}</span> kazanırsın.
          </p>

          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1 snap-x">
            {g.products.map((p) => (
              <div
                key={p.id}
                className="snap-start shrink-0 w-[150px] sm:w-[170px] rounded-xl border border-border overflow-hidden bg-white"
              >
                <Link to="/urun/$slug" params={{ slug: p.slug }} className="block">
                  <div className="relative aspect-square bg-brand-sand/30">
                    {p.image ? (
                      <img src={p.image} alt={p.name} loading="lazy" className="absolute inset-0 w-full h-full object-contain p-2" />
                    ) : null}
                    <span className="absolute top-1.5 left-1.5 bg-brand-cta text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                      {g.discountLabel}
                    </span>
                  </div>
                  <p className="px-2 pt-2 text-xs font-medium text-brand-ink line-clamp-2 min-h-[2.2rem]">
                    {p.name.replace("Alpottica ", "")}
                  </p>
                </Link>
                <div className="px-2 pb-2">
                  <p className="text-sm font-bold text-brand-ink mb-1.5">{formatTL(p.price)}</p>
                  <button
                    onClick={() => {
                      add({
                        product_id: p.id,
                        slug: p.slug,
                        name: p.name,
                        image: p.image,
                        price: p.price,
                        stock: p.stock,
                      });
                      toast.success("Sepete eklendi — indirim uygulandı");
                    }}
                    className="w-full flex items-center justify-center gap-1 text-[11px] tracking-wider font-semibold text-white bg-brand-ink rounded-full py-1.5 hover:opacity-90"
                  >
                    <Plus className="w-3 h-3" /> EKLE
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
