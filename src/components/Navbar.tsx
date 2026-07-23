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
  const { user, isAdmin } = useAuth();
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
            <Link to="/" className="flex items-center shrink-0" aria-label="Alpottica">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Alpottica Istanbul"
                  style={{ maxWidth: `${logoMax}px` }}
                  className={`h-10 sm:h-12 lg:h-14 w-auto object-contain transition-all duration-500 border-0 outline-none ${solid ? "invert" : "invert-0"}`}
                />
              ) : (
                <span className={`font-display tracking-widest text-xl sm:text-2xl ${solid ? "text-brand-ink" : "text-white"}`}>ALPOTTICA</span>
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

          <div className={`flex items-center gap-3 sm:gap-5 transition-colors ${solid ? "text-brand-ink" : "text-white"}`}>
            <SearchBox solid={solid} />
            {user ? (
              <Link to={isAdmin ? "/admin" : "/hesabim"} aria-label="Hesabım" className="hover:opacity-70 hidden sm:block">
                <User className="w-5 h-5" />
              </Link>
            ) : (
              <Link to="/giris" aria-label="Giriş" className="hover:opacity-70 hidden sm:block">
                <User className="w-5 h-5" />
              </Link>
            )}
            <Link to="/hesabim" search={{ tab: "favorites" }} aria-label="Favoriler" className="hover:opacity-70 hidden sm:block">
              <Heart className="w-5 h-5" />
            </Link>
            <Link to="/sepet" aria-label="Sepet" className="hover:opacity-70 relative">
              <ShoppingCart className="w-5 h-5" />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-brand-cta text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile menu drawer */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${menuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setMenuOpen(false)}
      >
        <div className="absolute inset-0 bg-black/40" />
        <aside
          onClick={(e) => e.stopPropagation()}
          className={`absolute top-20 left-0 right-0 bg-white shadow-xl transition-transform duration-300 origin-top ${menuOpen ? "translate-y-0" : "-translate-y-4"}`}
        >
          <nav className="flex flex-col divide-y divide-border">
            {items.map((item) => (
              <a key={item.id} href={item.url} className="px-6 py-4 text-brand-ink text-sm tracking-[0.15em] font-medium hover:bg-brand-sand/30 flex items-center justify-between">
                <span>{item.label}</span>
                <span className="text-brand-cta">→</span>
              </a>
            ))}
            <div className="grid grid-cols-3 divide-x divide-border">
              {user ? (
                <Link to={isAdmin ? "/admin" : "/hesabim"} className="flex flex-col items-center gap-1 py-4 text-xs text-brand-ink">
                  <User className="w-5 h-5" />Hesabım
                </Link>
              ) : (
                <Link to="/giris" className="flex flex-col items-center gap-1 py-4 text-xs text-brand-ink">
                  <User className="w-5 h-5" />Giriş
                </Link>
              )}
              <Link to="/hesabim" search={{ tab: "favorites" }} className="flex flex-col items-center gap-1 py-4 text-xs text-brand-ink">
                <Heart className="w-5 h-5" />Favoriler
              </Link>
              <Link to="/sepet" className="flex flex-col items-center gap-1 py-4 text-xs text-brand-ink">
                <ShoppingCart className="w-5 h-5" />Sepet
              </Link>
            </div>
          </nav>
        </aside>
      </div>
    </>
  );
}
