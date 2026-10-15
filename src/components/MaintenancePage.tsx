import { ArrowUpRight, Instagram, MessageCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import glasses from "@/assets/slide-klips.jpg";

const channels = [
  { name: "Shopier", detail: "Alışverişe devam edin", href: "https://www.shopier.com/alpottica", icon: ShoppingBag, tone: "maintenance-shopier" },
  { name: "Instagram", detail: "@alpottica", href: "https://www.instagram.com/alpottica", icon: Instagram, tone: "maintenance-instagram" },
  { name: "WhatsApp", detail: "0546 646 02 44", href: "https://wa.me/905466460244", icon: MessageCircle, tone: "maintenance-whatsapp" },
];

export function MaintenancePage() {
  return (
    <main className="maintenance-page min-h-svh bg-background text-foreground flex flex-col items-center px-6 py-10 sm:py-14">
      <div className="w-full max-w-5xl flex items-center justify-between border-b border-border pb-5">
        <span className="font-display text-3xl tracking-normal">ALPOTTICA</span>
        <span className="text-xs text-muted-foreground">İSTANBUL</span>
      </div>
      <section className="w-full max-w-3xl text-center pt-12 sm:pt-16">
        <div className="inline-flex items-center gap-2 text-xs text-muted-foreground mb-5"><span className="size-2 rounded-full bg-brand-cta" /> KISA BİR ARA</div>
        <h1 className="font-display text-5xl sm:text-7xl leading-none tracking-normal">Sitemiz kısa süreliğine<br />bakımda.</h1>
        <p className="mt-6 text-sm sm:text-base leading-7 text-muted-foreground max-w-lg mx-auto">Çok yakında yeniden buradayız. Bu sürede Shopier mağazamızdan alışveriş yapabilir, Instagram ve WhatsApp üzerinden bize ulaşabilirsiniz.</p>
        <div className="grid sm:grid-cols-3 gap-3 mt-9 text-left">
          {channels.map(({ name, detail, href, icon: Icon, tone }) => (
            <Button key={name} asChild variant="outline" className="h-auto whitespace-normal justify-start p-5 rounded-lg gap-3 hover:bg-muted">
              <a href={href} target="_blank" rel="noopener noreferrer" aria-label={`${name} — ${detail}`}>
                <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${tone}`}><Icon className="size-5" /></span>
                <span className="flex-1 min-w-0"><span className="block text-base font-semibold">{name}</span><span className="block mt-1 text-xs font-normal text-muted-foreground">{detail}</span></span>
                <ArrowUpRight className="text-muted-foreground" />
              </a>
            </Button>
          ))}
        </div>
      </section>
      <img src={glasses} alt="Alpottica klipsli güneş gözlüğü" className="mt-10 w-full max-w-3xl h-48 sm:h-64 object-cover rounded-lg" />
      <footer className="w-full max-w-5xl mt-10 pt-5 border-t border-border text-center text-xs text-muted-foreground">ALPOTTICA · İlginiz ve anlayışınız için teşekkür ederiz.</footer>
    </main>
  );
}