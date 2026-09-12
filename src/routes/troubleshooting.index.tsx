import { createFileRoute } from "@tanstack/react-router";

import { TypeIndexPage } from "@/components/content/type-index-page";
import { listTopicsQuery } from "@/lib/hvac.functions";
import { useSuspenseQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/troubleshooting/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(listTopicsQuery("troubleshooting")),
  head: () => ({
    meta: [
      { title: "Troubleshooting — Welcome to HVAC" },
      { name: "description", content: "Symptom-based HVAC troubleshooting with likely causes, diagnostic checks and what each reading means." },
      { property: "og:title", content: "Troubleshooting — Welcome to HVAC" },
      { property: "og:description", content: "Symptom-based HVAC troubleshooting with likely causes, diagnostic checks and what each reading means." },
    ],
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
