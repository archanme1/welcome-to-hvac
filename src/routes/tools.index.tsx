import { createFileRoute } from "@tanstack/react-router";

import { TypeIndexPage } from "@/components/content/type-index-page";
import { listTopicsQuery } from "@/lib/hvac.functions";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/tools/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listTopicsQuery("tool")),
  head: () => ({
    meta: [
      { title: "Tools — Welcome to HVAC" },
      { name: "description", content: "HVAC tools and instruments: what they measure, when to use them and how to read them correctly." },
      { property: "og:title", content: "Tools — Welcome to HVAC" },
      { property: "og:description", content: "HVAC tools and instruments: what they measure, when to use them and how to read them correctly." },
    ],
  }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This page didn't load. Please refresh.</p>
  ),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(listTopicsQuery("tool"));
  return (
    <TypeIndexPage
      type="tool"
      description="HVAC tools and instruments: what they measure, when to use them and how to read them correctly."
      topics={data.topics}
      categories={data.categories}
    />
  );
}
