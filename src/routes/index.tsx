import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/Navbar";
import { HeroSlider } from "@/components/HeroSlider";
import { FeatureStrip } from "@/components/FeatureStrip";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { CategoryShowcase } from "@/components/CategoryShowcase";
import { Footer } from "@/components/Footer";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Alpottica Istanbul — Klipsli & Polarize Gözlükler" },
      {
        name: "description",
        content:
          "Alpottica Istanbul: klipsli, polarize ve antifar filtreli premium gözlük koleksiyonu. Tek çerçevede birçok tarz, %30'a varan indirimler.",
      },
      { property: "og:title", content: "Alpottica Istanbul — Klipsli & Polarize Gözlükler" },
      {
        property: "og:description",
        content: "Zamansız çerçeveler, polarize ve antifar klips sistemleriyle tam koruma.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
      <FeaturedProducts />
      <CategoryShowcase />
      <Footer />
    </div>
  );
}
