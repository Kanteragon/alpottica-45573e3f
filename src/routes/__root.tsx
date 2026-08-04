import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { CartProvider } from "@/lib/cart";
import { AuthProvider } from "@/lib/auth";
import { ScriptInjector } from "@/components/ScriptInjector";
import { DynamicFavicon } from "@/components/DynamicFavicon";
import { ThemeVars } from "@/components/ThemeVars";
import { VisitTracker } from "@/lib/analytics";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Sayfa bulunamadı</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-brand-ink px-5 py-2.5 text-sm font-medium text-white hover:opacity-90"
          >
            Anasayfaya dön
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold text-foreground">Bu sayfa yüklenemedi</h1>
        <p className="mt-2 text-sm text-muted-foreground">Bir sorun oluştu.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-brand-ink px-4 py-2 text-sm font-medium text-white"
          >
            Tekrar dene
          </button>
          <a href="/" className="rounded-full border px-4 py-2 text-sm">
            Anasayfa
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "ALPOTTICA" },
      { name: "description", content: "Alpottica Istanbul: klipsli, polarize ve antifar filtreli premium gözlük koleksiyonu." },
      { property: "og:title", content: "ALPOTTICA" },
      { name: "twitter:title", content: "ALPOTTICA" },
      { property: "og:description", content: "Alpottica Istanbul: premium gözlük koleksiyonu." },
      { name: "twitter:description", content: "Alpottica Istanbul: premium gözlük koleksiyonu." },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "Alpottica Istanbul" },
      { property: "og:locale", content: "tr_TR" },
      { name: "robots", content: "index, follow" },
      { name: "author", content: "Alpottica Istanbul" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Alpottica Istanbul",
          alternateName: "Alpottica",
          url: "https://alpottica.lovable.app",
          description:
            "Alpottica Istanbul: klipsli, polarize ve antifar filtreli premium güneş gözlüğü ve optik çerçeve markası.",
          telephone: "+905466460244",
          sameAs: ["https://www.instagram.com/alpottica"],
          contactPoint: {
            "@type": "ContactPoint",
            telephone: "+905466460244",
            contactType: "customer service",
            areaServed: "TR",
            availableLanguage: "Turkish",
          },
        }),
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <DynamicFavicon />
          <ThemeVars />
          <VisitTracker />
          <ScriptInjector />
          <Outlet />
          <Toaster position="top-center" richColors />
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
