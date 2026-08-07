import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatTL } from "@/lib/products";
import { useTotals } from "@/lib/pricing";

import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TR_ILLER, TR_IL_LIST } from "@/lib/tr-locations";

export const Route = createFileRoute("/odeme")({
  head: () => ({
    meta: [
      { title: "Ödeme — Alpottica" },
      { name: "description", content: "Siparişinizi tamamlayın." },
    ],
  }),
  component: Checkout,
});

function Checkout() {
  const nav = useNavigate();
  const { items, clear } = useCart();
  const t = useTotals(items);

  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: user?.email ?? "",
    sehir: "",
    ilce: "",
    mahalle: "",
    posta_kodu: "",
    address: "",
    password: "",
    createAccount: false,
    kvkk: false,
    payment: "nakit" as "nakit" | "kart",
    notes: "",
  });
  const [busy, setBusy] = useState(false);
  const [placedCode, setPlacedCode] = useState<string | null>(null);


  const ilceler = useMemo(() => (form.sehir ? TR_ILLER[form.sehir] ?? [] : []), [form.sehir]);

  useEffect(() => {
    if (user?.email) setForm((f) => ({ ...f, email: user.email!, createAccount: false }));
  }, [user]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase.from("profiles").select("full_name,phone,address").eq("id", user.id).maybeSingle();
      const { data: addrRaw } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).limit(1).maybeSingle();
      const addr = (addrRaw ?? {}) as Record<string, string | null>;
      setForm((f) => ({
        ...f,
        full_name: f.full_name || data?.full_name || addr.ad_soyad || "",
        phone: f.phone || data?.phone || addr.telefon || "",
        address: f.address || addr.adres || data?.address || "",
        sehir: f.sehir || addr.sehir || "",
        ilce: f.ilce || addr.ilce || "",
        mahalle: f.mahalle || addr.mahalle || "",
        posta_kodu: f.posta_kodu || addr.posta_kodu || "",
      }));
    })();
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Sepetiniz boş");
    if (form.full_name.trim().length < 3) return toast.error("Ad Soyad zorunlu");
    if (form.phone.trim().length < 10) return toast.error("Geçerli telefon girin");
    if ((user || form.createAccount) && !/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Geçerli e-posta girin");
    if (!form.sehir) return toast.error("İl seçin");
    if (!form.ilce) return toast.error("İlçe seçin");
    if (form.address.trim().length < 10) return toast.error("Adres zorunlu");
    if (!user && form.createAccount && form.password.length < 6) return toast.error("Şifre en az 6 karakter olmalıdır");
    if (!user && form.createAccount && !form.kvkk)
      return toast.error("Üyelik sözleşmesi ve KVKK metnini onaylamanız gerekiyor");

    setBusy(true);
    try {
      let userId = user?.id ?? null;

      if (!user && form.createAccount && form.password) {
        const { data, error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: form.full_name, phone: form.phone },
          },
        });
        if (error) {
          if (/already|registered|exists/i.test(error.message)) {
            const { data: si, error: siErr } = await supabase.auth.signInWithPassword({
              email: form.email.trim(), password: form.password,
            });
            if (siErr) throw new Error("Bu e-posta zaten kayıtlı; şifre hatalı.");
            userId = si.user?.id ?? null;
          } else throw error;
        } else {
          userId = data.user?.id ?? null;
          if (!userId) {
            const { data: si } = await supabase.auth.signInWithPassword({ email: form.email.trim(), password: form.password });
            userId = si.user?.id ?? null;
          }
        }
        if (userId) {
          await supabase.from("profiles").update({ full_name: form.full_name, phone: form.phone, address: form.address }).eq("id", userId);
        }
      }

      // 1. Siparişi ve kalemlerini tek adımda oluştur (misafir siparişleri dahil)
      const { data: newOrderId, error: oErr } = await supabase.rpc("place_order", {
        order_data: {
          ad_soyad: form.full_name,
          telefon: form.phone,
          email: form.email.trim(),
          adres: form.address,
          sehir: form.sehir,
          ilce: form.ilce,
          mahalle: form.mahalle || "",
          posta_kodu: form.posta_kodu || "",
          odeme_tipi: form.payment,
          toplam: t.total,
          notlar: form.notes || "",
          kargo_firma: t.shippingCost > 0 ? t.shippingLabel : "",
          kargo_ucret: t.shippingCost,
          indirim: t.discount,

        },
        items: items.map((i) => ({
          product_id: i.product_id,
          adet: i.qty,
          birim_fiyat: i.price,
          urun_adi_snapshot: i.name,
        })),
      });
      if (oErr) throw oErr;

      clear();
      toast.success("Siparişiniz alındı!");
      if (userId) nav({ to: "/hesabim" });
      else setPlacedCode(String(newOrderId).slice(0, 8).toUpperCase());

    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Sipariş oluşturulamadı");
    } finally {
      setBusy(false);
    }
  };

  if (placedCode) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar /><div className="h-20" />
        <div className="max-w-lg mx-auto text-center py-24 px-6">
          <h1 className="font-display text-4xl text-brand-ink mb-4">Siparişiniz alındı!</h1>
          <p className="text-muted-foreground mb-6">Sipariş kodunuz:</p>
          <div className="text-3xl font-mono font-bold tracking-widest bg-brand-sand/40 border rounded-2xl py-5 mb-6">
            {placedCode}
          </div>
          <p className="text-brand-ink mb-8">Bu kodu kaydedin, kargonuz en kısa sürede yola çıkacak.</p>
          <Link to="/urunler" className="inline-block px-6 py-3 rounded-full bg-brand-ink text-white">Alışverişe Devam Et</Link>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar /><div className="h-20" />
        <div className="max-w-md mx-auto text-center py-32">
          <p className="text-muted-foreground mb-6">Sepetinizde ürün bulunmuyor.</p>
          <Link to="/urunler" className="inline-block px-6 py-3 rounded-full bg-brand-ink text-white">Alışverişe Başla</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar /><div className="h-20" />
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-12">
        <h1 className="font-display text-5xl text-brand-ink mb-8">Ödeme</h1>
        <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-8">
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="font-display text-2xl mb-2">Teslimat Bilgileri</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Ad Soyad" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              <Input label="Telefon" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            </div>
            {user && (
              <Input label="E-posta" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} disabled />
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">İl</label>
                <select value={form.sehir} onChange={(e) => setForm({ ...form, sehir: e.target.value, ilce: "" })} className="w-full border border-border rounded-full px-4 py-2.5 bg-white focus:outline-none focus:border-brand-ink">
                  <option value="">İl seçin</option>
                  {TR_IL_LIST.map((il) => <option key={il} value={il}>{il}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">İlçe</label>
                <select value={form.ilce} onChange={(e) => setForm({ ...form, ilce: e.target.value })} disabled={!form.sehir} className="w-full border border-border rounded-full px-4 py-2.5 bg-white focus:outline-none focus:border-brand-ink disabled:bg-muted">
                  <option value="">İlçe seçin</option>
                  {ilceler.map((i) => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
            </div>

            {!user && (
              <>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={form.createAccount} onChange={(e) => setForm({ ...form, createAccount: e.target.checked, kvkk: false })} />
                  <span>Hesap oluştur (isteğe bağlı — siparişlerini takip edebilirsin)</span>
                </label>
                {form.createAccount && (
                  <>
                    <div className="grid md:grid-cols-2 gap-4">
                      <Input label="E-posta" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
                      <Input label="Şifre (en az 6 karakter)" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
                    </div>
                    <label className="flex items-start gap-2 text-sm">
                      <input type="checkbox" className="mt-1" checked={form.kvkk} onChange={(e) => setForm({ ...form, kvkk: e.target.checked })} />
                      <span className="text-muted-foreground">
                        <Link to="/uyelik-sozlesmesi" className="underline text-brand-ink">Üyelik sözleşmesi</Link>,{" "}
                        <Link to="/gizlilik-sozlesmesi" className="underline text-brand-ink">KVKK aydınlatma metni</Link> ve{" "}
                        <Link to="/kullanim-kosullari" className="underline text-brand-ink">kullanım koşullarını</Link> okudum, onaylıyorum.
                      </span>
                    </label>
                  </>
                )}
              </>
            )}
            <div>
              <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">Açık Adres</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={3} placeholder="Cadde, sokak, bina no, daire..." className="w-full border border-border rounded-2xl p-3 focus:outline-none focus:border-brand-ink" />
            </div>
            <div>
              <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">Sipariş Notu (opsiyonel)</label>
              <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-border rounded-2xl p-3 focus:outline-none focus:border-brand-ink" />
            </div>

            <h2 className="font-display text-2xl mt-6 mb-2">Ödeme Yöntemi</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["nakit", "kart"] as const).map((p) => (
                <label key={p} className={`cursor-pointer border-2 rounded-2xl p-4 text-center ${form.payment === p ? "border-brand-ink bg-brand-sand/20" : "border-border"}`}>
                  <input type="radio" name="pay" value={p} checked={form.payment === p} onChange={() => setForm({ ...form, payment: p })} className="sr-only" />
                  <p className="font-semibold text-brand-ink">Kapıda {p === "nakit" ? "Nakit" : "Kartla"} Ödeme</p>
                </label>
              ))}
            </div>
          </div>

          <aside className="bg-white rounded-2xl border p-6 h-fit sticky top-24">
            <h2 className="font-display text-2xl text-brand-ink mb-4">Sipariş Özeti</h2>
            <div className="space-y-2 mb-4 max-h-64 overflow-auto">
              {items.map((i) => (
                <div key={i.product_id} className="flex justify-between text-sm">
                  <span className="truncate mr-2">{i.name} × {i.qty}</span>
                  <span>{formatTL(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-sm border-t pt-3"><span>Ara toplam</span><span>{formatTL(t.subtotal)}</span></div>
            {t.discount > 0 && (
              <div className="flex justify-between text-sm text-brand-cta mt-1"><span>İndirim</span><span>-{formatTL(t.discount)}</span></div>
            )}
            <div className="flex justify-between text-sm mt-1">
              <span>Kargo{t.shippingLabel ? ` (${t.shippingLabel})` : ""}</span>
              <span className={t.shippingCost === 0 ? "text-brand-cta" : ""}>{t.shippingCost === 0 ? "ÜCRETSİZ" : formatTL(t.shippingCost)}</span>
            </div>
            {t.appliedCampaigns.length > 0 && (
              <p className="text-xs text-brand-cta mt-2">Uygulanan kampanya: {t.appliedCampaigns.join(", ")}</p>
            )}
            <div className="flex justify-between font-semibold text-lg border-t pt-4 mt-3"><span>Toplam</span><span>{formatTL(t.total)}</span></div>

            <button type="submit" disabled={busy} className="mt-6 w-full bg-brand-cta text-white py-4 rounded-full font-semibold tracking-wider hover:opacity-90 disabled:opacity-60">
              {busy ? "GÖNDERİLİYOR..." : "SİPARİŞİ TAMAMLA"}
            </button>
          </aside>
        </form>
      </div>
      <Footer />
    </div>
  );
}

function Input({ label, value, onChange, type = "text", disabled }: { label: string; value: string; onChange: (v: string) => void; type?: string; disabled?: boolean; }) {
  return (
    <div>
      <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">{label}</label>
      <input type={type} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className="w-full border border-border rounded-full px-4 py-2.5 focus:outline-none focus:border-brand-ink disabled:bg-muted" />
    </div>
  );
}
