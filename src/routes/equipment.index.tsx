import { createFileRoute } from "@tanstack/react-router";

import { TypeIndexPage } from "@/components/content/type-index-page";
import { listTopicsQuery } from "@/lib/hvac.functions";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/equipment/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listTopicsQuery("equipment")),
  head: () => ({
    meta: [
      { title: "Equipment — Welcome to HVAC" },
      { name: "description", content: "HVAC equipment reference: furnaces, heat pumps, air conditioners, boilers, water heaters, ventilators and refrigeration systems." },
      { property: "og:title", content: "Equipment — Welcome to HVAC" },
      { property: "og:description", content: "HVAC equipment reference: furnaces, heat pumps, air conditioners, boilers, water heaters, ventilators and refrigeration systems." },
    ],
  }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This page didn't load. Please refresh.</p>
  ),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(listTopicsQuery("equipment"));
  return (
    <TypeIndexPage
      type="equipment"
      description="HVAC equipment reference: furnaces, heat pumps, air conditioners, boilers, water heaters, ventilators and refrigeration systems."
      topics={data.topics}
      categories={data.categories}
    />
  );
}
