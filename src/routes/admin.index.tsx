import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTL } from "@/lib/products";
import { Package, ShoppingBag, Users, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [prod, ord, users, revenue] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("toplam"),
      ]);
      const total = (revenue.data ?? []).reduce((s, r) => s + Number(r.toplam), 0);
      return {
        products: prod.count ?? 0,
        orders: ord.count ?? 0,
        users: users.count ?? 0,
        revenue: total,
      };
    },
  });

  const { data: recent } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("id,ad_soyad,toplam,durum,created_at").order("created_at", { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const cards = [
    { label: "Toplam Ürün", value: stats?.products, icon: Package, color: "bg-blue-100 text-blue-700" },
    { label: "Sipariş", value: stats?.orders, icon: ShoppingBag, color: "bg-green-100 text-green-700" },
    { label: "Müşteri", value: stats?.users, icon: Users, color: "bg-purple-100 text-purple-700" },
    { label: "Ciro", value: stats ? formatTL(stats.revenue) : "-", icon: TrendingUp, color: "bg-orange-100 text-orange-700" },
  ];

  return (
    <div>
      <h1 className="font-display text-4xl text-brand-ink mb-8">Kontrol Paneli</h1>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-10">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-6 border">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${c.color}`}><c.icon className="w-6 h-6" /></div>
            <p className="text-2xl font-bold text-brand-ink">{c.value ?? "-"}</p>
            <p className="text-sm text-muted-foreground mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border p-6">
        <h2 className="font-display text-2xl text-brand-ink mb-4">Son Siparişler</h2>
        {!recent || recent.length === 0 ? (
          <p className="text-muted-foreground text-sm">Henüz sipariş yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b">
              <tr><th className="py-2">No</th><th>Müşteri</th><th>Tutar</th><th>Durum</th><th>Tarih</th></tr>
            </thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id} className="border-b last:border-0">
                  <td className="py-3 font-mono text-xs">#{o.id.slice(0, 8)}</td>
                  <td>{o.ad_soyad}</td>
                  <td>{formatTL(Number(o.toplam))}</td>
                  <td><span className="px-2 py-1 bg-brand-sand rounded-full text-xs">{o.durum}</span></td>
                  <td className="text-muted-foreground">{new Date(o.created_at).toLocaleDateString("tr-TR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
