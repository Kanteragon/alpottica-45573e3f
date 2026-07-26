import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatTL } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TR_ILLER, TR_ILLER_LIST as TR_IL_LIST } from "@/lib/tr-locations"; // Projendeki import yoluna göre düzenlenebilir

export const Route = createFileRoute("/odeme")({
  head: () => ({
    meta: [{ title: "Ödeme — Alpottica" }, { name: "description", content: "Siparişinizi tamamlayın." }],
  }),
  component: Checkout,
});

function Checkout() {
  const nav = useNavigate();
  const { items, total, clear } = useCart();
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
    payment: "nakit" as "nakit" | "kart",
    notes: "",
  });

  const [busy, setBusy] = useState(false);
  const [successOrder, setSuccessOrder] = useState<{ id: string; trackingCode: string } | null>(null);

  const ilceler = useMemo(() => (form.sehir ? (TR_ILLER[form.sehir] ?? []) : []), [form.sehir]);

  useEffect(() => {
    if (user?.email) setForm((f) => ({ ...f, email: user.email!, createAccount: false }));
  }, [user]);

  useEffect(() => {
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("full_name,phone,address")
        .eq("id", user.id)
        .maybeSingle();
      const { data: addrRaw } = await supabase
        .from("addresses")
        .select("*")
        .eq("user_id", user.id)
        .order("is_default", { ascending: false })
        .limit(1)
        .maybeSingle();
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
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return toast.error("Geçerli e-posta girin");
    if (!form.sehir) return toast.error("İl seçin");
    if (!form.ilce) return toast.error("İlçe seçin");
    if (form.address.trim().length < 10) return toast.error("Adres zorunlu");
    if (!user && form.createAccount && form.password.length < 6) return toast.error("Şifre en az 6 karakter olmalıdır");

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
              email: form.email.trim(),
              password: form.password,
            });
            if (siErr) throw new Error("Bu e-posta zaten kayıtlı; şifre hatalı.");
            userId = si.user?.id ?? null;
          } else throw error;
        } else {
          userId = data.user?.id ?? null;
          if (!userId) {
            const { data: si } = await supabase.auth.signInWithPassword({
              email: form.email.trim(),
              password: form.password,
            });
            userId = si.user?.id ?? null;
          }
        }
        if (userId) {
          await supabase
            .from("profiles")
            .update({ full_name: form.full_name, phone: form.phone, address: form.address })
            .eq("id", userId);
        }
      }

      // 1. Siparişi oluştur (Misafir veya üye fark etmeksizin kaydedilir)
      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          user_id: userId, // Giriş yapılmadıysa null kalabilir
          ad_soyad: form.full_name,
          telefon: form.phone,
          email: form.email,
          adres: form.address,
          sehir: form.sehir,
          ilce: form.ilce,
          mahalle: form.mahalle || null,
          posta_kodu: form.posta_kodu || null,
          odeme_tipi: form.payment,
          toplam: total,
          notlar: form.notes || null,
        })
        .select("id")
        .single();
      if (oErr) throw oErr;

      // 2. Sipariş kalemlerini ekle
      const orderItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        adet: i.qty,
        birim_fiyat: i.price,
        urun_adi_snapshot: i.name,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(orderItems);
      if (iErr) throw iErr;

      // 3. Eğer kullanıcı giriş yapmışsa veya hesap açtıysa adresi addresses tablosuna da güvenli şekilde ekle
      if (userId) {
        await supabase
          .from("addresses")
          .insert({
            user_id: userId,
            ad_soyad: form.full_name,
            telefon: form.phone,
            adres: form.address,
            sehir: form.sehir,
            ilce: form.ilce,
            mahalle: form.mahalle || null,
            posta_kodu: form.posta_kodu || null,
            baslik: "Teslimat Adresi",
          })
          .select()
          .maybeSingle();
      }

      clear();
      toast.success("Siparişiniz başarıyla alındı!");

      // Benzersiz takip kodu üret (Sipariş ID'sinin ilk 8 büyük harfi)
      const trackingCode = order.id.replace(/-/g, "").substring(0, 8).toUpperCase();
      setSuccessOrder({ id: order.id, trackingCode });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Sipariş oluşturulamadı");
    } finally {
      setBusy(false);
    }
  };

  if (successOrder) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-20" />
        <div className="max-w-xl mx-auto text-center py-20 px-6">
          <div className="bg-white rounded-3xl border p-8 shadow-sm space-y-6">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h1 className="font-display text-3xl text-brand-ink">Siparişiniz Alındı!</h1>
            <p className="text-muted-foreground text-sm">
              Alışverişiniz için teşekkür ederiz. Siparişiniz başarıyla oluşturulmuştur.
            </p>

            <div className="bg-muted/50 rounded-2xl p-4 border">
              <span className="block text-xs uppercase tracking-widest text-muted-foreground mb-1">
                Sipariş Takip Kodunuz
              </span>
              <span className="font-mono text-2xl font-bold text-brand-ink tracking-wider">
                {successOrder.trackingCode}
              </span>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed bg-amber-50 text-amber-800 p-3 rounded-xl border border-amber-200">
              Sipariş takip kodunuz ve detaylarınız belirttiğiniz telefon numarasına{" "}
              <strong>SMS ile gönderilecektir</strong>.
            </p>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                to="/urunler"
                className="flex-1 py-3 px-6 rounded-full bg-brand-ink text-white font-medium text-sm hover:opacity-90 text-center"
              >
                Alışverişe Devam Et
              </Link>
              {user && (
                <Link
                  to="/hesabim"
                  className="flex-1 py-3 px-6 rounded-full border border-border text-brand-ink font-medium text-sm hover:bg-muted text-center"
                >
                  Siparişlerimi Görüntüle
                </Link>
              )}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-20" />
        <div className="max-w-md mx-auto text-center py-32">
          <p className="text-muted-foreground mb-6">Sepetinizde ürün bulunmuyor.</p>
          <Link to="/urunler" className="inline-block px-6 py-3 rounded-full bg-brand-ink text-white">
            Alışverişe Başla
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-20" />
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-12">
        <h1 className="font-display text-5xl text-brand-ink mb-8">Ödeme</h1>
        <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-8">
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="font-display text-2xl mb-2">Teslimat ve İletişim Bilgileri</h2>
            {!user && (
              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-xl border border-blue-200 mb-2">
                Üye olmadan hızlıca sipariş verebilirsiniz. İsterseniz aşağıdan hesap oluşturarak siparişlerinizi takip
                edebilirsiniz.
              </div>
            )}
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Ad Soyad" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              <Input
                label="Telefon"
                value={form.phone}
                onChange={(v) => setForm({ ...form, phone: v })}
                placeholder="05XX XXX XX XX"
              />
            </div>
            <Input
              label="E-posta"
              type="email"
              value={form.email}
              onChange={(v) => setForm({ ...form, email: v })}
              disabled={!!user}
            />

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">İl</label>
                <select
                  value={form.sehir}
                  onChange={(e) => setForm({ ...form, sehir: e.target.value, ilce: "" })}
                  className="w-full border border-border rounded-full px-4 py-2.5 bg-white focus:outline-none focus:border-brand-ink"
                >
                  <option value="">İl seçin</option>
                  {TR_IL_LIST.map((il) => (
                    <option key={il} value={il}>
                      {il}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">İlçe</label>
                <select
                  value={form.ilce}
                  onChange={(e) => setForm({ ...form, ilce: e.target.value })}
                  disabled={!form.sehir}
                  className="w-full border border-border rounded-full px-4 py-2.5 bg-white focus:outline-none focus:border-brand-ink disabled:bg-muted"
                >
                  <option value="">İlçe seçin</option>
                  {ilceler.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Mahalle" value={form.mahalle} onChange={(v) => setForm({ ...form, mahalle: v })} />
              <Input label="Posta Kodu" value={form.posta_kodu} onChange={(v) => setForm({ ...form, posta_kodu: v })} />
            </div>

            {!user && (
              <div className="pt-2 border-t mt-4 space-y-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.createAccount}
                    onChange={(e) => setForm({ ...form, createAccount: e.target.checked })}
                    className="rounded border-border"
                  />
                  <span>Bu bilgilerle benim için yeni bir hesap oluştur (isteğe bağlı)</span>
                </label>
                {form.createAccount && (
                  <Input
                    label="Şifre Belirle (en az 6 karakter)"
                    type="password"
                    value={form.password}
                    onChange={(v) => setForm({ ...form, password: v })}
                  />
                )}
              </div>
            )}

            <div>
              <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">Açık Adres</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                rows={3}
                placeholder="Cadde, sokak, bina no, daire..."
                className="w-full border border-border rounded-2xl p-3 focus:outline-none focus:border-brand-ink text-sm"
              />
            </div>
            <div>
              <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">
                Sipariş Notu (opsiyonel)
              </label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                rows={2}
                className="w-full border border-border rounded-2xl p-3 focus:outline-none focus:border-brand-ink text-sm"
              />
            </div>

            <h2 className="font-display text-2xl mt-6 mb-2">Ödeme Yöntemi</h2>
            <div className="grid grid-cols-2 gap-3">
              {(["nakit", "kart"] as const).map((p) => (
                <label
                  key={p}
                  className={`cursor-pointer border-2 rounded-2xl p-4 text-center transition-all ${form.payment === p ? "border-brand-ink bg-brand-sand/20" : "border-border"}`}
                >
                  <input
                    type="radio"
                    name="pay"
                    value={p}
                    checked={form.payment === p}
                    onChange={() => setForm({ ...form, payment: p })}
                    className="sr-only"
                  />
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
                  <span className="truncate mr-2">
                    {i.name} × {i.qty}
                  </span>
                  <span>{formatTL(i.price * i.qty)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between font-semibold text-lg border-t pt-4">
              <span>Toplam</span>
              <span>{formatTL(total)}</span>
            </div>
            <button
              type="submit"
              disabled={busy}
              className="mt-6 w-full bg-brand-cta text-white py-4 rounded-full font-semibold tracking-wider hover:opacity-90 disabled:opacity-60 transition-opacity"
            >
              {busy ? "SİPARİŞ OLUŞTURULUYOR..." : "SİPARİŞİ TAMAMLA"}
            </button>
          </aside>
        </form>
      </div>
      <Footer />
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  disabled,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">{label}</label>
      <input
        type={type}
        value={value}
        disabled={disabled}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-border rounded-full px-4 py-2.5 focus:outline-none focus:border-brand-ink disabled:bg-muted text-sm"
      />
    </div>
  );
}
