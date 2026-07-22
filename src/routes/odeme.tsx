import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { formatTL } from "@/lib/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

export const Route = createFileRoute("/odeme")({
  head: () => ({
    meta: [
      { title: "Ödeme — Alpottica" },
      { name: "description", content: "Siparişinizi tamamlayın." },
    ],
  }),
  component: Checkout,
});

const schema = z.object({
  full_name: z.string().min(3, "Ad Soyad zorunlu"),
  phone: z.string().min(10, "Telefon zorunlu"),
  email: z.string().email("Geçerli e-posta girin"),
  address: z.string().min(10, "Adres zorunlu"),
  password: z.string().min(6, "Şifre en az 6 karakter"),
  payment: z.enum(["nakit", "kart"]),
  notes: z.string().optional(),
});

function Checkout() {
  const nav = useNavigate();
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const [form, setForm] = useState({
    full_name: "",
    phone: "",
    email: user?.email ?? "",
    address: "",
    password: "",
    payment: "nakit" as "nakit" | "kart",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.email) setForm((f) => ({ ...f, email: user.email! }));
  }, [user]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return toast.error("Sepetiniz boş");

    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      return toast.error(parsed.error.errors[0].message);
    }
    setBusy(true);

    try {
      let userId = user?.id ?? null;

      if (!userId) {
        const { data, error } = await supabase.auth.signUp({
          email: form.email,
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: form.full_name, phone: form.phone },
          },
        });
        if (error && !error.message.includes("already registered")) throw error;
        userId = data.user?.id ?? null;

        if (!userId) {
          const { data: signIn, error: siErr } = await supabase.auth.signInWithPassword({
            email: form.email, password: form.password,
          });
          if (siErr) throw siErr;
          userId = signIn.user?.id ?? null;
        }
      }

      const { data: order, error: oErr } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          ad_soyad: form.full_name,
          telefon: form.phone,
          email: form.email,
          adres: form.address,
          odeme_tipi: form.payment,
          toplam: total,
          notlar: form.notes || null,
        })
        .select("id")
        .single();
      if (oErr) throw oErr;

      const orderItems = items.map((i) => ({
        order_id: order.id,
        product_id: i.product_id,
        adet: i.qty,
        birim_fiyat: i.price,
        urun_adi_snapshot: i.name,
      }));
      const { error: iErr } = await supabase.from("order_items").insert(orderItems);
      if (iErr) throw iErr;

      clear();
      toast.success("Siparişiniz alındı!");
      nav({ to: "/hesabim" });
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Sipariş oluşturulamadı");
    } finally {
      setBusy(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="h-20" />
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
      <Navbar />
      <div className="h-20" />
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-12">
        <h1 className="font-display text-5xl text-brand-ink mb-8">Ödeme</h1>
        <form onSubmit={submit} className="grid lg:grid-cols-[1fr_400px] gap-8">
          <div className="bg-white rounded-2xl border p-6 space-y-4">
            <h2 className="font-display text-2xl mb-2">Teslimat Bilgileri</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Input label="Ad Soyad" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
              <Input label="Telefon" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            </div>
            <Input label="E-posta" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} disabled={!!user} />
            {!user && (
              <Input label="Şifre (üyelik için)" type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
            )}
            <div>
              <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">Adres</label>
              <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} rows={4} className="w-full border border-border rounded-2xl p-3 focus:outline-none focus:border-brand-ink" />
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
            <div className="flex justify-between font-semibold text-lg border-t pt-4"><span>Toplam</span><span>{formatTL(total)}</span></div>
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
