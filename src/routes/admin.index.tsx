import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTL } from "@/lib/products";
import { Package, ShoppingBag, Users, TrendingUp, Eye, UserPlus, ShoppingCart, CalendarRange } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

const ymd = (d: Date) => {
  const t = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return t.toISOString().slice(0, 10);
};

const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return ymd(d);
};

const PRESETS: { key: string; label: string; days: number }[] = [
  { key: "today", label: "Bugün", days: 0 },
  { key: "7", label: "Son 7 Gün", days: 6 },
  { key: "30", label: "Son 30 Gün", days: 29 },
  { key: "90", label: "Son 90 Gün", days: 89 },
];

function Dashboard() {
  const [preset, setPreset] = useState("today");
  const [from, setFrom] = useState(ymd(new Date()));
  const [to, setTo] = useState(ymd(new Date()));

  const applyPreset = (key: string, days: number) => {
    setPreset(key);
    setFrom(daysAgo(days));
    setTo(ymd(new Date()));
  };

  const range = useMemo(() => {
    const start = new Date(`${from}T00:00:00`);
    const end = new Date(`${to}T00:00:00`);
    end.setDate(end.getDate() + 1);
    return { startIso: start.toISOString(), endIso: end.toISOString() };
  }, [from, to]);

  const rangeLabel = useMemo(
    () => (from === to ? new Date(`${from}T00:00:00`).toLocaleDateString("tr-TR") : `${new Date(`${from}T00:00:00`).toLocaleDateString("tr-TR")} — ${new Date(`${to}T00:00:00`).toLocaleDateString("tr-TR")}`),
    [from, to],
  );

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [prod, ord, users, revenue] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("orders").select("toplam").neq("durum", "iptal"),
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

  const { data: period } = useQuery({
    queryKey: ["admin-period", range.startIso, range.endIso],
    refetchInterval: 60_000,
    queryFn: async () => {
      const inRange = <T,>(q: T) =>
        (q as unknown as { gte: (c: string, v: string) => { lt: (c: string, v: string) => unknown } })
          .gte("created_at", range.startIso)
          .lt("created_at", range.endIso);

      const [visits, carts, signups, orders, revenue] = await Promise.all([
        inRange(supabase.from("site_events").select("session_id").eq("tip", "visit")) as Promise<{ data: { session_id: string | null }[] | null }>,
        inRange(supabase.from("site_events").select("id", { count: "exact", head: true }).eq("tip", "add_to_cart")) as Promise<{ count: number | null }>,
        inRange(supabase.from("profiles").select("id", { count: "exact", head: true })) as Promise<{ count: number | null }>,
        inRange(supabase.from("orders").select("id", { count: "exact", head: true })) as Promise<{ count: number | null }>,
        inRange(supabase.from("orders").select("toplam").neq("durum", "iptal")) as Promise<{ data: { toplam: number | string }[] | null }>,
      ]);
      const uniq = new Set((visits.data ?? []).map((v) => v.session_id ?? ""));
      return {
        visitors: uniq.size,
        pageviews: visits.data?.length ?? 0,
        carts: carts.count ?? 0,
        signups: signups.count ?? 0,
        orders: orders.count ?? 0,
        revenue: (revenue.data ?? []).reduce((s, r) => s + Number(r.toplam), 0),
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

  const periodCards = [
    { label: "Ziyaretçi", value: period?.visitors, sub: `${period?.pageviews ?? 0} sayfa görüntüleme`, icon: Eye, color: "bg-sky-100 text-sky-700" },
    { label: "Yeni Hesap", value: period?.signups, sub: "kayıt olan kullanıcı", icon: UserPlus, color: "bg-emerald-100 text-emerald-700" },
    { label: "Sepete Ekleme", value: period?.carts, sub: "ürün sepete eklendi", icon: ShoppingCart, color: "bg-amber-100 text-amber-700" },
    { label: "Sipariş", value: period?.orders, sub: "yeni sipariş", icon: ShoppingBag, color: "bg-rose-100 text-rose-700" },
    { label: "Ciro", value: period ? formatTL(period.revenue) : "-", sub: "iptaller hariç", icon: TrendingUp, color: "bg-orange-100 text-orange-700" },
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

      <div className="flex items-end justify-between flex-wrap gap-4 mb-4">
        <div>
          <h2 className="font-display text-2xl text-brand-ink">İstatistikler</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
            <CalendarRange className="w-3.5 h-3.5" /> {rangeLabel}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {PRESETS.map((p) => (
            <button
              key={p.key}
              onClick={() => applyPreset(p.key, p.days)}
              className={`px-3.5 py-1.5 rounded-full text-xs border transition ${preset === p.key ? "bg-brand-ink text-white border-brand-ink" : "bg-white hover:border-brand-ink"}`}
            >
              {p.label}
            </button>
          ))}
          <div className="flex items-center gap-1.5 bg-white border rounded-full px-3 py-1">
            <input type="date" value={from} max={to} onChange={(e) => { setFrom(e.target.value); setPreset("custom"); }} className="text-xs bg-transparent outline-none" />
            <span className="text-muted-foreground text-xs">—</span>
            <input type="date" value={to} min={from} max={ymd(new Date())} onChange={(e) => { setTo(e.target.value); setPreset("custom"); }} className="text-xs bg-transparent outline-none" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-5 mb-10">
        {periodCards.map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-6 border">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${c.color}`}><c.icon className="w-6 h-6" /></div>
            <p className="text-2xl font-bold text-brand-ink">{c.value ?? "-"}</p>
            <p className="text-sm text-muted-foreground mt-1">{c.label}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">{c.sub}</p>
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
