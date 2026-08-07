import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { formatTL, discountPct, mapDbProduct, type DbProduct } from "@/lib/products";
import { useProduct, useProducts, useAttributes, fetchProductBySlug } from "@/lib/queries";
import { ProductCard } from "@/components/ProductCard";
import { ShoppingCart, Heart, ShieldCheck, Truck, RefreshCcw, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useFavorites } from "@/lib/favorites";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const SITE = "https://alpottica.lovable.app";

export const Route = createFileRoute("/urun/$slug")({
  loader: async ({ params }) => {
    try {
      return { product: await fetchProductBySlug(params.slug) };
    } catch {
      return { product: null };
    }
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.product ?? null;
    const url = `${SITE}/urun/${params.slug}`;
    if (!p) {
      return {
        meta: [
          { title: "Ürün — Alpottica Istanbul" },
          { name: "description", content: "Alpottica Istanbul güneş gözlüğü ve klipsli gözlük modelleri." },
        ],
        links: [{ rel: "canonical", href: url }],
      };
    }
    const title = p.seo_title?.trim() || `${p.name} | Alpottica Istanbul`;
    const desc =
      p.seo_description?.trim() ||
      `${p.name} — ${formatTL(p.price)}. Alpottica Istanbul güneş gözlüğü koleksiyonu, kapıda ödeme ve şeffaf kargo avantajıyla.`;
    const keywords =
      p.seo_keywords?.trim() ||
      ["alpottica", p.name, "güneş gözlüğü", "klipsli gözlük", p.color, p.lensColor].filter(Boolean).join(", ");
    const meta: { title?: string; name?: string; property?: string; content?: string }[] = [
      { title },
      { name: "description", content: desc },
      { name: "keywords", content: keywords },
      { property: "og:title", content: title },
      { property: "og:description", content: desc },
      { property: "og:type", content: "product" },
      { property: "og:url", content: url },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: desc },
    ];
    if (p.image?.startsWith("https://")) {
      meta.push({ property: "og:image", content: p.image });
      meta.push({ name: "twitter:image", content: p.image });
    }
    return {
      meta,
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: desc,
            sku: p.sku,
            image: p.images?.filter((i) => i?.startsWith("https://")) ?? [],
            brand: { "@type": "Brand", name: "Alpottica" },
            offers: {
              "@type": "Offer",
              url,
              priceCurrency: "TRY",
              price: p.price,
              availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
            },
          }),
        },
      ],
    };
  },
  component: ProductDetail,
});

