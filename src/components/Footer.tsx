import { Instagram, Phone, MapPin } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-brand-ink text-white/80">
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 py-16 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <h3 className="font-display text-4xl text-white tracking-widest mb-4">ALPOTTICA</h3>
          <p className="text-sm max-w-md leading-relaxed">
            İstanbul'dan; zamansız çerçeveler, polarize ve antifar klips sistemleriyle her ortamda tek gözlükte tam koruma.
          </p>
        </div>
        <div>
          <h4 className="text-white text-sm tracking-widest mb-4">KOLEKSİYON</h4>
          <ul className="space-y-2 text-sm">
            <li>Klipsli Modeller</li>
            <li>Outlet Modeller</li>
            <li>Tüm Modeller</li>
          </ul>
        </div>
        <div>
          <h4 className="text-white text-sm tracking-widest mb-4">İLETİŞİM</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <a href="tel:+905466460244" className="hover:text-white transition">0546 646 02 44</a>
            </li>
            <li className="flex items-center gap-2">
              <Instagram className="w-4 h-4" />
              <a
                href="https://instagram.com/alpottica"
                target="_blank"
                rel="noreferrer"
                className="hover:text-white transition"
              >
                @alpottica
              </a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              İstanbul, Türkiye
            </li>
          </ul>
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
