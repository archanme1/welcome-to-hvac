import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { TutorPanel } from "@/components/content/tutor-panel";
import { navigationQuery } from "@/lib/hvac.functions";

const DESC =
  "Ask the Welcome to HVAC AI Tutor about equipment, components, diagnostics and procedures. Included with HVAC Pro.";

export const Route = createFileRoute("/ai-tutor")({
  loader: ({ context }) => context.queryClient.ensureQueryData(navigationQuery),
  head: () => ({
    meta: [
      { title: "AI Tutor — Welcome to HVAC" },
      { name: "description", content: DESC },
      { property: "og:title", content: "AI Tutor — Welcome to HVAC" },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Page,
});

function Page() {
  const { data: nav } = useSuspenseQuery(navigationQuery);
  const [contentId, setContentId] = useState<string>("");
  const selected = nav.topics.find((t) => t.id === contentId);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">AI Tutor</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{DESC}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        The tutor teaches from this knowledge base. It will not walk you through defeating safety
        controls, and it will tell you to verify anything code-related against your local
        jurisdiction and the manufacturer's instructions.
      </p>

      <label className="mt-6 block text-sm font-medium" htmlFor="tutor-topic">
        Ground the tutor in a topic (optional)
      </label>
      <select
        id="tutor-topic"
        value={contentId}
        onChange={(e) => setContentId(e.target.value)}
        className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
      >
        <option value="">No specific topic — general HVAC questions</option>
        {nav.topics.map((t) => (
          <option key={t.id} value={t.id}>
            {t.title}
          </option>
        ))}
      </select>

      <TutorPanel
        contentId={selected?.id}
        heading={selected ? `Ask AI about ${selected.title}` : "Ask the HVAC AI Tutor"}
      />
    </div>
  );
}
