import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Package, ShoppingBag, Images, Menu as MenuIcon, Star, Users,
  Upload, Tag, LogOut, Store, Sliders, Settings, Code2, ChevronDown, ChevronRight,
  FileText, FolderTree, X, User as UserIcon, Truck, Megaphone, Layers,
} from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — Alpottica" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

type Item = { to: string; label: string; icon: typeof Package; exact?: boolean };
type Group = { key: string; label: string; icon: typeof Package; items: Item[] };
type Entry = Item | Group;

const NAV: Entry[] = [
  { to: "/admin", label: "Kontrol Paneli", icon: LayoutDashboard, exact: true },
  {
    key: "icerik", label: "İçerik Yönetimi", icon: FileText, items: [
      { to: "/admin/sliderlar", label: "Slider Yönetimi", icon: Images },
      { to: "/admin/menu", label: "Menü Yönetimi", icon: MenuIcon },
      { to: "/admin/vitrin", label: "Vitrin Yönetimi", icon: Star },
      { to: "/admin/sayfalar", label: "Sayfa Yönetimi", icon: FileText },
    ],
  },
  {
    key: "katalog", label: "Katalog", icon: FolderTree, items: [
      { to: "/admin/urunler", label: "Ürünler", icon: Package },
      { to: "/admin/ozellikler", label: "Ürün Özellikleri", icon: Sliders },
      { to: "/admin/toplu-guncelleme", label: "Toplu Güncelleme", icon: Layers },
      { to: "/admin/kategoriler", label: "Ürün Kategorileri", icon: Tag },
      { to: "/admin/markalar", label: "Marka Yönetimi", icon: Store },
    ],
  },
  { to: "/admin/siparisler", label: "Siparişler", icon: ShoppingBag },
  { to: "/admin/kargo", label: "Kargo Yönetimi", icon: Truck },
  { to: "/admin/kampanyalar", label: "Kampanyalar", icon: Megaphone },

  { to: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
  { to: "/admin/aktarim", label: "Excel Aktarım", icon: Upload },
  { to: "/admin/scriptler", label: "Script Yönetimi", icon: Code2 },
  { to: "/admin/ayarlar", label: "Genel Ayarlar", icon: Settings },
];

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState<Record<string, boolean>>({ icerik: true, katalog: true });
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) nav({ to: "/giris" });
  }, [loading, user, isAdmin, nav]);

  useEffect(() => { setNavOpen(false); }, [path]);

  if (loading || !user || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Yükleniyor...</div>;
  }

  const isItem = (e: Entry): e is Item => "to" in e;
  const linkActive = (i: Item) => (i.exact ? path === i.to : path.startsWith(i.to));

  const sidebar = (
    <>
      <div className="p-6 border-b border-white/10 flex items-center justify-between">
        <div>
          <p className="font-display text-2xl">ALPOTTICA</p>
          <p className="text-xs tracking-widest text-white/60">ADMİN PANEL</p>
        </div>
        <button onClick={() => setNavOpen(false)} aria-label="Menüyü kapat" className="lg:hidden p-2 rounded-lg hover:bg-white/10">
          <X className="w-5 h-5" />
        </button>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {NAV.map((e) => {
          if (isItem(e)) {
            const active = linkActive(e);
            return (
              <Link key={e.to} to={e.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${active ? "bg-white text-brand-ink" : "text-white/80 hover:bg-white/10"}`}>
                <e.icon className="w-4 h-4" /> {e.label}
              </Link>
            );
          }
          const isOpen = !!open[e.key];
          const hasActive = e.items.some(linkActive);
          return (
            <div key={e.key}>
              <button
                onClick={() => setOpen((o) => ({ ...o, [e.key]: !o[e.key] }))}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${hasActive ? "text-white" : "text-white/80"} hover:bg-white/10`}
              >
                <e.icon className="w-4 h-4" />
                <span className="flex-1 text-left">{e.label}</span>
                {isOpen ? <ChevronDown className="w-4 h-4 opacity-70" /> : <ChevronRight className="w-4 h-4 opacity-70" />}
              </button>
              {isOpen && (
                <div className="mt-1 ml-2 pl-3 border-l border-white/10 space-y-1">
                  {e.items.map((sub) => {
                    const active = linkActive(sub);
                    return (
                      <Link key={sub.to} to={sub.to} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${active ? "bg-white text-brand-ink" : "text-white/70 hover:bg-white/10"}`}>
                        <sub.icon className="w-4 h-4" /> {sub.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
      <div className="p-3 border-t border-white/10 space-y-1">
        <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10">
          <Store className="w-4 h-4" /> Siteyi Görüntüle
        </Link>
        <Link to="/hesabim" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10">
          <UserIcon className="w-4 h-4" /> Hesap Bilgilerim
        </Link>
        <button onClick={() => signOut().then(() => nav({ to: "/" }))} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10">
          <LogOut className="w-4 h-4" /> Çıkış
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-brand-sand/20 lg:flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-brand-ink text-white flex-col">{sidebar}</aside>

      {/* Mobile drawer */}
      {navOpen && (
        <div className="lg:hidden fixed inset-0 z-50" onClick={() => setNavOpen(false)}>
          <div className="absolute inset-0 bg-black/50" />
          <aside onClick={(ev) => ev.stopPropagation()} className="absolute inset-y-0 left-0 w-[82%] max-w-[300px] bg-brand-ink text-white flex flex-col shadow-2xl">
            {sidebar}
          </aside>
        </div>
      )}

      <div className="flex-1 min-w-0">
        {/* Mobile top bar */}
        <header className="lg:hidden sticky top-0 z-40 bg-brand-ink text-white flex items-center gap-3 px-4 h-14">
          <button onClick={() => setNavOpen(true)} aria-label="Menü" className="p-2 -ml-2 rounded-lg hover:bg-white/10">
            <MenuIcon className="w-5 h-5" />
          </button>
          <p className="font-display text-xl">ALPOTTICA</p>
        </header>
        <main className="p-4 sm:p-6 lg:p-8 min-w-0 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
