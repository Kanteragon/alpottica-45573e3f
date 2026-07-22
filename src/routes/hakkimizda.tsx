import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/hakkimizda")({
  head: () => ({
    meta: [
      { title: "Hakkımızda — Alpottica" },
      { name: "description", content: "Alpottica Istanbul hakkında bilgi." },
      { property: "og:title", content: "Hakkımızda — Alpottica" },
      { property: "og:description", content: "Alpottica Istanbul hakkında bilgi." },
    ],
  }),
  component: () => <StaticPage slug="hakkimizda" />,
});
