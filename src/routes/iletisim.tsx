import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/iletisim")({
  head: () => ({
    meta: [
      { title: "Bize Ulaşın — Alpottica" },
      { name: "description", content: "Alpottica iletişim bilgileri." },
      { property: "og:title", content: "Bize Ulaşın — Alpottica" },
      { property: "og:description", content: "Alpottica iletişim bilgileri." },
    ],
  }),
  component: () => <StaticPage slug="iletisim" />,
});
