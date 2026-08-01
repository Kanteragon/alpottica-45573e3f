import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

const SITE = "https://alpottica.lovable.app";

const STATIC_PATHS = [
  "/",
  "/urunler",
  "/hakkimizda",
  "/iletisim",
  "/kullanim-kosullari",
  "/gizlilik-sozlesmesi",
  "/uyelik-sozlesmesi",
];

function urlEntry(loc: string, lastmod?: string, priority = "0.7") {
  return `  <url>\n    <loc>${loc}</loc>${lastmod ? `\n    <lastmod>${lastmod.slice(0, 10)}</lastmod>` : ""}\n    <priority>${priority}</priority>\n  </url>`;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const entries: string[] = STATIC_PATHS.map((p) => urlEntry(`${SITE}${p}`, undefined, p === "/" ? "1.0" : "0.8"));
        try {
          const { data: products } = await supabase
            .from("products")
            .select("slug,updated_at,stok_adedi,aktif")
            .eq("aktif", true)
            .gt("stok_adedi", 0)
            .limit(5000);
          for (const p of products ?? []) {
            entries.push(urlEntry(`${SITE}/urun/${p.slug}`, p.updated_at as string, "0.9"));
          }
          const { data: cats } = await supabase.from("categories").select("slug");
          for (const c of cats ?? []) {
            entries.push(urlEntry(`${SITE}/urunler?tag=${encodeURIComponent(c.slug)}`, undefined, "0.7"));
          }
        } catch {
          /* sitemap should never fail hard */
        }
        const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;
        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
        });
      },
    },
  },
});
