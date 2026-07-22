import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/menu")({ component: MenuAdmin });

type M = { id: string; label: string; url: string; sira: number; aktif: boolean };

function MenuAdmin() {
  const qc = useQueryClient();
  const { data: items = [] } = useQuery({
    queryKey: ["admin-menu"],
    queryFn: async () => ((await supabase.from("menu_items").select("*").order("sira")).data ?? []) as M[],
  });
  const [form, setForm] = useState({ label: "", url: "", sira: 0 });

  const add = async () => {
    if (!form.label || !form.url) return toast.error("Etiket ve URL gerekli");
    await supabase.from("menu_items").insert({ ...form, aktif: true });
    setForm({ label: "", url: "", sira: 0 });
    qc.invalidateQueries({ queryKey: ["admin-menu"] });
  };

  const upd = async (id: string, patch: Partial<M>) => {
    await supabase.from("menu_items").update(patch).eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-menu"] });
  };

  const del = async (id: string) => {
    await supabase.from("menu_items").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-menu"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-brand-ink mb-8">Menü</h1>
      <div className="bg-white rounded-2xl border p-6 mb-6 flex flex-wrap gap-3">
        <input placeholder="Etiket" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="border rounded-full px-4 py-2 flex-1 min-w-[200px]" />
        <input placeholder="URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="border rounded-full px-4 py-2 flex-1 min-w-[200px]" />
        <input type="number" placeholder="Sıra" value={form.sira} onChange={(e) => setForm({ ...form, sira: Number(e.target.value) })} className="border rounded-full px-4 py-2 w-24" />
        <button onClick={add} className="bg-brand-ink text-white rounded-full px-5 py-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Ekle</button>
      </div>

      <div className="bg-white rounded-2xl border divide-y">
        {items.map((m) => (
          <div key={m.id} className="p-4 flex items-center gap-3">
            <input defaultValue={m.label} onBlur={(e) => e.target.value !== m.label && upd(m.id, { label: e.target.value })} className="border rounded-full px-4 py-1.5 flex-1" />
            <input defaultValue={m.url} onBlur={(e) => e.target.value !== m.url && upd(m.id, { url: e.target.value })} className="border rounded-full px-4 py-1.5 flex-1" />
            <input type="number" defaultValue={m.sira} onBlur={(e) => Number(e.target.value) !== m.sira && upd(m.id, { sira: Number(e.target.value) })} className="border rounded-full px-3 py-1.5 w-20" />
            <button onClick={() => upd(m.id, { aktif: !m.aktif })} className={`px-3 py-1 rounded-full text-xs ${m.aktif ? "bg-green-100 text-green-700" : "bg-gray-100"}`}>{m.aktif ? "Aktif" : "Pasif"}</button>
            <button onClick={() => del(m.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
