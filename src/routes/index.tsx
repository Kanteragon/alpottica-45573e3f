import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { HeroSlider } from "@/components/HeroSlider";
import { FeatureStrip } from "@/components/FeatureStrip";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { CategoryShowcase } from "@/components/CategoryShowcase";
// import { TryOnGame } from "@/components/TryOnGame";
import { Footer } from "@/components/Footer";
import { MaintenancePage } from "@/components/MaintenancePage";
import { useSiteSettings } from "@/lib/settings";
import { useHomepageSections } from "@/lib/homepage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alpottica Istanbul | Klipsli & Polarize Güneş Gözlüğü Modelleri" },
      {
        name: "description",
        content:
          "Alpottica Istanbul: klipsli, polarize ve antifar filtreli premium gözlük koleksiyonu. Tek çerçevede birçok tarz, %30'a varan indirimler.",
      },
      { name: "keywords", content: "alpottica, alpottica istanbul, klipsli gözlük, klipsli modeller, güneş gözlüğü, polarize güneş gözlüğü, antifar gözlük, outlet gözlük" },
      { property: "og:title", content: "Alpottica Istanbul | Klipsli & Polarize Güneş Gözlüğü Modelleri" },
      { property: "og:url", content: "https://alpottica.lovable.app/" },
      { name: "twitter:title", content: "Alpottica Istanbul | Klipsli & Polarize Güneş Gözlüğü" },
      {
        property: "og:description",
        content:
          "Alpottica Istanbul: klipsli, polarize ve antifar filtreli premium gözlük koleksiyonu. Tek çerçevede birçok tarz, %30'a varan indirimler.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://alpottica.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Alpottica Istanbul",
          url: "https://alpottica.lovable.app",
          potentialAction: {
            "@type": "SearchAction",
            target: "https://alpottica.lovable.app/urunler?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }),
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { data: settings, isLoading } = useSiteSettings();
  const { data: sections } = useHomepageSections();
  if (isLoading) return <div className="min-h-svh bg-background" />;
  if (settings?.maintenance_mode === true) return <MaintenancePage />;

  const SECTION_COMPONENTS: Record<string, React.ComponentType> = {
    hero: HeroSlider,
    features: FeatureStrip,
    
    products: FeaturedProducts,
  };
  const ordered = (sections ?? [])
    .filter((s) => s.is_active && SECTION_COMPONENTS[s.key])
    .sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="bg-background text-foreground">
      <Navbar />
      {ordered.map((s) => {
        const Cmp = SECTION_COMPONENTS[s.key];
        return <Cmp key={s.key} />;
      })}
      {/* <TryOnGame /> */}
      <Footer />
    </div>
  );
}
