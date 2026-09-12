import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { AppLink } from "@/components/app-link";
import { Badge } from "@/components/ui/badge";
import { Callout } from "@/components/content/callout";
import { symptomQuery } from "@/lib/hvac.functions";
import {
  CONTENT_TYPE_LABEL,
  LOCAL_CODE_NOTICE,
  SYMPTOM_ROLE_LABEL,
  topicHref,
} from "@/lib/hvac-types";

const ROLE_ORDER = ["diagnoses", "cause", "affects", "explains", "procedure", "related"];

export const Route = createFileRoute("/symptoms/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(symptomQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const title = loaderData ? `${loaderData.symptom.title} — HVAC Symptom` : "HVAC Symptom";
    const desc =
      loaderData?.symptom.description ??
      "What this HVAC symptom means and which topics explain and diagnose it.";
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
    <p className="p-8 text-sm text-muted-foreground">This symptom didn't load. Please refresh.</p>
  ),
  notFoundComponent: () => (
    <div className="p-8">
      <p className="text-sm text-muted-foreground">That symptom doesn't exist.</p>
      <AppLink to="/symptoms" className="mt-2 inline-block text-sm underline underline-offset-4">
        Browse all symptoms
      </AppLink>
    </div>
  ),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(symptomQuery(Route.useParams().slug));
  if (!data) return null;
  const { symptom, topics, diagnostic } = data;

  const groups = ROLE_ORDER.map((role) => ({
    role,
    items: topics.filter((t) => t.role === role),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <nav className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <AppLink to="/symptoms" className="hover:text-foreground">
          Symptoms
        </AppLink>
        <span>/</span>
        <span className="text-foreground">{symptom.title}</span>
      </nav>

      <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">{symptom.title}</h1>
      {symptom.description ? (
        <p className="mt-3 text-base leading-7 text-muted-foreground">{symptom.description}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {symptom.category ? <Badge variant="secondary">{symptom.category}</Badge> : null}
        {symptom.severity ? <Badge variant="outline">{symptom.severity}</Badge> : null}
      </div>

      {diagnostic ? (
        <AppLink
          to={`/diagnostics/${diagnostic.slug}`}
          className="mt-6 block rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
        >
          <p className="text-sm font-semibold">Step-by-step: {diagnostic.title}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Work through an ordered diagnostic path for this symptom.
          </p>
        </AppLink>
      ) : null}

      <div className="mt-8 space-y-6">
        {groups.map((group) => (
          <section key={group.role}>
            <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {SYMPTOM_ROLE_LABEL[group.role] ?? group.role}
            </h2>
            <ul className="mt-2 divide-y rounded-lg border">
              {group.items.map(({ topic }) => (
                <li key={topic.id}>
                  <AppLink
                    to={topicHref(topic.content_type, topic.slug)}
                    className="block px-4 py-3 transition-colors hover:bg-accent/50"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">{topic.title}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {CONTENT_TYPE_LABEL[topic.content_type]}
                      </Badge>
                    </div>
                    {topic.summary ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {topic.summary}
                      </p>
                    ) : null}
                  </AppLink>
                </li>
              ))}
            </ul>
          </section>
        ))}
        {groups.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No topics are linked to this symptom yet.
          </p>
        ) : null}
      </div>

      <Callout variant="code-notice" title="Local Code Notice">
        {LOCAL_CODE_NOTICE}
      </Callout>
    </div>
  );
}
