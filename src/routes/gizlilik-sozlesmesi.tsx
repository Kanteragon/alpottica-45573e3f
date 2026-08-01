import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { loadPageSeo, pageHead } from "@/lib/page-seo";

const SLUG = "gizlilik-sozlesmesi";

export const Route = createFileRoute("/gizlilik-sozlesmesi")({
  loader: () => loadPageSeo(SLUG),
  head: ({ loaderData }) =>
    pageHead(loaderData, SLUG, 'Gizlilik Sözleşmesi (KVKK) — Alpottica', 'Alpottica Istanbul KVKK ve gizlilik politikası.'),
  component: () => <StaticPage slug={SLUG} />,
});
