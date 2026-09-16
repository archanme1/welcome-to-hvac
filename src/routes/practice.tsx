import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { Lock } from "lucide-react";

import { AppLink } from "@/components/app-link";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { navigationQuery, practiceCatalogQuery } from "@/lib/hvac.functions";
import { progressQuery } from "@/lib/practice.functions";
import { CONTENT_TYPE_LABEL, topicHref } from "@/lib/hvac-types";

const DESC =
  "Practice HVAC questions, quizzes, troubleshooting scenarios and equipment scenarios, and track your progress.";

export const Route = createFileRoute("/practice")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(navigationQuery),
      context.queryClient.ensureQueryData(practiceCatalogQuery),
    ]),
  head: () => ({
    meta: [
      { title: "Practice & Mastery — Welcome to HVAC" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Practice & Mastery — Welcome to HVAC" },
      { property: "og:description", content: DESC },
      { property: "og:url", content: "https://www.welcometohvac.com/practice" },
    ],
    links: [{ rel: "canonical", href: "https://www.welcometohvac.com/practice" }],
  }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This page didn't load. Please refresh.</p>
  ),
  component: Page,
});

function Page() {
  const { user, isPro } = useAuth();
  const { data: nav } = useSuspenseQuery(navigationQuery);
  const { data: catalog } = useSuspenseQuery(practiceCatalogQuery);
  const { data: progress } = useQuery(progressQuery(!!user));

  const byId = new Map(catalog.map((row) => [row.content_id, row]));
  const topics = nav.topics.filter((t) => byId.has(t.id));
  const totals = catalog.reduce(
    (acc, row) => ({
      questions: acc.questions + row.questions,
      quizzes: acc.quizzes + row.quizzes,
      scenarios: acc.scenarios + row.troubleshooting + row.equipment,
    }),
    { questions: 0, quizzes: 0, scenarios: 0 },
  );


  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Practice &amp; Mastery</h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{DESC}</p>

      {!isPro ? (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-lg border bg-card p-5">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Practice is part of HVAC Pro — $5/month or $50/year.
          </p>
          <Button asChild size="sm">
            <Link to="/pricing">See HVAC Pro</Link>
          </Button>
        </div>
      ) : progress ? (
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Topics read" value={progress.topicsViewed} />
          <Stat label="Questions answered" value={progress.questionsAnswered} />
          <Stat label="Correct" value={progress.correct} />
          <Stat label="Accuracy" value={`${progress.accuracy}%`} />
        </div>
      ) : null}

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        <span>{totals.questions} questions</span>
        <span>{totals.quizzes} quizzes</span>
        <span>{totals.scenarios} scenarios</span>
        <span>{topics.length} topics</span>
      </div>

      <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        Practice by topic
      </h2>
      <ul className="mt-3 divide-y rounded-lg border">
        {topics.map((topic) => {
          const row = byId.get(topic.id)!;
          const scenarios = row.troubleshooting + row.equipment;
          const bits = [
            row.questions ? `${row.questions} question${row.questions === 1 ? "" : "s"}` : null,
            row.quizzes ? "quiz" : null,
            scenarios ? `${scenarios} scenario${scenarios === 1 ? "" : "s"}` : null,

          ].filter(Boolean);
          return (
            <li key={topic.id}>
              <AppLink
                to={`${topicHref(topic.content_type, topic.slug)}#practice`}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-accent/50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{topic.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {CONTENT_TYPE_LABEL[topic.content_type]} · {bits.join(" · ")}
                  </span>
                </span>
                {!isPro ? <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
              </AppLink>
            </li>
          );
        })}

        {topics.length === 0 ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">
            No practice topics published yet.
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
