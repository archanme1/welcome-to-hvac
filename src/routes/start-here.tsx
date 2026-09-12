import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

const DESC =
  "New to HVAC? Start here for the learning path: fundamentals, equipment, components, diagnostics and practice.";

const PATH = [
  {
    step: "Learn",
    text: "Read the concept pages. Every topic explains what it is, why it matters, and where it is used.",
    to: "/concepts" as const,
    cta: "Browse concepts",
  },
  {
    step: "Understand",
    text: "Move to equipment and components to see how the parts work together in a real system.",
    to: "/equipment" as const,
    cta: "Browse equipment",
  },
  {
    step: "See it",
    text: "Follow the diagrams: the refrigeration cycle, furnace sequence of operation, control circuits and airflow.",
    to: "/components" as const,
    cta: "Browse components",
  },
  {
    step: "Troubleshoot",
    text: "Work symptom-first: likely causes, the checks that separate them, and what each reading means.",
    to: "/troubleshooting" as const,
    cta: "Browse troubleshooting",
  },
  {
    step: "Practice",
    text: "Answer questions, work scenarios and track progress with HVAC Pro.",
    to: "/practice" as const,
    cta: "Go to practice",
  },
];

export const Route = createFileRoute("/start-here")({
  head: () => ({
    meta: [
      { title: "Start Here — Welcome to HVAC" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Start Here — Welcome to HVAC" },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Start Here</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{DESC}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        Content is written for four levels — Beginner, Apprentice, Technician and Advanced — so you
        can read the same topic at the depth you need today.
      </p>

      <ol className="mt-10 space-y-6">
        {PATH.map((item, i) => (
          <li key={item.step} className="flex gap-4">
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full border text-xs font-semibold">
              {i + 1}
            </span>
            <div>
              <p className="text-sm font-semibold">{item.step}</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{item.text}</p>
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link to={item.to}>{item.cta}</Link>
              </Button>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-12 rounded-lg border bg-card p-5">
        <p className="text-sm font-semibold">A note on safety and code</p>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          This is educational reference material. It does not replace training, supervision,
          manufacturer instructions, or your local code. Requirements vary by jurisdiction, adopted
          code edition, permits and equipment — always verify before you install or service.
        </p>
      </div>
    </div>
  );
}
