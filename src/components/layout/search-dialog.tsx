import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { searchSuggestQuery } from "@/lib/hvac.functions";
import {
  CONTENT_TYPE_PLURAL,
  searchResultHref,
  type ContentType,
  type SearchResult,
} from "@/lib/hvac-types";

const TYPE_ORDER: ContentType[] = [
  "equipment",
  "component",
  "concept",
  "troubleshooting",
  "procedure",
  "tool",
];

export function SearchDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");

  useEffect(() => {
    if (!open) {
      setQuery("");
      setDebounced("");
    }
  }, [open]);

  // The index lives in the database, so only send a request once typing pauses.
  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 180);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isFetching } = useQuery({ ...searchSuggestQuery(debounced), enabled: open });

  const grouped = useMemo(() => {
    const items = (data ?? []) as SearchResult[];
    const symptoms = items.filter((i) => i.kind === "symptom");
    const topics = TYPE_ORDER.map((type) => ({
      heading: CONTENT_TYPE_PLURAL[type],
      items: items.filter((i) => i.kind === "topic" && i.content_type === type),
    })).filter((g) => g.items.length > 0);
    return symptoms.length ? [{ heading: "Symptoms", items: symptoms }, ...topics] : topics;
  }, [data]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Search HVAC topics, components, symptoms..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>{isFetching ? "Searching..." : "No topics found."}</CommandEmpty>
        {grouped.map((group) => (
          <CommandGroup key={group.heading} heading={group.heading}>
            {group.items.map((item) => (
              <CommandItem
                key={`${item.kind}-${item.id}`}
                value={`${item.kind}-${item.id}`}
                onSelect={() => {
                  onOpenChange(false);
                  void navigate({ to: searchResultHref(item) });
                }}
                className="flex flex-col items-start gap-0.5 py-2"
              >
                <span className="text-sm font-medium">{item.title}</span>
                {item.summary ? (
                  <span className="line-clamp-1 text-xs text-muted-foreground">{item.summary}</span>
                ) : null}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
        {debounced ? (
          <CommandGroup heading="More">
            <CommandItem
              value="see-all-results"
              onSelect={() => {
                onOpenChange(false);
                void navigate({ to: "/search", search: { q: debounced, kind: "all", page: 1 } });
              }}
            >
              See all results for &ldquo;{debounced}&rdquo;
            </CommandItem>
          </CommandGroup>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
