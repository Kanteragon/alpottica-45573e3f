import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

export function StaticPage({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["page", slug],
    queryFn: async () => {
      const { data } = await supabase.from("pages").select("title,content").eq("slug", slug).maybeSingle();
      return data;
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-20" />
      <div className="max-w-4xl mx-auto px-6 lg:px-10 py-16">
        {isLoading ? (
          <p className="text-muted-foreground">Yükleniyor…</p>
        ) : (
          <>
            <h1 className="font-display text-5xl text-brand-ink mb-8">{data?.title ?? "Sayfa"}</h1>
            <div
              className="prose prose-neutral max-w-none prose-headings:font-display prose-headings:text-brand-ink prose-a:text-brand-cta"
              dangerouslySetInnerHTML={{ __html: data?.content ?? "<p>Bu sayfanın içeriği henüz eklenmedi.</p>" }}
            />
          </>
        )}
      </div>
      <Footer />
    </div>
  );
}
