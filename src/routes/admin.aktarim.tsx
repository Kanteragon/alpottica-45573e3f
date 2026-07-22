import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/aktarim")({ component: Import });

type Row = {
  ModelKodu?: string; StokKodu?: string; Barkod?: string; UrunAdi?: string; Aciklama?: string;
  StokAdedi?: number | string; AlisFiyati?: number | string; ListeFiyati?: number | string; SatisFiyati?: number | string;
  Kategori?: string; Marka?: string; Resim?: string; Ozellik?: string; Etiketler?: string; Aktif?: string | boolean;
};

const TEMPLATE_HEADERS: Row = {
  ModelKodu: "M100", StokKodu: "SKU-100", Barkod: "8690000000001", UrunAdi: "Alpottica Örnek Klips Model",
  Aciklama: "Örnek açıklama metni", StokAdedi: 10, AlisFiyati: 500, ListeFiyati: 1200, SatisFiyati: 899,
  Kategori: "Klipsli Modeller", Marka: "Alpottica",
  Resim: "https://ornek.com/1.jpg;https://ornek.com/2.jpg",
  Ozellik: "renk:Siyah;cam_rengi:Yeşil;ekartman:56",
  Etiketler: "klipsli,yeni", Aktif: "Evet",
};

function slugify(s: string) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }

function isKlips(name: string, model?: string | null) {
  const s = `${name} ${model ?? ""}`.toLowerCase();
  return /klips|magnetic|magnet|trio/.test(s);
}