function ProductDetail() {
  const { slug } = Route.useParams();
  const { data: product, isLoading } = useProduct(slug);
  
  const { data: attrs = [] } = useAttributes();
  const { add } = useCart();
  const { isFavorite: isFav, toggle: toggleFav } = useFavorites();
  const [idx, setIdx] = useState(0);
  const [touchX, setTouchX] = useState<number | null>(null);

  // Varyasyon / ürün değişince galeriyi ilk fotoğrafa al
  useEffect(() => { setIdx(0); }, [slug]);

  // Dynamic <title> per product
  useEffect(() => {
    if (product?.name && typeof document !== "undefined") {
      const original = document.title;
      document.title = `${product.name} — Alpottica`;
      return () => { document.title = original; };
    }
  }, [product?.name]);

  // Variant siblings (same variant_group_id)
  const variantGroupId = product?.variant_group_id ?? null;
  const { data: variants = [] } = useQuery({
    queryKey: ["variants", variantGroupId],
    queryFn: async () => {
      if (!variantGroupId) return [];
      const { data } = await supabase
        .from("products")
        .select("id,slug,stok_kodu,urun_adi,aciklama,satis_fiyati,liste_fiyati,stok_adedi,resimler,ozellikler,etiketler,kategori_id,marka_id,variant_group_id")
        .eq("variant_group_id", variantGroupId)
        .eq("aktif", true);
      return (data ?? []).map((r) => mapDbProduct(r as unknown as DbProduct));
    },
    enabled: !!variantGroupId,
  });

  // Related: random products from the same category
  const { data: relatedRaw = [] } = useQuery({
    queryKey: ["related", product?.id, product?.kategori_id],
    queryFn: async () => {
      if (!product) return [];
      let ids: string[] = [];
      const { data: pcs } = await supabase
        .from("product_categories")
        .select("category_id")
        .eq("product_id", product.id);
      const catIds = Array.from(
        new Set([...(pcs ?? []).map((r) => r.category_id as string), product.kategori_id].filter(Boolean) as string[])
      );
      if (catIds.length) {
        const { data: sibs } = await supabase
          .from("product_categories")
          .select("product_id")
          .in("category_id", catIds)
          .limit(500);
        ids = Array.from(new Set((sibs ?? []).map((r) => r.product_id as string)));
      }
      const cols = "id,slug,stok_kodu,urun_adi,aciklama,satis_fiyati,liste_fiyati,stok_adedi,resimler,ozellikler,etiketler,kategori_id,marka_id,variant_group_id";
      let q = supabase.from("products").select(cols).eq("aktif", true).gt("stok_adedi", 0).neq("id", product.id).limit(60);
      if (catIds.length && ids.length) {
        q = q.or(`kategori_id.in.(${catIds.join(",")}),id.in.(${ids.join(",")})`);
      } else if (product.kategori_id) {
        q = q.eq("kategori_id", product.kategori_id);
      }
      const { data } = await q;
      return (data ?? []).map((r) => mapDbProduct(r as unknown as DbProduct)).sort(() => Math.random() - 0.5);
    },
    enabled: !!product,
  });

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">Yükleniyor...</p></div>;
  if (!product) return <div className="min-h-screen flex items-center justify-center flex-col gap-4"><p>Ürün bulunamadı.</p><Link to="/urunler" className="text-brand-cta underline">Ürünlere dön</Link></div>;

  const disc = discountPct(product);
  const gallery = product.images.length ? product.images : [product.image].filter(Boolean);
  const currentImage = gallery[idx] || "";
  const relatedPool = relatedRaw;
  const related = relatedPool.slice(0, 4);

  const rawOz = (product as unknown as { ozellikler?: Record<string, string> }).ozellikler ?? {};
  const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const ozByNorm: Record<string, { key: string; value: string }> = {};
  for (const [k, v] of Object.entries(rawOz)) {
    if (v == null || String(v).trim() === "") continue;
    ozByNorm[norm(k)] = { key: k, value: String(v) };
  }
  if (product.color && !ozByNorm["renk"]) ozByNorm["renk"] = { key: "Renk", value: product.color };
  if (product.lensColor && !ozByNorm["cam_rengi"]) ozByNorm["cam_rengi"] = { key: "Cam Rengi", value: product.lensColor };
  if (product.size && !ozByNorm["ekartman"]) ozByNorm["ekartman"] = { key: "Ekartman", value: product.size };

  const shownNorms = new Set<string>();
  const specs: { label: string; value: string }[] = [];
  for (const a of attrs.filter((a) => a.show_in_detail)) {
    const hit = ozByNorm[norm(a.slug)] || ozByNorm[norm(a.ad)];
    if (hit) {
      specs.push({ label: a.ad, value: hit.value });
      shownNorms.add(norm(a.slug));
      shownNorms.add(norm(a.ad));
    }
  }
  for (const [n, { key, value }] of Object.entries(ozByNorm)) {
    if (shownNorms.has(n)) continue;
    specs.push({ label: key, value });
  }

  const waMsg = encodeURIComponent(`${product.name} adlı modeli sipariş vermek istiyorum.`);
  const nav = (dir: -1 | 1) => setIdx((i) => (i + dir + gallery.length) % gallery.length);

  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="h-20" />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-6">
        <button onClick={() => window.history.back()} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-brand-ink transition">
          <ArrowLeft className="w-4 h-4" /> Geri
        </button>
      </div>

      <section className="max-w-[1600px] mx-auto px-6 lg:px-10 py-12 grid lg:grid-cols-2 gap-12">
        <div>
          <div
            className="relative aspect-square bg-brand-sand/30 rounded-3xl overflow-hidden mb-4 flex items-center justify-center group touch-pan-y select-none"
            onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
            onTouchEnd={(e) => {
              if (touchX === null) return;
              const dx = e.changedTouches[0].clientX - touchX;
              if (Math.abs(dx) > 40 && gallery.length > 1) nav(dx > 0 ? -1 : 1);
              setTouchX(null);
            }}
          >
            {currentImage && <img src={currentImage} alt={product.name} draggable={false} className="w-full h-full object-contain p-6" />}
            {gallery.length > 1 && (
              <>
                <button onClick={() => nav(-1)} aria-label="Önceki" className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 text-brand-ink flex items-center justify-center shadow-lg hover:bg-white transition opacity-100 md:opacity-0 md:group-hover:opacity-100">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button onClick={() => nav(1)} aria-label="Sonraki" className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/95 text-brand-ink flex items-center justify-center shadow-lg hover:bg-white transition opacity-100 md:opacity-0 md:group-hover:opacity-100">
                  <ChevronRight className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                  {gallery.map((_, i) => (
                    <span key={i} className={`w-2 h-2 rounded-full transition ${i === idx ? "bg-brand-ink" : "bg-brand-ink/30"}`} />
                  ))}
                </div>
              </>
            )}
          </div>
          {gallery.length > 1 && (
            <div className="grid grid-cols-5 gap-3">
              {gallery.map((img, i) => (
                <button key={img} onClick={() => setIdx(i)} className={`aspect-square rounded-xl overflow-hidden bg-brand-sand/30 border-2 transition ${i === idx ? "border-brand-ink" : "border-transparent"}`}>
                  <img src={img} alt="" className="w-full h-full object-contain p-1" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="text-xs tracking-[0.4em] text-muted-foreground mb-3">ALPOTTICA ISTANBUL</p>
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

          {variants.length > 1 && (
            <div className="mb-6">
              <p className="text-[11px] tracking-widest uppercase text-muted-foreground mb-3">Model / Renk Seçenekleri</p>
              <div className="flex flex-wrap gap-2">
                {variants.map((v) => {
                  const active = v.id === product.id;
                  const label = v.color || v.name.replace("Alpottica ", "");
                  return (
                    <Link
                      key={v.id}
                      to="/urun/$slug"
                      params={{ slug: v.slug }}
                      className={`flex items-center gap-2 border rounded-full pl-1 pr-4 py-1 text-sm transition ${active ? "border-brand-ink bg-brand-ink text-white" : "border-border hover:border-brand-ink"}`}
                    >
                      <span className={`w-8 h-8 rounded-full overflow-hidden bg-brand-sand/40 shrink-0 ${active ? "ring-2 ring-white" : ""}`}>
                        {v.image && <img src={v.image} alt="" className="w-full h-full object-contain" />}
                      </span>
                      <span className="text-xs">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {product.aciklama && (<p className="text-muted-foreground mb-6 leading-relaxed">{product.aciklama}</p>)}

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

          <div className="hidden md:flex gap-3 mb-4">
            <button
              onClick={() => { add({ product_id: product.id, slug: product.slug, name: product.name, image: product.image, price: product.price, stock: product.stock }); toast.success("Sepete eklendi"); }}
              className="flex-1 flex items-center justify-center gap-2 bg-brand-cta text-white font-semibold tracking-wider text-sm py-4 rounded-full hover:opacity-90 transition"
            >
              <ShoppingCart className="w-4 h-4" /> +SEPETE EKLE
            </button>
            <button
              onClick={() => toggleFav(product.id)}
              aria-label="Favori"
              className={`px-6 py-4 rounded-full border border-brand-ink transition ${isFav(product.id) ? "bg-brand-ink text-white" : "text-brand-ink hover:bg-brand-ink hover:text-white"}`}
            >
              <Heart className={`w-4 h-4 ${isFav(product.id) ? "fill-current" : ""}`} />
            </button>
          </div>

          <a href={`https://wa.me/905466460244?text=${waMsg}`} target="_blank" rel="noreferrer" className="hidden md:block text-center w-full py-4 rounded-full bg-[#25D366] text-white text-sm tracking-widest font-semibold hover:opacity-90 transition mb-8">
            WHATSAPP İLE SİPARİŞ
          </a>

          <div className="grid grid-cols-3 gap-4 text-center pt-6 border-t border-border">
            <div><ShieldCheck className="w-5 h-5 mx-auto text-brand-ink mb-2" /><p className="text-[11px] text-muted-foreground tracking-wider">ORİJİNAL ÜRÜN</p></div>
            <div><Truck className="w-5 h-5 mx-auto text-brand-ink mb-2" /><p className="text-[11px] text-muted-foreground tracking-wider">ÜCRETSİZ KARGO</p></div>
            <div><RefreshCcw className="w-5 h-5 mx-auto text-brand-ink mb-2" /><p className="text-[11px] text-muted-foreground tracking-wider">ŞEFFAF KARGO & KAPIDA ÖDEME</p></div>
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

      {/* Mobile sticky bottom bar */}
      <div className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.08)] px-3 py-3 flex gap-2 pb-[calc(env(safe-area-inset-bottom,0)+0.75rem)]">
        <button
          onClick={() => { add({ product_id: product.id, slug: product.slug, name: product.name, image: product.image, price: product.price, stock: product.stock }); toast.success("Sepete eklendi"); }}
          className="flex-1 flex items-center justify-center gap-2 bg-brand-cta text-white font-semibold tracking-wider text-sm py-3.5 rounded-full"
        >
          <ShoppingCart className="w-4 h-4" /> SEPETE EKLE
        </button>
        <a href={`https://wa.me/905466460244?text=${waMsg}`} target="_blank" rel="noreferrer" className="flex items-center justify-center px-5 py-3.5 rounded-full bg-[#25D366] text-white text-xs tracking-widest font-semibold">
          WHATSAPP
        </a>
      </div>
      <div className="md:hidden h-20" />
    </div>
  );
}
