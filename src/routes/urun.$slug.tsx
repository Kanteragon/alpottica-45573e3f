import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { formatTL, discountPct } from "@/lib/products";
import { useProduct, useProducts, useAttributes } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { ShoppingCart, Heart, ShieldCheck, Truck, RefreshCcw, ArrowLeft } from "lucide-react";
import { useCart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/urun/$slug")({
  head: () => ({
    meta: [
      { title: "Ürün — Alpottica" },
      { name: "description", content: "Alpottica Istanbul ürün detayı." },
    ],
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useProduct(slug);
  const { data: allProducts = [] } = useProducts();
  const { data: attrs = [] } = useAttributes();
  const { add } = useCart();
  const [active, setActive] = useState<string>("");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col gap-4">
        <p>Ürün bulunamadı.</p>
        <Link to="/urunler" className="text-brand-cta underline">Ürünlere dön</Link>
      </div>
    );
  }

  const disc = discountPct(product);
  const gallery = product.images.length ? product.images : [product.image].filter(Boolean);
  const currentImage = active || gallery[0] || "";
  const related = allProducts.filter((p) => p.id !== product.id && p.stock > 0).slice(0, 4);

  const rawOz = (product as unknown as { ozellikler?: Record<string, string> }).ozellikler ?? {};
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const ozByNorm: Record<string, { key: string; value: string }> = {};
  for (const [k, v] of Object.entries(rawOz)) {
    if (v == null || String(v).trim() === "") continue;
    ozByNorm[norm(k)] = { key: k, value: String(v) };
  }
  // legacy fallbacks
  if (product.color && !ozByNorm["renk"]) ozByNorm["renk"] = { key: "Renk", value: product.color };
  if (product.lensColor && !ozByNorm["cam_rengi"]) ozByNorm["cam_rengi"] = { key: "Cam Rengi", value: product.lensColor };
  if (product.size && !ozByNorm["ekartman"]) ozByNorm["ekartman"] = { key: "Ekartman", value: product.size };

  const shownNorms = new Set<string>();
  const specs: { label: string; value: string }[] = [];
  // Ordered by defined attributes first
  for (const a of attrs.filter((a) => a.show_in_detail)) {
    const hit = ozByNorm[norm(a.slug)] || ozByNorm[norm(a.ad)];
    if (hit) {
      specs.push({ label: a.ad, value: hit.value });
      shownNorms.add(norm(a.slug));
      shownNorms.add(norm(a.ad));
    }
  }
  // Then any remaining Excel-imported attributes not covered
  for (const [n, { key, value }] of Object.entries(ozByNorm)) {
    if (shownNorms.has(n)) continue;
    specs.push({ label: key, value });
  }

  const waMsg = encodeURIComponent(`${product.name} adlı modeli sipariş vermek istiyorum.`);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="h-20" />

      <section className="max-w-[1600px] mx-auto px-6 lg:px-10 py-12 grid lg:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square bg-brand-sand/30 rounded-3xl overflow-hidden mb-4 flex items-center justify-center">
            {currentImage && <img src={currentImage} alt={product.name} className="w-full h-full object-contain p-10" />}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {gallery.map((img) => (
                <button
                  key={img}
                  onClick={() => setActive(img)}
                  className={`aspect-square rounded-xl overflow-hidden bg-brand-sand/30 border-2 transition ${currentImage === img ? "border-brand-ink" : "border-transparent"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-contain p-2" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs tracking-[0.4em] text-muted-foreground mb-3">ALPOTTICA · {product.sku}</p>
          <h1 className="font-display text-4xl md:text-5xl text-brand-ink leading-tight mb-6">
            {product.name.replace("Alpottica ", "")}
          </h1>

          <div className="flex items-baseline gap-3 mb-8">
            <span className="text-3xl font-semibold text-brand-ink">{formatTL(product.price)}</span>
            {disc && (
              <>
                <span className="text-lg text-muted-foreground line-through">{formatTL(product.listPrice)}</span>
                <span className="bg-brand-cta text-white text-xs font-semibold px-2.5 py-1 rounded-full">%{disc} İNDİRİM</span>
              </>
            )}
          </div>

          {product.aciklama && (
            <p className="text-muted-foreground mb-6 leading-relaxed">{product.aciklama}</p>
          )}

          {specs.length > 0 && (
            <div className="mb-8 border border-border rounded-2xl overflow-hidden">
              <div className="px-5 py-3 bg-brand-sand/40 text-[11px] tracking-widest uppercase text-brand-ink font-semibold">Ürün Özellikleri</div>
              <dl className="divide-y divide-border">
                {specs.map((s) => (
                  <div key={s.label} className="grid grid-cols-[160px_1fr] gap-3 px-5 py-3 text-sm">
                    <dt className="text-muted-foreground">{s.label}</dt>
                    <dd className="text-brand-ink font-medium">{s.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          <p className="text-xs text-muted-foreground mb-6">Stok: <strong className="text-brand-ink">{product.stock} adet mevcut</strong></p>

          <div className="flex gap-3 mb-4">
            <button
              onClick={() => {
                add({
                  product_id: product.id, slug: product.slug, name: product.name,
                  image: product.image, price: product.price, stock: product.stock,
                });
                toast.success("Sepete eklendi");
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-cta text-white font-semibold tracking-wider text-sm py-4 rounded-full hover:opacity-90 transition"
            >
              <ShoppingCart className="w-4 h-4" /> +SEPETE EKLE
            </button>
            <button className="px-6 py-4 rounded-full border border-brand-ink text-brand-ink hover:bg-brand-ink hover:text-white transition">
              <Heart className="w-4 h-4" />
            </button>
          </div>

          <a href={`https://wa.me/905466460244?text=${waMsg}`} target="_blank" rel="noreferrer" className="block text-center w-full py-4 rounded-full bg-[#25D366] text-white text-sm tracking-widest font-semibold hover:opacity-90 transition mb-8">
            WHATSAPP İLE SİPARİŞ
          </a>

          <div className="grid grid-cols-3 gap-4 text-center pt-6 border-t border-border">
            <div><ShieldCheck className="w-5 h-5 mx-auto text-brand-ink mb-2" /><p className="text-[11px] text-muted-foreground tracking-wider">ORİJİNAL ÜRÜN</p></div>
            <div><Truck className="w-5 h-5 mx-auto text-brand-ink mb-2" /><p className="text-[11px] text-muted-foreground tracking-wider">ÜCRETSİZ KARGO</p></div>
            <div><RefreshCcw className="w-5 h-5 mx-auto text-brand-ink mb-2" /><p className="text-[11px] text-muted-foreground tracking-wider">14 GÜN İADE</p></div>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section className="max-w-[1600px] mx-auto px-6 lg:px-10 py-16">
          <h2 className="font-display text-4xl text-brand-ink mb-8">Benzer Ürünler</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      <Footer />
    </div>
  );
}
