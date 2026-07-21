import { ShieldCheck, Truck, RefreshCcw, Sparkles } from "lucide-react";

const ITEMS = [
  { icon: ShieldCheck, title: "Polarize & Antifar", desc: "Her ortamda tam koruma" },
  { icon: Sparkles, title: "Premium Malzeme", desc: "Hafif metal & TR90 çerçeveler" },
  { icon: Truck, title: "Ücretsiz Kargo", desc: "Türkiye geneli 1-3 iş günü" },
  { icon: RefreshCcw, title: "14 Gün İade", desc: "Koşulsuz değişim garantisi" },
];

export function FeatureStrip() {
  return (
    <section className="bg-white border-y border-border">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        {ITEMS.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-full bg-brand-sand/60 flex items-center justify-center shrink-0">
              <Icon className="w-5 h-5 text-brand-ink" />
            </div>
            <div>
              <p className="text-sm font-semibold text-brand-ink">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
