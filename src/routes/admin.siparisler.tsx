import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTL } from "@/lib/products";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";

export const Route = createFileRoute("/admin/siparisler")({ component: Orders });

const DURUMLAR = ["yeni", "hazirlaniyor", "kargoda", "teslim", "iptal"] as const;

function Orders() {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(id, adet, birim_fiyat, urun_adi_snapshot)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const updateStatus = async (id: string, durum: string) => {
    const { error } = await supabase.from("orders").update({ durum }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Durum güncellendi");
    qc.invalidateQueries({ queryKey: ["admin-orders"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-brand-ink mb-8">Siparişler ({orders.length})</h1>
      <div className="bg-white rounded-2xl border">
        {orders.length === 0 ? (
          <p className="p-8 text-center text-muted-foreground">Henüz sipariş yok.</p>
        ) : (
          <div className="divide-y">
            {orders.map((o) => (
              <div key={o.id} className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                    <p className="font-medium">{o.ad_soyad} — {o.telefon}</p>
                    <p className="text-sm text-muted-foreground">{o.email} · {new Date(o.created_at).toLocaleString("tr-TR")}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 bg-brand-sand rounded-full">{o.odeme_tipi === "nakit" ? "Kapıda Nakit" : "Kapıda Kart"}</span>
                    <span className="font-bold">{formatTL(Number(o.toplam))}</span>
                    <select value={o.durum} onChange={(e) => updateStatus(o.id, e.target.value)} className="border rounded-full px-3 py-1 text-sm">
                      {DURUMLAR.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                    <button onClick={() => setExpanded(expanded === o.id ? null : o.id)} className="p-2 hover:bg-brand-sand rounded">
                      {expanded === o.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                {expanded === o.id && (
                  <div className="mt-4 pt-4 border-t space-y-2 text-sm">
                    <p><strong>Adres:</strong> {o.adres}</p>
                    {o.notlar && <p><strong>Not:</strong> {o.notlar}</p>}
                    <div className="mt-2">
                      <p className="font-medium mb-1">Ürünler:</p>
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
