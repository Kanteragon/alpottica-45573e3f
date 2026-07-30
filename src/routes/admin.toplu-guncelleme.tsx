import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Search, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/toplu-guncelleme")({ component: BulkUpdate });

type Row = {
  id: string;
  urun_adi: string;
  stok_kodu: string;
  kategori_id: string | null;
  marka_id: string | null;
  ozellikler: Record<string, string> | null;
};

type Attr = { id: string; ad: string; slug: string; degerler: string[] };

const norm = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");

function BulkUpdate() {
  const [q, setQ] = useState("");
  const [kategori, setKategori] = useState("");
  const [marka, setMarka] = useState("");
  const [attrKey, setAttrKey] = useState("");
  const [attrVal, setAttrVal] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const { data: attrs = [] } = useQuery({
    queryKey: ["attrs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_attributes").select("*").order("sira");
      if (error) throw error;
      return data as Attr[];
    },
  });

  const { data: cats = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name").order("sort");
      return data ?? [];
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data } = await supabase.from("brands").select("id,name").order("name");
      return data ?? [];
    },
  });

  const { data: rows = [], isFetching, refetch } = useQuery({
    queryKey: ["bulk-products", q, kategori, marka],
    queryFn: async () => {
      let sel = supabase
        .from("products")
        .select("id,urun_adi,stok_kodu,kategori_id,marka_id,ozellikler")
        .order("urun_adi")
        .limit(500);
      if (q.trim()) sel = sel.ilike("urun_adi", `%${q.trim()}%`);
      if (kategori) sel = sel.eq("kategori_id", kategori);
      if (marka) sel = sel.eq("marka_id", marka);
      const { data, error } = await sel;
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const selectedAttr = useMemo(() => attrs.find((a) => a.slug === attrKey), [attrs, attrKey]);

  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(rows.map((r) => r.id)));
  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });

  const applyAttr = async () => {
    const key = attrKey.trim();
    const val = attrVal.trim();
    if (!key || !val) return toast.error("Özellik ve değer seç");
    const targets = rows.filter((r) => selected.has(r.id));
    if (!targets.length) return toast.error("Ürün seçilmedi");
    if (!confirm(`${targets.length} ürüne "${selectedAttr?.ad ?? key}: ${val}" uygulanacak. Onaylıyor musun?`)) return;
    setBusy(true);
    let ok = 0;
    for (const t of targets) {
      const oz: Record<string, string> = { ...(t.ozellikler ?? {}) };
      // remove any variant of the same attribute key (case/format differences)
      for (const k of Object.keys(oz)) {
        if (norm(k) === norm(key) || (selectedAttr && norm(k) === norm(selectedAttr.ad))) delete oz[k];
      }
      oz[key] = val;
      const { error } = await supabase.from("products").update({ ozellikler: oz }).eq("id", t.id);
      if (!error) ok++;
    }
    setBusy(false);
    toast.success(`${ok} ürün güncellendi`);
    setSelected(new Set());
    refetch();
  };

  const addCategory = async (categoryId: string) => {
    const targets = rows.filter((r) => selected.has(r.id));
    if (!targets.length) return toast.error("Ürün seçilmedi");
    setBusy(true);
    const { error } = await supabase
      .from("product_categories")
      .upsert(targets.map((t) => ({ product_id: t.id, category_id: categoryId })), {
        onConflict: "product_id,category_id",
      });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(`${targets.length} ürün kategoriye eklendi`);
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-brand-ink mb-6">Toplu Güncelleme</h1>

      <div className="bg-white rounded-2xl border p-4 grid gap-3 md:grid-cols-4 mb-4">
        <label className="relative md:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ürün adında ara (örn. black)"
            className="w-full border rounded-xl pl-9 pr-3 py-2 text-sm"
          />
        </label>
        <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
          <option value="">Tüm kategoriler</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={marka} onChange={(e) => setMarka(e.target.value)} className="border rounded-xl px-3 py-2 text-sm">
          <option value="">Tüm markalar</option>
          {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-2xl border p-4 mb-4 grid gap-3 md:grid-cols-4 items-end">
        <label className="block">
          <span className="block text-xs uppercase tracking-widest mb-1">Özellik</span>
          <select
            value={attrKey}
            onChange={(e) => { setAttrKey(e.target.value); setAttrVal(""); }}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Seç</option>
            {attrs.map((a) => <option key={a.id} value={a.slug}>{a.ad}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-widest mb-1">Değer</span>
          <input
            list="attr-values"
            value={attrVal}
            onChange={(e) => setAttrVal(e.target.value)}
            placeholder="Örn. Siyah"
            className="w-full border rounded-xl px-3 py-2 text-sm"
          />
          <datalist id="attr-values">
            {(selectedAttr?.degerler ?? []).map((d) => <option key={d} value={d} />)}
          </datalist>
        </label>
        <button
          disabled={busy}
          onClick={applyAttr}
          className="bg-brand-ink text-white rounded-full px-5 py-2 text-sm disabled:opacity-60"
        >
          {busy ? "Uygulanıyor..." : `Seçili ${selected.size} ürüne uygula`}
        </button>
        <label className="block">
          <span className="block text-xs uppercase tracking-widest mb-1">Kategoriye ekle</span>
          <select
            value=""
            onChange={(e) => { if (e.target.value) addCategory(e.target.value); }}
            className="w-full border rounded-xl px-3 py-2 text-sm"
          >
            <option value="">Seç</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="flex items-center gap-3 p-3 border-b bg-brand-sand/30 text-sm">
          <input type="checkbox" checked={allSelected} onChange={toggleAll} />
          <span>Tümünü seç</span>
          <span className="ml-auto text-muted-foreground flex items-center gap-2">
            {isFetching && <Loader2 className="w-4 h-4 animate-spin" />}
            {rows.length} ürün
          </span>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b last:border-0 hover:bg-brand-sand/10">
                  <td className="p-3 w-10">
                    <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} />
                  </td>
                  <td className="py-2">{r.urun_adi}</td>
                  <td className="py-2 text-xs text-muted-foreground">
                    {Object.entries(r.ozellikler ?? {}).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(" · ")}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && !isFetching && (
                <tr><td className="p-6 text-center text-muted-foreground">Sonuç yok</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
