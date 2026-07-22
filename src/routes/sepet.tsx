import { createFileRoute, Link } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { formatTL } from "@/lib/products";
import { Trash2, Minus, Plus } from "lucide-react";

export const Route = createFileRoute("/sepet")({
  head: () => ({
    meta: [
      { title: "Sepetim — Alpottica" },
      { name: "description", content: "Alışveriş sepetiniz." },
    ],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, total } = useCart();

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-20" />
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-12">
        <h1 className="font-display text-5xl text-brand-ink mb-8">Sepetim</h1>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground mb-6">Sepetiniz boş.</p>
            <Link to="/urunler" className="inline-block px-8 py-3 rounded-full bg-brand-ink text-white">Alışverişe Başla</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_360px] gap-8">
            <div className="bg-white rounded-2xl border border-border divide-y">
              {items.map((i) => (
                <div key={i.product_id} className="p-5 flex gap-4 items-center">
                  <div className="w-24 h-24 rounded-xl bg-brand-sand/30 flex items-center justify-center overflow-hidden">
                    {i.image && <img src={i.image} alt="" className="w-full h-full object-contain p-2" />}
                  </div>
                  <div className="flex-1">
                    <Link to="/urun/$slug" params={{ slug: i.slug }} className="font-medium text-brand-ink hover:text-brand-cta">
                      {i.name}
                    </Link>
                    <p className="text-sm text-muted-foreground mt-1">{formatTL(i.price)}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <button onClick={() => setQty(i.product_id, i.qty - 1)} className="w-8 h-8 rounded-full border flex items-center justify-center"><Minus className="w-3 h-3" /></button>
                      <span className="min-w-[2rem] text-center">{i.qty}</span>
                      <button onClick={() => setQty(i.product_id, i.qty + 1)} className="w-8 h-8 rounded-full border flex items-center justify-center"><Plus className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-brand-ink">{formatTL(i.price * i.qty)}</p>
                    <button onClick={() => remove(i.product_id)} className="text-muted-foreground hover:text-brand-cta mt-2"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            <aside className="bg-white rounded-2xl border border-border p-6 h-fit sticky top-24">
              <h2 className="font-display text-2xl text-brand-ink mb-4">Özet</h2>
              <div className="flex justify-between mb-2 text-sm"><span>Ara toplam</span><span>{formatTL(total)}</span></div>
              <div className="flex justify-between mb-4 text-sm"><span>Kargo</span><span className="text-brand-cta">ÜCRETSİZ</span></div>
              <div className="flex justify-between font-semibold text-lg border-t pt-4"><span>Toplam</span><span>{formatTL(total)}</span></div>
              <Link to="/odeme" className="mt-6 block w-full text-center bg-brand-cta text-white py-3.5 rounded-full font-semibold tracking-wider hover:opacity-90">
                ÖDEMEYE GEÇ
              </Link>
              <Link to="/urunler" className="mt-3 block text-center text-sm text-muted-foreground hover:text-brand-ink">Alışverişe devam et</Link>
            </aside>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
