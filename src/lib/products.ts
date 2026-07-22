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
  aciklama?: string | null;
  kategori_id?: string | null;
  marka_id?: string | null;
};

export type DbProduct = {
  id: string;
  slug: string;
  stok_kodu: string;
  urun_adi: string;
  aciklama: string | null;
  satis_fiyati: number | string;
  liste_fiyati: number | string;
  stok_adedi: number;
  resimler: string[] | null;
  ozellikler: unknown;
  etiketler: string[] | null;
  kategori_id?: string | null;
  marka_id?: string | null;
};

export function mapDbProduct(r: DbProduct): Product {
  const oz = (r.ozellikler ?? {}) as Record<string, string>;
  const images = r.resimler ?? [];
  return {
    id: r.id,
    sku: r.stok_kodu,
    name: r.urun_adi,
    price: Number(r.satis_fiyati) || 0,
    listPrice: Number(r.liste_fiyati) || 0,
    stock: r.stok_adedi ?? 0,
    image: images[0] || "",
    images,
    color: oz.renk || "",
    lensColor: oz.cam_rengi || "",
    size: oz.ekartman || "",
    slug: r.slug,
    tags: r.etiketler ?? [],
    aciklama: r.aciklama,
    kategori_id: r.kategori_id ?? null,
    marka_id: r.marka_id ?? null,
  };
}

export function formatTL(n: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

export function discountPct(p: Pick<Product, "price" | "listPrice">): number | null {
  if (p.listPrice > p.price && p.listPrice > 0) {
    return Math.round(((p.listPrice - p.price) / p.listPrice) * 100);
  }
  return null;
}
