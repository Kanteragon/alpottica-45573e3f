import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useShipping } from "@/lib/pricing";
import { toast } from "sonner";
import { Truck } from "lucide-react";

export const Route = createFileRoute("/admin/kargo")({ component: KargoPage });

function KargoPage() {
  const qc = useQueryClient();
  const { data } = useShipping();
  const [firma, setFirma] = useState("");
  const [ucret, setUcret] = useState("0");
  const [aktif, setAktif] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!data) return;
    setFirma(data.firma);
    setUcret(String(data.ucret));
    setAktif(data.aktif);
  }, [data]);

  const save = async () => {
    setBusy(true);
    const { error } = await supabase
      .from("shipping_settings")
      .upsert({ id: 1, firma: firma || "Kargo", ucret: Number(ucret) || 0, aktif });
    setBusy(false);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["shipping"] });
    toast.success("Kargo ayarları kaydedildi");
  };

  return (
    <div className="max-w-xl">
      <h1 className="font-display text-4xl text-brand-ink mb-6 flex items-center gap-3">
        <Truck className="w-8 h-8" /> Kargo Yönetimi
      </h1>
      <div className="bg-white rounded-2xl border p-6 space-y-4">
        <label className="block">
          <span className="block text-xs uppercase tracking-widest mb-1">Kargo Firması</span>
          <input value={firma} onChange={(e) => setFirma(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
        </label>
        <label className="block">
          <span className="block text-xs uppercase tracking-widest mb-1">Kargo Ücreti (₺)</span>
          <input type="number" min="0" step="0.01" value={ucret} onChange={(e) => setUcret(e.target.value)} className="w-full border rounded-xl px-3 py-2" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={aktif} onChange={(e) => setAktif(e.target.checked)} />
          Kargo ücreti uygulansın (kapalıysa her siparişte ücretsiz)
        </label>
        <button disabled={busy} onClick={save} className="px-6 py-2.5 rounded-full bg-brand-ink text-white disabled:opacity-60">
          {busy ? "..." : "Kaydet"}
        </button>
      </div>
      <p className="text-sm text-muted-foreground mt-4">
        Bu ücret sepet ve ödeme adımında otomatik olarak toplama eklenir. Kampanya ekranından tanımlanan ücretsiz kargo
        eşiği aşılırsa ücret sıfırlanır.
      </p>
    </div>
  );
}
