import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSliders } from "@/lib/queries";
import slideKlips from "@/assets/slide-klips.jpg";
import slidePilota from "@/assets/slide-pilota.jpg";
import slideOutlet from "@/assets/slide-outlet.jpg";

type Slide = {
  id: string; gorsel: string; buton_link: string;
};

const FALLBACK: Slide[] = [
  { id: "k", gorsel: slideKlips, buton_link: "/urunler?tag=klipsli" },
  { id: "p", gorsel: slidePilota, buton_link: "/urunler" },
  { id: "o", gorsel: slideOutlet, buton_link: "/urunler?tag=outlet" },
];

function useDevice(): "mobile" | "tablet" | "desktop" {
  const [d, setD] = useState<"mobile" | "tablet" | "desktop">(
    typeof window === "undefined" ? "desktop" : window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop",
  );
  useEffect(() => {
    const on = () => setD(window.innerWidth < 640 ? "mobile" : window.innerWidth < 1024 ? "tablet" : "desktop");
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return d;
}

export function HeroSlider() {
  const { data } = useSliders();
  const device = useDevice();

  const slides: Slide[] = data && data.length
    ? data
        .filter((s) => {
          if (device === "mobile") return s.show_mobile ?? true;
          if (device === "tablet") return s.show_tablet ?? true;
          return s.show_desktop ?? true;
        })
        .map((s) => ({
          id: s.id,
          gorsel: s.gorsel?.startsWith("/hero-")
            ? (s.gorsel.includes("klips") ? slideKlips : s.gorsel.includes("pilota") ? slidePilota : slideOutlet)
            : s.gorsel,
          buton_link: s.buton_link ?? "/urunler",
        }))
    : FALLBACK;

  const list = slides.length ? slides : FALLBACK;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx >= list.length) setIdx(0);
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 6000);
    return () => clearInterval(t);
  }, [list.length, idx]);

  const go = (n: number) => setIdx((n + list.length) % list.length);

  return (
    <section className="relative w-screen h-screen overflow-hidden bg-brand-sand">
      {list.map((s, i) => (
        <a
          key={s.id}
          href={s.buton_link || "/urunler"}
          className={`absolute inset-0 block transition-opacity duration-[1200ms] ease-out ${i === idx ? "opacity-100 z-10" : "opacity-0 pointer-events-none"}`}
        >
          <img
            src={s.gorsel}
            alt=""
            className="absolute inset-0 w-full h-full object-contain"
            loading={i === 0 ? "eager" : "lazy"}
          />
        </a>
      ))}

      <button onClick={() => go(idx - 1)} aria-label="Önceki" className="absolute left-4 lg:left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white flex items-center justify-center hover:bg-white/25 transition">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button onClick={() => go(idx + 1)} aria-label="Sonraki" className="absolute right-4 lg:right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white flex items-center justify-center hover:bg-white/25 transition">
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {list.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-10 bg-white" : "w-4 bg-white/40 hover:bg-white/60"}`} />
        ))}
      </div>
    </section>
  );
}
