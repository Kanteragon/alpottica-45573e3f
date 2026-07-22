import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, X, ArrowUp, ArrowDown } from "lucide-react";

export const Route = createFileRoute("/admin/ozellikler")({ component: Attrs });

type Attr = {
  id: string; ad: string; slug: string; degerler: string[];
  filterable: boolean; show_in_detail: boolean; sira: number;
};

function slugify(s: string) {
  return s.toLowerCase()
    .replace(/ç/g, "c").replace(/ğ/g, "g").replace(/ı/g, "i")
    .replace(/ö/g, "o").replace(/ş/g, "s").replace(/ü/g, "u")
    .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function Attrs() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Attr | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: rows = [] } = useQuery({
    queryKey: ["attrs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("product_attributes").select("*").order("sira");
      if (error) throw error;
      return data as Attr[];
    },
  });

  const del = async (id: string) => {
    if (!confirm("Silinsin mi?")) return;
    await supabase.from("product_attributes").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["attrs"] });
  };

  const move = async (row: Attr, dir: -1 | 1) => {
    const swap = rows[rows.indexOf(row) + dir];
    if (!swap) return;
    await supabase.from("product_attributes").update({ sira: swap.sira }).eq("id", row.id);
    await supabase.from("product_attributes").update({ sira: row.sira }).eq("id", swap.id);
    qc.invalidateQueries({ queryKey: ["attrs"] });
  };

  const toggle = async (row: Attr, field: "filterable" | "show_in_detail") => {
    const patch = field === "filterable" ? { filterable: !row.filterable } : { show_in_detail: !row.show_in_detail };
    await supabase.from("product_attributes").update(patch).eq("id", row.id);
    qc.invalidateQueries({ queryKey: ["attrs"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl text-brand-ink">Ürün Özellikleri</h1>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-brand-ink text-white px-4 py-2 rounded-full text-sm">
          <Plus className="w-4 h-4" /> Yeni Özellik
        </button>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b bg-brand-sand/30">
            <tr>
              <th className="p-3">Sıra</th>
              <th>Özellik</th>
              <th>Değerler</th>
              <th className="text-center">Filtre</th>
              <th className="text-center">Detayda Göster</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-0 hover:bg-brand-sand/10">
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    <span className="w-6 text-center">{r.sira}</span>
                    <button onClick={() => move(r, -1)} className="p-1 hover:bg-brand-sand rounded"><ArrowUp className="w-3 h-3" /></button>
                    <button onClick={() => move(r, 1)} className="p-1 hover:bg-brand-sand rounded"><ArrowDown className="w-3 h-3" /></button>
                  </div>
                </td>
                <td>
                  <div className="font-medium">{r.ad}</div>
                  <div className="text-xs text-muted-foreground font-mono">{r.slug}</div>
                </td>
                <td className="max-w-md">
                  <div className="flex flex-wrap gap-1">
                    {r.degerler.map((d) => (
                      <span key={d} className="text-xs bg-brand-sand/50 px-2 py-0.5 rounded-full">{d}</span>
                    ))}
                  </div>
                </td>
                <td className="text-center">
                  <button onClick={() => toggle(r, "filterable")} className={`px-2 py-1 rounded-full text-xs ${r.filterable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {r.filterable ? "Evet" : "Hayır"}
                  </button>
                </td>
                <td className="text-center">
                  <button onClick={() => toggle(r, "show_in_detail")} className={`px-2 py-1 rounded-full text-xs ${r.show_in_detail ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {r.show_in_detail ? "Evet" : "Hayır"}
                  </button>
                </td>
                <td className="flex gap-1 p-3">
                  <button onClick={() => setEditing(r)} className="p-2 hover:bg-brand-sand rounded"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(r.id)} className="p-2 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <AttrForm
          attr={editing}
          nextSira={rows.length ? Math.max(...rows.map((r) => r.sira)) + 1 : 1}
          onClose={() => { setEditing(null); setCreating(false); qc.invalidateQueries({ queryKey: ["attrs"] }); }}
        />
      )}
    </div>
  );
}

function AttrForm({ attr, nextSira, onClose }: { attr: Attr | null; nextSira: number; onClose: () => void }) {
  const isNew = !attr;
  const [f, setF] = useState({
    ad: attr?.ad ?? "",
    slug: attr?.slug ?? "",
    degerler: (attr?.degerler ?? []).join(", "),
    filterable: attr?.filterable ?? true,
    show_in_detail: attr?.show_in_detail ?? true,
    sira: attr?.sira ?? nextSira,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!f.ad) return toast.error("Ad zorunlu");
    setBusy(true);
    const payload = {
      ad: f.ad,
      slug: f.slug || slugify(f.ad),
      degerler: f.degerler.split(",").map((s) => s.trim()).filter(Boolean),
      filterable: f.filterable,
      show_in_detail: f.show_in_detail,
      sira: Number(f.sira),
    };
    const { error } = isNew
      ? await supabase.from("product_attributes").insert(payload)
      : await supabase.from("product_attributes").update(payload).eq("id", attr!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Kaydedildi");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display text-2xl">{isNew ? "Yeni Özellik" : "Düzenle"}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-widest mb-1">Ad</span>
            <input value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-widest mb-1">Slug (boş bırak = otomatik)</span>
            <input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono text-sm" />
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-widest mb-1">Değerler (virgülle)</span>
            <textarea rows={3} value={f.degerler} onChange={(e) => setF({ ...f, degerler: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.filterable} onChange={(e) => setF({ ...f, filterable: e.target.checked })} /> Filtre
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={f.show_in_detail} onChange={(e) => setF({ ...f, show_in_detail: e.target.checked })} /> Detay
            </label>
            <label className="flex items-center gap-2 text-sm">
              Sıra <input type="number" value={f.sira} onChange={(e) => setF({ ...f, sira: Number(e.target.value) })} className="w-16 border rounded px-2 py-1" />
            </label>
          </div>
        </div>
        <div className="p-5 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-full border">İptal</button>
          <button disabled={busy} onClick={save} className="px-5 py-2 rounded-full bg-brand-ink text-white disabled:opacity-60">
            {busy ? "..." : "Kaydet"}
          </button>
        </div>
      </div>
    </div>
  );
}
