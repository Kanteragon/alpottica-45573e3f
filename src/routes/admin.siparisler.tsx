import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTL } from "@/lib/products";
import { toast } from "sonner";
import { ChevronDown, ChevronUp, Package, Truck, CheckCircle2, XCircle, Clock, PackageOpen } from "lucide-react";

export const Route = createFileRoute("/admin/siparisler")({ component: Orders });

type OrderItem = { id: string; adet: number; birim_fiyat: number; urun_adi_snapshot: string };
type Order = {
  id: string; ad_soyad: string; telefon: string; email: string;
  created_at: string; adres: string; notlar: string | null;
  sehir?: string | null; ilce?: string | null; mahalle?: string | null; posta_kodu?: string | null;
  odeme_tipi: string; toplam: number; durum: string;
  order_items?: OrderItem[];
};

const STATUS: Record<string, { label: string; icon: typeof Clock; bg: string; text: string; dot: string }> = {
  yeni: { label: "Yeni", icon: Clock, bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  hazirlaniyor: { label: "Hazırlanıyor", icon: PackageOpen, bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
  kargoda: { label: "Kargoda", icon: Truck, bg: "bg-indigo-50", text: "text-indigo-700", dot: "bg-indigo-500" },
  teslim: { label: "Teslim Edildi", icon: CheckCircle2, bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  iptal: { label: "İptal", icon: XCircle, bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
};

function StatusSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = STATUS[value] ?? STATUS.yeni;
  const Icon = current.icon;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs font-medium border ${current.bg} ${current.text} border-current/20 hover:shadow-sm transition min-w-[150px]`}
      >
        <span className={`w-2 h-2 rounded-full ${current.dot}`} />
        <Icon className="w-3.5 h-3.5" />
        <span className="flex-1 text-left">{current.label}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 z-30 bg-white rounded-xl shadow-lg border overflow-hidden min-w-[180px]">
          {Object.entries(STATUS).map(([key, s]) => {
            const I = s.icon;
            return (
              <button
                key={key}
                onMouseDown={() => { onChange(key); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2.5 text-xs hover:bg-brand-sand/40 text-left ${key === value ? "bg-brand-sand/30 font-medium" : ""}`}
              >
                <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                <I className="w-3.5 h-3.5" />
                {s.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Orders() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, adet, birim_fiyat, urun_adi_snapshot)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Order[];
    },
  });

  const updateStatus = async (id: string, durum: string) => {
    const { error } = await supabase.from("orders").update({ durum }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Durum güncellendi");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  const shown = filter === "all" ? orders : orders.filter((o) => o.durum === filter);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-4xl text-brand-ink">Siparişler ({shown.length})</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilter("all")} className={`px-3 py-1.5 rounded-full text-xs border ${filter === "all" ? "bg-brand-ink text-white border-brand-ink" : "bg-white"}`}>Tümü ({orders.length})</button>
          {Object.entries(STATUS).map(([k, s]) => {
            const count = orders.filter((o) => o.durum === k).length;
            return (
              <button key={k} onClick={() => setFilter(k)} className={`px-3 py-1.5 rounded-full text-xs border inline-flex items-center gap-1.5 ${filter === k ? `${s.bg} ${s.text} border-current/30` : "bg-white"}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} /> {s.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-white rounded-2xl border">
        {shown.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">Sipariş yok.</p>
        ) : (
          <div className="divide-y">
            {shown.map((o) => (
              <div key={o.id} className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                    <p className="font-medium">{o.ad_soyad} — {o.telefon}</p>
                    <p className="text-sm text-muted-foreground">{o.email} · {new Date(o.created_at).toLocaleString("tr-TR")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2.5 py-1 bg-brand-sand rounded-full">{o.odeme_tipi === "nakit" ? "Kapıda Nakit" : "Kapıda Kart"}</span>
                    <span className="font-bold text-lg">{formatTL(Number(o.toplam))}</span>
                    <StatusSelect value={o.durum} onChange={(v) => updateStatus(o.id, v)} />
                    <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="p-2 hover:bg-brand-sand rounded">
                      {expanded === o.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {expanded === o.id && (
                  <div className="mt-4 pt-4 border-t space-y-3 text-sm">
                    <div className="grid md:grid-cols-2 gap-3 bg-brand-sand/30 rounded-xl p-4">
                      <div>
                        <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Teslimat Adresi</p>
                        <p className="font-medium text-brand-ink">{o.ad_soyad}</p>
                        <p className="text-muted-foreground">{o.telefon}</p>
                        {(o.sehir || o.ilce) && (
                          <p className="mt-1">
                            <strong>{[o.mahalle, o.ilce, o.sehir].filter(Boolean).join(" / ")}</strong>
                            {o.posta_kodu && <span className="ml-2 text-muted-foreground">PK: {o.posta_kodu}</span>}
                          </p>
                        )}
                        <p className="mt-1">{o.adres}</p>
                      </div>
                      {o.notlar && (
                        <div>
                          <p className="text-[11px] uppercase tracking-widest text-muted-foreground mb-1">Not</p>
                          <p>{o.notlar}</p>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-medium mb-1 flex items-center gap-2"><Package className="w-4 h-4" /> Ürünler</p>
                      {o.order_items?.map((it) => (
                        <div key={it.id} className="flex justify-between py-1 text-muted-foreground">
                          <span>{it.urun_adi_snapshot} × {it.adet}</span>
                          <span>{formatTL(Number(it.birim_fiyat) * it.adet)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
