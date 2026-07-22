import { supabase } from "@/integrations/supabase/client";

const TEN_YEARS = 60 * 60 * 24 * 365 * 10;

export type UploadBucket = "product-images" | "slider-images";

function safeName(name: string) {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  const ext = dot > 0 ? name.slice(dot).toLowerCase() : "";
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${base || "img"}${ext}`;
}

export async function uploadImage(bucket: UploadBucket, file: File): Promise<string> {
  const path = safeName(file.name);
  const { error } = await supabase.storage.from(bucket).upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;
  const { data, error: signErr } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, TEN_YEARS);
  if (signErr || !data?.signedUrl) throw signErr ?? new Error("URL alınamadı");
  return data.signedUrl;
}

export async function uploadImages(bucket: UploadBucket, files: FileList | File[]): Promise<string[]> {
  const arr = Array.from(files);
  const out: string[] = [];
  for (const f of arr) out.push(await uploadImage(bucket, f));
  return out;
}
