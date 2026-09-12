import { createFileRoute } from "@tanstack/react-router";

import { TutorPanel } from "@/components/content/tutor-panel";

const DESC =
  "Ask the Welcome to HVAC AI Tutor about equipment, components, diagnostics and procedures. Included with HVAC Pro.";

export const Route = createFileRoute("/ai-tutor")({
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
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">AI Tutor</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{DESC}</p>
      <p className="mt-2 text-sm text-muted-foreground">
        The tutor teaches from this knowledge base. It will not walk you through defeating safety
        controls, and it will tell you to verify anything code-related against your local
        jurisdiction and the manufacturer's instructions.
      </p>
      <TutorPanel heading="Ask the HVAC AI Tutor" />
    </div>
  );
}
