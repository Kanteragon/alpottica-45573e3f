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

function scopeText(c: Campaign) {
  if (c.hedef_tip === "kategori" && (c.hedef_kategori_ids?.length ?? 0) > 0) return ` (${c.hedef_kategori_ids.length} kategori)`;
  if (c.hedef_tip === "urun" && (c.hedef_urun_ids?.length ?? 0) > 0) return ` (${c.hedef_urun_ids.length} ürün)`;
  return "";
}

function ruleText(c: Campaign) {
  switch (c.tip) {
    case "ucretsiz_kargo":
      return `Sepet ${formatTL(Number(c.esik))} üzerindeyse kargo ücretsiz`;
    case "sepet_indirim":
      return `Sepet ${formatTL(Number(c.esik))} üzerindeyse ${amountText(c)} indirim${scopeText(c)}`;
    case "ikinci_urun":
      return `${Number(c.min_adet) || 2} ürün alana en ucuz ürüne ${amountText(c)} indirim${scopeText(c)}`;
    case "kupon":
      return `"${c.kod ?? ""}" kodu ile ${amountText(c)} indirim${Number(c.esik) > 0 ? ` (min ${formatTL(Number(c.esik))})` : ""}`;
    default:
      return `A + B grubu birlikte alınırsa ${amountText(c)} indirim`;
  }
}


function useCategories() {
  return useQuery({
    queryKey: ["cats-all"],
    queryFn: async () => {
      const { data } = await supabase.from("categories").select("id,name").order("sort");
      return (data ?? []) as { id: string; name: string }[];
    },
  });
}

function CategoryMulti({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const { data: cats = [] } = useCategories();
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div>
      <span className="block text-xs uppercase tracking-widest mb-1">{label}</span>
      <div className="border rounded-xl p-2 max-h-40 overflow-y-auto space-y-1">
        {cats.map((c) => (
          <label key={c.id} className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={value.includes(c.id)} onChange={() => toggle(c.id)} />
            {c.name}
          </label>
        ))}
        {cats.length === 0 && <p className="text-xs text-muted-foreground">Kategori yok</p>}
      </div>
    </div>
  );
}

function ProductMulti({ label, value, onChange }: { label: string; value: string[]; onChange: (v: string[]) => void }) {
  const [q, setQ] = useState("");
  const { data: opts = [] } = useQuery({
    queryKey: ["campaign-products-multi", q],
    queryFn: async () => {
      let query = supabase.from("products").select("id,urun_adi").order("urun_adi").limit(30);
      if (q) query = query.ilike("urun_adi", `%${q}%`);
      const { data } = await query;
      return (data ?? []) as { id: string; urun_adi: string }[];
    },
  });
  const { data: selected = [] } = useQuery({
    queryKey: ["campaign-products-selected", value.join(",")],
    enabled: value.length > 0,
    queryFn: async () => {
      const { data } = await supabase.from("products").select("id,urun_adi").in("id", value);
      return (data ?? []) as { id: string; urun_adi: string }[];
    },
  });
  const add = (id: string) => { if (id && !value.includes(id)) onChange([...value, id]); };
  return (
    <div>
      <span className="block text-xs uppercase tracking-widest mb-1">{label}</span>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ürün ara..." className="w-full border rounded-xl px-3 py-2 mb-2 text-sm" />
      <select value="" onChange={(e) => add(e.target.value)} className="w-full border rounded-xl px-3 py-2">
        <option value="">Ürün ekle...</option>
        {opts.map((o) => <option key={o.id} value={o.id}>{o.urun_adi}</option>)}
      </select>
      <div className="flex flex-wrap gap-1 mt-2">
        {selected.map((s) => (
          <button key={s.id} type="button" onClick={() => onChange(value.filter((v) => v !== s.id))} className="text-xs bg-brand-sand px-2 py-1 rounded-full flex items-center gap-1">
            {s.urun_adi} <X className="w-3 h-3" />
          </button>
        ))}
      </div>
      {value.length === 0 && <p className="text-xs text-muted-foreground mt-1">Henüz ürün seçilmedi</p>}
    </div>
  );
}

