import { Link } from "@tanstack/react-router";
import { Instagram, Phone, MapPin, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { MadeBy } from "@/components/MadeBy";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/lib/settings";


export function Footer() {
  const { data: settings } = useSiteSettings();
  const brand = settings?.brand_name || "Alpottica";
  const phone = settings?.phone || "0546 646 02 44";
  const email = settings?.email || "";
  const address = settings?.address || "İstanbul, Türkiye";
  const instagram = settings?.instagram || "alpottica";
  const [mail, setMail] = useState("");
  const [busy, setBusy] = useState(false);

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(mail)) return toast.error("Geçerli e-posta girin");
    setBusy(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email: mail.trim().toLowerCase(), kaynak: "footer" });
    setBusy(false);
    if (error && !/duplicate|unique/i.test(error.message)) return toast.error("Kayıt yapılamadı, tekrar deneyin");
    toast.success("Bültenimize kaydoldunuz!");
    setMail("");
  };

  return (
    <footer className="bg-brand-ink text-white/80">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-16 grid gap-10 md:grid-cols-2 lg:grid-cols-5">
        <div>
          <h4 className="text-white text-xs tracking-[0.3em] mb-5">KURUMSAL</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/hakkimizda" className="hover:text-white transition">Hakkımızda</Link></li>
            <li><Link to="/iletisim" className="hover:text-white transition">Bize Ulaşın</Link></li>
            <li><a href="/urunler" className="hover:text-white transition">Ürünler</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs tracking-[0.3em] mb-5">HESABIM</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/hesabim" className="hover:text-white transition">Hesap Bilgilerim</Link></li>
            <li><Link to="/hesabim" search={{ tab: "orders" }} className="hover:text-white transition">Siparişlerim</Link></li>
            <li><Link to="/hesabim" search={{ tab: "favorites" }} className="hover:text-white transition">Favorilerim</Link></li>
            <li><Link to="/hesabim" search={{ tab: "addresses" }} className="hover:text-white transition">Adres Bilgilerim</Link></li>
            <li><Link to="/sepet" className="hover:text-white transition">Sepetim</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs tracking-[0.3em] mb-5">SÖZLEŞMELER</h4>
          <ul className="space-y-3 text-sm">
            <li><Link to="/uyelik-sozlesmesi" className="hover:text-white transition">Üyelik Sözleşmesi</Link></li>
            <li><Link to="/gizlilik-sozlesmesi" className="hover:text-white transition">Gizlilik Sözleşmesi</Link></li>
            <li><Link to="/kullanim-kosullari" className="hover:text-white transition">Kullanım Koşulları</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white text-xs tracking-[0.3em] mb-5">BİZDEN HABERLER</h4>
          <p className="text-sm mb-3">Kampanya ve yeniliklerden ilk siz haberdar olun.</p>
          <form onSubmit={subscribe} className="flex flex-col gap-2">
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/50" />
              <input
                type="email"
                value={mail}
                onChange={(e) => setMail(e.target.value)}
                placeholder="E-posta adresiniz"
                className="w-full pl-9 pr-3 py-2.5 rounded-full bg-white/10 border border-white/20 text-sm text-white placeholder-white/40 focus:outline-none focus:border-white/60"
              />
            </div>
            <button type="submit" disabled={busy} className="rounded-full bg-white text-brand-ink text-xs tracking-widest font-semibold py-2.5 hover:opacity-90 transition disabled:opacity-60">
              {busy ? "KAYDEDİLİYOR..." : "ABONE OL"}
            </button>
          </form>
        </div>

        <div>
          <h4 className="text-white text-xs tracking-[0.3em] mb-5">MÜŞTERİ HİZMETLERİ</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Phone className="w-4 h-4 mt-0.5 shrink-0" />
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-white transition">{phone}</a>
            </li>
            {email && (
              <li className="flex items-start gap-2">
                <Mail className="w-4 h-4 mt-0.5 shrink-0" />
                <a href={`mailto:${email}`} className="hover:text-white transition">{email}</a>
              </li>
            )}
            <li className="flex items-start gap-2">
              <Instagram className="w-4 h-4 mt-0.5 shrink-0" />
              <a href={`https://instagram.com/${instagram.replace("@", "")}`} target="_blank" rel="noreferrer" className="hover:text-white transition">@{instagram.replace("@", "")}</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{address}</span>
            </li>
          </ul>
          <div className="mt-5 pt-5 border-t border-white/10">
            <p className="text-xs tracking-widest text-white/60 mb-2">GERİ BİLDİRİM</p>
            <Link to="/iletisim" className="text-sm hover:text-white transition underline">Bize yazın →</Link>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-5 text-xs text-white/50 flex flex-wrap items-center justify-between gap-2">
          <span>© {new Date().getFullYear()} {brand}. Tüm hakları saklıdır.</span>
          <MadeBy />
        </div>
      </div>
    </footer>
  );
}

