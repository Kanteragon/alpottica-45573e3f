import slideKlips from "@/assets/slide-klips.jpg";
import slideOutlet from "@/assets/slide-outlet.jpg";
import slideAll from "@/assets/slide-pilota.jpg";

const CATS = [
  { title: "Klipsli Modeller", tag: "YENİ SERİ", image: slideKlips, href: "/urunler?tag=klipsli" },
  { title: "Outlet Modeller", tag: "%30'A VARAN İNDİRİM", image: slideOutlet, href: "/kategori/outlet" },
  { title: "Tüm Modeller", tag: "HEPSİNİ KEŞFET", image: slideAll, href: "/urunler" },
];

export function CategoryShowcase() {
  return (
    <section className="bg-background py-24">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs tracking-[0.4em] text-muted-foreground mb-3">KOLEKSİYON</p>
            <h2 className="font-display text-5xl md:text-6xl text-brand-ink">Öne Çıkan Seriler</h2>
          </div>
          <a
            href="/urunler"
            className="hidden md:inline text-sm tracking-widest text-brand-ink hover:text-brand-cta transition"
          >
            TÜMÜNÜ GÖR →
          </a>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {CATS.map((c) => (
            <a
              key={c.title}
              href={c.href}
              className="group relative aspect-[4/5] overflow-hidden rounded-2xl bg-brand-sand"
            >
              <img
                src={c.image}
                alt={c.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
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
  );
}
