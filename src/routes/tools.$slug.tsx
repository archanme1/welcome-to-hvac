import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { TopicPage } from "@/components/content/topic-page";
import { topicQuery } from "@/lib/hvac.functions";
import { topicHead } from "@/lib/topic-seo";

export const Route = createFileRoute("/tools/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(topicQuery("tool", params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) =>
    topicHead({
      segment: "tools",
      sectionLabel: "Tools",
      slug: params.slug,
      fallbackDescription:
        "HVAC tools and instruments: what they measure, when to use them and how to read them correctly.",
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
  const { data } = useSuspenseQuery(topicQuery("tool", slug));
  if (!data) return null;
  return <TopicPage payload={data} />;
}
