import { createFileRoute } from "@tanstack/react-router";

import { TypeIndexPage } from "@/components/content/type-index-page";
import { listTopicsQuery } from "@/lib/hvac.functions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { topicIndexHead } from "@/lib/topic-seo";

export const Route = createFileRoute("/concepts/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listTopicsQuery("concept")),
  head: ({ loaderData }) => topicIndexHead({
    segment: "concepts",
    sectionLabel: "Concepts",
    title: "Concepts — Welcome to HVAC",
    description: "Core HVAC concepts: the refrigeration cycle, heat transfer, psychrometrics, electricity, combustion and airflow.",
    loaderData,
  }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This page didn't load. Please refresh.</p>
  ),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(listTopicsQuery("concept"));
  return (
    <TypeIndexPage
      type="concept"
      description="Core HVAC concepts: the refrigeration cycle, heat transfer, psychrometrics, electricity, combustion and airflow."
      topics={data.topics}
      categories={data.categories}
    />
  );
}
