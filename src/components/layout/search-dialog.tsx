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
import { searchIndexQuery } from "@/lib/hvac.functions";
import { CONTENT_TYPE_PLURAL, topicHref, type ContentType } from "@/lib/hvac-types";
import { fuzzyFilter } from "@/lib/fuzzy";

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
  const { data } = useQuery({ ...searchIndexQuery, enabled: open });

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const grouped = useMemo(() => {
    const items = data ?? [];
    const matches = fuzzyFilter(
      query,
      items,
      (item) => [item.title, item.summary ?? "", item.tags.join(" ")],
      60,
    );
    return TYPE_ORDER.map((type) => ({
      type,
      items: matches.filter((m) => m.content_type === type),
    })).filter((g) => g.items.length > 0);
  }, [data, query]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
      <CommandInput
        placeholder="Search HVAC topics, components, symptoms..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList className="max-h-[60vh]">
        <CommandEmpty>No topics found.</CommandEmpty>
        {grouped.map((group) => (
          <CommandGroup key={group.type} heading={CONTENT_TYPE_PLURAL[group.type]}>
            {group.items.map((item) => (
              <CommandItem
                key={item.id}
                value={item.id}
                onSelect={() => {
                  onOpenChange(false);
                  void navigate({ to: topicHref(item.content_type, item.slug) });
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
      </CommandList>
    </CommandDialog>
  );
}
