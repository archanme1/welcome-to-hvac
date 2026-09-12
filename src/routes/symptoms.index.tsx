import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { AppLink } from "@/components/app-link";
import { symptomsQuery } from "@/lib/hvac.functions";
import type { SymptomRecord } from "@/lib/hvac-types";

const TITLE = "HVAC Symptoms — Welcome to HVAC";
const DESC =
  "Start from what the system is doing. Every symptom links to the equipment, components, concepts and troubleshooting guides behind it.";

export const Route = createFileRoute("/symptoms/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(symptomsQuery),
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
    <p className="p-8 text-sm text-muted-foreground">Symptoms didn't load. Please refresh.</p>
  ),
  notFoundComponent: () => <p className="p-8 text-sm text-muted-foreground">No symptoms yet.</p>,
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(symptomsQuery);

  const groups = useMemo(() => {
    const map = new Map<string, SymptomRecord[]>();
    for (const s of data) {
      const key = s.category ?? "Other";
      const list = map.get(key) ?? [];
      list.push(s);
      map.set(key, list);
    }
    return [...map.entries()];
  }, [data]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Symptoms</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{DESC}</p>

      <div className="mt-8 space-y-8">
        {groups.map(([category, items]) => (
          <section key={category}>
            <h2 className="border-b pb-2 text-lg font-semibold capitalize tracking-tight">
              {category}
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {items.map((s) => (
                <li key={s.id}>
                  <AppLink
                    to={`/symptoms/${s.slug}`}
                    className="block rounded-lg border bg-card p-3 transition-colors hover:bg-accent/50"
                  >
                    <p className="text-sm font-medium">{s.title}</p>
                    {s.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                        {s.description}
                      </p>
                    ) : null}
                  </AppLink>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
