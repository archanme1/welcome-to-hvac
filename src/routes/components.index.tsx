import { createFileRoute } from "@tanstack/react-router";

import { TypeIndexPage } from "@/components/content/type-index-page";
import { listTopicsQuery } from "@/lib/hvac.functions";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/components/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listTopicsQuery("component")),
  head: () => ({
    meta: [
      { title: "Components — Welcome to HVAC" },
      { name: "description", content: "HVAC component reference: compressors, motors, valves, controls, ignitors, sensors and safety devices." },
      { property: "og:title", content: "Components — Welcome to HVAC" },
      { property: "og:description", content: "HVAC component reference: compressors, motors, valves, controls, ignitors, sensors and safety devices." },
      { property: "og:url", content: "https://www.welcometohvac.com/components" },
    ],
    links: [{ rel: "canonical", href: "https://www.welcometohvac.com/components" }],
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
