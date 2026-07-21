import productsData from "@/data/products.json";

export type Product = {
  id: string;
  sku: string;
  name: string;
  price: number;
  listPrice: number;
  stock: number;
  image: string;
  images: string[];
  color: string;
  lensColor: string;
  size: string;
  slug: string;
  tags: string[];
};

export const products = productsData as Product[];

export function formatTL(n: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

export function discountPct(p: Product): number | null {
  if (p.listPrice > p.price && p.listPrice > 0) {
    return Math.round(((p.listPrice - p.price) / p.listPrice) * 100);
  }
  return null;
}

export function filterProducts(tag?: string, q?: string): Product[] {
  let list = products;
  if (tag && tag !== "tumu") list = list.filter((p) => p.tags.includes(tag));
  if (q) {
    const s = q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(s) ||
        p.color.toLowerCase().includes(s) ||
        p.sku.toLowerCase().includes(s),
    );
  }
  return list;
}

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}
