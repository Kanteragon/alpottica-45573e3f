import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploader } from "@/components/ImageUploader";
import { useSiteSettings } from "@/lib/settings";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/ayarlar")({
  head: () => ({ meta: [{ title: "Genel Ayarlar — Admin" }, { name: "robots", content: "noindex" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const qc = useQueryClient();
  const { data: settings } = useSiteSettings();
  const [logoUrl, setLogoUrl] = useState<string>("");
  const [faviconUrl, setFaviconUrl] = useState<string>("");
  const [maxWidth, setMaxWidth] = useState<number>(260);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.logo_url ?? "");
      setFaviconUrl(settings.favicon_url ?? "");
      setMaxWidth(settings.logo_max_width);
    }
  }, [settings]);

  const save = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.from("site_settings").upsert({
        id: 1,
        logo_url: logoUrl || null,
        favicon_url: faviconUrl || null,
        logo_max_width: Math.max(40, Math.min(600, Number(maxWidth) || 260)),
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["site_settings"] });
      toast.success("Ayarlar kaydedildi");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Hata");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl text-brand-ink mb-2">Genel Ayarlar</h1>
      <p className="text-sm text-muted-foreground mb-8">Mağaza logosu, favicon ve header ayarları.</p>

      <div className="bg-white rounded-2xl border p-6 space-y-8">
        <div>
          <label className="block text-sm font-semibold text-brand-ink mb-3">Mağaza Logosu</label>
          <ImageUploader
            bucket="slider-images"
            value={logoUrl ? [logoUrl] : []}
            onChange={(urls) => setLogoUrl(urls[0] ?? "")}
            multiple={false}
            label="Logo Yükle"
          />
          <p className="text-xs text-muted-foreground mt-2">PNG şeffaf arka planlı önerilir.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-ink mb-3">Favicon (Tarayıcı Sekmesi İkonu)</label>
          <ImageUploader
            bucket="slider-images"
            value={faviconUrl ? [faviconUrl] : []}
            onChange={(urls) => setFaviconUrl(urls[0] ?? "")}
            multiple={false}
            label="Favicon Yükle"
          />
          <p className="text-xs text-muted-foreground mt-2">Kare (32×32 veya 64×64) PNG/ICO önerilir. Boş bırakılırsa logo kullanılır.</p>
          {faviconUrl && (
            <div className="mt-3 flex items-center gap-3">
              <img src={faviconUrl} alt="Favicon" className="w-8 h-8 object-contain border rounded bg-white" />
              <span className="text-xs text-muted-foreground">Önizleme</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-ink mb-2">Logo Maksimum Genişliği (px)</label>
          <div className="flex items-center gap-4">
            <input type="range" min={60} max={400} value={maxWidth} onChange={(e) => setMaxWidth(Number(e.target.value))} className="flex-1" />
            <input type="number" min={40} max={600} value={maxWidth} onChange={(e) => setMaxWidth(Number(e.target.value))} className="w-24 border border-border rounded-lg px-3 py-2 text-sm" />
            <span className="text-xs text-muted-foreground">px</span>
          </div>
          <div className="mt-4 border rounded-xl p-4 bg-brand-sand/20">
            <p className="text-xs text-muted-foreground mb-2">Önizleme:</p>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" style={{ maxWidth: `${maxWidth}px` }} className="h-16 object-contain" />
            ) : (
              <p className="text-xs text-muted-foreground italic">Logo yüklenmedi.</p>
            )}
          </div>
        </div>

        <button onClick={save} disabled={busy} className="bg-brand-ink text-white px-8 py-3 rounded-full text-sm font-semibold tracking-widest disabled:opacity-60">
          {busy ? "..." : "KAYDET"}
        </button>
      </div>
    </div>
  );
}
