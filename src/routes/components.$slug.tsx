import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { TopicPage } from "@/components/content/topic-page";
import { topicQuery } from "@/lib/hvac.functions";
import { topicHead } from "@/lib/topic-seo";

export const Route = createFileRoute("/components/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(topicQuery("component", params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) =>
    topicHead({
      segment: "components",
      sectionLabel: "Components",
      slug: params.slug,
      fallbackDescription:
        "HVAC component reference: compressors, motors, valves, controls, ignitors, sensors and safety devices.",
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
  const { data } = useSuspenseQuery(topicQuery("component", slug));
  if (!data) return null;
  return <TopicPage payload={data} />;
}
