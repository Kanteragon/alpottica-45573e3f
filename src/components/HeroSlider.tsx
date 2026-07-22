import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSliders } from "@/lib/queries";
import slideKlips from "@/assets/slide-klips.jpg";
import slidePilota from "@/assets/slide-pilota.jpg";
import slideOutlet from "@/assets/slide-outlet.jpg";

const FALLBACK = [
  { id: "k", baslik: "KLİPSLİLER", alt_baslik: "Yeni seri klipsli koleksiyon", gorsel: slideKlips, buton_yazi: "HEMEN İNCELE", buton_link: "/urunler?tag=klipsli" },
  { id: "p", baslik: "PİLOTA", alt_baslik: "Yeni ürün — havayı kes", gorsel: slidePilota, buton_yazi: "KEŞFET", buton_link: "/urunler" },
  { id: "o", baslik: "OUTLET", alt_baslik: "Sezon sonu fırsatlar", gorsel: slideOutlet, buton_yazi: "OUTLETİ GÖR", buton_link: "/urunler?tag=outlet" },
];

export function HeroSlider() {
  const { data } = useSliders();
  const slides = data && data.length
    ? data.map((s) => ({
        id: s.id,
        baslik: s.baslik ?? "",
        alt_baslik: s.alt_baslik ?? "",
        gorsel: s.gorsel?.startsWith("/hero-") ? (s.gorsel.includes("klips") ? slideKlips : s.gorsel.includes("pilota") ? slidePilota : slideOutlet) : s.gorsel,
        buton_yazi: s.buton_yazi ?? "İNCELE",
        buton_link: s.buton_link ?? "/urunler",
      }))
    : FALLBACK;

  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % slides.length), 6000);
    return () => clearInterval(t);
  }, [slides.length]);

  const go = (n: number) => setIdx((n + slides.length) % slides.length);

  return (
    <section className="relative w-full h-screen min-h-[720px] overflow-hidden bg-brand-sand">
      {slides.map((s, i) => (
        <div
          key={s.id}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${i === idx ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        >
          <img src={s.gorsel} alt="" className="absolute inset-0 w-full h-full object-cover" loading={i === 0 ? "eager" : "lazy"} />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />
          <div className="relative z-10 h-full max-w-[1600px] mx-auto px-6 lg:px-16 flex items-center">
            <div className="max-w-2xl text-white pt-24">
              <p className={`text-sm md:text-base tracking-[0.5em] font-light mb-6 transition-all duration-1000 ${i === idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
                {s.alt_baslik}
              </p>
              <h1 className={`font-display text-[15vw] md:text-[8rem] lg:text-[10rem] leading-[0.9] mb-8 drop-shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-all duration-1000 delay-150 ${i === idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
                {s.baslik}
              </h1>
              <a
                href={s.buton_link}
                className={`inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-brand-cta text-white text-sm font-semibold tracking-wider hover:opacity-90 transition shadow-lg mt-6 ${i === idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}
              >
                {s.buton_yazi}
              </a>
            </div>
          </div>
        </div>
      ))}

      <button onClick={() => go(idx - 1)} aria-label="Önceki" className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white flex items-center justify-center hover:bg-white/25 transition">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button onClick={() => go(idx + 1)} aria-label="Sonraki" className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white flex items-center justify-center hover:bg-white/25 transition">
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/60"}`}
          />
        ))}
      </div>
    </section>
  );
}
