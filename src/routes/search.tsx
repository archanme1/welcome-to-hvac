import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";

import { AppLink } from "@/components/app-link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { fuzzyFilter } from "@/lib/fuzzy";
import { searchIndexQuery } from "@/lib/hvac.functions";
import { CONTENT_TYPE_LABEL, DIFFICULTY_LABEL, topicHref } from "@/lib/hvac-types";

const DESC = "Search every HVAC topic, component, procedure, tool and troubleshooting guide.";

export const Route = createFileRoute("/search")({
  loader: ({ context }) => context.queryClient.ensureQueryData(searchIndexQuery),
  head: () => ({
    meta: [
      { title: "Search — Welcome to HVAC" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Search — Welcome to HVAC" },
      { property: "og:description", content: DESC },
    ],
  }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">Search didn't load. Please refresh.</p>
  ),
  component: Page,
});

function Page() {
  const { data } = useSuspenseQuery(searchIndexQuery);
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return data.slice(0, 60);
    return fuzzyFilter(data, query, (item) => `${item.title} ${item.summary ?? ""} ${item.tags?.join(" ") ?? ""}`).slice(0, 80);
  }, [data, query]);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Search</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{DESC}</p>

      <Input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search topics, symptoms, parts, tools..."
        className="mt-6"
      />

      <ul className="mt-6 divide-y rounded-lg border">
        {results.map((item) => (
          <li key={item.id}>
            <AppLink
              to={topicHref(item.content_type, item.slug)}
              className="block px-4 py-3 transition-colors hover:bg-accent/50"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium">{item.title}</span>
                <Badge variant="secondary" className="text-[10px]">
                  {CONTENT_TYPE_LABEL[item.content_type]}
                </Badge>
                <span className="text-[10px] text-muted-foreground">
                  {DIFFICULTY_LABEL[item.difficulty]}
                </span>
              </div>
              {item.summary ? (
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {item.summary}
                </p>
              ) : null}
            </AppLink>
          </li>
        ))}
        {results.length === 0 ? (
          <li className="px-4 py-6 text-sm text-muted-foreground">No matching topics.</li>
        ) : null}
      </ul>
    </div>
  );
}
