import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { TopicPage } from "@/components/content/topic-page";
import { topicQuery } from "@/lib/hvac.functions";
import { topicHead } from "@/lib/topic-seo";

export const Route = createFileRoute("/procedures/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(topicQuery("procedure", params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) =>
    topicHead({
      segment: "procedures",
      sectionLabel: "Procedures",
      slug: params.slug,
      fallbackDescription:
        "Step-by-step HVAC procedures for installation, startup, charging, maintenance and testing.",
      loaderData,
    }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This topic didn't load. Please refresh.</p>
  ),
  notFoundComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This topic hasn't been published yet.</p>
  ),
  component: Page,
});

function Page() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(topicQuery("procedure", slug));
  if (!data) return null;
  return <TopicPage payload={data} />;
}
