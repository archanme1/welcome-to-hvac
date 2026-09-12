import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AppLink } from "@/components/app-link";
import { Badge } from "@/components/ui/badge";
import { learningPathsQuery } from "@/lib/hvac.functions";
import { DIFFICULTY_LABEL } from "@/lib/hvac-types";

const TITLE = "HVAC Learning Paths — Welcome to HVAC";
const DESC =
  "Ordered routes through the library: start as a beginner, build apprentice-level electrical and equipment knowledge, then work up to full technician diagnostics.";

export const Route = createFileRoute("/paths/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(learningPathsQuery),
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">Learning paths didn't load. Please refresh.</p>
  ),
  notFoundComponent: () => <p className="p-8 text-sm text-muted-foreground">No paths yet.</p>,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(learningPathsQuery);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Learning Paths</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{DESC}</p>

      <div className="mt-8 grid gap-3">
        {data.map((path) => (
          <AppLink
            key={path.id}
            to={`/paths/${path.slug}`}
            className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
          >
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold">{path.title}</p>
              <Badge variant="outline">{DIFFICULTY_LABEL[path.level]}</Badge>
              <span className="text-xs text-muted-foreground">{path.steps} topics</span>
            </div>
            {path.description ? (
              <p className="mt-1 text-xs leading-5 text-muted-foreground">{path.description}</p>
            ) : null}
          </AppLink>
        ))}
      </div>
    </div>
  );
}
