import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

type Slider = { id: string; baslik: string | null; alt_baslik: string | null; gorsel: string; buton_yazi: string | null; buton_link: string | null; sira: number; aktif: boolean };

export const Route = createFileRoute("/admin/sliderlar")({ component: Sliders });

function Sliders() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-sliders"],
    queryFn: async () => ((await supabase.from("sliders").select("*").order("sira")).data ?? []) as Slider[],
  });

  const [form, setForm] = useState({ baslik: "", alt_baslik: "", gorsel: "", buton_yazi: "", buton_link: "", sira: 0, aktif: true });

  const add = async () => {
    if (!form.gorsel) return toast.error("Görsel URL zorunlu");
    const { error } = await supabase.from("sliders").insert(form);
    if (error) return toast.error(error.message);
    setForm({ baslik: "", alt_baslik: "", gorsel: "", buton_yazi: "", buton_link: "", sira: 0, aktif: true });
    qc.invalidateQueries({ queryKey: ["admin-sliders"] });
  };

  const del = async (id: string) => {
    await supabase.from("sliders").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-sliders"] });
  };

  const toggle = async (r: Slider) => {
    await supabase.from("sliders").update({ aktif: !r.aktif }).eq("id", r.id);
    qc.invalidateQueries({ queryKey: ["admin-sliders"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-brand-ink mb-8">Sliderlar</h1>
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <h2 className="font-display text-2xl mb-4">Yeni Slider</h2>
        <div className="grid md:grid-cols-2 gap-3">
          <input placeholder="Başlık" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} className="border rounded-full px-4 py-2" />
          <input placeholder="Alt başlık" value={form.alt_baslik} onChange={(e) => setForm({ ...form, alt_baslik: e.target.value })} className="border rounded-full px-4 py-2" />
          <input placeholder="Görsel URL" value={form.gorsel} onChange={(e) => setForm({ ...form, gorsel: e.target.value })} className="border rounded-full px-4 py-2 md:col-span-2" />
          <input placeholder="Buton yazısı" value={form.buton_yazi} onChange={(e) => setForm({ ...form, buton_yazi: e.target.value })} className="border rounded-full px-4 py-2" />
          <input placeholder="Buton linki" value={form.buton_link} onChange={(e) => setForm({ ...form, buton_link: e.target.value })} className="border rounded-full px-4 py-2" />
          <input type="number" placeholder="Sıra" value={form.sira} onChange={(e) => setForm({ ...form, sira: Number(e.target.value) })} className="border rounded-full px-4 py-2" />
          <button onClick={add} className="bg-brand-ink text-white rounded-full px-4 py-2 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Ekle</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border divide-y">
        {rows.map((r) => (
          <div key={r.id} className="p-4 flex items-center gap-4">
            <img src={r.gorsel} alt="" className="w-24 h-16 object-cover rounded" />
            <div className="flex-1">
              <p className="font-semibold">{r.baslik}</p>
              <p className="text-sm text-muted-foreground">{r.alt_baslik}</p>
              <p className="text-xs text-muted-foreground">Buton: {r.buton_yazi} → {r.buton_link} · Sıra: {r.sira}</p>
            </div>
            <button onClick={() => toggle(r)} className={`px-3 py-1 rounded-full text-xs ${r.aktif ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>{r.aktif ? "Aktif" : "Pasif"}</button>
            <button onClick={() => del(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
