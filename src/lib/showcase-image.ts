import type { Product } from "@/lib/products";

export function resolveSeriesImage(customImage: string, products: Pick<Product, "id" | "stock" | "images">[], productId?: string | null) {
  if (customImage) return { image: customImage, productId: null };
  const product = productId ? products.find((p) => p.id === productId && p.stock > 0) : products.find((p) => p.stock > 0);
  return { image: product?.images[0] ?? "", productId: product?.id ?? null };
}

export function seriesFilter(href: string) {
  const url = new URL(href || "/urunler", "https://alpottica.invalid");
  return {
    tag: url.searchParams.get("tag") ?? undefined,
    kategori_id: url.searchParams.get("kategori") ?? undefined,
    marka_id: url.searchParams.get("marka") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    slug: url.pathname === "/urunler" || url.pathname === "/" ? undefined : decodeURIComponent(url.pathname.split("/").filter(Boolean).pop() ?? ""),
  };
}