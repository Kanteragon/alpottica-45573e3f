import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/giris")({
  head: () => ({
    meta: [
      { title: "Giriş — Alpottica" },
      { name: "description", content: "Hesabınıza giriş yapın veya kayıt olun." },
    ],
  }),
  component: Login,
});

function Login() {
  const nav = useNavigate();
  const { user, isAdmin } = useAuth();
  const [mode, setMode] = useState<"login" | "register" | "admin">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav({ to: isAdmin ? "/admin" : "/hesabim" });
  }, [user, isAdmin, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: fullName, phone } },
        });
        if (error) throw error;
        toast.success("Kayıt oluşturuldu, giriş yapıldı.");
      } else {
        const loginEmail = mode === "admin" && !email.includes("@")
          ? "adminalpottica@alpottica.com" : email;
        const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
        if (error) throw error;
        toast.success("Giriş başarılı");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Hata oluştu");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="h-20" />
      <div className="max-w-md mx-auto px-6 py-16">
        <h1 className="font-display text-4xl text-brand-ink text-center mb-2">
          {mode === "register" ? "Kayıt Ol" : mode === "admin" ? "Admin Girişi" : "Giriş Yap"}
        </h1>
        <p className="text-center text-muted-foreground text-sm mb-8">Alpottica Istanbul</p>

        <div className="flex bg-brand-sand/40 rounded-full p-1 mb-6">
          <button onClick={() => setMode("login")} className={`flex-1 py-2 text-xs tracking-widest rounded-full ${mode === "login" ? "bg-white shadow" : ""}`}>MÜŞTERİ</button>
          <button onClick={() => setMode("register")} className={`flex-1 py-2 text-xs tracking-widest rounded-full ${mode === "register" ? "bg-white shadow" : ""}`}>KAYIT</button>
          <button onClick={() => setMode("admin")} className={`flex-1 py-2 text-xs tracking-widest rounded-full ${mode === "admin" ? "bg-white shadow" : ""}`}>ADMİN</button>
        </div>

        <form onSubmit={submit} className="space-y-4 bg-white p-6 rounded-2xl border">
          {mode === "register" && (
            <>
              <Field label="Ad Soyad" value={fullName} onChange={setFullName} />
              <Field label="Telefon" value={phone} onChange={setPhone} />
            </>
          )}
          <Field
            label={mode === "admin" ? "Kullanıcı adı veya E-posta" : "E-posta"}
            value={email}
            onChange={setEmail}
            placeholder={mode === "admin" ? "adminalpottica" : ""}
          />
          <Field label="Şifre" type="password" value={password} onChange={setPassword} />
          <button disabled={busy} className="w-full bg-brand-cta text-white py-3 rounded-full font-semibold tracking-wider hover:opacity-90 disabled:opacity-60">
            {busy ? "..." : mode === "register" ? "KAYIT OL" : "GİRİŞ YAP"}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          <Link to="/" className="hover:text-brand-ink">← Anasayfaya dön</Link>
        </p>
      </div>
      <Footer />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; }) {
  return (
    <div>
      <label className="block text-xs tracking-widest text-muted-foreground uppercase mb-2">{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full border border-border rounded-full px-4 py-2.5 focus:outline-none focus:border-brand-ink" />
    </div>
  );
}
