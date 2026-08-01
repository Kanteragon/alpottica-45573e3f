import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { loadPageSeo, pageHead } from "@/lib/page-seo";

const SLUG = "kullanim-kosullari";

export const Route = createFileRoute("/kullanim-kosullari")({
  loader: () => loadPageSeo(SLUG),
  head: ({ loaderData }) =>
    pageHead(loaderData, SLUG, 'Kullanım Koşulları — Alpottica', 'Alpottica Istanbul web sitesi kullanım koşulları.'),
  component: () => <StaticPage slug={SLUG} />,
});
