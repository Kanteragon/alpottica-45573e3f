import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { User, Heart, ShoppingCart, Menu, X } from "lucide-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { useMenu } from "@/lib/queries";
import { useSiteSettings } from "@/lib/settings";
import { SearchBox } from "@/components/SearchBox";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { count } = useCart();
  const { user } = useAuth();
  const { data: menu } = useMenu();
  const { data: settings } = useSiteSettings();
  const path = useRouterState({ select: (s) => s.location.pathname });

  const isHome = path === "/";
  const solid = !isHome || scrolled || menuOpen;

  useEffect(() => {
    if (!isHome) return;
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [isHome]);

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); }, [path]);

  // Lock body scroll when open
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const items = menu?.length ? menu : [
    { id: "1", label: "KLİPSLİ MODELLER", url: "/urunler?tag=klipsli" },
    { id: "2", label: "OUTLET MODELLER", url: "/urunler?tag=outlet" },
    { id: "3", label: "TÜM MODELLER", url: "/urunler" },
  ];

  const brand = settings?.brand_name || "Alpottica";
  const logoSrc = settings?.logo_url ?? null;
  const logoMax = settings?.logo_max_width ?? 260;

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
          solid ? "bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.06)]" : "bg-transparent"
        }`}
      >
        <div className="max-w-[1720px] mx-auto pl-3 pr-4 sm:pr-6 lg:pl-4 lg:pr-10 h-20 grid grid-cols-[auto_1fr_auto] items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menü"
              className={`lg:hidden w-10 h-10 flex items-center justify-center rounded-full transition ${solid ? "text-brand-ink hover:bg-brand-sand/40" : "text-white hover:bg-white/10"}`}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
            <Link to="/" className="flex items-center shrink-0" aria-label={brand}>
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt={brand}
                  style={{ maxWidth: `${logoMax}px` }}
                  className={`h-10 sm:h-12 lg:h-14 w-auto object-contain transition-all duration-500 border-0 outline-none ${solid ? "invert" : "invert-0"}`}
                />
              ) : (
                <span className={`font-display tracking-widest text-xl sm:text-2xl ${solid ? "text-brand-ink" : "text-white"}`}>{brand.toUpperCase()}</span>
              )}
            </Link>
          </div>

          <nav className="hidden lg:flex items-center justify-center gap-12">
            {items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                className={`group relative text-[15px] tracking-[0.16em] font-medium transition-colors py-2 ${
                  solid ? "text-brand-ink hover:text-brand-cta" : "text-white/95 hover:text-white"
                }`}
              >
                {item.label}
                <span className={`pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-0 h-[2px] w-0 group-hover:w-full transition-all duration-300 ${solid ? "bg-brand-cta" : "bg-white"}`} />
              </a>
            ))}
          </nav>

          <div className={`flex items-center justify-end gap-0.5 sm:gap-1 transition-colors ${solid ? "text-brand-ink" : "text-white"}`}>
            <SearchBox solid={solid} />
            <Link
              to={user ? "/hesabim" : "/giris"}
              aria-label={user ? "Hesabım" : "Giriş"}
              className="w-10 h-10 hidden sm:flex items-center justify-center rounded-full hover:bg-current/10 transition"
            >
              <User className="w-[22px] h-[22px]" strokeWidth={1.6} />
            </Link>
            <Link
              to="/hesabim"
              search={{ tab: "favorites" }}
              aria-label="Favoriler"
              className="w-10 h-10 hidden sm:flex items-center justify-center rounded-full hover:bg-current/10 transition"
            >
              <Heart className="w-[22px] h-[22px]" strokeWidth={1.6} />
            </Link>
            <Link to="/sepet" aria-label="Sepet" className="relative w-10 h-10 flex items-center justify-center rounded-full hover:bg-current/10 transition">
              <ShoppingCart className="w-[22px] h-[22px]" strokeWidth={1.6} />
              {count > 0 && (
                <span className="absolute top-1 right-0.5 bg-brand-cta text-white text-[10px] leading-none rounded-full min-w-[17px] h-[17px] px-1 flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${menuOpen ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}
        />
        <aside
          className={`absolute inset-y-0 left-0 w-[86%] max-w-[340px] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
            menuOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="h-20 px-5 flex items-center justify-between border-b border-border shrink-0">
            <span className="font-display text-2xl tracking-widest text-brand-ink">{brand.toUpperCase()}</span>
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Kapat"
              className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-brand-sand/40 text-brand-ink"
            >
              <X className="w-6 h-6" strokeWidth={1.6} />
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-2">
            <p className="px-5 pt-3 pb-2 text-[10px] tracking-[0.3em] text-muted-foreground">KOLEKSİYON</p>
            {items.map((item) => (
              <a
                key={item.id}
                href={item.url}
                className="px-5 py-4 text-brand-ink text-[15px] tracking-[0.12em] font-medium hover:bg-brand-sand/30 flex items-center justify-between border-b border-border/60"
              >
                <span>{item.label}</span>
                <span className="text-brand-cta">→</span>
              </a>
            ))}

            <p className="px-5 pt-5 pb-2 text-[10px] tracking-[0.3em] text-muted-foreground">HESABIM</p>
            <Link to={user ? "/hesabim" : "/giris"} className="px-5 py-3.5 text-brand-ink text-sm flex items-center gap-3 hover:bg-brand-sand/30">
              <User className="w-5 h-5" strokeWidth={1.6} /> {user ? "Hesabım" : "Giriş Yap"}
            </Link>
            <Link to="/hesabim" search={{ tab: "favorites" }} className="px-5 py-3.5 text-brand-ink text-sm flex items-center gap-3 hover:bg-brand-sand/30">
              <Heart className="w-5 h-5" strokeWidth={1.6} /> Favorilerim
            </Link>
            <Link to="/hesabim" search={{ tab: "orders" }} className="px-5 py-3.5 text-brand-ink text-sm flex items-center gap-3 hover:bg-brand-sand/30">
              <User className="w-5 h-5" strokeWidth={1.6} /> Siparişlerim
            </Link>
          </nav>

          <div className="p-4 border-t border-border shrink-0 pb-[calc(env(safe-area-inset-bottom,0)+1rem)]">
            <Link
              to="/sepet"
              className="w-full flex items-center justify-center gap-2 bg-brand-ink text-white rounded-full py-3.5 text-sm tracking-widest font-semibold"
            >
              <ShoppingCart className="w-4 h-4" strokeWidth={1.8} /> SEPETİM {count > 0 ? `(${count})` : ""}
            </Link>
            <a href="tel:+905466460244" className="mt-2 block text-center text-xs text-muted-foreground">
              0546 646 02 44
            </a>
          </div>
        </aside>
      </div>
    </>
  );
}
