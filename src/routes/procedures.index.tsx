import { createFileRoute } from "@tanstack/react-router";

import { TypeIndexPage } from "@/components/content/type-index-page";
import { listTopicsQuery } from "@/lib/hvac.functions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { topicIndexHead } from "@/lib/topic-seo";

export const Route = createFileRoute("/procedures/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listTopicsQuery("procedure")),
  head: ({ loaderData }) => topicIndexHead({
    segment: "procedures",
    sectionLabel: "Procedures",
    title: "Procedures — Welcome to HVAC",
    description: "Step-by-step HVAC procedures for installation, startup, charging, maintenance and testing.",
    loaderData,
  }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This page didn't load. Please refresh.</p>
  ),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(listTopicsQuery("procedure"));
  return (
    <TypeIndexPage
      type="procedure"
      description="Step-by-step HVAC procedures for installation, startup, charging, maintenance and testing."
      topics={data.topics}
      categories={data.categories}
    />
  );
}
