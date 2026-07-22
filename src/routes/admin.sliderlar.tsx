import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, Smartphone, Tablet, Monitor } from "lucide-react";
import { ImageUploader } from "@/components/ImageUploader";

type Slider = {
  id: string; baslik: string | null; alt_baslik: string | null; gorsel: string;
  buton_yazi: string | null; buton_link: string | null; sira: number; aktif: boolean;
  show_mobile: boolean; show_tablet: boolean; show_desktop: boolean;
};

export const Route = createFileRoute("/admin/sliderlar")({ component: Sliders });

const EMPTY = {
  baslik: "", alt_baslik: "", gorsel: "", buton_yazi: "", buton_link: "",
  sira: 0, aktif: true, show_mobile: true, show_tablet: true, show_desktop: true,
};

function Sliders() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-sliders"],
    queryFn: async () => ((await supabase.from("sliders").select("*").order("sira")).data ?? []) as Slider[],
  });

  const [form, setForm] = useState(EMPTY);

  const add = async () => {
    if (!form.gorsel) return toast.error("Görsel zorunlu");
    const { error } = await supabase.from("sliders").insert(form);
    if (error) return toast.error(error.message);
    setForm(EMPTY);
    qc.invalidateQueries({ queryKey: ["admin-sliders"] });
    toast.success("Eklendi");
  };

  const del = async (id: string) => {
    await supabase.from("sliders").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-sliders"] });
  };

  const toggle = async (r: Slider) => {
    await supabase.from("sliders").update({ aktif: !r.aktif }).eq("id", r.id);
    qc.invalidateQueries({ queryKey: ["admin-sliders"] });
  };

  const toggleDevice = async (r: Slider, key: "show_mobile" | "show_tablet" | "show_desktop") => {
    const patch = key === "show_mobile" ? { show_mobile: !r.show_mobile }
      : key === "show_tablet" ? { show_tablet: !r.show_tablet }
      : { show_desktop: !r.show_desktop };
    await supabase.from("sliders").update(patch).eq("id", r.id);
    qc.invalidateQueries({ queryKey: ["admin-sliders"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-brand-ink mb-8">Sliderlar</h1>
      <div className="bg-white rounded-2xl border p-6 mb-6">
        <h2 className="font-display text-2xl mb-4">Yeni Slider</h2>
        <div className="grid md:grid-cols-2 gap-3 mb-4">
          <input placeholder="Başlık" value={form.baslik} onChange={(e) => setForm({ ...form, baslik: e.target.value })} className="border rounded-full px-4 py-2" />
          <input placeholder="Alt başlık" value={form.alt_baslik} onChange={(e) => setForm({ ...form, alt_baslik: e.target.value })} className="border rounded-full px-4 py-2" />
          <input placeholder="Buton yazısı" value={form.buton_yazi} onChange={(e) => setForm({ ...form, buton_yazi: e.target.value })} className="border rounded-full px-4 py-2" />
          <input placeholder="Buton linki" value={form.buton_link} onChange={(e) => setForm({ ...form, buton_link: e.target.value })} className="border rounded-full px-4 py-2" />
          <input type="number" placeholder="Sıra" value={form.sira} onChange={(e) => setForm({ ...form, sira: Number(e.target.value) })} className="border rounded-full px-4 py-2" />
        </div>

        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest mb-2 text-muted-foreground">Slider Görseli</p>
          <ImageUploader
            bucket="slider-images"
            value={form.gorsel ? [form.gorsel] : []}
            onChange={(urls) => setForm({ ...form, gorsel: urls[0] ?? "" })}
            multiple={false}
            label="Görsel Yükle"
          />
        </div>

        <div className="mb-4">
          <p className="text-xs uppercase tracking-widest mb-2 text-muted-foreground">Hangi cihazlarda gösterilsin?</p>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.show_mobile} onChange={(e) => setForm({ ...form, show_mobile: e.target.checked })} />
              <Smartphone className="w-4 h-4" /> Mobil
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.show_tablet} onChange={(e) => setForm({ ...form, show_tablet: e.target.checked })} />
              <Tablet className="w-4 h-4" /> Tablet
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.show_desktop} onChange={(e) => setForm({ ...form, show_desktop: e.target.checked })} />
              <Monitor className="w-4 h-4" /> Masaüstü
            </label>
          </div>
        </div>

        <button onClick={add} className="bg-brand-ink text-white rounded-full px-6 py-2.5 flex items-center gap-2">
          <Plus className="w-4 h-4" /> Ekle
        </button>
      </div>

      <div className="bg-white rounded-2xl border divide-y">
        {rows.map((r) => (
          <div key={r.id} className="p-4 flex items-center gap-4 flex-wrap">
            <img src={r.gorsel} alt="" className="w-28 h-20 object-cover rounded" />
            <div className="flex-1 min-w-[200px]">
              <p className="font-semibold">{r.baslik}</p>
              <p className="text-sm text-muted-foreground">{r.alt_baslik}</p>
              <p className="text-xs text-muted-foreground">Buton: {r.buton_yazi} → {r.buton_link} · Sıra: {r.sira}</p>
            </div>
            <div className="flex gap-1">
              <button onClick={() => toggleDevice(r, "show_mobile")} title="Mobil" className={`p-2 rounded ${r.show_mobile ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                <Smartphone className="w-4 h-4" />
              </button>
              <button onClick={() => toggleDevice(r, "show_tablet")} title="Tablet" className={`p-2 rounded ${r.show_tablet ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                <Tablet className="w-4 h-4" />
              </button>
              <button onClick={() => toggleDevice(r, "show_desktop")} title="Masaüstü" className={`p-2 rounded ${r.show_desktop ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"}`}>
                <Monitor className="w-4 h-4" />
              </button>
            </div>
            <button onClick={() => toggle(r)} className={`px-3 py-1 rounded-full text-xs ${r.aktif ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>
              {r.aktif ? "Aktif" : "Pasif"}
            </button>
            <button onClick={() => del(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
