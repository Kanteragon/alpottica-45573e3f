import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export const Route = createFileRoute("/admin/aktarim")({ component: Import });

type Row = {
  ModelKodu?: string; StokKodu?: string; Barkod?: string; UrunAdi?: string; Aciklama?: string;
  StokAdedi?: number | string; AlisFiyati?: number | string; ListeFiyati?: number | string; SatisFiyati?: number | string;
  Kategori?: string; Marka?: string; Resim?: string; Ozellik?: string; Etiketler?: string; Aktif?: string | boolean;
};

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function Import() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  const { data: cats } = useQuery({ queryKey: ["cats-all"], queryFn: async () => (await supabase.from("categories").select("id,name,slug")).data ?? [] });
  const { data: brands } = useQuery({ queryKey: ["brands-all"], queryFn: async () => (await supabase.from("brands").select("id,name,slug")).data ?? [] });

  const handleFile = async (file: File) => {
    setBusy(true); setProgress("Excel okunuyor...");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Row>(ws);
      setProgress(`${rows.length} satır bulundu, işleniyor...`);

      const catMap = new Map((cats ?? []).map((c) => [c.name.toLowerCase(), c.id]));
      const brandMap = new Map((brands ?? []).map((b) => [b.name.toLowerCase(), b.id]));

      const payload = rows
        .filter((r) => r.StokKodu && r.UrunAdi)
        .map((r) => {
          const catName = String(r.Kategori ?? "").trim();
          const brandName = String(r.Marka ?? "Alpottica").trim();
          const stok = Number(r.StokAdedi) || 0;
          return {
            stok_kodu: String(r.StokKodu),
            model_kodu: r.ModelKodu ? String(r.ModelKodu) : null,
            barkod: r.Barkod ? String(r.Barkod) : null,
            urun_adi: String(r.UrunAdi),
            aciklama: r.Aciklama ? String(r.Aciklama) : null,
            stok_adedi: stok,
            alis_fiyati: Number(r.AlisFiyati) || 0,
            liste_fiyati: Number(r.ListeFiyati) || 0,
            satis_fiyati: Number(r.SatisFiyati) || 0,
            kategori_id: catMap.get(catName.toLowerCase()) ?? null,
            marka_id: brandMap.get(brandName.toLowerCase()) ?? null,
            resimler: String(r.Resim ?? "").split(/[;,\n]/).map((s) => s.trim()).filter(Boolean),
            ozellikler: parseOzellik(String(r.Ozellik ?? "")),
            etiketler: String(r.Etiketler ?? "").split(/[,;]/).map((s) => s.trim()).filter(Boolean),
            aktif: r.Aktif === false || String(r.Aktif).toLowerCase() === "hayır" || String(r.Aktif).toLowerCase() === "no" ? false : true,
            slug: slugify(String(r.StokKodu) + "-" + String(r.UrunAdi)).slice(0, 80),
          };
        });

      const chunkSize = 100;
      let done = 0;
      for (let i = 0; i < payload.length; i += chunkSize) {
        const chunk = payload.slice(i, i + chunkSize);
        const { error } = await supabase.from("products").upsert(chunk, { onConflict: "stok_kodu" });
        if (error) throw error;
        done += chunk.length;
        setProgress(`${done}/${payload.length} yüklendi...`);
      }
      toast.success(`${payload.length} ürün yüklendi`);
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    } finally {
      setBusy(false); setProgress("");
    }
  };

  const exportAll = async () => {
    setBusy(true);
    const { data } = await supabase.from("products").select("*, kategori:categories(name), marka:brands(name)").limit(10000);
    const rows = (data ?? []).map((p) => ({
      ModelKodu: p.model_kodu, StokKodu: p.stok_kodu, Barkod: p.barkod, UrunAdi: p.urun_adi,
      Aciklama: p.aciklama, StokAdedi: p.stok_adedi, AlisFiyati: p.alis_fiyati,
      ListeFiyati: p.liste_fiyati, SatisFiyati: p.satis_fiyati,
      Kategori: (p.kategori as { name: string } | null)?.name ?? "",
      Marka: (p.marka as { name: string } | null)?.name ?? "",
      Resim: (p.resimler ?? []).join(";"),
      Ozellik: Object.entries((p.ozellikler ?? {}) as Record<string, string>).map(([k, v]) => `${k}:${v}`).join(";"),
      Etiketler: (p.etiketler ?? []).join(","),
      Aktif: p.aktif ? "Evet" : "Hayır",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Urunler");
    XLSX.writeFile(wb, `alpottica-urunler-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setBusy(false);
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-brand-ink mb-8">Excel Aktarım</h1>
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-display text-2xl mb-3">İçe Aktar</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Excel/CSV yükleyin. Sütunlar: ModelKodu, StokKodu, Barkod, UrunAdi, Aciklama, StokAdedi, AlisFiyati, ListeFiyati, SatisFiyati, Kategori, Marka, Resim, Ozellik, Etiketler, Aktif.
            <br/>Ozellik formatı: <code>renk:Siyah;cam_rengi:Şeffaf;ekartman:56</code>
          </p>
          <input type="file" accept=".xlsx,.xls,.csv" disabled={busy} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="w-full text-sm" />
          {progress && <p className="mt-3 text-sm text-brand-cta">{progress}</p>}
        </div>
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-display text-2xl mb-3">Dışa Aktar</h2>
          <p className="text-sm text-muted-foreground mb-4">Tüm ürünleri Excel dosyası olarak indirin.</p>
          <button onClick={exportAll} disabled={busy} className="px-6 py-2.5 rounded-full bg-brand-ink text-white text-sm disabled:opacity-60">
            {busy ? "..." : "Excel Olarak İndir"}
          </button>
        </div>
      </div>
    </div>
  );
}

function parseOzellik(s: string): Record<string, string> {
  const out: Record<string, string> = {};
  s.split(/[;,\n]/).forEach((part) => {
    const [k, ...rest] = part.split(":");
    if (k && rest.length) out[k.trim()] = rest.join(":").trim();
  });
  return out;
}
