import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import slideKlips from "@/assets/slide-klips.jpg";
import slidePilota from "@/assets/slide-pilota.jpg";
import slideOutlet from "@/assets/slide-outlet.jpg";

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  highlight?: string;
  image: string;
};

const SLIDES: Slide[] = [
  {
    eyebrow: "YENİ SERİ",
    title: "KLİPSLİLER",
    body: "Aynı çerçevede hem polarize hem antifar filtreleri kullanarak numaralı veya mavi ışık korumalı gözlüğünüzü birçok farklı tarzda kullanma imkânı sunuyoruz.",
    highlight: "%30'a varan indirimlerden yararlan",
    image: slideKlips,
  },
  {
    eyebrow: "YENİ ÜRÜN",
    title: "PİLOTA",
    body: "Zamansız pilot çerçeve tasarımı; polarize ve antifar klipsleriyle her ortamda tek gözlükte tam koruma.",
    highlight: "Sınırlı stok — hemen keşfet",
    image: slidePilota,
  },
  {
    eyebrow: "OUTLET",
    title: "SEZON SONU",
    body: "Seçili modellerde büyük fırsatlar. Alpottica kalitesi, outlet fiyatlarıyla sadece burada.",
    highlight: "Tüm outlet modellerde net indirim",
    image: slideOutlet,
  },
];

export function HeroSlider() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const go = (n: number) => setIdx((n + SLIDES.length) % SLIDES.length);

  return (
    <section className="relative w-full h-screen min-h-[720px] overflow-hidden bg-brand-sand">
      {SLIDES.map((s, i) => (
        <div
          key={s.title}
          className={`absolute inset-0 transition-opacity duration-[1200ms] ease-out ${
            i === idx ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          aria-hidden={i !== idx}
        >
          <img
            src={s.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
            width={1920}
            height={1080}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-transparent" />

          <div className="relative z-10 h-full max-w-[1600px] mx-auto px-6 lg:px-16 flex items-center">
            <div className="max-w-2xl text-white pt-24">
              <p
                className={`text-sm md:text-base tracking-[0.5em] font-light mb-6 transition-all duration-1000 ${
                  i === idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                {s.eyebrow}
              </p>
              <h1
                className={`font-display text-[15vw] md:text-[8rem] lg:text-[10rem] leading-[0.9] font-normal mb-8 drop-shadow-[0_4px_30px_rgba(0,0,0,0.3)] transition-all duration-1000 delay-150 ${
                  i === idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                }`}
              >
                {s.title}
              </h1>
              <p
                className={`text-base md:text-lg text-white/90 max-w-lg leading-relaxed mb-6 transition-all duration-1000 delay-300 ${
                  i === idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                {s.body}
              </p>
              {s.highlight && (
                <p
                  className={`text-sm tracking-[0.25em] uppercase text-white/80 mb-10 transition-all duration-1000 delay-500 ${
                    i === idx ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {s.highlight}
                </p>
              )}
              <div
                className={`flex flex-wrap gap-3 transition-all duration-1000 delay-700 ${
                  i === idx ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
                }`}
              >
                <button className="px-7 py-3.5 rounded-full bg-brand-cta text-white text-sm font-semibold tracking-wider hover:opacity-90 transition shadow-lg">
                  +SEPETİNE EKLE
                </button>
                <button className="px-7 py-3.5 rounded-full bg-white text-brand-ink text-sm font-semibold tracking-wider hover:bg-white/90 transition shadow-lg">
                  ŞİMDİ SATIN AL
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Arrows */}
      <button
        onClick={() => go(idx - 1)}
        aria-label="Önceki"
        className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white flex items-center justify-center hover:bg-white/25 transition"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={() => go(idx + 1)}
        aria-label="Sonraki"
        className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white flex items-center justify-center hover:bg-white/25 transition"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIdx(i)}
            aria-label={`Slide ${i + 1}`}
            className={`h-1.5 rounded-full transition-all ${
              i === idx ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
