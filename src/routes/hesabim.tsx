import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { formatTL } from "@/lib/products";
import { toast } from "sonner";
import { User, MapPin, Package, Heart, Lock, LogOut } from "lucide-react";

type Tab = "profile" | "addresses" | "orders" | "favorites" | "password";

export const Route = createFileRoute("/hesabim")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => ({
    tab: (s.tab as Tab) || undefined,
  }),
  head: () => ({
    meta: [
      { title: "Hesabım — Alpottica" },
      { name: "description", content: "Siparişleriniz, adresleriniz ve hesap bilgileriniz." },
    ],
  }),
  component: Account,
});

function Account() {
  const { user, loading, signOut, isAdmin } = useAuth();
  const nav = useNavigate();
  const search = Route.useSearch();
  const [tab, setTab] = useState<Tab>(search.tab ?? "profile");

  useEffect(() => {
    if (!loading && !user) nav({ to: "/giris" });
  }, [loading, user, nav]);

  if (!user) return null;

  const TABS: { key: Tab; label: string; icon: typeof User }[] = [
    { key: "profile", label: "Kişisel Bilgiler", icon: User },
    { key: "addresses", label: "Adreslerim", icon: MapPin },
    { key: "orders", label: "Siparişlerim", icon: Package },
    { key: "favorites", label: "Favorilerim", icon: Heart },
    { key: "password", label: "Şifre Değiştir", icon: Lock },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-20" />
      <div className="max-w-[1200px] mx-auto px-6 lg:px-10 py-12">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-display text-5xl text-brand-ink">Hesabım</h1>
            <p className="text-muted-foreground text-sm mt-2">{user.email}</p>
          </div>
          {isAdmin && (
            <Link to="/admin" className="px-5 py-2 rounded-full bg-brand-ink text-white text-sm">Admin Paneli</Link>
          )}
        </div>

        <div className="grid lg:grid-cols-[240px_1fr] gap-8">
          <aside className="bg-white rounded-2xl border p-2 h-fit">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-left transition ${
                  tab === t.key ? "bg-brand-ink text-white" : "text-brand-ink hover:bg-brand-sand/30"
                }`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
            <button
              onClick={() => signOut().then(() => nav({ to: "/" }))}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-600 hover:bg-red-50 mt-2 border-t"
            >
              <LogOut className="w-4 h-4" /> Çıkış Yap
            </button>
          </aside>

          <div className="min-w-0">
            {tab === "profile" && <ProfileTab userId={user.id} email={user.email!} />}
            {tab === "addresses" && <AddressesTab userId={user.id} />}
            {tab === "orders" && <OrdersTab />}
            {tab === "favorites" && <FavoritesTab />}
            {tab === "password" && <PasswordTab />}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function ProfileTab({ userId, email }: { userId: string; email: string }) {
  const qc = useQueryClient();
  const { data: profile } = useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      return data;
    },
  });
  const [form, setForm] = useState({ full_name: "", phone: "", newEmail: email });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (profile) setForm((f) => ({ ...f, full_name: profile.full_name ?? "", phone: profile.phone ?? "" }));
  }, [profile]);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.from("profiles").upsert({
        id: userId,
        full_name: form.full_name,
        phone: form.phone,
      });
      if (error) throw error;
      if (form.newEmail && form.newEmail !== email) {
        const { error: eErr } = await supabase.auth.updateUser({ email: form.newEmail });
        if (eErr) throw eErr;
      }
      qc.invalidateQueries({ queryKey: ["profile", userId] });
      toast.success("Bilgileriniz güncellendi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={save} className="bg-white rounded-2xl border p-6 space-y-4">
      <h2 className="font-display text-2xl text-brand-ink mb-2">Kişisel Bilgiler</h2>
      <Field label="Ad Soyad" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
      <Field label="Telefon" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
      <Field label="E-posta" type="email" value={form.newEmail} onChange={(v) => setForm({ ...form, newEmail: v })} />
      <button disabled={busy} className="bg-brand-ink text-white px-6 py-3 rounded-full text-sm font-semibold tracking-widest disabled:opacity-60">
        {busy ? "..." : "KAYDET"}
      </button>
    </form>
  );
}

function AddressesTab({ userId }: { userId: string }) {
  const qc = useQueryClient();
  const { data: addresses } = useQuery({
    queryKey: ["addresses", userId],
    queryFn: async () => {
      const { data, error } = await supabase.from("addresses").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
  const [form, setForm] = useState({ baslik: "", ad_soyad: "", telefon: "", adres: "", sehir: "", ilce: "" });
  const [busy, setBusy] = useState(false);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.from("addresses").insert({ ...form, user_id: userId });
      if (error) throw error;
      setForm({ baslik: "", ad_soyad: "", telefon: "", adres: "", sehir: "", ilce: "" });
      qc.invalidateQueries({ queryKey: ["addresses", userId] });
      toast.success("Adres eklendi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    } finally {
      setBusy(false);
    }
  };

  const del = async (id: string) => {
    await supabase.from("addresses").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["addresses", userId] });
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="font-display text-2xl text-brand-ink mb-4">Kayıtlı Adreslerim</h2>
        {!addresses || addresses.length === 0 ? (
          <p className="text-muted-foreground text-sm">Henüz kayıtlı adresiniz yok.</p>
        ) : (
          <div className="space-y-3">
            {addresses.map((a) => (
              <div key={a.id} className="border rounded-xl p-4 flex justify-between items-start gap-4">
                <div>
                  <p className="font-semibold text-brand-ink">{a.baslik}</p>
                  <p className="text-sm text-muted-foreground">{a.ad_soyad} • {a.telefon}</p>
                  <p className="text-sm mt-1">{a.adres} {a.ilce && `• ${a.ilce}`} {a.sehir && `• ${a.sehir}`}</p>
                </div>
                <button onClick={() => del(a.id)} className="text-xs text-red-600 hover:underline">Sil</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <form onSubmit={add} className="bg-white rounded-2xl border p-6 space-y-4">
        <h2 className="font-display text-2xl text-brand-ink mb-2">Yeni Adres Ekle</h2>
        <Field label="Adres Başlığı (Ev, İş...)" value={form.baslik} onChange={(v) => setForm({ ...form, baslik: v })} />
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Ad Soyad" value={form.ad_soyad} onChange={(v) => setForm({ ...form, ad_soyad: v })} />
          <Field label="Telefon" value={form.telefon} onChange={(v) => setForm({ ...form, telefon: v })} />
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="İl" value={form.sehir} onChange={(v) => setForm({ ...form, sehir: v })} />
          <Field label="İlçe" value={form.ilce} onChange={(v) => setForm({ ...form, ilce: v })} />
        </div>
        <div>
          <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">Adres</label>
          <textarea value={form.adres} onChange={(e) => setForm({ ...form, adres: e.target.value })} rows={3} className="w-full border border-border rounded-2xl p-3 focus:outline-none focus:border-brand-ink" />
        </div>
        <button disabled={busy} className="bg-brand-ink text-white px-6 py-3 rounded-full text-sm font-semibold tracking-widest disabled:opacity-60">
          {busy ? "..." : "ADRES EKLE"}
        </button>
      </form>
    </div>
  );
}

function OrdersTab() {
  const { data: orders } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id,created_at,toplam,durum,odeme_tipi,ad_soyad,order_items(adet,birim_fiyat,urun_adi_snapshot)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="bg-white rounded-2xl border p-6">
      <h2 className="font-display text-2xl text-brand-ink mb-4">Siparişlerim</h2>
      {!orders || orders.length === 0 ? (
        <p className="text-muted-foreground text-sm">Henüz siparişiniz yok.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="border rounded-2xl p-5">
              <div className="flex flex-wrap justify-between mb-3 gap-2 items-center">
                <div>
                  <p className="font-mono text-xs text-muted-foreground">#{o.id.slice(0, 8)}</p>
                  <p className="text-sm">{new Date(o.created_at).toLocaleString("tr-TR")}</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-brand-sand text-xs tracking-widest uppercase">{o.durum}</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 mb-3">
                {o.order_items?.map((it, idx: number) => (
                  <div key={idx}>{it.urun_adi_snapshot} × {it.adet} — {formatTL(Number(it.birim_fiyat))}</div>
                ))}
              </div>
              <div className="flex justify-between items-center pt-3 border-t">
                <span className="text-xs uppercase tracking-widest text-muted-foreground">Kapıda {o.odeme_tipi === "nakit" ? "Nakit" : "Kartla"}</span>
                <span className="font-semibold text-brand-ink">{formatTL(Number(o.toplam))}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FavoritesTab() {
  const qc = useQueryClient();
  const { data: favorites } = useQuery({
    queryKey: ["favorites"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("favorites")
        .select("id,product_id,products(id,slug,urun_adi,satis_fiyati,resimler)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = async (id: string) => {
    await supabase.from("favorites").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["favorites"] });
  };

  return (
    <div className="bg-white rounded-2xl border p-6">
      <h2 className="font-display text-2xl text-brand-ink mb-4">Favorilerim</h2>
      {!favorites || favorites.length === 0 ? (
        <p className="text-muted-foreground text-sm">Henüz favori ürününüz yok.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
          {favorites.map((f) => {
            const p = f.products as { id: string; slug: string; urun_adi: string; satis_fiyati: number; resim: string | null } | null;
            if (!p) return null;
            const img = p.resim?.split(";")[0]?.trim();
            return (
              <div key={f.id} className="border rounded-2xl p-3">
                <Link to="/urun/$slug" params={{ slug: p.slug }} className="block">
                  <div className="aspect-square bg-brand-sand/20 rounded-xl overflow-hidden mb-2">
                    {img && <img src={img} alt={p.urun_adi} className="w-full h-full object-contain p-3" />}
                  </div>
                  <p className="text-sm font-medium text-brand-ink line-clamp-2">{p.urun_adi}</p>
                  <p className="text-sm text-brand-cta font-semibold">{formatTL(Number(p.satis_fiyati))}</p>
                </Link>
                <button onClick={() => remove(f.id)} className="mt-2 text-xs text-red-600 hover:underline">Kaldır</button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PasswordTab() {
  const [pw, setPw] = useState({ current: "", next: "", confirm: "" });
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.next.length < 6) return toast.error("Yeni şifre en az 6 karakter olmalıdır");
    if (pw.next !== pw.confirm) return toast.error("Şifreler eşleşmiyor");
    setBusy(true);
    try {
      // Verify current password by attempting a sign-in
      if (user?.email) {
        const { error: vErr } = await supabase.auth.signInWithPassword({ email: user.email, password: pw.current });
        if (vErr) throw new Error("Mevcut şifre hatalı");
      }
      const { error } = await supabase.auth.updateUser({ password: pw.next });
      if (error) throw error;
      setPw({ current: "", next: "", confirm: "" });
      toast.success("Şifreniz güncellendi");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="bg-white rounded-2xl border p-6 space-y-4 max-w-lg">
      <h2 className="font-display text-2xl text-brand-ink mb-2">Şifre Değiştir</h2>
      <Field label="Mevcut Şifre" type="password" value={pw.current} onChange={(v) => setPw({ ...pw, current: v })} />
      <Field label="Yeni Şifre" type="password" value={pw.next} onChange={(v) => setPw({ ...pw, next: v })} />
      <Field label="Yeni Şifre (Tekrar)" type="password" value={pw.confirm} onChange={(v) => setPw({ ...pw, confirm: v })} />
      <button disabled={busy} className="bg-brand-ink text-white px-6 py-3 rounded-full text-sm font-semibold tracking-widest disabled:opacity-60">
        {busy ? "..." : "ŞİFREYİ GÜNCELLE"}
      </button>
    </form>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className="w-full border border-border rounded-full px-4 py-2.5 focus:outline-none focus:border-brand-ink" />
    </div>
  );
}
