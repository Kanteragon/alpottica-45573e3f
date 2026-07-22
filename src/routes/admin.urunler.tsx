import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTL } from "@/lib/products";
import { toast } from "sonner";
import { Pencil, Trash2, Eye, EyeOff, Plus, X, Save, Copy, Printer, ExternalLink, PackagePlus } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";
import { useCategories, useBrands, useAttributes } from "@/lib/queries";

export const Route = createFileRoute("/admin/urunler")({ component: AdminProducts });

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
  const [catFilter, setCatFilter] = useState<string>("");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "out">("all");
  const [editing, setEditing] = useState<P | null>(null);
  const [creating, setCreating] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkOpen, setBulkOpen] = useState(false);

  const { data: cats = [] } = useCategories();

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

  const filtered = useMemo(() => products.filter((p) => {
    if (q && !(p.urun_adi.toLowerCase().includes(q.toLowerCase()) || p.stok_kodu.toLowerCase().includes(q.toLowerCase()))) return false;
    if (catFilter && p.kategori_id !== catFilter) return false;
    if (stockFilter === "in" && p.stok_adedi <= 0) return false;
    if (stockFilter === "out" && p.stok_adedi > 0) return false;
    return true;
  }), [products, q, catFilter, stockFilter]);

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

  const toggleSel = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const selectAll = () => {
    if (selected.size === filtered.slice(0, 500).length) setSelected(new Set());
    else setSelected(new Set(filtered.slice(0, 500).map((p) => p.id)));
  };

  const bulkDelete = async () => {
    if (!confirm(`${selected.size} ürün silinecek. Emin misiniz?`)) return;
    const { error } = await supabase.from("products").delete().in("id", Array.from(selected));
    if (error) return toast.error(error.message);
    toast.success(`${selected.size} ürün silindi`);
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin-products"] });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-4xl text-brand-ink">Ürünler ({filtered.length})</h1>
        <div className="flex gap-3 flex-wrap">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara..." className="border rounded-full px-4 py-2 text-sm" />
          <select value={catFilter} onChange={(e) => setCatFilter(e.target.value)} className="border rounded-full px-4 py-2 text-sm bg-white">
            <option value="">Tüm Kategoriler</option>
            {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={stockFilter} onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)} className="border rounded-full px-4 py-2 text-sm bg-white">
            <option value="all">Tüm Stok</option>
            <option value="in">Stokta Var</option>
            <option value="out">Stok Yok</option>
          </select>
          <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-brand-ink text-white px-4 py-2 rounded-full text-sm"><Plus className="w-4 h-4" /> Yeni Ürün</button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 bg-brand-ink text-white rounded-2xl p-3 flex items-center justify-between flex-wrap gap-3">
          <span className="text-sm"><strong>{selected.size}</strong> ürün seçildi</span>
          <div className="flex gap-2">
            <button onClick={() => setBulkOpen(true)} className="px-4 py-1.5 rounded-full bg-white text-brand-ink text-xs">Toplu Güncelle</button>
            <button onClick={bulkDelete} className="px-4 py-1.5 rounded-full bg-red-600 text-white text-xs">Toplu Sil</button>
            <button onClick={() => setSelected(new Set())} className="px-4 py-1.5 rounded-full border border-white/30 text-xs">Temizle</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b bg-brand-sand/30 sticky top-0">
              <tr>
                <th className="p-3 w-8">
                  <input type="checkbox" checked={selected.size > 0 && selected.size === filtered.slice(0, 500).length} onChange={selectAll} />
                </th>
                <th>Görsel</th><th>SKU</th><th>Ürün</th><th>Fiyat</th><th>Stok</th><th>Durum</th><th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((p) => (
                <tr key={p.id} className="border-b last:border-0 hover:bg-brand-sand/10">
                  <td className="p-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSel(p.id)} /></td>
                  <td className="p-3"><div className="w-12 h-12 rounded bg-brand-sand/30 flex items-center justify-center overflow-hidden">
                    {p.resimler?.[0] && <img src={p.resimler[0]} alt="" className="w-full h-full object-contain" />}
                  </div></td>
                  <td className="font-mono text-xs">{p.stok_kodu}</td>
                  <td>{p.urun_adi}</td>
                  <td>{formatTL(Number(p.satis_fiyati))}</td>
                  <td className={p.stok_adedi <= 0 ? "text-red-600 font-semibold" : ""}>{p.stok_adedi}</td>
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

      {bulkOpen && (
        <BulkUpdate ids={Array.from(selected)} onClose={() => { setBulkOpen(false); setSelected(new Set()); qc.invalidateQueries({ queryKey: ["admin-products"] }); }} />
      )}
    </div>
  );
}

