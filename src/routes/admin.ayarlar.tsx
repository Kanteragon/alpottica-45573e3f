import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ImageUploader } from "@/components/ImageUploader";
import { useSiteSettings, SETTINGS_DEFAULTS } from "@/lib/settings";
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
  const [brandName, setBrandName] = useState<string>("Alpottica");
  const [colors, setColors] = useState({
    color_primary: SETTINGS_DEFAULTS.color_primary,
    color_secondary: SETTINGS_DEFAULTS.color_secondary,
    color_success: SETTINGS_DEFAULTS.color_success,
    color_danger: SETTINGS_DEFAULTS.color_danger,
  });
  const [contact, setContact] = useState({
    phone: "",
    whatsapp: "",
    email: "",
    address: "",
    instagram: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (settings) {
      setLogoUrl(settings.logo_url ?? "");
      setFaviconUrl(settings.favicon_url ?? "");
      setMaxWidth(settings.logo_max_width);
      setBrandName(settings.brand_name);
      setColors({
        color_primary: settings.color_primary,
        color_secondary: settings.color_secondary,
        color_success: settings.color_success,
        color_danger: settings.color_danger,
      });
      setContact({
        phone: settings.phone,
        whatsapp: settings.whatsapp,
        email: settings.email,
        address: settings.address,
        instagram: settings.instagram,
      });
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
        brand_name: brandName.trim() || "Alpottica",
        ...colors,
        ...contact,
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

  const colorFields: { key: keyof typeof colors; label: string; hint: string }[] = [
    { key: "color_primary", label: "Birincil Renk", hint: "Navbar, başlıklar ve ana butonlar." },
    { key: "color_secondary", label: "İkincil Renk", hint: "Vurgular, linkler ve rozetler." },
    { key: "color_success", label: "Onaylandı Rengi", hint: "Onaylanan sipariş/durum etiketleri." },
    { key: "color_danger", label: "Reddedildi Rengi", hint: "İptal/red durum etiketleri ve uyarılar." },
  ];

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl text-brand-ink mb-2">Genel Ayarlar</h1>
      <p className="text-sm text-muted-foreground mb-8">Mağaza logosu, favicon, renkler ve iletişim bilgileri.</p>

      <div className="bg-white rounded-2xl border p-6 space-y-8">
        <div>
          <label className="block text-sm font-semibold text-brand-ink mb-2">Marka İsmi</label>
          <input
            value={brandName}
            onChange={(e) => setBrandName(e.target.value)}
            placeholder="Alpottica"
            className="w-full border border-border rounded-lg px-3 py-2 text-sm"
          />
          <p className="text-xs text-muted-foreground mt-2">Site genelindeki marka yazıları bu isme göre güncellenir.</p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-ink mb-3">Tema Renkleri</label>
          <div className="grid sm:grid-cols-2 gap-4">
            {colorFields.map((f) => (
              <div key={f.key} className="border rounded-xl p-3">
                <p className="text-sm font-medium text-brand-ink mb-2">{f.label}</p>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={colors[f.key]}
                    onChange={(e) => setColors((c) => ({ ...c, [f.key]: e.target.value }))}
                    className="w-12 h-10 rounded border border-border bg-white p-1"
                  />
                  <input
                    value={colors[f.key]}
                    onChange={(e) => setColors((c) => ({ ...c, [f.key]: e.target.value }))}
                    className="flex-1 border border-border rounded-lg px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setColors((c) => ({ ...c, [f.key]: SETTINGS_DEFAULTS[f.key] }))}
                    className="text-xs text-muted-foreground underline shrink-0"
                  >
                    Sıfırla
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">{f.hint}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-brand-ink mb-3">İletişim Bilgileri</label>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Telefon</p>
              <input value={contact.phone} onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))} placeholder="0546 646 02 44" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">WhatsApp (905xxxxxxxxx)</p>
              <input value={contact.whatsapp} onChange={(e) => setContact((c) => ({ ...c, whatsapp: e.target.value }))} placeholder="905466460244" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">E-posta</p>
              <input value={contact.email} onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))} placeholder="info@alpottica.com" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Instagram kullanıcı adı</p>
              <input value={contact.instagram} onChange={(e) => setContact((c) => ({ ...c, instagram: e.target.value }))} placeholder="alpottica" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground mb-1">Mağaza Adresi</p>
              <textarea value={contact.address} onChange={(e) => setContact((c) => ({ ...c, address: e.target.value }))} rows={2} placeholder="İstanbul, Türkiye" className="w-full border border-border rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
        </div>


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
