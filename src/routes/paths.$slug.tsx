import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AppLink } from "@/components/app-link";
import { Badge } from "@/components/ui/badge";
import { learningPathQuery } from "@/lib/hvac.functions";
import { CONTENT_TYPE_LABEL, DIFFICULTY_LABEL, topicHref } from "@/lib/hvac-types";

export const Route = createFileRoute("/paths/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(learningPathQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.path.title} — Welcome to HVAC`
      : "Learning Path — Welcome to HVAC";
    const desc =
      loaderData?.path.description ?? "An ordered route through the HVAC library, step by step.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary" },
      ],
    };
  },
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">This path didn't load. Please refresh.</p>
  ),
  notFoundComponent: () => (
    <div className="p-8">
      <p className="text-sm text-muted-foreground">That learning path doesn't exist.</p>
      <AppLink to="/paths" className="mt-2 inline-block text-sm underline underline-offset-4">
        Browse all paths
      </AppLink>
    </div>
  ),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(learningPathQuery(Route.useParams().slug));
  if (!data) return null;
  const { path, steps } = data;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <AppLink to="/paths" className="hover:text-foreground">
          Learning Paths
        </AppLink>
        <span>/</span>
        <span className="text-foreground">{path.title}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{path.title}</h1>
      {path.description ? (
        <p className="mt-3 text-base leading-7 text-muted-foreground">{path.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge variant="outline">{DIFFICULTY_LABEL[path.level]}</Badge>
        <span className="text-xs text-muted-foreground">{steps.length} topics in order</span>
      </div>

      <ol className="mt-8 space-y-2">
        {steps.map((step, index) => (
          <li key={step.topic.id}>
            <AppLink
              to={topicHref(step.topic.content_type, step.topic.slug)}
              className="flex gap-3 rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
            >
              <span className="mt-0.5 text-xs font-semibold text-muted-foreground">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{step.topic.title}</span>
                  <Badge variant="secondary" className="text-[10px]">
                    {CONTENT_TYPE_LABEL[step.topic.content_type]}
                  </Badge>
                </span>
                {step.note ?? step.topic.summary ? (
                  <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                    {step.note ?? step.topic.summary}
                  </span>
                ) : null}
              </span>
            </AppLink>
          </li>
        ))}
      </ol>
    </div>
  );
}
