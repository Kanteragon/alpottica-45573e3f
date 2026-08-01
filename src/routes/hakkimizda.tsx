import { createFileRoute } from "@tanstack/react-router";
import { StaticPage } from "@/components/StaticPage";
import { loadPageSeo, pageHead } from "@/lib/page-seo";

const SLUG = "hakkimizda";

export const Route = createFileRoute("/hakkimizda")({
  loader: () => loadPageSeo(SLUG),
  head: ({ loaderData }) =>
    pageHead(loaderData, SLUG, 'Hakkımızda — Alpottica Istanbul', 'Alpottica Istanbul: klipsli, polarize ve antifar filtreli premium güneş gözlüğü markası hakkında bilgi.'),
  component: () => <StaticPage slug={SLUG} />,
});
