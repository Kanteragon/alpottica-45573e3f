import { useShowcaseCategories, DEFAULT_SHOWCASE } from "@/lib/homepage";
import klipsImage from "@/assets/slide-klips.jpg";
import outletImage from "@/assets/slide-outlet.jpg";
import pilotaImage from "@/assets/slide-pilota.jpg";
import { ArrowUpRight } from "lucide-react";

const FALLBACK_IMAGES = [klipsImage, outletImage, pilotaImage];

export function CategoryShowcase() {
  const { data } = useShowcaseCategories();
  const cats = (data && data.length > 0 ? data : DEFAULT_SHOWCASE.map((c, i) => ({ ...c, id: `d${i}` }))).filter(
    (c) => c.is_active,
  );

  if (cats.length === 0) return null;

  return (
    <section className="bg-background py-10 sm:py-14" data-homepage-section="categories">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10">
        <h2 className="font-display text-3xl text-foreground mb-8">Öne Çıkan Seriler</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cats.map((c, i) => (
            <a key={c.id} href={c.href} className="group block text-foreground">
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img src={c.image_url || FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]} alt={c.title} loading="lazy" decoding="async" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none" />
              </div>
              <div className="flex items-center justify-between gap-4 mt-4">
                <div><p className="text-xs text-muted-foreground mb-1">{c.tag}</p><h3 className="font-display text-2xl">{c.title}</h3></div>
                <ArrowUpRight className="w-5 h-5 shrink-0" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
