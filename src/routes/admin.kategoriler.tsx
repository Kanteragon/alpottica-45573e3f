import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, PackagePlus, X, Search } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/kategoriler")({ component: Cats });

type Cat = { id: string; name: string; slug: string; sort: number | null };

function Cats() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () =>
      ((await supabase.from("categories").select("*").order("sort")).data ?? []) as Cat[],
  });
  const [form, setForm] = useState({ name: "", slug: "", sort: 0 });
  const [picker, setPicker] = useState<Cat | null>(null);

  const add = async () => {
    if (!form.name || !form.slug) return toast.error("Ad ve slug gerekli");
    const { error } = await supabase.from("categories").insert(form);
    if (error) return toast.error(error.message);
    setForm({ name: "", slug: "", sort: 0 });
    qc.invalidateQueries({ queryKey: ["admin-cats"] });
  };

  const del = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-cats"] });
  };

  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl text-brand-ink mb-6 sm:mb-8">Kategoriler</h1>
      <div className="bg-white rounded-2xl border p-4 sm:p-6 mb-6 flex flex-wrap gap-3">
        <input placeholder="Ad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} className="border rounded-full px-4 py-2 flex-1 min-w-[180px]" />
        <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="border rounded-full px-4 py-2 flex-1 min-w-[180px]" />
        <input type="number" placeholder="Sıra" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} className="border rounded-full px-4 py-2 w-24" />
        <button onClick={add} className="bg-brand-ink text-white rounded-full px-5 py-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Ekle</button>
      </div>
      <div className="bg-white rounded-2xl border divide-y">
        {rows.map((c) => (
          <div key={c.id} className="p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{c.name}</p>
              <p className="text-xs text-muted-foreground truncate">/{c.slug} · sıra {c.sort}</p>
            </div>
            <button onClick={() => setPicker(c)} className="shrink-0 flex items-center gap-2 text-sm border rounded-full px-3 py-2 hover:border-brand-ink transition">
              <PackagePlus className="w-4 h-4" /> <span className="hidden sm:inline">Ürün Ekle</span>
            </button>
            <button onClick={() => del(c.id)} className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>

      {picker && <CategoryProducts cat={picker} onClose={() => setPicker(null)} />}
    </div>
  );
}

type Row = { id: string; urun_adi: string; stok_kodu: string; resimler: string[] | null };

function CategoryProducts({ cat, onClose }: { cat: Cat; onClose: () => void }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const { data: assigned = [], refetch } = useQuery({
    queryKey: ["cat-products", cat.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("product_categories")
        .select("product_id, products(id,urun_adi,stok_kodu,resimler)")
        .eq("category_id", cat.id);
      return (data ?? [])
        .map((r) => (r as unknown as { products: Row | null }).products)
        .filter(Boolean) as Row[];
    },
  });

  const { data: results = [] } = useQuery({
    queryKey: ["cat-product-search", q],
    queryFn: async () => {
      let query = supabase.from("products").select("id,urun_adi,stok_kodu,resimler").limit(30);
      if (q.trim()) query = query.or(`urun_adi.ilike.%${q}%,stok_kodu.ilike.%${q}%`);
      const { data } = await query.order("created_at", { ascending: false });
      return (data ?? []) as Row[];
    },
  });

  const assignedIds = useMemo(() => new Set(assigned.map((a) => a.id)), [assigned]);

  const toggle = (id: string) => {
    const next = new Set(sel);
    next.has(id) ? next.delete(id) : next.add(id);
    setSel(next);
  };

  const save = async () => {
    if (sel.size === 0) return toast.error("Ürün seçin");
    setBusy(true);
    const rows = Array.from(sel).map((pid) => ({ product_id: pid, category_id: cat.id }));
    const { error } = await supabase
      .from("product_categories")
      .upsert(rows, { onConflict: "product_id,category_id", ignoreDuplicates: true });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${sel.size} ürün "${cat.name}" kategorisine eklendi`);
    setSel(new Set());
    refetch();
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const remove = async (pid: string) => {
    await supabase.from("product_categories").delete().eq("category_id", cat.id).eq("product_id", pid);
    refetch();
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div onClick={(e) => e.stopPropagation()} className="relative bg-white w-full sm:max-w-3xl rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-5 border-b flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="font-display text-2xl truncate">{cat.name}</p>
            <p className="text-xs text-muted-foreground">{assigned.length} ürün bu kategoride</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-brand-sand/40"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 border-b">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ürün adı veya stok kodu ara" className="w-full border rounded-full pl-10 pr-4 py-2.5 text-sm" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          <div>
            <p className="text-[11px] tracking-widest uppercase text-muted-foreground mb-2">Ürün Ekle</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {results.map((r) => {
                const already = assignedIds.has(r.id);
                const checked = sel.has(r.id);
                return (
                  <button
                    key={r.id}
                    disabled={already}
                    onClick={() => toggle(r.id)}
                    className={`flex items-center gap-3 border rounded-xl p-2.5 text-left transition disabled:opacity-40 ${checked ? "border-brand-ink bg-brand-sand/30" : "hover:border-brand-ink"}`}
                  >
                    <span className="w-10 h-10 rounded-lg bg-brand-sand/40 overflow-hidden shrink-0">
                      {r.resimler?.[0] && <img src={r.resimler[0]} alt="" className="w-full h-full object-contain" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm truncate">{r.urun_adi}</span>
                      <span className="block text-[11px] text-muted-foreground">{already ? "Zaten ekli" : r.stok_kodu}</span>
                    </span>
                  </button>
                );
              })}
              {results.length === 0 && <p className="text-sm text-muted-foreground">Sonuç yok.</p>}
            </div>
          </div>

          {assigned.length > 0 && (
            <div>
              <p className="text-[11px] tracking-widest uppercase text-muted-foreground mb-2">Kategorideki Ürünler</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {assigned.map((r) => (
                  <div key={r.id} className="flex items-center gap-3 border rounded-xl p-2.5">
                    <span className="w-10 h-10 rounded-lg bg-brand-sand/40 overflow-hidden shrink-0">
                      {r.resimler?.[0] && <img src={r.resimler[0]} alt="" className="w-full h-full object-contain" />}
                    </span>
                    <span className="min-w-0 flex-1 text-sm truncate">{r.urun_adi}</span>
                    <button onClick={() => remove(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t flex items-center gap-3">
          <button onClick={onClose} className="flex-1 border rounded-full py-3 text-sm">Kapat</button>
          <button onClick={save} disabled={busy || sel.size === 0} className="flex-1 bg-brand-ink text-white rounded-full py-3 text-sm disabled:opacity-50">
            {sel.size > 0 ? `${sel.size} Ürünü Ekle` : "Ürün Ekle"}
          </button>
        </div>
      </div>
    </div>
  );
}
