import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, PackagePlus, X, Search, ArrowUp, ArrowDown, Shuffle, GripVertical, Pencil } from "lucide-react";

import { toast } from "sonner";

export const Route = createFileRoute("/admin/kategoriler")({ component: Cats });

type Cat = { id: string; name: string; slug: string; sort: number | null; rastgele_sirala?: boolean | null };

function Cats() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () =>
      ((await supabase.from("categories").select("*").order("sort")).data ?? []) as Cat[],
  });
  const [form, setForm] = useState({ name: "", slug: "", sort: 0 });
  const [picker, setPicker] = useState<Cat | null>(null);
  const [order, setOrder] = useState<Cat[]>([]);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [edit, setEdit] = useState<{ id: string; name: string; slug: string } | null>(null);

  useEffect(() => { setOrder(rows); }, [rows]);

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

  const persist = async (list: Cat[]) => {
    setOrder(list);
    await Promise.all(list.map((c, i) => supabase.from("categories").update({ sort: i }).eq("id", c.id)));
    qc.invalidateQueries({ queryKey: ["admin-cats"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const onDrop = (target: number) => {
    if (dragIdx === null || dragIdx === target) return setDragIdx(null);
    const list = [...order];
    const [item] = list.splice(dragIdx, 1);
    list.splice(target, 0, item);
    setDragIdx(null);
    persist(list);
    toast.success("Sıralama güncellendi");
  };

  const shuffle = async () => {
    const list = [...order];
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    await persist(list);
    toast.success("Kategoriler rastgele sıralandı");
  };

  const toggleRandom = async (c: Cat) => {
    const next = !c.rastgele_sirala;
    setOrder((list) => list.map((x) => (x.id === c.id ? { ...x, rastgele_sirala: next } : x)));
    const { error } = await supabase.from("categories").update({ rastgele_sirala: next }).eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success(next ? "Rastgele sıralama açıldı" : "Rastgele sıralama kapatıldı");
    qc.invalidateQueries({ queryKey: ["admin-cats"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
    qc.invalidateQueries({ queryKey: ["products"] });
  };

  const saveEdit = async () => {
    if (!edit) return;
    const slug = edit.slug.trim().replace(/^\/+/, "");
    if (!edit.name.trim() || !slug) return toast.error("Ad ve URL gerekli");
    const { error } = await supabase.from("categories").update({ name: edit.name.trim(), slug }).eq("id", edit.id);
    if (error) return toast.error(error.message);
    setEdit(null);
    toast.success("Kategori güncellendi");
    qc.invalidateQueries({ queryKey: ["admin-cats"] });
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  return (
    <div>
      <div className="flex items-end justify-between flex-wrap gap-3 mb-6 sm:mb-8">
        <h1 className="font-display text-3xl sm:text-4xl text-brand-ink">Kategoriler</h1>
        <button onClick={shuffle} className="inline-flex items-center gap-2 border rounded-full px-4 py-2 text-sm hover:border-brand-ink transition">
          <Shuffle className="w-4 h-4" /> Rastgele Sırala
        </button>
      </div>
      <div className="bg-white rounded-2xl border p-4 sm:p-6 mb-6 flex flex-wrap gap-3">
        <input placeholder="Ad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} className="border rounded-full px-4 py-2 flex-1 min-w-[180px]" />
        <input placeholder="SEO URL (slug)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="border rounded-full px-4 py-2 flex-1 min-w-[180px]" />
        <input type="number" placeholder="Sıra" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} className="border rounded-full px-4 py-2 w-24" />
        <button onClick={add} className="bg-brand-ink text-white rounded-full px-5 py-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Ekle</button>
      </div>

      <p className="text-xs text-muted-foreground mb-2">Sıralamak için kategorileri sürükleyip bırakın. SEO URL alanı sitedeki kategori adresini belirler (örn. /urunler?tag=klipsli-modeller).</p>
      <div className="bg-white rounded-2xl border divide-y">
        {order.map((c, i) => (
          <div
            key={c.id}
            draggable
            onDragStart={() => setDragIdx(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => onDrop(i)}
            className={`p-4 flex items-center gap-3 ${dragIdx === i ? "opacity-50" : ""}`}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />
            {edit?.id === c.id ? (
              <div className="flex-1 flex flex-wrap gap-2">
                <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="border rounded-full px-3 py-1.5 text-sm flex-1 min-w-[140px]" />
                <input value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} className="border rounded-full px-3 py-1.5 text-sm flex-1 min-w-[140px] font-mono" />
                <button onClick={saveEdit} className="bg-brand-ink text-white rounded-full px-4 py-1.5 text-sm">Kaydet</button>
                <button onClick={() => setEdit(null)} className="border rounded-full px-4 py-1.5 text-sm">İptal</button>
              </div>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">/{c.slug} · sıra {c.sort}</p>
                </div>
                <button
                  onClick={() => toggleRandom(c)}
                  title="Bu kategori sayfası her açılışta ürünleri rastgele sıralasın"
                  className={`shrink-0 flex items-center gap-2 text-xs rounded-full border px-3 py-2 transition ${c.rastgele_sirala ? "bg-brand-ink text-white border-brand-ink" : "hover:border-brand-ink"}`}
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Rastgele</span>
                  <span className={`w-8 h-4 rounded-full relative transition ${c.rastgele_sirala ? "bg-white/30" : "bg-border"}`}>
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-current transition-all ${c.rastgele_sirala ? "left-[18px]" : "left-0.5"}`} />
                  </span>
                </button>
                <button onClick={() => setEdit({ id: c.id, name: c.name, slug: c.slug })} className="shrink-0 p-2 hover:bg-brand-sand rounded"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => setPicker(c)} className="shrink-0 flex items-center gap-2 text-sm border rounded-full px-3 py-2 hover:border-brand-ink transition">
                  <PackagePlus className="w-4 h-4" /> <span className="hidden sm:inline">Ürün Ekle</span>
                </button>
                <button onClick={() => del(c.id)} className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
          </div>
        ))}
      </div>

      {picker && <CategoryProducts cat={picker} onClose={() => setPicker(null)} />}
    </div>
  );
}


type Row = { id: string; urun_adi: string; stok_kodu: string; resimler: string[] | null; sira?: number };

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
        .select("product_id, sira, products(id,urun_adi,stok_kodu,resimler)")
        .eq("category_id", cat.id)
        .order("sira");
      return (data ?? [])
        .map((r) => {
          const rr = r as unknown as { sira: number | null; products: Row | null };
          return rr.products ? { ...rr.products, sira: rr.sira ?? 0 } : null;
        })
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
    const base = assigned.length;
    const rows = Array.from(sel).map((pid, i) => ({ product_id: pid, category_id: cat.id, sira: base + i }));
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

  const move = async (index: number, dir: -1 | 1) => {
    const next = index + dir;
    if (next < 0 || next >= assigned.length) return;
    const reordered = [...assigned];
    const [item] = reordered.splice(index, 1);
    reordered.splice(next, 0, item);
    await Promise.all(
      reordered.map((r, i) =>
        supabase.from("product_categories").update({ sira: i }).eq("category_id", cat.id).eq("product_id", r.id)
      )
    );
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
              <p className="text-[11px] tracking-widest uppercase text-muted-foreground mb-2">
                Kategorideki Ürünler — sıralama sitede de bu şekilde görünür
              </p>
              <div className="space-y-2">
                {assigned.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-3 border rounded-xl p-2.5">
                    <span className="text-xs text-muted-foreground w-5 text-center">{i + 1}</span>
                    <span className="w-10 h-10 rounded-lg bg-brand-sand/40 overflow-hidden shrink-0">
                      {r.resimler?.[0] && <img src={r.resimler[0]} alt="" className="w-full h-full object-contain" />}
                    </span>
                    <span className="min-w-0 flex-1 text-sm truncate">{r.urun_adi}</span>
                    <button onClick={() => move(i, -1)} disabled={i === 0} className="p-2 rounded hover:bg-brand-sand disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => move(i, 1)} disabled={i === assigned.length - 1} className="p-2 rounded hover:bg-brand-sand disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
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
