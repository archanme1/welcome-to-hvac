import { createFileRoute } from "@tanstack/react-router";

import { TypeIndexPage } from "@/components/content/type-index-page";
import { listTopicsQuery } from "@/lib/hvac.functions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { topicIndexHead } from "@/lib/topic-seo";

export const Route = createFileRoute("/components/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listTopicsQuery("component")),
  head: ({ loaderData }) => topicIndexHead({
    segment: "components",
    sectionLabel: "Components",
    title: "Components — Welcome to HVAC",
    description: "HVAC component reference: compressors, motors, valves, controls, ignitors, sensors and safety devices.",
    loaderData,
  }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This page didn't load. Please refresh.</p>
  ),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(listTopicsQuery("component"));
  return (
    <TypeIndexPage
      type="component"
      description="HVAC component reference: compressors, motors, valves, controls, ignitors, sensors and safety devices."
      topics={data.topics}
      categories={data.categories}
    />
  );
}
