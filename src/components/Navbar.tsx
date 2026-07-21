import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Search, User, Heart, ShoppingCart } from "lucide-react";
import logo from "@/assets/alpottica-logo.jpg.asset.json";

const NAV = [
  { label: "KLİPSLİ MODELLER", to: "/" },
  { label: "OUTLET MODELLER", to: "/" },
  { label: "TÜM MODELLER", to: "/" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(0,0,0,0.06)]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 h-20 grid grid-cols-[auto_1fr_auto] items-center gap-8">
        <Link to="/" className="flex items-center shrink-0">
          <img
            src={logo.url}
            alt="Alpottica Istanbul"
            className={`h-12 w-auto object-contain transition-all duration-500 rounded-md border ${
              scrolled
                ? "invert-0 border-transparent"
                : "invert brightness-200 border-white/40 bg-transparent"
            }`}
          />
        </Link>

        <nav className="hidden lg:flex items-center justify-center gap-12">
          {NAV.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              className={`text-[13px] tracking-[0.18em] font-medium transition-colors ${
                scrolled
                  ? "text-brand-ink hover:text-brand-cta"
                  : "text-white/95 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div
          className={`flex items-center gap-5 transition-colors ${
            scrolled ? "text-brand-ink" : "text-white"
          }`}
        >
          <button aria-label="Ara" className="hover:opacity-70 transition">
            <Search className="w-5 h-5" />
          </button>
          <button aria-label="Hesabım" className="hover:opacity-70 transition hidden sm:block">
            <User className="w-5 h-5" />
          </button>
          <button aria-label="Favoriler" className="hover:opacity-70 transition hidden sm:block relative">
            <Heart className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-brand-cta text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">0</span>
          </button>
          <button aria-label="Sepet" className="hover:opacity-70 transition relative">
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute -top-2 -right-2 bg-brand-cta text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">0</span>
          </button>
        </div>
      </div>
    </header>
  );
}
