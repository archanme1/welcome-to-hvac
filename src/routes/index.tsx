import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, Gauge, Sparkles, Wrench } from "lucide-react";

import { AppLink } from "@/components/app-link";
import { Button } from "@/components/ui/button";
import { navigationQuery } from "@/lib/hvac.functions";
import { CONTENT_TYPE_LABEL, topicHref } from "@/lib/hvac-types";

const DESC =
  "Structured HVAC documentation, diagrams, diagnostics and practice — from the refrigeration cycle to furnace sequence of operation, charging and troubleshooting.";

export const Route = createFileRoute("/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(navigationQuery),
  head: () => ({
    meta: [
      { title: "Welcome to HVAC — Learn HVAC Properly" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Welcome to HVAC — Learn HVAC Properly" },
      { property: "og:description", content: DESC },
    ],
  }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This page didn't load. Please refresh.</p>
  ),
  component: Home,
});

const PILLARS = [
  {
    icon: BookOpen,
    title: "Documentation first",
    text: "Every topic answers what it is, why it matters, where it's used, how it works, what goes wrong, and how to diagnose it.",
  },
  {
    icon: Gauge,
    title: "Diagrams and readings",
    text: "Cycle diagrams, sequences of operation, control circuits and airflow — plus what each measurement is telling you.",
  },
  {
    icon: Wrench,
    title: "Symptom-first diagnostics",
    text: "Start from what the equipment is doing, work through likely causes, and let the checks narrow it down.",
  },
  {
    icon: Sparkles,
    title: "Practice and AI Tutor",
    text: "Questions, quizzes, troubleshooting and equipment scenarios, and a tutor that knows the page you're reading.",
  },
];

function Home() {
  const { data } = useSuspenseQuery(navigationQuery);
  const featured = data.topics.slice(0, 9);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:py-20">
      <section className="max-w-3xl">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Learn HVAC properly — from fundamentals to field diagnostics.
        </h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">{DESC}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/start-here">Start here</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/search">Search the reference</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link to="/pricing">HVAC Pro — $5/mo</Link>
          </Button>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          Documentation, diagrams and search are free. HVAC Pro adds practice, scenarios and the AI
          Tutor.
        </p>
      </section>

      <section className="mt-16 grid gap-5 sm:grid-cols-2">
        {PILLARS.map((p) => (
          <div key={p.title} className="rounded-xl border bg-card p-5">
            <p.icon className="h-5 w-5" />
            <p className="mt-3 text-sm font-semibold">{p.title}</p>
            <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{p.text}</p>
          </div>
        ))}
      </section>

      {featured.length ? (
        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Start reading
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((topic) => (
              <AppLink
                key={topic.id}
                to={topicHref(topic.content_type, topic.slug)}
                className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
              >
                <p className="text-sm font-semibold">{topic.title}</p>
                {topic.summary ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                    {topic.summary}
                  </p>
                ) : null}
                <p className="mt-2 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                  {CONTENT_TYPE_LABEL[topic.content_type]}
                </p>
              </AppLink>
            ))}
          </div>
        </section>
      ) : null}

      <section className="mt-16 rounded-xl border bg-card p-6">
        <h2 className="text-base font-semibold">Safety and local code</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          This is educational reference material. It never presents bypassing safety controls,
          unsafe energized work, improvised repairs, or improper refrigerant handling as normal
          practice. Installation, venting, combustion air, gas piping, clearances, electrical
          requirements and permits vary by jurisdiction, adopted code edition and equipment —
          always verify local code and the manufacturer's instructions.
        </p>
      </section>
    </div>
  );
}
