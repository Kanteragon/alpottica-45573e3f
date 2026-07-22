import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/kullanim-kosullari")({
  head: () => ({
    meta: [
      { title: "Kullanım Koşulları — Alpottica" },
      { name: "description", content: "Alpottica kullanım koşulları." },
    ],
  }),
  component: () => <StaticPage slug="kullanim-kosullari" />,
});
