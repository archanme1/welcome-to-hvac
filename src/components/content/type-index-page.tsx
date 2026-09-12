import { useMemo, useState } from "react";

import { TopicCardGrid } from "./related-topics";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CONTENT_TYPE_PLURAL,
  DIFFICULTY_LABEL,
  type CategoryRecord,
  type ContentSummary,
  type ContentType,
  type Difficulty,
} from "@/lib/hvac-types";

const DIFFICULTIES: Difficulty[] = ["beginner", "apprentice", "technician", "advanced"];

export function TypeIndexPage({
  type,
  description,
  topics,
  categories,
}: {
  type: ContentType;
  description: string;
  topics: (ContentSummary & { category_id: string | null })[];
  categories: CategoryRecord[];
}) {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);

  const categoryById = useMemo(
    () => new Map(categories.map((c) => [c.id, c] as const)),
    [categories],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topics.filter((t) => {
      if (difficulty && t.difficulty !== difficulty) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.summary ?? "").toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q))
      );
    });
  }, [topics, query, difficulty]);

  const grouped = useMemo(() => {
    const map = new Map<string, ContentSummary[]>();
    for (const topic of filtered) {
      const key = topic.category_id ? (categoryById.get(topic.category_id)?.title ?? "Other") : "Other";
      const list = map.get(key) ?? [];
      list.push(topic);
      map.set(key, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered, categoryById]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        {CONTENT_TYPE_PLURAL[type]}
      </h1>
      <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">{description}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filter ${CONTENT_TYPE_PLURAL[type].toLowerCase()}...`}
          className="sm:max-w-xs"
        />
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTIES.map((level) => (
            <Button
              key={level}
              type="button"
              size="sm"
              variant={difficulty === level ? "default" : "outline"}
              className={cn("h-8 text-xs")}
              onClick={() => setDifficulty(difficulty === level ? null : level)}
            >
              {DIFFICULTY_LABEL[level]}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-10 text-sm text-muted-foreground">
          No topics match yet. New content is published regularly.
        </p>
      ) : (
        <div className="mt-8 space-y-10">
          {grouped.map(([group, items]) => (
            <section key={group}>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                {group}
              </h2>
              <TopicCardGrid items={items} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
