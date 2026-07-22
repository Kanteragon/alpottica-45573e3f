import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { formatTL } from "@/lib/products";

export const Route = createFileRoute("/hesabim")({
  head: () => ({
    meta: [
      { title: "Hesabım — Alpottica" },
      { name: "description", content: "Siparişleriniz ve hesap bilgileriniz." },
    ],
  }),
  component: Account,
});

function Account() {
  const { user, loading, signOut, isAdmin } = useAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (!loading && !user) nav({ to: "/giris" });
  }, [loading, user, nav]);

  const { data: orders } = useQuery({
    queryKey: ["my-orders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,created_at,toplam,durum,odeme_tipi,ad_soyad,order_items(adet,birim_fiyat,urun_adi_snapshot)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-20" />
      <div className="max-w-[1000px] mx-auto px-6 lg:px-10 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-5xl text-brand-ink">Hesabım</h1>
            <p className="text-muted-foreground text-sm mt-2">{user.email}</p>
          </div>
          <div className="flex gap-3">
            {isAdmin && (
              <Link to="/admin" className="px-5 py-2 rounded-full bg-brand-ink text-white text-sm">Admin Paneli</Link>
            )}
            <button onClick={() => signOut().then(() => nav({ to: "/" }))} className="px-5 py-2 rounded-full border text-sm">Çıkış</button>
          </div>
        </div>

        <h2 className="font-display text-2xl text-brand-ink mb-4">Siparişlerim</h2>
        {!orders || orders.length === 0 ? (
          <p className="text-muted-foreground">Henüz siparişiniz yok.</p>
        ) : (
          <div className="space-y-4">
            {orders.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border p-5">
                <div className="flex flex-wrap justify-between mb-3 gap-2 items-center">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                    <p className="text-sm">{new Date(o.created_at).toLocaleString("tr-TR")}</p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-brand-sand text-xs tracking-widest uppercase">{o.durum}</span>
                </div>
                <div className="text-sm text-muted-foreground space-y-1 mb-3">
                  {o.order_items?.map((it, idx: number) => (
                    <div key={idx}>{it.urun_adi_snapshot} × {it.adet} — {formatTL(Number(it.birim_fiyat))}</div>
                  ))}
                </div>
                <div className="flex justify-between items-center pt-3 border-t">
                  <span className="text-xs uppercase tracking-widest text-muted-foreground">Kapıda {o.odeme_tipi === "nakit" ? "Nakit" : "Kartla"} Ödeme</span>
                  <span className="font-semibold text-brand-ink">{formatTL(Number(o.toplam))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
