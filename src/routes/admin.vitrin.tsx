import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/vitrin")({ component: Showcase });

function Showcase() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin-showcase"],
    queryFn: async () => (await supabase.from("showcase_items").select("id, sira, product:products(id, urun_adi, resimler, satis_fiyati)").order("sira")).data ?? [],
  });
  const [sku, setSku] = useState("");

  const add = async () => {
    if (!sku) return;
    const { data: p } = await supabase.from("products").select("id").eq("stok_kodu", sku).maybeSingle();
    if (!p) return toast.error("Ürün bulunamadı");
    await supabase.from("showcase_items").insert({ product_id: p.id, sira: items.length });
    setSku("");
    qc.invalidateQueries({ queryKey: ["admin-showcase"] });
  };

  const del = async (id: string) => {
    await supabase.from("showcase_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-showcase"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-brand-ink mb-8">Vitrin (Öne Çıkanlar)</h1>
      <div className="bg-white rounded-2xl border p-6 mb-6 flex gap-3">
        <input placeholder="Stok Kodu" value={sku} onChange={(e) => setSku(e.target.value)} className="border rounded-full px-4 py-2 flex-1" />
        <button onClick={add} className="bg-brand-ink text-white rounded-full px-5 py-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Vitrine Ekle</button>
      </div>
      <div className="bg-white rounded-2xl border divide-y">
        {items.map((i) => {
          const p = i.product as { id: string; urun_adi: string; resimler: string[] | null; satis_fiyati: number } | null;
          if (!p) return null;
          return (
            <div key={i.id} className="p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-sand/30 rounded overflow-hidden">
                {p.resimler?.[0] && <img src={p.resimler[0]} alt="" className="w-full h-full object-contain" />}
              </div>
              <div className="flex-1">
                <p className="font-medium">{p.urun_adi}</p>
                <p className="text-sm text-muted-foreground">Sıra: {i.sira}</p>
              </div>
              <button onClick={() => del(i.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
