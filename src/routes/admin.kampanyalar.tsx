import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatTL } from "@/lib/products";
import { CAMPAIGN_TYPES, campaignTypeLabel, type Campaign } from "@/lib/pricing";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, X, Megaphone } from "lucide-react";

export const Route = createFileRoute("/admin/kampanyalar")({ component: CampaignsPage });

function useAllCampaigns() {
  return useQuery({
    queryKey: ["campaigns", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("campaigns").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Campaign[];
    },
  });
}

function CampaignsPage() {
  const qc = useQueryClient();
  const { data: rows = [] } = useAllCampaigns();
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = () => qc.invalidateQueries({ queryKey: ["campaigns"] });

  const del = async (id: string) => {
    if (!confirm("Kampanya silinsin mi?")) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  };

  const toggle = async (c: Campaign) => {
    await supabase.from("campaigns").update({ aktif: !c.aktif }).eq("id", c.id);
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-4xl text-brand-ink flex items-center gap-3">
          <Megaphone className="w-8 h-8" /> Kampanyalar
        </h1>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-brand-ink text-white px-4 py-2 rounded-full text-sm">
          <Plus className="w-4 h-4" /> Yeni Kampanya
        </button>
      </div>

      <div className="bg-white rounded-2xl border overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead className="text-left text-xs uppercase tracking-widest text-muted-foreground border-b bg-brand-sand/30">
            <tr>
              <th className="p-3">Ad</th>
              <th>Tip</th>
              <th>Kural</th>
              <th className="text-center">Aktif</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">Henüz kampanya yok.</td></tr>
            )}
            {rows.map((c) => (
              <tr key={c.id} className="border-b last:border-0">
                <td className="p-3 font-medium">{c.ad}</td>
                <td>{campaignTypeLabel(c.tip)}</td>
                <td className="text-muted-foreground">{ruleText(c)}</td>
                <td className="text-center">
                  <button onClick={() => toggle(c)} className={`px-2 py-1 rounded-full text-xs ${c.aktif ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                    {c.aktif ? "Evet" : "Hayır"}
                  </button>
                </td>
                <td className="p-3 flex gap-1">
                  <button onClick={() => setEditing(c)} className="p-2 hover:bg-brand-sand rounded"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => del(c.id)} className="p-2 hover:bg-red-50 text-red-600 rounded"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(editing || creating) && (
        <CampaignForm
          row={editing}
          onClose={() => { setEditing(null); setCreating(false); refresh(); }}
        />
      )}
    </div>
  );
}

function amountText(c: Campaign) {
  return Number(c.indirim_tutar) > 0 ? formatTL(Number(c.indirim_tutar)) : `%${c.indirim_oran}`;
}

function ruleText(c: Campaign) {
  switch (c.tip) {
    case "ucretsiz_kargo":
      return `Sepet ${formatTL(Number(c.esik))} üzerindeyse kargo ücretsiz`;
    case "sepet_indirim":
      return `Sepet ${formatTL(Number(c.esik))} üzerindeyse ${amountText(c)} indirim`;
    case "ikinci_urun":
      return `${Number(c.min_adet) || 2} ürün alana en ucuz ürüne ${amountText(c)} indirim`;
    case "kupon":
      return `"${c.kod ?? ""}" kodu ile ${amountText(c)} indirim${Number(c.esik) > 0 ? ` (min ${formatTL(Number(c.esik))})` : ""}`;
    default:
      return `2 ürün birlikte alınırsa ${amountText(c)} indirim`;
  }
}

function ProductSelect({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [q, setQ] = useState("");
  const { data: opts = [] } = useQuery({
    queryKey: ["campaign-products", q],
    queryFn: async () => {
      let query = supabase.from("products").select("id,urun_adi").order("urun_adi").limit(30);
      if (q) query = query.ilike("urun_adi", `%${q}%`);
      const { data } = await query;
      return (data ?? []) as { id: string; urun_adi: string }[];
    },
  });
  return (
    <div>
      <span className="block text-xs uppercase tracking-widest mb-1">{label}</span>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ürün ara..." className="w-full border rounded-xl px-3 py-2 mb-2 text-sm" />
      <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full border rounded-xl px-3 py-2">
        <option value="">Seçin</option>
        {opts.map((o) => <option key={o.id} value={o.id}>{o.urun_adi}</option>)}
      </select>
    </div>
  );
}

function CampaignForm({ row, onClose }: { row: Campaign | null; onClose: () => void }) {
  const isNew = !row;
  const [f, setF] = useState({
    ad: row?.ad ?? "",
    tip: row?.tip ?? "ucretsiz_kargo",
    esik: String(row?.esik ?? 0),
    urun_a: row?.urun_a ?? "",
    urun_b: row?.urun_b ?? "",
    indirim_tutar: String(row?.indirim_tutar ?? 0),
    indirim_oran: String(row?.indirim_oran ?? 0),
    kod: row?.kod ?? "",
    min_adet: String(row?.min_adet ?? 2),
    max_indirim: String(row?.max_indirim ?? 0),
    aktif: row?.aktif ?? true,
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!f.ad.trim()) return toast.error("Kampanya adı zorunlu");
    if (f.tip === "kombine_indirim" && (!f.urun_a || !f.urun_b)) return toast.error("İki ürün de seçilmeli");
    if (f.tip === "kupon" && !f.kod.trim()) return toast.error("İndirim kodu zorunlu");
    setBusy(true);
    const payload = {
      ad: f.ad.trim(),
      tip: f.tip,
      esik: Number(f.esik) || 0,
      urun_a: f.tip === "kombine_indirim" ? f.urun_a : null,
      urun_b: f.tip === "kombine_indirim" ? f.urun_b : null,
      indirim_tutar: Number(f.indirim_tutar) || 0,
      indirim_oran: Number(f.indirim_oran) || 0,
      kod: f.tip === "kupon" ? f.kod.trim() : null,
      min_adet: Number(f.min_adet) || 2,
      max_indirim: Number(f.max_indirim) || 0,
      aktif: f.aktif,
    };
    const { error } = isNew
      ? await supabase.from("campaigns").insert(payload)
      : await supabase.from("campaigns").update(payload).eq("id", row!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Kaydedildi");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display text-2xl">{isNew ? "Yeni Kampanya" : "Düzenle"}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <label className="block">
            <span className="block text-xs uppercase tracking-widest mb-1">Kampanya Adı</span>
            <input value={f.ad} onChange={(e) => setF({ ...f, ad: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
          </label>
          <label className="block">
            <span className="block text-xs uppercase tracking-widest mb-1">Kampanya Tipi</span>
            <select value={f.tip} onChange={(e) => setF({ ...f, tip: e.target.value })} className="w-full border rounded-xl px-3 py-2">
              {CAMPAIGN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </label>

          {f.tip === "ucretsiz_kargo" && (
            <label className="block">
              <span className="block text-xs uppercase tracking-widest mb-1">Ücretsiz Kargo Eşiği (₺)</span>
              <input type="number" min="0" value={f.esik} onChange={(e) => setF({ ...f, esik: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
            </label>
          )}

          {f.tip === "sepet_indirim" && (
            <label className="block">
              <span className="block text-xs uppercase tracking-widest mb-1">Minimum Sepet Tutarı (₺)</span>
              <input type="number" min="0" value={f.esik} onChange={(e) => setF({ ...f, esik: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
            </label>
          )}

          {f.tip === "ikinci_urun" && (
            <label className="block">
              <span className="block text-xs uppercase tracking-widest mb-1">Kaç ürün alınırsa (indirim en ucuz ürüne uygulanır)</span>
              <input type="number" min="2" value={f.min_adet} onChange={(e) => setF({ ...f, min_adet: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
            </label>
          )}

          {f.tip === "kupon" && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs uppercase tracking-widest mb-1">İndirim Kodu</span>
                <input value={f.kod} onChange={(e) => setF({ ...f, kod: e.target.value.toUpperCase() })} placeholder="YAZ25" className="w-full border rounded-xl px-3 py-2 font-mono uppercase" />
              </label>
              <label className="block">
                <span className="block text-xs uppercase tracking-widest mb-1">Min. Sepet Tutarı (₺)</span>
                <input type="number" min="0" value={f.esik} onChange={(e) => setF({ ...f, esik: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </label>
            </div>
          )}

          {f.tip === "kombine_indirim" && (
            <>
              <ProductSelect label="Ürün A" value={f.urun_a} onChange={(v) => setF({ ...f, urun_a: v })} />
              <ProductSelect label="Ürün B" value={f.urun_b} onChange={(v) => setF({ ...f, urun_b: v })} />
            </>
          )}

          {f.tip !== "ucretsiz_kargo" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="block text-xs uppercase tracking-widest mb-1">İndirim Tutarı (₺)</span>
                  <input type="number" min="0" value={f.indirim_tutar} onChange={(e) => setF({ ...f, indirim_tutar: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </label>
                <label className="block">
                  <span className="block text-xs uppercase tracking-widest mb-1">veya İndirim Oranı (%)</span>
                  <input type="number" min="0" max="100" value={f.indirim_oran} onChange={(e) => setF({ ...f, indirim_oran: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
                </label>
              </div>
              <label className="block">
                <span className="block text-xs uppercase tracking-widest mb-1">Maksimum İndirim (₺, 0 = sınırsız)</span>
                <input type="number" min="0" value={f.max_indirim} onChange={(e) => setF({ ...f, max_indirim: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
              </label>
              <p className="text-xs text-muted-foreground">Tutar girilirse oran yok sayılır.</p>
            </>
          )}

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={f.aktif} onChange={(e) => setF({ ...f, aktif: e.target.checked })} /> Aktif
          </label>
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
