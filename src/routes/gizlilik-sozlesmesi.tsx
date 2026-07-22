import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/gizlilik-sozlesmesi")({
  head: () => ({
    meta: [
      { title: "Gizlilik Sözleşmesi — Alpottica" },
      { name: "description", content: "Alpottica gizlilik sözleşmesi." },
    ],
  }),
  component: () => <StaticPage slug="gizlilik-sozlesmesi" />,
});
