import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { LayoutDashboard, Package, ShoppingBag, Images, Menu as MenuIcon, Star, Users, Upload, Tag, LogOut, Store } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin Panel — Alpottica" }, { name: "robots", content: "noindex" }] }),
  component: AdminLayout,
});

const LINKS = [
  { to: "/admin", label: "Kontrol Paneli", icon: LayoutDashboard, exact: true },
  { to: "/admin/urunler", label: "Ürünler", icon: Package },
  { to: "/admin/kategoriler", label: "Kategoriler", icon: Tag },
  { to: "/admin/markalar", label: "Markalar", icon: Store },
  { to: "/admin/aktarim", label: "Excel Aktarım", icon: Upload },
  { to: "/admin/siparisler", label: "Siparişler", icon: ShoppingBag },
  { to: "/admin/kullanicilar", label: "Kullanıcılar", icon: Users },
  { to: "/admin/sliderlar", label: "Sliderlar", icon: Images },
  { to: "/admin/menu", label: "Menü", icon: MenuIcon },
  { to: "/admin/vitrin", label: "Vitrin", icon: Star },
];

function AdminLayout() {
  const { user, isAdmin, loading, signOut } = useAuth();
  const nav = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) nav({ to: "/giris" });
  }, [loading, user, isAdmin, nav]);

  if (loading || !user || !isAdmin) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="min-h-screen bg-brand-sand/20 flex">
      <aside className="w-64 bg-brand-ink text-white flex flex-col">
        <div className="p-6 border-b border-white/10">
          <p className="font-display text-2xl">ALPOTTICA</p>
          <p className="text-xs tracking-widest text-white/60">ADMİN PANEL</p>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {LINKS.map((l) => {
            const active = l.exact ? path === l.to : path.startsWith(l.to);
            return (
              <Link key={l.to} to={l.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${active ? "bg-white text-brand-ink" : "text-white/80 hover:bg-white/10"}`}>
                <l.icon className="w-4 h-4" /> {l.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <Link to="/" className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10">
            <Store className="w-4 h-4" /> Siteyi Görüntüle
          </Link>
          <button onClick={() => signOut().then(() => nav({ to: "/" }))} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/80 hover:bg-white/10">
            <LogOut className="w-4 h-4" /> Çıkış
          </button>
        </div>
      </aside>
      <main className="flex-1 min-w-0 p-8">
        <Outlet />
      </main>
    </div>
  );
}
