import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { loadPageSeo, pageHead } from "@/lib/page-seo";

const SLUG = "uyelik-sozlesmesi";

export const Route = createFileRoute("/uyelik-sozlesmesi")({
  loader: () => loadPageSeo(SLUG),
  head: ({ loaderData }) =>
    pageHead(loaderData, SLUG, 'Üyelik Sözleşmesi — Alpottica', 'Alpottica Istanbul üyelik sözleşmesi ve üyelik koşulları.'),
  component: () => <StaticPage slug={SLUG} />,
});
