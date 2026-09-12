import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AppLink } from "@/components/app-link";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/content/callout";
import { diagnosticTreeQuery } from "@/lib/hvac.functions";
import { LOCAL_CODE_NOTICE, topicHref, type DiagnosticNode } from "@/lib/hvac-types";

export const Route = createFileRoute("/diagnostics/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(diagnosticTreeQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.tree.title} — HVAC Diagnostic Path`
      : "HVAC Diagnostic Path";
    const desc =
      loaderData?.tree.intro ??
      "An ordered diagnostic path: confirm one thing at a time instead of guessing.";
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
    <p className="p-8 text-sm text-muted-foreground">
      This diagnostic path didn't load. Please refresh.
    </p>
  ),
  notFoundComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">That diagnostic path doesn't exist.</p>
  ),
  component: Page,
});

type Visited = { node: DiagnosticNode; answer: string | null; result: string | null };

function Page() {
  const { data } = useSuspenseQuery(diagnosticTreeQuery(Route.useParams().slug));
  const nodes = data?.nodes ?? [];

  const byKey = useMemo(() => new Map(nodes.map((n) => [n.key, n])), [nodes]);
  const root = useMemo(() => nodes.find((n) => n.is_root) ?? nodes[0], [nodes]);

  const [trail, setTrail] = useState<Visited[]>([]);
  const [currentKey, setCurrentKey] = useState<string | null>(null);
  const [finished, setFinished] = useState<string | null>(null);

  if (!data || !root) return null;
  const { tree } = data;

  const current = finished ? null : (byKey.get(currentKey ?? root.key) ?? root);

  const answer = (node: DiagnosticNode, label: string, next?: string | null, result?: string | null) => {
    setTrail((t) => [...t, { node, answer: label, result: result ?? null }]);
    if (next && byKey.has(next)) {
      setCurrentKey(next);
    } else {
      setFinished(result ?? "End of this path.");
    }
  };

  const restart = () => {
    setTrail([]);
    setCurrentKey(null);
    setFinished(null);
  };

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{tree.title}</h1>
      {tree.intro ? (
        <p className="mt-3 text-base leading-7 text-muted-foreground">{tree.intro}</p>
      ) : null}

      {tree.safety_note ? (
        <Callout variant="safety" title="Safety">
          {tree.safety_note}
        </Callout>
      ) : null}

      {trail.length > 0 ? (
        <ol className="mt-8 space-y-2">
          {trail.map((step, i) => (
            <li key={`${step.node.key}-${i}`} className="rounded-lg border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Step {i + 1}</p>
              <p className="mt-1 text-sm font-medium">{step.node.question}</p>
              <p className="mt-1 text-sm text-muted-foreground">→ {step.answer}</p>
            </li>
          ))}
        </ol>
      ) : null}

      {current ? (
        <section className="mt-6 rounded-lg border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Step {trail.length + 1}
          </p>
          <h2 className="mt-2 text-lg font-semibold tracking-tight">{current.question}</h2>

          {current.observation ? (
            <p className="mt-3 text-sm leading-6 text-muted-foreground">{current.observation}</p>
          ) : null}

          {current.safety_note ? (
            <p className="mt-3 rounded-md border-l-2 border-destructive/60 bg-destructive/5 px-3 py-2 text-xs leading-5">
              {current.safety_note}
            </p>
          ) : null}

          {current.possible_causes?.length ? (
            <div className="mt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Common causes at this step
              </p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                {current.possible_causes.map((cause) => (
                  <li key={cause}>{cause}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col gap-2">
            {current.answers.map((a) => (
              <Button
                key={a.label}
                variant="outline"
                className="h-auto justify-start whitespace-normal py-2 text-left"
                onClick={() => answer(current, a.label, a.next, a.result)}
              >
                {a.label}
              </Button>
            ))}
          </div>

          {current.related ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Background:{" "}
              <AppLink
                to={topicHref(current.related.content_type, current.related.slug)}
                className="underline underline-offset-4"
              >
                {current.related.title}
              </AppLink>
            </p>
          ) : null}
        </section>
      ) : null}

      {finished ? (
        <section className="mt-6 rounded-lg border bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Where this points
          </p>
          <p className="mt-2 text-sm leading-6">{finished}</p>
          <Button className="mt-4" size="sm" variant="secondary" onClick={restart}>
            Start over
          </Button>
        </section>
      ) : null}

      {trail.length > 0 && !finished ? (
        <Button className="mt-4" size="sm" variant="ghost" onClick={restart}>
          Start over
        </Button>
      ) : null}

      <Callout variant="code-notice" title="Local Code Notice">
        {LOCAL_CODE_NOTICE}
      </Callout>
    </div>
  );
}
