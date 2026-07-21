import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { getProductBySlug, formatTL, discountPct, products } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { ShoppingCart, Heart, ShieldCheck, Truck, RefreshCcw } from "lucide-react";

export const Route = createFileRoute("/urun/$slug")({
  loader: ({ params }) => {
    const product = getProductBySlug(params.slug);
    if (!product) throw notFound();
    return { product };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.product.name} — Alpottica` },
          { name: "description", content: `${loaderData.product.name} - Alpottica Istanbul.` },
          { property: "og:title", content: loaderData.product.name },
          { property: "og:image", content: loaderData.product.image },
        ]
      : [],
  }),
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <Link to="/urunler" className="text-brand-cta underline">Ürünlere dön</Link>
    </div>
  ),
  component: ProductDetail,
});

function ProductDetail() {
  const { product } = Route.useLoaderData();
  const [active, setActive] = useState(product.image || "");
  const disc = discountPct(product);
  const gallery = product.images.length ? product.images : [product.image].filter(Boolean);
  const related = products
    .filter((p) => p.id !== product.id)
    .slice(0, 4);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="h-20" />

      <section className="max-w-[1600px] mx-auto px-6 lg:px-10 py-12 grid lg:grid-cols-2 gap-12">
        <div>
          <div className="aspect-square bg-brand-sand/30 rounded-3xl overflow-hidden mb-4 flex items-center justify-center">
            {active && (
              <img src={active} alt={product.name} className="w-full h-full object-contain p-10" />
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {gallery.map((img) => (
                <button
                  key={img}
                  onClick={() => setActive(img)}
                  className={`aspect-square rounded-xl overflow-hidden bg-brand-sand/30 border-2 transition ${
                    active === img ? "border-brand-ink" : "border-transparent"
                  }`}
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
                <span className="text-lg text-muted-foreground line-through">
                  {formatTL(product.listPrice)}
                </span>
                <span className="bg-brand-cta text-white text-xs font-semibold px-2.5 py-1 rounded-full">
                  %{disc} İNDİRİM
                </span>
              </>
            )}
          </div>

          <dl className="grid grid-cols-2 gap-4 mb-8 p-5 rounded-2xl bg-brand-sand/30">
            {product.color && (
              <div>
                <dt className="text-[11px] tracking-widest text-muted-foreground uppercase">Çerçeve Rengi</dt>
                <dd className="text-sm text-brand-ink font-medium mt-1">{product.color}</dd>
              </div>
            )}
            {product.lensColor && (
              <div>
                <dt className="text-[11px] tracking-widest text-muted-foreground uppercase">Cam Rengi</dt>
                <dd className="text-sm text-brand-ink font-medium mt-1">{product.lensColor}</dd>
              </div>
            )}
            {product.size && (
              <div>
                <dt className="text-[11px] tracking-widest text-muted-foreground uppercase">Ekartman</dt>
                <dd className="text-sm text-brand-ink font-medium mt-1">{product.size} mm</dd>
              </div>
            )}
            <div>
              <dt className="text-[11px] tracking-widest text-muted-foreground uppercase">Stok</dt>
              <dd className="text-sm text-brand-ink font-medium mt-1">
                {product.stock > 0 ? `${product.stock} adet mevcut` : "Sipariş üzerine"}
              </dd>
            </div>
          </dl>

          <div className="flex gap-3 mb-8">
            <button className="flex-1 flex items-center justify-center gap-2 bg-brand-cta text-white font-semibold tracking-wider text-sm py-4 rounded-full hover:opacity-90 transition">
              <ShoppingCart className="w-4 h-4" /> +SEPETE EKLE
            </button>
            <button className="px-6 py-4 rounded-full border border-brand-ink text-brand-ink hover:bg-brand-ink hover:text-white transition">
              <Heart className="w-4 h-4" />
            </button>
          </div>

          <a
            href="https://wa.me/905466460244"
            target="_blank"
            rel="noreferrer"
            className="block text-center w-full py-4 rounded-full border border-border text-brand-ink text-sm tracking-widest hover:border-brand-ink transition mb-8"
          >
            WHATSAPP İLE SİPARİŞ
          </a>

          <div className="grid grid-cols-3 gap-4 text-center pt-6 border-t border-border">
            <div>
              <ShieldCheck className="w-5 h-5 mx-auto text-brand-ink mb-2" />
              <p className="text-[11px] text-muted-foreground tracking-wider">ORİJİNAL ÜRÜN</p>
            </div>
            <div>
              <Truck className="w-5 h-5 mx-auto text-brand-ink mb-2" />
              <p className="text-[11px] text-muted-foreground tracking-wider">ÜCRETSİZ KARGO</p>
            </div>
            <div>
              <RefreshCcw className="w-5 h-5 mx-auto text-brand-ink mb-2" />
              <p className="text-[11px] text-muted-foreground tracking-wider">14 GÜN İADE</p>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-[1600px] mx-auto px-6 lg:px-10 py-16">
        <h2 className="font-display text-4xl text-brand-ink mb-8">Benzer Ürünler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {related.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <Footer />
    </div>
  );
}