function Import() {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");

  const { data: cats } = useQuery({ queryKey: ["cats-all"], queryFn: async () => (await supabase.from("categories").select("id,name,slug")).data ?? [] });
  const { data: brands } = useQuery({ queryKey: ["brands-all"], queryFn: async () => (await supabase.from("brands").select("id,name,slug")).data ?? [] });

  const downloadTemplate = () => {
    const ws = XLSX.utils.json_to_sheet([TEMPLATE_HEADERS]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sablon");
    XLSX.writeFile(wb, "alpottica-urun-sablonu.xlsx");
  };

  const handleFile = async (file: File) => {
    setBusy(true); setProgress("Excel okunuyor...");
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json<Row>(ws);
      setProgress(`${rows.length} satır bulundu...`);

      // Ensure Klipsli category exists
      let klipsId = (cats ?? []).find((c) => /klipsli/i.test(c.name))?.id ?? null;
      if (!klipsId) {
        const { data: newCat } = await supabase.from("categories").insert({ name: "Klipsli Modeller", slug: "klipsli-modeller", sort: 1 }).select("id").single();
        klipsId = newCat?.id ?? null;
      }

      const catMap = new Map((cats ?? []).map((c) => [c.name.toLowerCase(), c.id]));
      const brandMap = new Map((brands ?? []).map((b) => [b.name.toLowerCase(), b.id]));

      // helper: resolve or create a category by name
      const resolveCat = async (rawName: string): Promise<string | null> => {
        const key = rawName.trim().toLowerCase();
        if (!key) return null;
        if (catMap.has(key)) return catMap.get(key)!;
        const slug = key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        const { data: created } = await supabase.from("categories").insert({ name: rawName.trim(), slug, sort: 99 }).select("id").single();
        if (created?.id) { catMap.set(key, created.id); return created.id; }
        return null;
      };

      type Payload = { stok_kodu: string; urun_adi: string; slug: string; [k: string]: unknown };
      type Prepared = { payload: Payload; categoryIds: string[]; stok_kodu: string };
      const prepared: Prepared[] = [];
      for (const r of rows) {
        if (!r.StokKodu || !r.UrunAdi) continue;
        const catRaw = String(r.Kategori ?? "").trim();
        const brandName = String(r.Marka ?? "Alpottica").trim();
        const stok = Number(r.StokAdedi) || 0;
        const name = String(r.UrunAdi);
        const model = r.ModelKodu ? String(r.ModelKodu) : null;

        // Split multi-category on ; (also support , when no colon)
        const catParts = catRaw.split(";").map((s) => s.trim()).filter(Boolean);
        const catIds: string[] = [];
        for (const c of catParts) {
          const id = await resolveCat(c);
          if (id) catIds.push(id);
        }
        // Klips rule
        if ((catIds.length === 0 || isKlips(name, model)) && klipsId && !catIds.includes(klipsId)) {
          catIds.unshift(klipsId);
        }

        prepared.push({
          stok_kodu: String(r.StokKodu),
          categoryIds: catIds,
          payload: {
            stok_kodu: String(r.StokKodu),
            model_kodu: model,
            barkod: r.Barkod ? String(r.Barkod) : null,
            urun_adi: name,
            aciklama: r.Aciklama ? String(r.Aciklama) : null,
            stok_adedi: stok,
            alis_fiyati: Number(r.AlisFiyati) || 0,
            liste_fiyati: Number(r.ListeFiyati) || 0,
            satis_fiyati: Number(r.SatisFiyati) || 0,
            kategori_id: catIds[0] ?? null,
            marka_id: brandMap.get(brandName.toLowerCase()) ?? null,
            resimler: String(r.Resim ?? "").split(/[;,\n]/).map((s) => s.trim()).filter(Boolean),
            ozellikler: parseOzellik(String(r.Ozellik ?? "")),
            etiketler: String(r.Etiketler ?? "").split(/[,;]/).map((s) => s.trim()).filter(Boolean),
            aktif: r.Aktif === false || String(r.Aktif).toLowerCase() === "hayır" || String(r.Aktif).toLowerCase() === "no" ? false : true,
            slug: slugify(String(r.StokKodu) + "-" + name).slice(0, 80),
          },
        });
      }

      const chunkSize = 100;
      let done = 0;
      for (let i = 0; i < prepared.length; i += chunkSize) {
        const chunk = prepared.slice(i, i + chunkSize);
        const { data: upserted, error } = await supabase
          .from("products")
          .upsert(chunk.map((p) => p.payload) as never, { onConflict: "stok_kodu" })
          .select("id, stok_kodu");
        if (error) throw error;

        // Sync product_categories
        const idBySku = new Map((upserted ?? []).map((u) => [u.stok_kodu as string, u.id as string]));
        const links: { product_id: string; category_id: string }[] = [];
        const productIds: string[] = [];
        for (const p of chunk) {
          const pid = idBySku.get(p.stok_kodu);
          if (!pid) continue;
          productIds.push(pid);
          for (const cid of p.categoryIds) links.push({ product_id: pid, category_id: cid });
        }
        if (productIds.length) {
          await supabase.from("product_categories").delete().in("product_id", productIds);
        }
        if (links.length) {
          await supabase.from("product_categories").upsert(links, { onConflict: "product_id,category_id" });
        }
        done += chunk.length;
        setProgress(`${done}/${prepared.length} yüklendi/güncellendi...`);
      }
      toast.success(`${prepared.length} ürün işlendi`);
      qc.invalidateQueries();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    } finally {
      setBusy(false); setProgress("");
    }
  };

  const exportAll = async () => {
    setBusy(true);
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*, kategori:categories!products_kategori_id_fkey(name), marka:brands(name), product_categories(category:categories(name))")
        .limit(10000);
      if (error) throw error;
      const rows = (data ?? []).map((p) => {
        const multi = ((p.product_categories ?? []) as { category: { name: string } | null }[])
          .map((r) => r.category?.name)
          .filter(Boolean) as string[];
        const primary = (p.kategori as { name: string } | null)?.name;
        const catNames = Array.from(new Set([primary, ...multi].filter(Boolean))) as string[];
        return {
          ModelKodu: p.model_kodu, StokKodu: p.stok_kodu, Barkod: p.barkod, UrunAdi: p.urun_adi,
          Aciklama: p.aciklama, StokAdedi: p.stok_adedi, AlisFiyati: p.alis_fiyati,
          ListeFiyati: p.liste_fiyati, SatisFiyati: p.satis_fiyati,
          Kategori: catNames.join(";"),
          Marka: (p.marka as { name: string } | null)?.name ?? "",
          Resim: (p.resimler ?? []).join(";"),
          Ozellik: Object.entries((p.ozellikler ?? {}) as Record<string, string>).map(([k, v]) => `${k}:${v}`).join(";"),
          Etiketler: (p.etiketler ?? []).join(","),
          Aktif: p.aktif ? "Evet" : "Hayır",
        };
      });
      if (rows.length === 0) {
        toast.error("Dışa aktarılacak ürün bulunamadı");
        return;
      }
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Urunler");
      XLSX.writeFile(wb, `alpottica-urunler-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success(`${rows.length} ürün dışa aktarıldı`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Dışa aktarım hatası");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-4xl text-brand-ink mb-8">Excel Aktarım</h1>

      <div className="bg-brand-sand/30 rounded-2xl p-5 mb-6 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-semibold">Boş Örnek Şablon</p>
          <p className="text-sm text-muted-foreground">Doğru formatlı boş Excel şablonunu indirin, doldurun ve yükleyin.</p>
        </div>
        <button onClick={downloadTemplate} className="inline-flex items-center gap-2 bg-brand-ink text-white px-5 py-2.5 rounded-full text-sm">
          <Download className="w-4 h-4" /> Örnek Excel Şablonu İndir
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border p-6">
          <h2 className="font-display text-2xl mb-3">İçe Aktar</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Excel/CSV yükleyin. Aynı StokKodu varsa güncellenir; yoksa yeni eklenir. Kategori boşsa veya isim/modelde "klips" ya da "magnetic" geçiyorsa otomatik olarak <strong>Klipsli Modeller</strong> kategorisine atanır.
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
