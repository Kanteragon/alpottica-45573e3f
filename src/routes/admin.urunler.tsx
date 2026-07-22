import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTL } from "@/lib/products";
import { toast } from "sonner";
import { Pencil, Trash2, Eye, EyeOff, Plus, X } from "lucide-react";

export const Route = createFileRoute("/admin/urunler")({
  component: AdminProducts,
});

type P = {
  id: string; stok_kodu: string; urun_adi: string; satis_fiyati: number; liste_fiyati: number;
  stok_adedi: number; aktif: boolean; slug: string; resimler: string[] | null;
  ozellikler: Record<string, string> | null; etiketler: string[] | null;
  aciklama: string | null; model_kodu: string | null; barkod: string | null;
  kategori_id: string | null; marka_id: string | null; alis_fiyati: number;
};

function AdminProducts() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<P | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: products = [] } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return data as unknown as P[];
    },
  });

  const filtered = products.filter((p) =>
    !q || p.urun_adi.toLowerCase().includes(q.toLowerCase()) || p.stok_kodu.toLowerCase().includes(q.toLowerCase()),
  );

  const toggle = async (id: string, aktif: boolean) => {
    await supabase.from("products").update({ aktif: !aktif }).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const del = async (id: string) => {
    if (!confirm("Silinsin mi?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Silindi");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-4xl text-brand-ink">Ürünler ({filtered.length})</h1>
        <div className="flex gap-3">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara..." className="border rounded-full px-4 py-2 text-sm" />
          <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-brand-ink text-white px-4 py-2 rounded-full text-sm"><Plus className="w-4 h-4" /> Yeni Ürün</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b bg-brand-sand/30 sticky top-0">
              <tr><th className="p-3">Görsel</th><th>SKU</th><th>Ürün</th><th>Fiyat</th><th>Stok</th><th>Durum</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-brand-sand/10">
                  <td className="p-3"><div className="w-12 h-12 rounded bg-brand-sand/30 flex items-center justify-center overflow-hidden">
                    {p.resimler?.[0] && <img src={p.resimler[0]} alt="" className="w-full h-full object-contain" />}
                  </div></td>
                  <td className="font-mono text-xs">{p.stok_kodu}</td>
                  <td>{p.urun_adi}</td>
                  <td>{formatTL(Number(p.satis_fiyati))}</td>
                  <td>{p.stok_adedi}</td>
                  <td>
                    <button onClick={() => toggle(p.id, p.aktif)} className={`px-2 py-1 rounded-full text-xs ${p.aktif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {p.aktif ? "Aktif" : "Pasif"}
                    </button>
                  </td>
                  <td className="flex gap-1 p-3">
                    <button onClick={() => setEditing(p)} className="p-2 hover:bg-brand-sand rounded"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => toggle(p.id, p.aktif)} className="p-2 hover:bg-brand-sand rounded">{p.aktif ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                    <button onClick={() => del(p.id)} className="p-2 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length > 500 && <p className="p-3 text-xs text-center text-muted-foreground">İlk 500 gösteriliyor — daha spesifik arama yapın</p>}
      </div>

      {(editing || creating) && (
        <ProductForm product={editing} onClose={() => { setEditing(null); setCreating(false); qc.invalidateQueries({ queryKey: ["admin-products"] }); }} />
      )}
    </div>
  );
}

function ProductForm({ product, onClose }: { product: P | null; onClose: () => void; }) {
  const isNew = !product;
  const [form, setForm] = useState({
    stok_kodu: product?.stok_kodu ?? "",
    urun_adi: product?.urun_adi ?? "",
    aciklama: product?.aciklama ?? "",
    stok_adedi: product?.stok_adedi ?? 0,
    alis_fiyati: Number(product?.alis_fiyati ?? 0),
    liste_fiyati: Number(product?.liste_fiyati ?? 0),
    satis_fiyati: Number(product?.satis_fiyati ?? 0),
    resimler: (product?.resimler ?? []).join("\n"),
    etiketler: (product?.etiketler ?? []).join(", "),
    slug: product?.slug ?? "",
    aktif: product?.aktif ?? true,
    renk: product?.ozellikler?.renk ?? "",
    cam_rengi: product?.ozellikler?.cam_rengi ?? "",
    ekartman: product?.ozellikler?.ekartman ?? "",
    model_kodu: product?.model_kodu ?? "",
    barkod: product?.barkod ?? "",
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    const payload = {
      stok_kodu: form.stok_kodu,
      urun_adi: form.urun_adi,
      aciklama: form.aciklama || null,
      stok_adedi: Number(form.stok_adedi),
      alis_fiyati: Number(form.alis_fiyati),
      liste_fiyati: Number(form.liste_fiyati),
      satis_fiyati: Number(form.satis_fiyati),
      resimler: form.resimler.split("\n").map((s) => s.trim()).filter(Boolean),
      etiketler: form.etiketler.split(",").map((s) => s.trim()).filter(Boolean),
      slug: form.slug || form.stok_kodu.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      aktif: form.aktif,
      ozellikler: { renk: form.renk, cam_rengi: form.cam_rengi, ekartman: form.ekartman },
      model_kodu: form.model_kodu || null,
      barkod: form.barkod || null,
    };
    const { error } = isNew
      ? await supabase.from("products").insert(payload)
      : await supabase.from("products").update(payload).eq("id", product!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(isNew ? "Eklendi" : "Güncellendi");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b sticky top-0 bg-white">
          <h2 className="font-display text-2xl">{isNew ? "Yeni Ürün" : "Ürün Düzenle"}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
          <F label="Stok Kodu"><input value={form.stok_kodu} onChange={(e) => setForm({ ...form, stok_kodu: e.target.value })} className="input" /></F>
          <F label="Model Kodu"><input value={form.model_kodu} onChange={(e) => setForm({ ...form, model_kodu: e.target.value })} className="input" /></F>
          <F label="Ürün Adı" className="col-span-2"><input value={form.urun_adi} onChange={(e) => setForm({ ...form, urun_adi: e.target.value })} className="input" /></F>
          <F label="Açıklama" className="col-span-2"><textarea rows={3} value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} className="input" /></F>
          <F label="Barkod"><input value={form.barkod} onChange={(e) => setForm({ ...form, barkod: e.target.value })} className="input" /></F>
          <F label="Slug"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" /></F>
          <F label="Stok Adedi"><input type="number" value={form.stok_adedi} onChange={(e) => setForm({ ...form, stok_adedi: Number(e.target.value) })} className="input" /></F>
          <F label="Alış Fiyatı"><input type="number" step="0.01" value={form.alis_fiyati} onChange={(e) => setForm({ ...form, alis_fiyati: Number(e.target.value) })} className="input" /></F>
          <F label="Liste Fiyatı"><input type="number" step="0.01" value={form.liste_fiyati} onChange={(e) => setForm({ ...form, liste_fiyati: Number(e.target.value) })} className="input" /></F>
          <F label="Satış Fiyatı"><input type="number" step="0.01" value={form.satis_fiyati} onChange={(e) => setForm({ ...form, satis_fiyati: Number(e.target.value) })} className="input" /></F>
          <F label="Renk"><input value={form.renk} onChange={(e) => setForm({ ...form, renk: e.target.value })} className="input" /></F>
          <F label="Cam Rengi"><input value={form.cam_rengi} onChange={(e) => setForm({ ...form, cam_rengi: e.target.value })} className="input" /></F>
          <F label="Ekartman"><input value={form.ekartman} onChange={(e) => setForm({ ...form, ekartman: e.target.value })} className="input" /></F>
          <F label="Etiketler (virgülle)"><input value={form.etiketler} onChange={(e) => setForm({ ...form, etiketler: e.target.value })} className="input" /></F>
          <F label="Resimler (satır başına 1 URL)" className="col-span-2"><textarea rows={3} value={form.resimler} onChange={(e) => setForm({ ...form, resimler: e.target.value })} className="input" /></F>
          <F label="Durum" className="col-span-2">
            <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })} /> Aktif</label>
          </F>
        </div>
        <div className="p-5 border-t flex justify-end gap-3 bg-white sticky bottom-0">
          <button onClick={onClose} className="px-5 py-2 rounded-full border">İptal</button>
          <button disabled={busy} onClick={save} className="px-5 py-2 rounded-full bg-brand-ink text-white disabled:opacity-60">{busy ? "..." : "Kaydet"}</button>
        </div>
      </div>
      <style>{`.input { width: 100%; border: 1px solid var(--border); border-radius: 12px; padding: 8px 12px; font-size: 14px; background: white; }`}</style>
    </div>
  );
}

function F({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-[11px] uppercase tracking-widest text-muted-foreground mb-1">{label}</label>
      {children}
    </div>
  );
}
