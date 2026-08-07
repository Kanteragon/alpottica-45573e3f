import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { mapDbProduct, type Product, type DbProduct } from "@/lib/products";

const PRODUCT_COLS =
  "id,slug,stok_kodu,urun_adi,aciklama,satis_fiyati,liste_fiyati,stok_adedi,resimler,ozellikler,etiketler,kategori_id,marka_id,variant_group_id,seo_title,seo_description,seo_keywords";

export type ProductFilter = {
  tag?: string;
  q?: string;
  kategori_id?: string | null;
  marka_id?: string | null;
  minPrice?: number;
  maxPrice?: number;
  color?: string;
  size?: string;
};

export async function fetchProducts(filter: ProductFilter = {}): Promise<Product[]> {
  let orderMap: Record<string, number> | null = null;
  let q = supabase.from("products").select(PRODUCT_COLS).order("created_at", { ascending: false });
  if (filter.tag && filter.tag !== "tumu") {
    // Match by tag OR by a category whose slug/name matches the tag (Excel categories)
    const { data: cats } = await supabase
      .from("categories")
      .select("id,name,slug")
      .or(`slug.ilike.%${filter.tag}%,name.ilike.%${filter.tag}%`);
    const catIds = (cats ?? []).map((c) => c.id as string);
    let ids: string[] = [];
    if (catIds.length) {
      const { data: pcs } = await supabase
        .from("product_categories")
        .select("product_id,sira")
        .in("category_id", catIds)
        .order("sira");
      ids = Array.from(new Set((pcs ?? []).map((r) => r.product_id as string)));
      orderMap = {};
      (pcs ?? []).forEach((r, i) => {
        const pid = r.product_id as string;
        if (orderMap![pid] === undefined) orderMap![pid] = Number((r as { sira?: number }).sira ?? i);
      });
    }
    const parts = [`etiketler.cs.{${filter.tag}}`];
    if (catIds.length) parts.push(`kategori_id.in.(${catIds.join(",")})`);
    if (ids.length) parts.push(`id.in.(${ids.join(",")})`);
    q = q.or(parts.join(","));
  }
  let shuffleResult = false;
  if (filter.kategori_id) {
    const { data: catRow } = await supabase
      .from("categories")
      .select("rastgele_sirala")
      .eq("id", filter.kategori_id)
      .maybeSingle();
    shuffleResult = Boolean((catRow as { rastgele_sirala?: boolean } | null)?.rastgele_sirala);

    const { data: pcs } = await supabase
      .from("product_categories")
      .select("product_id,sira")
      .eq("category_id", filter.kategori_id)
      .order("sira");
    orderMap = {};
    (pcs ?? []).forEach((r, i) => {
      orderMap![r.product_id as string] = Number((r as { sira?: number }).sira ?? i);
    });
    const ids = Array.from(new Set((pcs ?? []).map((r) => r.product_id as string)));
    if (ids.length > 0) {
      q = q.or(`kategori_id.eq.${filter.kategori_id},id.in.(${ids.join(",")})`);
    } else {
      q = q.eq("kategori_id", filter.kategori_id);
    }
  }

  if (filter.marka_id) q = q.eq("marka_id", filter.marka_id);
  if (filter.minPrice != null) q = q.gte("satis_fiyati", filter.minPrice);
  if (filter.maxPrice != null) q = q.lte("satis_fiyati", filter.maxPrice);
  if (filter.q) q = q.ilike("urun_adi", `%${filter.q}%`);
  const { data, error } = await q.limit(1000);
  if (error) throw error;
  let list = (data as unknown as DbProduct[]).map(mapDbProduct);
  if (filter.color) list = list.filter((p) => p.color.toLowerCase() === filter.color!.toLowerCase());
  if (filter.size) list = list.filter((p) => String(p.size) === String(filter.size));
  if (shuffleResult) {
    list = [...list].sort(() => Math.random() - 0.5);
  } else if (orderMap) {
    const om = orderMap;
    list = [...list].sort((a, b) => (om[a.id] ?? 9999) - (om[b.id] ?? 9999));
  }
  return list;
}

export function useProducts(filter: ProductFilter = {}, options: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ["products", filter],
    queryFn: () => fetchProducts(filter),
    enabled: options.enabled ?? true,
  });
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLS)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? mapDbProduct(data as unknown as DbProduct) : null;
}

export function useProduct(slug: string) {
  return useQuery({
    queryKey: ["product", slug],
    queryFn: () => fetchProductBySlug(slug),
    enabled: !!slug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,slug,sort,rastgele_sirala")
        .order("sort");
      if (error) throw error;
      return data;
    },
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase.from("brands").select("id,name,slug").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useMenu() {
  return useQuery({
    queryKey: ["menu"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_items")
        .select("id,label,url,sira")
        .eq("aktif", true)
        .order("sira");
      if (error) throw error;
      return data;
    },
  });
}

export function useSliders() {
  return useQuery({
    queryKey: ["sliders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sliders")
        .select("*")
        .eq("aktif", true)
        .order("sira");
      if (error) throw error;
      return data;
    },
  });
}

export function useShowcase() {
  return useQuery({
    queryKey: ["showcase"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("showcase_items")
        .select(`id,sira,product:products(${PRODUCT_COLS})`)
        .order("sira");
      if (error) throw error;
      return (data ?? [])
        .filter((r: { product: DbProduct | null }) => r.product && (r.product as DbProduct).stok_adedi > 0)
        .map((r: { product: DbProduct | null }) => mapDbProduct(r.product as DbProduct));
    },
  });
}

export type AttributeDef = {
  id: string; ad: string; slug: string; degerler: string[];
  filterable: boolean; show_in_detail: boolean; sira: number;
};

export function useAttributes() {
  return useQuery({
    queryKey: ["attrs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_attributes").select("*").order("sira");
      if (error) throw error;
      return (data ?? []) as AttributeDef[];
    },
  });
}
