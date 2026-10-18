import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploader } from "@/components/ImageUploader";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import {
  useHomepageSections,
  useShowcaseCategories,
  DEFAULT_SECTIONS,
  type HomeSection,
  type ShowcaseCategory,
} from "@/lib/homepage";

export const Route = createFileRoute("/admin/anasayfa")({
  head: () => ({
    meta: [
      { title: "Ana Sayfa Yönetimi — Alpottica Admin" },
      { name: "robots", content: "noindex" },
      { name: "description", content: "Ana sayfa bölüm sıralaması ve kategori vitrini yönetimi." },
      { property: "og:title", content: "Ana Sayfa Yönetimi — Alpottica Admin" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomepageAdmin,
});

function HomepageAdmin() {
  const qc = useQueryClient();
  const { data: sectionsData } = useHomepageSections();
  const { data: catsData } = useShowcaseCategories();
  const [sections, setSections] = useState<HomeSection[]>([]);
  const [cats, setCats] = useState<ShowcaseCategory[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (sectionsData) setSections([...sectionsData].sort((a, b) => a.sort_order - b.sort_order));
  }, [sectionsData]);

  useEffect(() => {
    if (catsData) setCats([...catsData].sort((a, b) => a.sort_order - b.sort_order));
  }, [catsData]);

  const move = (i: number, dir: -1 | 1) => {
    setSections((list) => {
      const j = i + dir;
      if (j < 0 || j >= list.length) return list;
      const next = [...list];
      [next[i], next[j]] = [next[j], next[i]];
      return next.map((s, idx) => ({ ...s, sort_order: idx + 1 }));
    });
  };

  const saveSections = async () => {
    setBusy(true);
    try {
      const rows = sections.map((s, i) => ({ key: s.key, label: s.label, sort_order: i + 1, is_active: s.is_active }));
      const { error } = await supabase.from("homepage_sections" as never).upsert(rows as never, { onConflict: "key" });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["homepage_sections"] });
      toast.success("Bölüm düzeni kaydedildi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kaydedilemedi — tablo henüz oluşturulmamış olabilir");
    } finally {
      setBusy(false);
    }
  };

  const saveCats = async () => {
    setBusy(true);
    try {
      const rows = cats.map((c, i) => ({
        ...(c.id.startsWith("new-") ? {} : { id: c.id }),
        title: c.title,
        tag: c.tag,
        image_url: c.image_url,
        href: c.href,
        sort_order: i + 1,
        is_active: c.is_active,
      }));
      const { error } = await supabase.from("showcase_categories" as never).upsert(rows as never);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["showcase_categories"] });
      toast.success("Kategori vitrini kaydedildi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kaydedilemedi — tablo henüz oluşturulmamış olabilir");
    } finally {
      setBusy(false);
    }
  };

  const removeCat = async (c: ShowcaseCategory) => {
    if (!c.id.startsWith("new-")) {
      const { error } = await supabase.from("showcase_categories" as never).delete().eq("id", c.id);
      if (error) {
        toast.error(error.message);
        return;
      }
    }
    setCats((l) => l.filter((x) => x.id !== c.id));
    qc.invalidateQueries({ queryKey: ["showcase_categories"] });
  };

  const updateCat = (id: string, patch: Partial<ShowcaseCategory>) =>
    setCats((l) => l.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  return (
    <div className="max-w-3xl space-y-10">
      <div>
        <h1 className="font-display text-4xl text-brand-ink mb-2">Ana Sayfa Yönetimi</h1>
        <p className="text-sm text-muted-foreground">Bölümlerin sırasını ve görünürlüğünü ayarlayın, kategori vitrini kartlarını düzenleyin.</p>
      </div>

      {/* Bölümler */}
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-sm font-semibold text-brand-ink mb-4">Bölüm Sırası ve Görünürlük</h2>
        <div className="space-y-2">
          {sections.map((s, i) => (
            <div key={s.key} className="flex items-center gap-3 border rounded-xl px-4 py-3">
              <span className="text-xs text-muted-foreground w-6">{i + 1}.</span>
              <span className="flex-1 text-sm font-medium text-brand-ink">{s.label}</span>
              <Switch checked={s.is_active} onCheckedChange={(v) => setSections((l) => l.map((x) => (x.key === s.key ? { ...x, is_active: v } : x)))} />
              <button onClick={() => move(i, -1)} disabled={i === 0} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30" aria-label="Yukarı taşı">
                <ArrowUp className="w-4 h-4" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === sections.length - 1} className="p-1.5 rounded-lg hover:bg-muted disabled:opacity-30" aria-label="Aşağı taşı">
                <ArrowDown className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        <button onClick={saveSections} disabled={busy} className="mt-5 bg-brand-ink text-white px-6 py-2.5 rounded-full text-sm font-semibold tracking-widest disabled:opacity-60">
          {busy ? "..." : "KAYDET"}
        </button>
        {sectionsData === DEFAULT_SECTIONS && (
          <p className="text-xs text-muted-foreground mt-3">Varsayılan düzen gösteriliyor; kaydettiğinizde veritabanına yazılır.</p>
        )}
      </div>

      {/* Kategori vitrini */}
      <div className="bg-white rounded-2xl border p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-brand-ink">Kategori Vitrini Kartları</h2>
          <button
            onClick={() => setCats((l) => [...l, { id: `new-${Date.now()}`, title: "", tag: "", image_url: "", href: "/urunler", sort_order: l.length + 1, is_active: true }])}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand-ink border rounded-full px-3 py-1.5 hover:bg-muted"
          >
            <Plus className="w-3.5 h-3.5" /> Kart Ekle
          </button>
        </div>
        <div className="space-y-4">
          {cats.map((c) => (
            <div key={c.id} className="border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <input value={c.title} onChange={(e) => updateCat(c.id, { title: e.target.value })} placeholder="Başlık (ör. Klipsli Modeller)" className="flex-1 border border-border rounded-lg px-3 py-2 text-sm" />
                <Switch checked={c.is_active} onCheckedChange={(v) => updateCat(c.id, { is_active: v })} />
                <button onClick={() => removeCat(c)} className="p-2 rounded-lg hover:bg-muted text-red-600" aria-label="Kartı sil">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <input value={c.tag} onChange={(e) => updateCat(c.id, { tag: e.target.value })} placeholder="Üst etiket (ör. YENİ SERİ)" className="border border-border rounded-lg px-3 py-2 text-sm" />
                <input value={c.href} onChange={(e) => updateCat(c.id, { href: e.target.value })} placeholder="Bağlantı (ör. /urunler?tag=klipsli)" className="border border-border rounded-lg px-3 py-2 text-sm" />
              </div>
              <ImageUploader bucket="slider-images" value={c.image_url ? [c.image_url] : []} onChange={(urls) => updateCat(c.id, { image_url: urls[0] ?? "" })} multiple={false} label="Kart Görseli Yükle" />
            </div>
          ))}
          {cats.length === 0 && <p className="text-xs text-muted-foreground">Henüz kart yok — site varsayılan üç kartı gösterir.</p>}
        </div>
        <button onClick={saveCats} disabled={busy} className="mt-5 bg-brand-ink text-white px-6 py-2.5 rounded-full text-sm font-semibold tracking-widest disabled:opacity-60">
          {busy ? "..." : "KAYDET"}
        </button>
      </div>
    </div>
  );
}
