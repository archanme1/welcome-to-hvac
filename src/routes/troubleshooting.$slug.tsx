import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { TopicPage } from "@/components/content/topic-page";
import { topicQuery } from "@/lib/hvac.functions";
import { topicHead } from "@/lib/topic-seo";

export const Route = createFileRoute("/troubleshooting/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(topicQuery("troubleshooting", params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData, params }) =>
    topicHead({
      segment: "troubleshooting",
      sectionLabel: "Troubleshooting",
      slug: params.slug,
      fallbackDescription:
        "Symptom-based HVAC troubleshooting with likely causes, diagnostic checks and what each reading means.",
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
  const { data } = useSuspenseQuery(topicQuery("troubleshooting", slug));
  if (!data) return null;
  return <TopicPage payload={data} />;
}
