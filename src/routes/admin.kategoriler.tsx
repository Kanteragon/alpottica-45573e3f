import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Trash2, Plus } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/kategoriler")({ component: Cats });

function Cats() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-cats"],
    queryFn: async () => (await supabase.from("categories").select("*").order("sort")).data ?? [],
  });
  const [form, setForm] = useState({ name: "", slug: "", sort: 0 });

  const add = async () => {
    if (!form.name || !form.slug) return toast.error("Ad ve slug gerekli");
    const { error } = await supabase.from("categories").insert(form);
    if (error) return toast.error(error.message);
    setForm({ name: "", slug: "", sort: 0 });
    qc.invalidateQueries({ queryKey: ["admin-cats"] });
  };

  const del = async (id: string) => {
    await supabase.from("categories").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["admin-cats"] });
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-brand-ink mb-8">Kategoriler</h1>
      <div className="bg-white rounded-2xl border p-6 mb-6 flex flex-wrap gap-3">
        <input placeholder="Ad" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-") })} className="border rounded-full px-4 py-2 flex-1 min-w-[200px]" />
        <input placeholder="Slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="border rounded-full px-4 py-2 flex-1 min-w-[200px]" />
        <input type="number" placeholder="Sıra" value={form.sort} onChange={(e) => setForm({ ...form, sort: Number(e.target.value) })} className="border rounded-full px-4 py-2 w-24" />
        <button onClick={add} className="bg-brand-ink text-white rounded-full px-5 py-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Ekle</button>
      </div>
      <div className="bg-white rounded-2xl border divide-y">
        {rows.map((c) => (
          <div key={c.id} className="p-4 flex items-center gap-3">
            <div className="flex-1">
              <p className="font-medium">{c.name}</p>
              <p className="text-xs text-muted-foreground">/{c.slug} · sıra {c.sort}</p>
            </div>
            <button onClick={() => del(c.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}
