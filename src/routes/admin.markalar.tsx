import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/markalar")({ component: Brands });

function Brands() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-brands"],
    queryFn: async () => (await supabase.from("brands").select("*").order("name")).data ?? [],
  });
  const [form, setForm] = useState({ name: "", slug: "" });

  const add = async () => {
    if (!form.name) return toast.error("Ad gerekli");
    const slug = form.slug || form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const { error } = await supabase.from("brands").insert({ name: form.name, slug });
    if (error) return toast.error(error.message);
    setForm({ name: "", slug: "" });
    qc.invalidateQueries({ queryKey: ["admin-brands"] });
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
        <input placeholder="Slug (opsiyonel)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="border rounded-full px-4 py-2 flex-1 min-w-[200px]" />
        <button onClick={add} className="bg-brand-ink text-white rounded-full px-5 py-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Ekle</button>
      </div>
      <div className="bg-white rounded-2xl border divide-y">
        {rows.map((b) => (
          <div key={b.id} className="p-4 flex items-center gap-3">
            <div className="flex-1"><p className="font-medium">{b.name}</p><p className="text-xs text-muted-foreground">/{b.slug}</p></div>
            <button onClick={() => del(b.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
