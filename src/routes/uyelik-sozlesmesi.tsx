import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";

export const Route = createFileRoute("/uyelik-sozlesmesi")({
  head: () => ({
    meta: [
      { title: "Üyelik Sözleşmesi — Alpottica" },
      { name: "description", content: "Alpottica üyelik sözleşmesi." },
    ],
  }),
  component: () => <StaticPage slug="uyelik-sozlesmesi" />,
});
