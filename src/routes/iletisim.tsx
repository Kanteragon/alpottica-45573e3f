import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { loadPageSeo, pageHead } from "@/lib/page-seo";

const SLUG = "iletisim";

export const Route = createFileRoute("/iletisim")({
  loader: () => loadPageSeo(SLUG),
  head: ({ loaderData }) =>
    pageHead(loaderData, SLUG, 'İletişim — Alpottica Istanbul', 'Alpottica Istanbul iletişim bilgileri: 0546 646 02 44, Instagram @alpottica.'),
  component: () => <StaticPage slug={SLUG} />,
});
