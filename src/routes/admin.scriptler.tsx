import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

export const Route = createFileRoute("/admin/scriptler")({ component: Scripts });

type Script = {
  id: string; ad: string; konum: string; icerik: string; aktif: boolean; sira: number;
};

const KONUMLAR: { value: string; label: string }[] = [
  { value: "all", label: "Tüm Sayfalar" },
  { value: "home", label: "Ana Sayfa" },
  { value: "product", label: "Ürün Detay" },
  { value: "category", label: "Kategori / Ürünler" },
  { value: "cart", label: "Sepet" },
  { value: "checkout", label: "Ödeme" },
];

function Scripts() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin-scripts"],
    queryFn: async () => {
      const { data } = await supabase.from("custom_scripts").select("*").order("sira");
      return (data ?? []) as Script[];
    },
  });

  const [draft, setDraft] = useState<Partial<Script>>({ ad: "", konum: "all", icerik: "", aktif: true, sira: 0 });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-scripts"] });

  const add = async () => {
    if (!draft.ad?.trim()) return toast.error("Ad zorunlu");
    await supabase.from("custom_scripts").insert({
      ad: draft.ad, konum: draft.konum ?? "all", icerik: draft.icerik ?? "",
      aktif: draft.aktif ?? true, sira: draft.sira ?? 0,
    });
    setDraft({ ad: "", konum: "all", icerik: "", aktif: true, sira: 0 });
    toast.success("Script eklendi");
    refresh();
  };

  const update = async (s: Script) => {
    await supabase.from("custom_scripts").update({
      ad: s.ad, konum: s.konum, icerik: s.icerik, aktif: s.aktif, sira: s.sira,
    }).eq("id", s.id);
    toast.success("Güncellendi");
    refresh();
  };

  const del = async (id: string) => {
    if (!confirm("Silinsin mi?")) return;
    await supabase.from("custom_scripts").delete().eq("id", id);
    toast.success("Silindi");
    refresh();
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-4xl text-brand-ink">Script Yönetimi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          İçeriğe doğrudan <code>&lt;script&gt;</code> veya <code>&lt;style&gt;</code> etiketleri yazabilir ya da düz JS/CSS/HTML girebilirsiniz.
          İlgili sayfa yüklendiğinde otomatik olarak gövdeye enjekte edilir.
        </p>
      </div>

      <div className="bg-white rounded-2xl border p-5 mb-8">
        <p className="font-semibold text-brand-ink mb-3 flex items-center gap-2"><Plus className="w-4 h-4" /> Yeni Script</p>
        <div className="grid md:grid-cols-[1fr_180px_100px_100px] gap-3 mb-3">
          <input value={draft.ad} onChange={(e) => setDraft({ ...draft, ad: e.target.value })} placeholder="Script adı (örn. Google Analytics)" className="border rounded-xl px-3 py-2 text-sm" />
          <select value={draft.konum} onChange={(e) => setDraft({ ...draft, konum: e.target.value })} className="border rounded-xl px-3 py-2 text-sm bg-white">
            {KONUMLAR.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <input type="number" value={draft.sira ?? 0} onChange={(e) => setDraft({ ...draft, sira: Number(e.target.value) })} placeholder="Sıra" className="border rounded-xl px-3 py-2 text-sm" />
          <label className="flex items-center gap-2 text-sm border rounded-xl px-3">
            <input type="checkbox" checked={draft.aktif ?? true} onChange={(e) => setDraft({ ...draft, aktif: e.target.checked })} /> Aktif
          </label>
        </div>
        <textarea
          value={draft.icerik} onChange={(e) => setDraft({ ...draft, icerik: e.target.value })}
          rows={8} placeholder="<script>...</script> veya <style>...</style> veya düz kod"
          className="w-full border rounded-xl px-3 py-2 text-sm font-mono"
        />
        <div className="mt-3 flex justify-end">
          <button onClick={add} className="bg-brand-ink text-white rounded-full px-5 py-2 text-sm">Ekle</button>
        </div>
      </div>

      <div className="space-y-4">
        {items.length === 0 && <p className="text-sm text-muted-foreground italic text-center py-8">Henüz script eklenmedi.</p>}
        {items.map((s) => (
          <ScriptRow key={s.id} script={s} onSave={update} onDelete={del} />
        ))}
      </div>
    </div>
  );
}

function ScriptRow({ script, onSave, onDelete }: { script: Script; onSave: (s: Script) => void; onDelete: (id: string) => void }) {
  const [s, setS] = useState(script);
  return (
    <div className="bg-white rounded-2xl border p-5">
      <div className="grid md:grid-cols-[1fr_180px_100px_100px_auto_auto] gap-3 mb-3 items-center">
        <input value={s.ad} onChange={(e) => setS({ ...s, ad: e.target.value })} className="border rounded-xl px-3 py-2 text-sm" />
        <select value={s.konum} onChange={(e) => setS({ ...s, konum: e.target.value })} className="border rounded-xl px-3 py-2 text-sm bg-white">
          {KONUMLAR.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
        </select>
        <input type="number" value={s.sira} onChange={(e) => setS({ ...s, sira: Number(e.target.value) })} className="border rounded-xl px-3 py-2 text-sm" />
        <label className="flex items-center gap-2 text-sm border rounded-xl px-3 py-2">
          <input type="checkbox" checked={s.aktif} onChange={(e) => setS({ ...s, aktif: e.target.checked })} /> Aktif
        </label>
        <button onClick={() => onSave(s)} className="bg-brand-ink text-white rounded-full px-4 py-2 text-sm inline-flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Kaydet</button>
        <button onClick={() => onDelete(s.id)} className="text-red-600 p-2 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
      </div>
      <textarea value={s.icerik} onChange={(e) => setS({ ...s, icerik: e.target.value })} rows={6} className="w-full border rounded-xl px-3 py-2 text-xs font-mono" />
    </div>
  );
}