function BulkUpdate({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const [mode, setMode] = useState<"price" | "stock" | "discount">("price");
  const [val, setVal] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    const num = Number(val);
    if (Number.isNaN(num)) return toast.error("Geçerli sayı girin");
    setBusy(true);
    try {
      if (mode === "stock") {
        await supabase.from("products").update({ stok_adedi: num }).in("id", ids);
      } else if (mode === "price") {
        await supabase.from("products").update({ satis_fiyati: num }).in("id", ids);
      } else {
        // discount %: satis = liste * (1 - pct/100)
        const { data } = await supabase.from("products").select("id, liste_fiyati").in("id", ids);
        for (const row of data ?? []) {
          const yeni = Math.round(Number(row.liste_fiyati) * (1 - num / 100));
          await supabase.from("products").update({ satis_fiyati: yeni }).eq("id", row.id);
        }
      }
      toast.success(`${ids.length} ürün güncellendi`);
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display text-2xl">Toplu Güncelle ({ids.length})</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            <button onClick={() => setMode("price")} className={`flex-1 px-3 py-2 rounded-full text-sm border ${mode === "price" ? "bg-brand-ink text-white border-brand-ink" : ""}`}>Fiyat</button>
            <button onClick={() => setMode("stock")} className={`flex-1 px-3 py-2 rounded-full text-sm border ${mode === "stock" ? "bg-brand-ink text-white border-brand-ink" : ""}`}>Stok</button>
            <button onClick={() => setMode("discount")} className={`flex-1 px-3 py-2 rounded-full text-sm border ${mode === "discount" ? "bg-brand-ink text-white border-brand-ink" : ""}`}>İndirim %</button>
          </div>
          <label className="block">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">
              {mode === "price" ? "Yeni Satış Fiyatı (TL)" : mode === "stock" ? "Yeni Stok Adedi" : "İndirim Oranı (%)"}
            </span>
            <input type="number" value={val} onChange={(e) => setVal(e.target.value)} className="w-full border rounded-xl px-3 py-2 mt-1" />
          </label>
        </div>
        <div className="p-5 border-t flex justify-end gap-3">
          <button onClick={onClose} className="px-5 py-2 rounded-full border">İptal</button>
          <button disabled={busy} onClick={apply} className="px-5 py-2 rounded-full bg-brand-ink text-white disabled:opacity-60">
            {busy ? "..." : "Uygula"}
          </button>
        </div>
      </div>
    </div>
  );
}

type TabKey =
  | "info" | "stock" | "price" | "discount" | "showcase" | "seo" | "images"
  | "category" | "links" | "variants" | "attrs" | "notify" | "orders" | "moves" | "shelves" | "reviews";

const TABS: { key: TabKey; label: string }[] = [
  { key: "info", label: "Ürün Bilgileri" },
  { key: "stock", label: "Stok Bilgileri" },
  { key: "price", label: "Fiyat Bilgileri" },
  { key: "discount", label: "İndirimler" },
  { key: "showcase", label: "Vitrin Bilgileri" },
  { key: "seo", label: "Seo Bilgileri" },
  { key: "images", label: "Ürün Resimleri" },
  { key: "category", label: "Kategori / Marka" },
  { key: "links", label: "Ürün Bağlantıları" },
  { key: "variants", label: "Ürün Varyasyonları" },
  { key: "attrs", label: "Ürün Özellikleri" },
  { key: "notify", label: "Gelince Haber Ver" },
  { key: "orders", label: "Bulunduğu Siparişler" },
  { key: "moves", label: "Stok Hareketleri" },
  { key: "shelves", label: "Bulunduğu Raflar" },
  { key: "reviews", label: "Ürün Yorumları" },
];

function ProductForm({ product, onClose }: { product: P | null; onClose: () => void }) {
  const isNew = !product;
  const { data: cats = [] } = useCategories();
  const { data: brands = [] } = useBrands();
  const { data: attrs = [] } = useAttributes();
  const qc = useQueryClient();

  const [tab, setTab] = useState<TabKey>("attrs");
  const [form, setForm] = useState({
    stok_kodu: product?.stok_kodu ?? "",
    urun_adi: product?.urun_adi ?? "",
    aciklama: product?.aciklama ?? "",
    stok_adedi: product?.stok_adedi ?? 0,
    alis_fiyati: Number(product?.alis_fiyati ?? 0),
    liste_fiyati: Number(product?.liste_fiyati ?? 0),
    satis_fiyati: Number(product?.satis_fiyati ?? 0),
    resimler: product?.resimler ?? [],
    etiketler: (product?.etiketler ?? []).join(", "),
    slug: product?.slug ?? "",
    aktif: product?.aktif ?? true,
    kategori_id: product?.kategori_id ?? "",
    marka_id: product?.marka_id ?? "",
    model_kodu: product?.model_kodu ?? "",
    barkod: product?.barkod ?? "",
    ozellikler: (product?.ozellikler ?? {}) as Record<string, string>,
  });
  const [busy, setBusy] = useState(false);

  const buildPayload = () => ({
    stok_kodu: form.stok_kodu,
    urun_adi: form.urun_adi,
    aciklama: form.aciklama || null,
    stok_adedi: Number(form.stok_adedi),
    alis_fiyati: Number(form.alis_fiyati),
    liste_fiyati: Number(form.liste_fiyati),
    satis_fiyati: Number(form.satis_fiyati),
    resimler: form.resimler,
    etiketler: form.etiketler.split(",").map((s) => s.trim()).filter(Boolean),
    slug: form.slug || form.stok_kodu.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    aktif: form.aktif,
    kategori_id: form.kategori_id || null,
    marka_id: form.marka_id || null,
    ozellikler: form.ozellikler,
    model_kodu: form.model_kodu || null,
    barkod: form.barkod || null,
  });

  const save = async (keepOpen = false) => {
    setBusy(true);
    const payload = buildPayload();
    const { error } = isNew
      ? await supabase.from("products").insert(payload)
      : await supabase.from("products").update(payload).eq("id", product!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success(isNew ? "Eklendi" : "Güncellendi");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    if (!keepOpen) onClose();
  };

  const duplicate = async () => {
    if (!product) return;
    const payload = { ...buildPayload(), stok_kodu: `${form.stok_kodu}-KOPYA`, slug: `${form.slug}-kopya` };
    const { error } = await supabase.from("products").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Kopyalandı");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    onClose();
  };

  const remove = async () => {
    if (!product || !confirm("Ürün silinsin mi?")) return;
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    if (error) return toast.error(error.message);
    toast.success("Silindi");
    qc.invalidateQueries({ queryKey: ["admin-products"] });
    onClose();
  };

  const stockAdjust = async () => {
    const raw = prompt("Stok değişimi (örn: +5 veya -3):", "+1");
    if (!raw) return;
    const delta = Number(raw);
    if (Number.isNaN(delta)) return toast.error("Geçerli sayı girin");
    setForm({ ...form, stok_adedi: Math.max(0, Number(form.stok_adedi) + delta) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="bg-brand-sand/30 rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div>
            <p className="text-[11px] tracking-widest text-muted-foreground uppercase">Katalog · Ürünler</p>
            <h2 className="font-display text-2xl text-brand-ink">{isNew ? "Yeni Ürün" : form.urun_adi || "Ürün Düzenle"}</h2>
          </div>
          <div className="flex flex-wrap gap-2 justify-end">
            {product && (
              <a href={`/urun/${product.slug}`} target="_blank" rel="noreferrer" className="admin-btn-outline"><ExternalLink className="w-3.5 h-3.5" /> Ön İzleme</a>
            )}
            <button onClick={stockAdjust} className="admin-btn-outline"><PackagePlus className="w-3.5 h-3.5" /> Stok Ekle / Çıkar</button>
            {product && <button onClick={duplicate} className="admin-btn-outline"><Copy className="w-3.5 h-3.5" /> Ürünü Kopyala</button>}
            <button disabled={busy} onClick={() => save(false)} className="admin-btn-primary"><Save className="w-3.5 h-3.5" /> Kaydet</button>
            <button disabled={busy} onClick={() => save(true)} className="admin-btn-primary">Kaydet ve Devam Et</button>
            {product && <button onClick={remove} className="admin-btn-danger"><Trash2 className="w-3.5 h-3.5" /> Sil</button>}
            <button onClick={() => window.print()} className="admin-btn-outline"><Printer className="w-3.5 h-3.5" /> Yazdır</button>
            <button onClick={onClose} className="p-2 hover:bg-brand-sand rounded"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <aside className="w-60 shrink-0 bg-white border-r overflow-y-auto">
            <nav className="py-2">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`w-full text-left px-4 py-2.5 text-sm border-l-4 transition ${
                    tab === t.key
                      ? "border-brand-cta bg-brand-sand/40 text-brand-ink font-semibold"
                      : "border-transparent text-muted-foreground hover:bg-brand-sand/20"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          <div className="flex-1 overflow-y-auto p-6 bg-white">
            {tab === "info" && (
              <div className="grid grid-cols-2 gap-4">
                <F label="Stok Kodu"><input value={form.stok_kodu} onChange={(e) => setForm({ ...form, stok_kodu: e.target.value })} className="input" /></F>
                <F label="Model Kodu"><input value={form.model_kodu} onChange={(e) => setForm({ ...form, model_kodu: e.target.value })} className="input" /></F>
                <F label="Barkod"><input value={form.barkod} onChange={(e) => setForm({ ...form, barkod: e.target.value })} className="input" /></F>
                <F label="Slug"><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="input" /></F>
                <F label="Ürün Adı" className="col-span-2"><input value={form.urun_adi} onChange={(e) => setForm({ ...form, urun_adi: e.target.value })} className="input" /></F>
                <F label="Açıklama" className="col-span-2"><textarea rows={5} value={form.aciklama} onChange={(e) => setForm({ ...form, aciklama: e.target.value })} className="input" /></F>
                <F label="Etiketler (virgülle)" className="col-span-2"><input value={form.etiketler} onChange={(e) => setForm({ ...form, etiketler: e.target.value })} className="input" /></F>
                <F label="Durum" className="col-span-2">
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={form.aktif} onChange={(e) => setForm({ ...form, aktif: e.target.checked })} /> Aktif</label>
                </F>
              </div>
            )}

            {tab === "stock" && (
              <div className="grid grid-cols-2 gap-4 max-w-md">
                <F label="Stok Adedi"><input type="number" value={form.stok_adedi} onChange={(e) => setForm({ ...form, stok_adedi: Number(e.target.value) })} className="input" /></F>
              </div>
            )}

            {tab === "price" && (
              <div className="grid grid-cols-3 gap-4">
                <F label="Alış Fiyatı"><input type="number" step="0.01" value={form.alis_fiyati} onChange={(e) => setForm({ ...form, alis_fiyati: Number(e.target.value) })} className="input" /></F>
                <F label="Liste Fiyatı"><input type="number" step="0.01" value={form.liste_fiyati} onChange={(e) => setForm({ ...form, liste_fiyati: Number(e.target.value) })} className="input" /></F>
                <F label="Satış Fiyatı"><input type="number" step="0.01" value={form.satis_fiyati} onChange={(e) => setForm({ ...form, satis_fiyati: Number(e.target.value) })} className="input" /></F>
              </div>
            )}

            {tab === "images" && (
              <ImageUploader bucket="product-images" value={form.resimler} onChange={(urls) => setForm({ ...form, resimler: urls })} />
            )}

            {tab === "category" && (
              <div className="grid grid-cols-2 gap-4">
                <F label="Kategori">
                  <select value={form.kategori_id} onChange={(e) => setForm({ ...form, kategori_id: e.target.value })} className="input">
                    <option value="">—</option>
                    {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </F>
                <F label="Marka">
                  <select value={form.marka_id} onChange={(e) => setForm({ ...form, marka_id: e.target.value })} className="input">
                    <option value="">—</option>
                    {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </F>
              </div>
            )}

            {tab === "attrs" && (
              <AttrsTab
                attrs={attrs}
                value={form.ozellikler}
                onChange={(oz) => setForm({ ...form, ozellikler: oz })}
              />
            )}

            {["discount","showcase","seo","links","variants","notify","orders","moves","shelves","reviews"].includes(tab) && (
              <div className="text-sm text-muted-foreground italic border rounded-xl p-8 text-center">
                Bu sekme yakında aktif olacak.
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`
        .input { width: 100%; border: 1px solid #e5e5e5; border-radius: 10px; padding: 8px 12px; font-size: 14px; background: white; }
        .admin-btn-outline { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; border: 1px solid #d4d4d4; font-size: 12px; background: white; }
        .admin-btn-primary { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: #0a0a0a; color: white; font-size: 12px; }
        .admin-btn-primary:disabled { opacity: 0.6; }
        .admin-btn-danger { display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 999px; background: #dc2626; color: white; font-size: 12px; }
      `}</style>
    </div>
  );
}

function AttrsTab({
  attrs, value, onChange,
}: {
  attrs: { id: string; ad: string; slug: string; degerler: string[]; filterable: boolean; show_in_detail: boolean; sira: number }[];
  value: Record<string, string>;
  onChange: (v: Record<string, string>) => void;
}) {
  const [newSlug, setNewSlug] = useState("");
  const [newVal, setNewVal] = useState("");
  const rows = attrs
    .map((a) => ({ attr: a, val: value[a.slug] }))
    .filter((r) => r.val);

  const del = (slug: string) => {
    const next = { ...value };
    delete next[slug];
    onChange(next);
  };

  const add = () => {
    if (!newSlug || !newVal) return toast.error("Özellik ve değer seçin");
    onChange({ ...value, [newSlug]: newVal });
    setNewSlug(""); setNewVal("");
  };

  const chosenAttr = attrs.find((a) => a.slug === newSlug);

  return (
    <div>
      <div className="border rounded-xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-brand-sand/40 text-xs uppercase tracking-widest text-muted-foreground text-left">
            <tr>
              <th className="p-3">Özellik</th><th>Değer</th>
              <th className="text-center">Filtre</th>
              <th className="text-center">Detayda Göster</th>
              <th className="text-center">Sıra</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-muted-foreground italic">Henüz özellik eklenmedi.</td></tr>
            )}
            {rows.map(({ attr, val }) => (
              <tr key={attr.slug} className="border-t">
                <td className="p-3 font-medium">{attr.ad}</td>
                <td>{val}</td>
                <td className="text-center">{attr.filterable ? "✓" : "—"}</td>
                <td className="text-center">{attr.show_in_detail ? "✓" : "—"}</td>
                <td className="text-center">{attr.sira}</td>
                <td className="p-3 text-right">
                  <button onClick={() => del(attr.slug)} className="p-1.5 rounded hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border rounded-xl p-4 bg-brand-sand/20">
        <p className="text-sm font-semibold mb-3 text-brand-ink">Ürün Özelliği Ekleyin</p>
        <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto_auto_auto_auto] gap-3 items-end">
          <F label="Özellik">
            <select value={newSlug} onChange={(e) => { setNewSlug(e.target.value); setNewVal(""); }} className="input">
              <option value="">— Seçin —</option>
              {attrs.map((a) => <option key={a.slug} value={a.slug}>{a.ad}</option>)}
            </select>
          </F>
          <F label="Değer">
            {chosenAttr && chosenAttr.degerler.length > 0 ? (
              <select value={newVal} onChange={(e) => setNewVal(e.target.value)} className="input">
                <option value="">— Seçin —</option>
                {chosenAttr.degerler.map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            ) : (
              <input value={newVal} onChange={(e) => setNewVal(e.target.value)} className="input" placeholder="Değer" />
            )}
          </F>
          <div className="text-xs text-center text-muted-foreground pb-2">
            <div>Filtre</div>
            <div className="text-brand-ink font-semibold">{chosenAttr?.filterable ? "Evet" : "—"}</div>
          </div>
          <div className="text-xs text-center text-muted-foreground pb-2">
            <div>Detay</div>
            <div className="text-brand-ink font-semibold">{chosenAttr?.show_in_detail ? "Evet" : "—"}</div>
          </div>
          <div className="text-xs text-center text-muted-foreground pb-2">
            <div>Sıra</div>
            <div className="text-brand-ink font-semibold">{chosenAttr?.sira ?? "—"}</div>
          </div>
          <button onClick={add} className="admin-btn-primary h-10"><Plus className="w-4 h-4" /> Ekle</button>
        </div>
        <p className="text-[11px] text-muted-foreground mt-3">Filtre / Detay / Sıra ayarları, "Ürün Özellikleri" sekmesinden yönetilir.</p>
      </div>
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
