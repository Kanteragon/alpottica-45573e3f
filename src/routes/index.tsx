import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { HeroSlider } from "@/components/HeroSlider";
import { FeatureStrip } from "@/components/FeatureStrip";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { CategoryShowcase } from "@/components/CategoryShowcase";
// import { TryOnGame } from "@/components/TryOnGame";
import { Footer } from "@/components/Footer";

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
  return (
    <div className="bg-background text-foreground">
      <Navbar />
      <HeroSlider />
      <FeatureStrip />
      <CategoryShowcase />
      <FeaturedProducts />
      {/* <TryOnGame /> */}


      <Footer />
    </div>
  );
}
