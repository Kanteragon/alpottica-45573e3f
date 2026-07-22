import { Link } from "@tanstack/react-router";
import { Instagram, Phone, MapPin, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function Footer() {
  const [mail, setMail] = useState("");

  const subscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(mail)) return toast.error("Geçerli e-posta girin");
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
            <button type="submit" className="rounded-full bg-white text-brand-ink text-xs tracking-widest font-semibold py-2.5 hover:opacity-90 transition">
              ABONE OL
            </button>
          </form>
        </div>

        <div>
          <h4 className="text-white text-xs tracking-[0.3em] mb-5">MÜŞTERİ HİZMETLERİ</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <Phone className="w-4 h-4 mt-0.5 shrink-0" />
              <a href="tel:+905466460244" className="hover:text-white transition">0546 646 02 44</a>
            </li>
            <li className="flex items-start gap-2">
              <Instagram className="w-4 h-4 mt-0.5 shrink-0" />
              <a href="https://instagram.com/alpottica" target="_blank" rel="noreferrer" className="hover:text-white transition">@alpottica</a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
              <span>İstanbul, Türkiye</span>
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
          <span>© {new Date().getFullYear()} Alpottica Istanbul. Tüm hakları saklıdır.</span>
          <span>Made with care in İstanbul</span>
        </div>
      </div>
    </footer>
  );
}
