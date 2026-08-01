import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { FileText, Plus, Trash2, X, Pencil } from "lucide-react";

export const Route = createFileRoute("/admin/sayfalar")({ component: PagesAdmin });

type PageRow = {
  id: string;
  slug: string;
  title: string;
  content: string | null;
  aktif: boolean;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
};

const KNOWN = [
  { slug: "hakkimizda", title: "Hakkımızda" },
  { slug: "iletisim", title: "Bize Ulaşın" },
  { slug: "kullanim-kosullari", title: "Kullanım Koşulları" },
  { slug: "gizlilik-sozlesmesi", title: "Gizlilik Sözleşmesi (KVKK)" },
  { slug: "uyelik-sozlesmesi", title: "Üyelik Sözleşmesi" },
];

function PagesAdmin() {
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => ((await supabase.from("pages").select("*").order("slug")).data ?? []) as PageRow[],
  });
  const [editing, setEditing] = useState<PageRow | null>(null);
  const [creating, setCreating] = useState(false);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["admin-pages"] });
    qc.invalidateQueries({ queryKey: ["page"] });
  };

  const createKnown = async (slug: string, title: string) => {
    const { error } = await supabase.from("pages").insert({ slug, title, content: "", aktif: true });
    if (error) return toast.error(error.message);
    refresh();
    toast.success(`${title} sayfası oluşturuldu`);
  };

  const del = async (id: string) => {
    if (!confirm("Sayfa silinsin mi?")) return;
    await supabase.from("pages").delete().eq("id", id);
    refresh();
  };

  const missing = KNOWN.filter((k) => !rows.some((r) => r.slug === k.slug));

  return (
    <div>
      <div className="flex items-center justify-between mb-6 gap-3 flex-wrap">
        <h1 className="font-display text-3xl sm:text-4xl text-brand-ink flex items-center gap-3">
          <FileText className="w-8 h-8" /> Sayfa Yönetimi
        </h1>
        <button onClick={() => setCreating(true)} className="flex items-center gap-2 bg-brand-ink text-white px-4 py-2 rounded-full text-sm">
          <Plus className="w-4 h-4" /> Yeni Sayfa
        </button>
      </div>

      {missing.length > 0 && (
        <div className="bg-brand-sand/40 border rounded-2xl p-4 mb-6">
          <p className="text-sm mb-2">Henüz oluşturulmamış standart sayfalar:</p>
          <div className="flex flex-wrap gap-2">
            {missing.map((m) => (
              <button key={m.slug} onClick={() => createKnown(m.slug, m.title)} className="text-sm border rounded-full px-3 py-1.5 bg-white hover:border-brand-ink">
                + {m.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border divide-y">
        {rows.map((r) => (
          <div key={r.id} className="p-4 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{r.title}</p>
              <p className="text-xs text-muted-foreground truncate">/{r.slug} · {r.aktif ? "Aktif" : "Pasif"}</p>
            </div>
            <button onClick={() => setEditing(r)} className="p-2 hover:bg-brand-sand rounded"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => del(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
          </div>
        ))}
        {rows.length === 0 && <p className="p-6 text-center text-muted-foreground text-sm">Henüz sayfa yok.</p>}
      </div>

      {(editing || creating) && (
        <PageForm row={editing} onClose={() => { setEditing(null); setCreating(false); refresh(); }} />
      )}
    </div>
  );
}

function PageForm({ row, onClose }: { row: PageRow | null; onClose: () => void }) {
  const isNew = !row;
  const [f, setF] = useState({
    slug: row?.slug ?? "",
    title: row?.title ?? "",
    content: row?.content ?? "",
    aktif: row?.aktif ?? true,
    seo_title: row?.seo_title ?? "",
    seo_description: row?.seo_description ?? "",
    seo_keywords: row?.seo_keywords ?? "",
  });
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!f.slug.trim() || !f.title.trim()) return toast.error("Başlık ve slug zorunlu");
    setBusy(true);
    const payload = {
      slug: f.slug.trim(),
      title: f.title.trim(),
      content: f.content,
      aktif: f.aktif,
      seo_title: f.seo_title || null,
      seo_description: f.seo_description || null,
      seo_keywords: f.seo_keywords || null,
    };
    const { error } = isNew
      ? await supabase.from("pages").insert(payload)
      : await supabase.from("pages").update(payload).eq("id", row!.id);
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Kaydedildi");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-display text-2xl">{isNew ? "Yeni Sayfa" : f.title}</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs uppercase tracking-widest mb-1">Sayfa Başlığı</span>
              <input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className="w-full border rounded-xl px-3 py-2" />
            </label>
            <label className="block">
              <span className="block text-xs uppercase tracking-widest mb-1">Slug (adres)</span>
              <input value={f.slug} onChange={(e) => setF({ ...f, slug: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono text-sm" />
            </label>
          </div>
          <label className="block">
            <span className="block text-xs uppercase tracking-widest mb-1">İçerik (HTML destekler)</span>
            <textarea rows={14} value={f.content} onChange={(e) => setF({ ...f, content: e.target.value })} className="w-full border rounded-xl px-3 py-2 font-mono text-sm" />
          </label>

          <div className="border rounded-2xl p-4 bg-brand-sand/20 space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">SEO Bilgileri</p>
            <label className="block">
              <span className="block text-xs mb-1">SEO Başlığı (60 karakter önerilir)</span>
              <input value={f.seo_title} onChange={(e) => setF({ ...f, seo_title: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-white" />
            </label>
            <label className="block">
              <span className="block text-xs mb-1">Meta Açıklama (160 karakter önerilir)</span>
              <textarea rows={3} value={f.seo_description} onChange={(e) => setF({ ...f, seo_description: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-white" />
            </label>
            <label className="block">
              <span className="block text-xs mb-1">Anahtar Kelimeler (virgülle)</span>
              <input value={f.seo_keywords} onChange={(e) => setF({ ...f, seo_keywords: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-white" />
            </label>
          </div>

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
