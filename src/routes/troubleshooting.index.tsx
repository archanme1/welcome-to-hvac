import { createFileRoute } from "@tanstack/react-router";

import { TypeIndexPage } from "@/components/content/type-index-page";
import { listTopicsQuery } from "@/lib/hvac.functions";
import { useSuspenseQuery } from "@tanstack/react-query";
import { topicIndexHead } from "@/lib/topic-seo";

export const Route = createFileRoute("/troubleshooting/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listTopicsQuery("troubleshooting")),
  head: ({ loaderData }) => topicIndexHead({
    segment: "troubleshooting",
    sectionLabel: "Troubleshooting",
    title: "Troubleshooting — Welcome to HVAC",
    description: "Symptom-based HVAC troubleshooting with likely causes, diagnostic checks and what each reading means.",
    loaderData,
  }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This page didn't load. Please refresh.</p>
  ),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(listTopicsQuery("troubleshooting"));
  return (
    <TypeIndexPage
      type="troubleshooting"
      description="Symptom-based HVAC troubleshooting with likely causes, diagnostic checks and what each reading means."
      topics={data.topics}
      categories={data.categories}
    />
  );
}