function ScopePicker({
  label, tip, onTip, cats, onCats, prods, onProds,
}: {
  label: string; tip: string; onTip: (v: string) => void;
  cats: string[]; onCats: (v: string[]) => void;
  prods: string[]; onProds: (v: string[]) => void;
}) {
  return (
    <div className="border rounded-2xl p-3 space-y-3 bg-brand-sand/20">
      <div>
        <span className="block text-xs uppercase tracking-widest mb-1">{label}</span>
        <select value={tip} onChange={(e) => onTip(e.target.value)} className="w-full border rounded-xl px-3 py-2 bg-white">
          <option value="tumu">Tüm ürünler</option>
          <option value="kategori">Seçili kategoriler</option>
          <option value="urun">Elle seçilen ürünler</option>
        </select>
      </div>
      {tip === "kategori" && <CategoryMulti label="Kategoriler" value={cats} onChange={onCats} />}
      {tip === "urun" && <ProductMulti label="Ürünler" value={prods} onChange={onProds} />}
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
    uye_zorunlu: row?.uye_zorunlu ?? true,
    kullanim_limiti: String(row?.kullanim_limiti ?? 1),
    oneri_goster: row?.oneri_goster ?? true,
    aktif: row?.aktif ?? true,
  });
  const [hedefTip, setHedefTip] = useState(row?.hedef_tip ?? "tumu");
  const [hedefCats, setHedefCats] = useState<string[]>(row?.hedef_kategori_ids ?? []);
  const [hedefProds, setHedefProds] = useState<string[]>(row?.hedef_urun_ids ?? []);
  const [aTip, setATip] = useState((row?.grup_a_kategori_ids?.length ?? 0) > 0 ? "kategori" : "urun");
  const [aCats, setACats] = useState<string[]>(row?.grup_a_kategori_ids ?? []);
  const [aProds, setAProds] = useState<string[]>(row?.grup_a_urun_ids ?? (row?.urun_a ? [row.urun_a] : []));
  const [bTip, setBTip] = useState((row?.grup_b_kategori_ids?.length ?? 0) > 0 ? "kategori" : "urun");
  const [bCats, setBCats] = useState<string[]>(row?.grup_b_kategori_ids ?? []);
  const [bProds, setBProds] = useState<string[]>(row?.grup_b_urun_ids ?? (row?.urun_b ? [row.urun_b] : []));
  const [kosulTip, setKosulTip] = useState(row?.kosul_tip ?? "tumu");
  const [kosulCats, setKosulCats] = useState<string[]>(row?.kosul_kategori_ids ?? []);
  const [kosulProds, setKosulProds] = useState<string[]>(row?.kosul_urun_ids ?? []);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!f.ad.trim()) return toast.error("Kampanya adı zorunlu");
    if (f.tip === "kombine_indirim") {
      const aOk = aTip === "kategori" ? aCats.length > 0 : aProds.length > 0;
      const bOk = bTip === "kategori" ? bCats.length > 0 : bProds.length > 0;
      if (!aOk || !bOk) return toast.error("A ve B grupları için seçim yapın");
    }
    if (f.tip === "kupon" && !f.kod.trim()) return toast.error("İndirim kodu zorunlu");
    setBusy(true);
    const payload = {
      ad: f.ad.trim(),
      tip: f.tip,
      esik: Number(f.esik) || 0,
      urun_a: null,
      urun_b: null,
      hedef_tip: f.tip === "kombine_indirim" ? "tumu" : hedefTip,
      hedef_kategori_ids: hedefTip === "kategori" ? hedefCats : [],
      hedef_urun_ids: hedefTip === "urun" ? hedefProds : [],
      grup_a_kategori_ids: f.tip === "kombine_indirim" && aTip === "kategori" ? aCats : [],
      grup_a_urun_ids: f.tip === "kombine_indirim" && aTip === "urun" ? aProds : [],
      grup_b_kategori_ids: f.tip === "kombine_indirim" && bTip === "kategori" ? bCats : [],
      grup_b_urun_ids: f.tip === "kombine_indirim" && bTip === "urun" ? bProds : [],
      kosul_tip: f.tip === "ikinci_urun" ? kosulTip : "tumu",
      kosul_kategori_ids: f.tip === "ikinci_urun" && kosulTip === "kategori" ? kosulCats : [],
      kosul_urun_ids: f.tip === "ikinci_urun" && kosulTip === "urun" ? kosulProds : [],
      indirim_tutar: Number(f.indirim_tutar) || 0,
      indirim_oran: Number(f.indirim_oran) || 0,
      kod: f.tip === "kupon" ? f.kod.trim() : null,
      min_adet: Number(f.min_adet) || 2,
      max_indirim: Number(f.max_indirim) || 0,
      uye_zorunlu: f.tip === "kupon" ? f.uye_zorunlu : false,
      kullanim_limiti: f.tip === "kupon" ? Math.max(0, Number(f.kullanim_limiti) || 0) : 0,
      oneri_goster: f.oneri_goster,
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

          {f.tip === "kupon" && (
            <div className="border rounded-2xl p-3 space-y-3 bg-brand-sand/20">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.uye_zorunlu} onChange={(e) => setF({ ...f, uye_zorunlu: e.target.checked })} />
                Bu kod yalnızca hesap açan / giriş yapan müşteriler için geçerli
              </label>
              <label className="block">
                <span className="block text-xs uppercase tracking-widest mb-1">Hesap başına kullanım hakkı (0 = sınırsız)</span>
                <input
                  type="number" min="0" value={f.kullanim_limiti}
                  onChange={(e) => setF({ ...f, kullanim_limiti: e.target.value })}
                  className="w-full border rounded-xl px-3 py-2 bg-white"
                />
              </label>
              <p className="text-xs text-muted-foreground">Kullanım sayımı için üyelik zorunlu olmalıdır.</p>
            </div>
          )}


          {f.tip === "kombine_indirim" ? (
            <>
              <ScopePicker label="A Grubu (kategori veya ürünler)" tip={aTip} onTip={setATip} cats={aCats} onCats={setACats} prods={aProds} onProds={setAProds} />
              <ScopePicker label="B Grubu (kategori veya ürünler)" tip={bTip} onTip={setBTip} cats={bCats} onCats={setBCats} prods={bProds} onProds={setBProds} />
            </>
          ) : f.tip === "ikinci_urun" ? (
            <>
              <ScopePicker
                label="1. Ürün — koşul (sepette bulunması gereken)"
                tip={kosulTip} onTip={setKosulTip}
                cats={kosulCats} onCats={setKosulCats}
                prods={kosulProds} onProds={setKosulProds}
              />
              <ScopePicker
                label="2. Ürün — indirim uygulanacak ürünler"
                tip={hedefTip} onTip={setHedefTip}
                cats={hedefCats} onCats={setHedefCats}
                prods={hedefProds} onProds={setHedefProds}
              />
            </>
          ) : f.tip !== "ucretsiz_kargo" ? (
            <ScopePicker
              label="İndirim uygulanacak ürünler"
              tip={hedefTip} onTip={setHedefTip}
              cats={hedefCats} onCats={setHedefCats}
              prods={hedefProds} onProds={setHedefProds}
            />
          ) : null}

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
