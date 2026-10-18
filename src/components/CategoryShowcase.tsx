import { useShowcaseCategories, DEFAULT_SHOWCASE } from "@/lib/homepage";

const FALLBACK_IMAGES: Record<string, string> = {};

export function CategoryShowcase() {
  const { data } = useShowcaseCategories();
  const cats = (data && data.length > 0 ? data : DEFAULT_SHOWCASE.map((c, i) => ({ ...c, id: `d${i}` }))).filter(
    (c) => c.is_active,
  );

  return (
    
  );
}
