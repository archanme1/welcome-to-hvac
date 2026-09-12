import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import type {
  CategoryRecord,
  ContentRecord,
  ContentSummary,
  ContentType,
  Section,
} from "./hvac-types";

const SUMMARY_COLUMNS =
  "id, title, slug, content_type, summary, difficulty, tags, subcategory, category_id, sort_order";

const FULL_COLUMNS =
  "id, title, slug, content_type, category_id, subcategory, summary, body, difficulty, status, featured_image, tags, safety_note, code_notice, diagram_key, sort_order, updated_at";

export type NavCategory = CategoryRecord & { children: CategoryRecord[] };

export type TopicPayload = {
  topic: ContentRecord;
  category: CategoryRecord | null;
  related: Record<ContentType, ContentSummary[]>;
  practice: { questions: number; quizzes: number; troubleshooting: number; equipment: number };
};

const emptyRelated = (): Record<ContentType, ContentSummary[]> => ({
  equipment: [],
  component: [],
  concept: [],
  procedure: [],
  troubleshooting: [],
  tool: [],
});

/** Full navigation tree: categories plus their published topics. */
export const getNavigation = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./hvac.server");
  const db = publicDb();

  const [{ data: categories }, { data: topics }] = await Promise.all([
    db.from("categories").select("*").order("sort_order").order("title"),
    db
      .from("content")
      .select(SUMMARY_COLUMNS)
      .eq("status", "published")
      .order("sort_order")
      .order("title")
      .limit(4000),
  ]);

  return {
    categories: (categories ?? []) as CategoryRecord[],
    topics: (topics ?? []) as (ContentSummary & {
      category_id: string | null;
      sort_order: number;
    })[],
  };
});

export const navigationQuery = queryOptions({
  queryKey: ["hvac", "navigation"],
  queryFn: () => getNavigation(),
  staleTime: 5 * 60 * 1000,
});

/** One topic with its relationships and practice counts. */
export const getTopic = createServerFn({ method: "GET" })
  .inputValidator((data: { type: ContentType; slug: string }) => data)
  .handler(async ({ data }): Promise<TopicPayload | null> => {
    const { publicDb } = await import("./hvac.server");
    const db = publicDb();

    const { data: topic } = await db
      .from("content")
      .select(FULL_COLUMNS)
      .eq("content_type", data.type)
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();

    if (!topic) return null;

    const [{ data: rels }, { data: category }, { data: counts }] = await Promise.all([
      db
        .from("content_relationships")
        .select("related_content_id, relationship_type, sort_order")
        .eq("content_id", topic.id)
        .order("sort_order"),
      topic.category_id
        ? db.from("categories").select("*").eq("id", topic.category_id).maybeSingle()
        : Promise.resolve({ data: null }),
      db.rpc("practice_counts", { _content_id: topic.id }),
    ]);

    const related = emptyRelated();
    const ids = (rels ?? []).map((r) => r.related_content_id);
    if (ids.length) {
      const { data: relatedRows } = await db
        .from("content")
        .select(SUMMARY_COLUMNS)
        .in("id", ids)
        .eq("status", "published")
        .order("title");
      for (const row of (relatedRows ?? []) as ContentSummary[]) {
        related[row.content_type].push(row);
      }
    }

    const countRow = Array.isArray(counts) ? counts[0] : counts;

    return {
      topic: { ...topic, body: (topic.body ?? []) as Section[] } as ContentRecord,
      category: (category ?? null) as CategoryRecord | null,
      related,
      practice: {
        questions: countRow?.questions ?? 0,
        quizzes: countRow?.quizzes ?? 0,
        troubleshooting: countRow?.troubleshooting ?? 0,
        equipment: countRow?.equipment ?? 0,
      },
    };
  });

export const topicQuery = (type: ContentType, slug: string) =>
  queryOptions({
    queryKey: ["hvac", "topic", type, slug],
    queryFn: () => getTopic({ data: { type, slug } }),
    staleTime: 5 * 60 * 1000,
  });

/** All published topics of one type, for index/listing pages. */
export const listTopics = createServerFn({ method: "GET" })
  .inputValidator((data: { type: ContentType }) => data)
  .handler(async ({ data }) => {
    const { publicDb } = await import("./hvac.server");
    const db = publicDb();

    const [{ data: topics }, { data: categories }] = await Promise.all([
      db
        .from("content")
        .select(SUMMARY_COLUMNS)
        .eq("content_type", data.type)
        .eq("status", "published")
        .order("sort_order")
        .order("title")
        .limit(2000),
      db.from("categories").select("*").order("sort_order"),
    ]);

    return {
      topics: (topics ?? []) as (ContentSummary & { category_id: string | null })[],
      categories: (categories ?? []) as CategoryRecord[],
    };
  });

export const listTopicsQuery = (type: ContentType) =>
  queryOptions({
    queryKey: ["hvac", "list", type],
    queryFn: () => listTopics({ data: { type } }),
    staleTime: 5 * 60 * 1000,
  });

/** Lightweight index powering the command palette. */
export const getSearchIndex = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./hvac.server");
  const db = publicDb();
  const { data } = await db
    .from("content")
    .select("id, title, slug, content_type, summary, difficulty, tags, subcategory")
    .eq("status", "published")
    .order("title")
    .limit(4000);
  return (data ?? []) as ContentSummary[];
});

export const searchIndexQuery = queryOptions({
  queryKey: ["hvac", "search-index"],
  queryFn: () => getSearchIndex(),
  staleTime: 10 * 60 * 1000,
});
