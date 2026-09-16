import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { AppLink } from "@/components/app-link";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PAGE_SIZE, searchQuery } from "@/lib/hvac.functions";
import {
  CONTENT_TYPE_LABEL,
  DIFFICULTY_LABEL,
  searchResultHref,
  type SearchResult,
} from "@/lib/hvac-types";

const DESC = "Search every HVAC topic, component, procedure, tool, symptom and troubleshooting guide.";

type Search = { q: string; kind: string; page: number };

const KINDS = [
  { value: "all", label: "All" },
  { value: "topic", label: "Topics" },
  { value: "symptom", label: "Symptoms" },
];

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    q: typeof search["q"] === "string" ? search["q"] : "",
    kind: typeof search["kind"] === "string" ? search["kind"] : "all",
    page: Number(search["page"]) > 0 ? Number(search["page"]) : 1,
  }),
  head: () => ({
    meta: [
      { title: "Search — Welcome to HVAC" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Search — Welcome to HVAC" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://www.welcometohvac.com/search" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [{ rel: "canonical", href: "https://www.welcometohvac.com/search" }],
  }),
  errorComponent: () => (
    <p className="p-8 text-sm text-muted-foreground">Search didn't load. Please refresh.</p>
  ),
  component: Page,
});

function Page() {
  const { q, kind, page } = Route.useSearch();
  const navigate = useNavigate({ from: "/search" });
  const [draft, setDraft] = useState(q);

  // Keep the input in sync when the URL changes (back button, shared link).
  useEffect(() => setDraft(q), [q]);

  // Debounce typing into the URL so every keystroke is not a query.
  useEffect(() => {
    if (draft === q) return;
    const t = setTimeout(() => {
      void navigate({ search: (prev) => ({ ...prev, q: draft, page: 1 }), replace: true });
    }, 250);
    return () => clearTimeout(t);
  }, [draft, q, navigate]);

  const { data, isFetching } = useQuery({
    ...searchQuery(q.trim(), kind, page),
    enabled: q.trim().length > 0,
  });

  const results = data?.results ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Search</h1>
      <p className="mt-3 text-base leading-7 text-muted-foreground">{DESC}</p>

      <Input
        autoFocus
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Search topics, symptoms, parts, tools..."
        className="mt-6"
      />

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {KINDS.map((k) => (
          <Button
            key={k.value}
            type="button"
            size="sm"
            variant={kind === k.value ? "secondary" : "ghost"}
            onClick={() =>
              void navigate({ search: (prev) => ({ ...prev, kind: k.value, page: 1 }) })
            }
          >
            {k.label}
          </Button>
        ))}
        {q.trim() ? (
          <span className="ml-auto text-xs text-muted-foreground">
            {isFetching ? "Searching..." : `${total} result${total === 1 ? "" : "s"}`}
          </span>
        ) : null}
      </div>

      {!q.trim() ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Start typing to search the whole library. Try a symptom like &ldquo;furnace won&rsquo;t
          ignite&rdquo;, an abbreviation like &ldquo;TXV&rdquo;, or a part name.
        </p>
      ) : (
        <>
          <ul className="mt-6 divide-y rounded-lg border">
            {results.map((item: SearchResult) => (
              <li key={`${item.kind}-${item.id}`}>
                <AppLink
                  to={searchResultHref(item)}
                  className="block px-4 py-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{item.title}</span>
                    <Badge variant="secondary" className="text-[10px]">
                      {item.kind === "symptom"
                        ? "Symptom"
                        : CONTENT_TYPE_LABEL[item.content_type ?? "concept"]}
                    </Badge>
                    {item.difficulty ? (
                      <span className="text-[10px] text-muted-foreground">
                        {DIFFICULTY_LABEL[item.difficulty]}
                      </span>
                    ) : null}
                  </div>
                  {item.summary ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {item.summary}
                    </p>
                  ) : null}
                </AppLink>
              </li>
            ))}
            {!isFetching && results.length === 0 ? (
              <li className="px-4 py-6 text-sm text-muted-foreground">
                No matches. Try fewer words, or search for the symptom you are seeing.
              </li>
            ) : null}
          </ul>

          {pages > 1 ? (
            <div className="mt-6 flex items-center justify-between">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() =>
                  void navigate({ search: (prev) => ({ ...prev, page: prev.page - 1 }) })
                }
              >
                Previous
              </Button>
              <span className="text-xs text-muted-foreground">
                Page {page} of {pages}
              </span>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= pages}
                onClick={() =>
                  void navigate({ search: (prev) => ({ ...prev, page: prev.page + 1 }) })
                }
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
