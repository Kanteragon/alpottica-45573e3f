import { supabase } from "@/integrations/supabase/client";

export const SITE_URL = "https://alpottica.lovable.app";

export type PageSeo = {
  title: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
} | null;

export async function loadPageSeo(slug: string): Promise<PageSeo> {
  try {
    const { data } = await supabase
      .from("pages")
      .select("title,seo_title,seo_description,seo_keywords")
      .eq("slug", slug)
      .maybeSingle();
    return (data as PageSeo) ?? null;
  } catch {
    return null;
  }
}

export function pageHead(data: PageSeo | undefined, slug: string, fallbackTitle: string, fallbackDesc: string) {
  const title = data?.seo_title?.trim() || (data?.title ? `${data.title} — Alpottica Istanbul` : fallbackTitle);
  const desc = data?.seo_description?.trim() || fallbackDesc;
  const url = `${SITE_URL}/${slug}`;
  const meta: { title?: string; name?: string; property?: string; content?: string }[] = [
    { title },
    { name: "description", content: desc },
    { property: "og:title", content: title },
    { property: "og:description", content: desc },
    { property: "og:type", content: "article" },
    { property: "og:url", content: url },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: desc },
  ];
  if (data?.seo_keywords?.trim()) meta.push({ name: "keywords", content: data.seo_keywords.trim() });
  return { meta, links: [{ rel: "canonical", href: url }] };
}
