export type ProductImageFit = "current" | "contain" | "cover";

export function normalizeProductImageFit(value: unknown): ProductImageFit {
  return value === "contain" || value === "cover" ? value : "current";
}

export function focalPosition(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 50;
}

export function imagePosition(x: unknown, y: unknown): string {
  return `${focalPosition(x)}% ${focalPosition(y)}%`;
}

export function productImageClass(value: unknown): string {
  const fit = normalizeProductImageFit(value);
  return fit === "cover" ? "object-cover" : fit === "contain" ? "object-contain" : "object-contain p-1 sm:p-2";
}