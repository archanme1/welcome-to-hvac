import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { TopicPage } from "@/components/content/topic-page";
import { topicQuery } from "@/lib/hvac.functions";

export const Route = createFileRoute("/equipment/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(topicQuery("equipment", params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Unavailable — Welcome to HVAC" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.topic.title} — Welcome to HVAC`;
    const description = loaderData.topic.summary ?? "HVAC equipment reference: furnaces, heat pumps, air conditioners, boilers, water heaters, ventilators and refrigeration systems.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
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
  const { data } = useSuspenseQuery(topicQuery("equipment", slug));
  if (!data) return null;
  return <TopicPage payload={data} />;
}
