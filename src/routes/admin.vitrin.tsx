import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, X, ChevronUp, ChevronDown, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/vitrin")({ component: Showcase });

type ShowcaseRow = {
  id: string;
  sira: number;
  product: { id: string; urun_adi: string; stok_kodu: string; resimler: string[] | null; satis_fiyati: number } | null;
};

function Showcase() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin-showcase"],
    queryFn: async () => {
      const { data } = await supabase
        .from("showcase_items")
        .select("id, sira, product:products(id, urun_adi, stok_kodu, resimler, satis_fiyati)")
        .order("sira");
      return (data ?? []) as unknown as ShowcaseRow[];
    },
  });
  const [pickerOpen, setPickerOpen] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-showcase"] });

  const addProducts = async (ids: string[]) => {
    if (!ids.length) return;
    const existing = new Set(items.map((i) => i.product?.id));
    const fresh = ids.filter((id) => !existing.has(id));
    if (!fresh.length) return toast.info("Zaten vitrinde");
    const base = items.length;
    await supabase.from("showcase_items").insert(
      fresh.map((product_id, i) => ({ product_id, sira: base + i }))
    );
    toast.success(`${fresh.length} ürün eklendi`);
    refresh();
  };

  const del = async (id: string) => {
    await supabase.from("showcase_items").delete().eq("id", id);
    refresh();
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const a = items[idx];
    const b = items[idx + dir];
    if (!a || !b) return;
    await Promise.all([
      supabase.from("showcase_items").update({ sira: b.sira }).eq("id", a.id),
      supabase.from("showcase_items").update({ sira: a.sira }).eq("id", b.id),
    ]);
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-4xl text-brand-ink">Vitrin (Öne Çıkanlar)</h1>
          <p className="text-sm text-muted-foreground mt-1">Anasayfa "Öne Çıkan Ürünler" bölümünde gösterilir. Sıra soldan sağa.</p>
        </div>
        <button onClick={() => setPickerOpen(true)} className="bg-brand-ink text-white rounded-full px-5 py-2.5 flex items-center gap-2 text-sm">
          <Plus className="w-4 h-4" /> Ürün Seç
        </button>
      </div>

      <div className="bg-white rounded-2xl border divide-y">
        {items.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground italic">Henüz vitrine ürün eklenmedi.</p>
        )}
        {items.map((i, idx) => {
          const p = i.product;
          if (!p) return null;
          return (
            <div key={i.id} className="p-4 flex items-center gap-4">
              <div className="w-16 h-16 bg-brand-sand/30 rounded overflow-hidden shrink-0">
                {p.resimler?.[0] && <img src={p.resimler[0]} alt="" className="w-full h-full object-contain" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{p.urun_adi}</p>
                <p className="text-xs text-muted-foreground font-mono">{p.stok_kodu} · Sıra {idx + 1}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => move(idx, -1)} disabled={idx === 0} className="p-2 rounded hover:bg-brand-sand disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => move(idx, 1)} disabled={idx === items.length - 1} className="p-2 rounded hover:bg-brand-sand disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                <button onClick={() => del(i.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          );
        })}
      </div>

      {pickerOpen && (
        <ProductPicker
          excludeIds={items.map((i) => i.product?.id).filter(Boolean) as string[]}
          onClose={() => setPickerOpen(false)}
          onConfirm={(ids) => { addProducts(ids); setPickerOpen(false); }}
        />
      )}
    </div>
  );
}

function ProductPicker({ excludeIds, onClose, onConfirm }: { excludeIds: string[]; onClose: () => void; onConfirm: (ids: string[]) => void }) {
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());

  const { data: products = [] } = useQuery({
    queryKey: ["picker-products"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, urun_adi, stok_kodu, resimler, satis_fiyati, stok_adedi")
        .eq("aktif", true)
        .order("created_at", { ascending: false })
        .limit(1000);
      return data ?? [];
    },
  });

  const exclude = useMemo(() => new Set(excludeIds), [excludeIds]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return products.filter((p) => {
      if (exclude.has(p.id)) return false;
      if (!s) return true;
      return p.urun_adi.toLowerCase().includes(s) || p.stok_kodu.toLowerCase().includes(s);
    }).slice(0, 200);
  }, [products, q, exclude]);

  const toggle = (id: string) => {
    const next = new Set(picked);
    if (next.has(id)) next.delete(id); else next.add(id);
    setPicked(next);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b flex items-center justify-between gap-4">
          <h2 className="font-display text-2xl text-brand-ink">Ürün Seç</h2>
          <div className="flex items-center gap-2 flex-1 max-w-md">
            <Search className="w-4 h-4 text-muted-foreground" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ürün adı veya stok kodu..." className="flex-1 border rounded-full px-4 py-2 text-sm" />
          </div>
          <button onClick={onClose} className="p-2 rounded hover:bg-brand-sand"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => {
              const active = picked.has(p.id);
              return (
                <button
                  key={p.id}
                  onClick={() => toggle(p.id)}
                  className={`text-left border rounded-xl overflow-hidden transition ${active ? "border-brand-ink ring-2 ring-brand-ink" : "border-border hover:border-brand-ink/40"}`}
                >
                  <div className="aspect-square bg-brand-sand/30 relative">
                    {p.resimler?.[0] && <img src={p.resimler[0]} alt="" className="w-full h-full object-contain" />}
                    {active && <div className="absolute inset-0 bg-brand-ink/10" />}
                  </div>
                  <div className="p-2">
                    <p className="text-sm font-medium truncate">{p.urun_adi}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{p.stok_kodu}</p>
                  </div>
                </button>
              );
            })}
          </div>
          {filtered.length === 0 && <p className="p-8 text-center text-sm text-muted-foreground italic">Ürün bulunamadı.</p>}
        </div>
        <div className="p-4 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{picked.size} ürün seçildi</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-5 py-2 rounded-full border text-sm">İptal</button>
            <button disabled={picked.size === 0} onClick={() => onConfirm(Array.from(picked))} className="px-5 py-2 rounded-full bg-brand-ink text-white text-sm disabled:opacity-40">
              Vitrine Ekle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
