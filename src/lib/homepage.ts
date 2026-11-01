import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchProducts } from "@/lib/queries";
import { mapDbProduct, type DbProduct } from "@/lib/products";
import { resolveSeriesImage, seriesFilter } from "@/lib/showcase-image";

export type HomeSection = {
  key: string;
  label: string;
  sort_order: number;
  is_active: boolean;
};

export type ShowcaseCategory = {
  id: string;
  title: string;
  tag: string;
  image_url: string;
  product_id?: string | null;
  href: string;
  sort_order: number;
  is_active: boolean;
};

export const DEFAULT_SECTIONS: HomeSection[] = [
  { key: "hero", label: "Slider (Hero)", sort_order: 1, is_active: true },
  { key: "features", label: "Özellik Şeridi", sort_order: 2, is_active: true },
  { key: "categories", label: "Kategori Vitrini", sort_order: 3, is_active: false },
  { key: "products", label: "Öne Çıkan Ürünler", sort_order: 4, is_active: true },
];

export const DEFAULT_SHOWCASE: Omit<ShowcaseCategory, "id">[] = [
  { title: "Klipsli Modeller", tag: "YENİ SERİ", image_url: "", href: "/urunler?tag=klipsli", sort_order: 1, is_active: true },
  { title: "Outlet Modeller", tag: "%30'A VARAN İNDİRİM", image_url: "", href: "/urunler?tag=outlet", sort_order: 2, is_active: true },
  { title: "Tüm Modeller", tag: "HEPSİNİ KEŞFET", image_url: "", href: "/urunler?tag=tumu", sort_order: 3, is_active: true },
];

export function useHomepageSections() {
  return useQuery({
    queryKey: ["homepage_sections"],
    queryFn: async (): Promise<HomeSection[]> => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error || !data || (data as unknown[]).length === 0) return DEFAULT_SECTIONS;
      return (data as unknown as HomeSection[]).map((s) => ({
        key: s.key,
        label: s.label,
        sort_order: s.sort_order,
        is_active: s.is_active,
      }));
    },
    staleTime: 60_000,
  });
}

export function useShowcaseCategories() {
  return useQuery({
    queryKey: ["showcase_categories"],
    queryFn: async (): Promise<ShowcaseCategory[]> => {
      const { data, error } = await supabase
        .from("showcase_categories")
        .select("*")
        .order("sort_order", { ascending: true });
      if (error || !data) return [];
      return data as unknown as ShowcaseCategory[];
    },
    staleTime: 60_000,
  });
}

export function useSeriesImage(card: Pick<ShowcaseCategory, "href" | "image_url" | "product_id">) {
  return useQuery({
    queryKey: ["series-image", card.href, card.image_url, card.product_id],
    queryFn: async () => {
      if (card.image_url) return resolveSeriesImage(card.image_url, []);
      if (card.product_id) {
        const { data, error } = await supabase.from("products").select("*").eq("id", card.product_id).eq("aktif", true).gt("stok_adedi", 0).maybeSingle();
        if (error) throw error;
        return resolveSeriesImage("", data ? [mapDbProduct(data as DbProduct)] : [], card.product_id);
      }
      const { slug, ...filter } = seriesFilter(card.href);
      if (slug) {
        const { data, error } = await supabase.from("categories").select("id").eq("slug", slug).maybeSingle();
        if (error) throw error;
        if (!data) return resolveSeriesImage("", []);
        filter.kategori_id = data.id;
      }
      const products = await fetchProducts(filter, { shuffle: false });
      return resolveSeriesImage("", products);
    },
    staleTime: 60_000,
  });
}
