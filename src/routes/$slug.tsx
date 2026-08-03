import { createFileRoute, redirect, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

/**
 * Marka ve kategori kısa adresleri: /alpottica, /klipsli, /outlet ...
 * Slug'a göre ilgili filtreye yönlendirir.
 */
export const Route = createFileRoute("/$slug")({
  beforeLoad: async ({ params }) => {
    const slug = params.slug.toLowerCase();

    const { data: brand } = await supabase
      .from("brands")
      .select("id,slug")
      .ilike("slug", slug)
      .maybeSingle();
    if (brand?.id) throw redirect({ to: "/urunler", search: { marka: brand.id } });

    const { data: cat } = await supabase
      .from("categories")
      .select("id,slug,name")
      .or(`slug.ilike.${slug},name.ilike.${slug}`)
      .maybeSingle();
    if (cat?.id) throw redirect({ to: "/urunler", search: { kategori: cat.id } });

    const { data: fuzzy } = await supabase
      .from("categories")
      .select("id")
      .or(`slug.ilike.%${slug}%,name.ilike.%${slug}%`)
      .limit(1)
      .maybeSingle();
    if (fuzzy?.id) throw redirect({ to: "/urunler", search: { kategori: fuzzy.id } });

    throw redirect({ to: "/urunler", search: { tag: slug } });
  },
  component: () => null,
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="font-display text-4xl text-brand-ink">Sayfa bulunamadı</h1>
      <Link to="/urunler" className="underline text-brand-cta">
        Tüm modellere göz atın
      </Link>
    </div>
  ),
});
