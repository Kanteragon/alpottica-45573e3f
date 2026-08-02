import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus, Pencil } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/markalar")({ component: Brands });

type Brand = { id: string; name: string; slug: string };

function Brands() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => ((await supabase.from("brands").select("*").order("name")).data ?? []) as Brand[],
  });
  const [form, setForm] = useState({ name: "", slug: "" });
  const [edit, setEdit] = useState<Brand | null>(null);

  const add = async () => {
    if (!form.name) return toast.error("Ad gerekli");
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { error } = await supabase.from("brands").insert({ name: form.name, slug });
    if (error) return toast.error(error.message);
    setForm({ name: "", slug: "" });
    qc.invalidateQueries({ queryKey: ["admin-brands"] });
  };

  const save = async () => {
    if (!edit) return;
    const slug = edit.slug.trim().replace(/^\/+/, "");
    if (!edit.name.trim() || !slug) return toast.error("Ad ve URL gerekli");
    const { error } = await supabase.from("brands").update({ name: edit.name.trim(), slug }).eq("id", edit.id);
    if (error) return toast.error(error.message);
    setEdit(null);
    toast.success("Marka güncellendi");
    qc.invalidateQueries({ queryKey: ["admin-brands"] });
    qc.invalidateQueries({ queryKey: ["brands"] });
  };

  const del = async (id: string) => {
    await supabase.from("brands").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-brands"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-brand-ink mb-8">Markalar</h1>
      <div className="bg-white rounded-2xl border p-6 mb-6 flex flex-wrap gap-3">
        <input placeholder="Marka Adı" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="border rounded-full px-4 py-2 flex-1 min-w-[200px]" />
        <input placeholder="SEO URL (slug) — örn. alpottica" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="border rounded-full px-4 py-2 flex-1 min-w-[200px]" />
        <button onClick={add} className="bg-brand-ink text-white rounded-full px-5 py-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Ekle</button>
      </div>
      <p className="text-xs text-muted-foreground mb-2">SEO URL alanı markanın site adresinde görünen kısmıdır (örn. /alpottica).</p>
      <div className="bg-white rounded-2xl border divide-y">
        {rows.map((b) => (
          <div key={b.id} className="p-4 flex items-center gap-3">
            {edit?.id === b.id ? (
              <div className="flex-1 flex flex-wrap gap-2">
                <input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} className="border rounded-full px-3 py-1.5 text-sm flex-1 min-w-[140px]" />
                <input value={edit.slug} onChange={(e) => setEdit({ ...edit, slug: e.target.value })} className="border rounded-full px-3 py-1.5 text-sm flex-1 min-w-[140px] font-mono" />
                <button onClick={save} className="bg-brand-ink text-white rounded-full px-4 py-1.5 text-sm">Kaydet</button>
                <button onClick={() => setEdit(null)} className="border rounded-full px-4 py-1.5 text-sm">İptal</button>
              </div>
            ) : (
              <>
                <div className="flex-1"><p className="font-medium">{b.name}</p><p className="text-xs text-muted-foreground">/{b.slug}</p></div>
                <button onClick={() => setEdit(b)} className="p-2 hover:bg-brand-sand rounded"><Pencil className="w-4 h-4" /></button>
                <button onClick={() => del(b.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

