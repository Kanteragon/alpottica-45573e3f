import { useShowcaseCategories, DEFAULT_SHOWCASE } from "@/lib/homepage";

const FALLBACK_IMAGES: Record<string, string> = {};

export function CategoryShowcase() {
  const { data } = useShowcaseCategories();
  const cats = (data && data.length > 0 ? data : DEFAULT_SHOWCASE.map((c, i) => ({ ...c, id: `d${i}` }))).filter(
    (c) => c.is_active,
  );

  return (
    <!--This is a comment. Comments are not displayed in the browser
    <section className="bg-background py-10 sm:py-14">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-6 sm:mb-8">
          <div>
            <p className="text-[11px] tracking-[0.4em] text-muted-foreground mb-2">KOLEKSİYON</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-brand-ink">Öne Çıkan Seriler</h2>
          </div>
          <a
            href="/urunler"
            className="hidden md:inline text-sm tracking-widest text-brand-ink hover:text-brand-cta transition"
          >
            TÜMÜNÜ GÖR →
          </a>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {cats.map((c) => (
            <a
              key={c.id}
              href={c.href}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand-sand"
            >
              {c.image_url || FALLBACK_IMAGES[c.title] ? (
                <img
                  src={c.image_url || FALLBACK_IMAGES[c.title]}
                  alt={c.title}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-brand-sand" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-7 text-white">
                <p className="text-[11px] tracking-[0.35em] text-white/80 mb-2">{c.tag}</p>
                <h3 className="font-display text-4xl">{c.title}</h3>
                <span className="mt-4 inline-block text-sm tracking-widest border-b border-white/60 pb-1 opacity-90 group-hover:opacity-100">
                  KEŞFET
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
      -->

  );
}
