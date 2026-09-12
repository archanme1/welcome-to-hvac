import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";

import type {
  CategoryRecord,
  ContentRecord,
  ContentSummary,
  ContentType,
  DiagnosticNode,
  DiagnosticTreeRecord,
  Difficulty,
  LearningPathRecord,
  SearchResult,
  Section,
  SymptomRecord,
  TopicLevel,
  TopicSymptom,
} from "./hvac-types";

const SUMMARY_COLUMNS =
  "id, title, slug, content_type, summary, difficulty, tags, subcategory, category_id, sort_order";

const FULL_COLUMNS =
  "id, title, slug, content_type, category_id, subcategory, summary, body, difficulty, status, featured_image, tags, safety_note, code_notice, diagram_key, sort_order, updated_at, next_content_id, reading_minutes";

export type NavCategory = CategoryRecord & { children: CategoryRecord[] };

export type TopicPayload = {
  topic: ContentRecord & { reading_minutes?: number | null };
  category: CategoryRecord | null;
  related: Record<ContentType, ContentSummary[]>;
  practice: { questions: number; quizzes: number; troubleshooting: number; equipment: number };
  symptoms: TopicSymptom[];
  levels: TopicLevel[];
  nextTopic: ContentSummary | null;
  diagnostic: { slug: string; title: string } | null;
};

const emptyRelated = (): Record<ContentType, ContentSummary[]> => ({
  equipment: [],
  component: [],
  concept: [],
  procedure: [],
  troubleshooting: [],
  tool: [],
});

/* ---------------------------------------------------------------------- *
 * Navigation
 * ---------------------------------------------------------------------- */

export type NavTreeNode = {
  id: string;
  slug: string;
  title: string;
  parent_id: string | null;
  content_type: ContentType | null;
  sort_order: number;
  topic_count: number;
};

/** Compact category tree with topic counts. Small enough to load everywhere. */
export const getNavTree = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./hvac.server");
  const { data } = await publicDb().rpc("nav_tree");
  return (data ?? []) as NavTreeNode[];
});

export const navTreeQuery = queryOptions({
  queryKey: ["hvac", "nav-tree"],
  queryFn: () => getNavTree(),
  staleTime: 30 * 60 * 1000,
});

/** Topics belonging to one category. Fetched lazily when a section expands. */
export const getCategoryTopics = createServerFn({ method: "GET" })
  .inputValidator((data: { categoryId: string }) => data)
  .handler(async ({ data }) => {
    const { publicDb } = await import("./hvac.server");
    const { data: rows } = await publicDb()
      .from("content")
      .select("id, title, slug, content_type")
      .eq("category_id", data.categoryId)
      .eq("status", "published")
      .order("sort_order")
      .order("title")
      .limit(200);
    return (rows ?? []) as Pick<ContentSummary, "id" | "title" | "slug" | "content_type">[];
  });

export const categoryTopicsQuery = (categoryId: string) =>
  queryOptions({
    queryKey: ["hvac", "category-topics", categoryId],
    queryFn: () => getCategoryTopics({ data: { categoryId } }),
    staleTime: 30 * 60 * 1000,
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

/* ---------------------------------------------------------------------- *
 * Topic
 * ---------------------------------------------------------------------- */

/** One topic with its relationships, symptoms, levels and practice counts. */
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

    const [
      { data: rels },
      { data: category },
      { data: counts },
      { data: symptomRows },
      { data: levelRows },
      { data: treeRow },
      { data: nextRow },
    ] = await Promise.all([
      db
        .from("content_relationships")
        .select("related_content_id, relationship_type, sort_order")
        .eq("content_id", topic.id)
        .order("sort_order"),
      topic.category_id
        ? db.from("categories").select("*").eq("id", topic.category_id).maybeSingle()
        : Promise.resolve({ data: null }),
      db.rpc("practice_counts", { _content_id: topic.id }),
      db
        .from("content_symptoms")
        .select(
          "role, sort_order, symptoms!inner(id, slug, title, description, category, severity, is_published)",
        )
        .eq("content_id", topic.id)
        .order("sort_order"),
      db
        .from("topic_levels")
        .select("level, summary, body")
        .eq("content_id", topic.id),
      db
        .from("diagnostic_trees")
        .select("slug, title")
        .eq("content_id", topic.id)
        .eq("status", "published")
        .limit(1)
        .maybeSingle(),
      topic.next_content_id
        ? db
            .from("content")
            .select(SUMMARY_COLUMNS)
            .eq("id", topic.next_content_id)
            .eq("status", "published")
            .maybeSingle()
        : Promise.resolve({ data: null }),
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

    const symptoms: TopicSymptom[] = ((symptomRows ?? []) as unknown[])
      .map((row) => {
        const r = row as { role: string; symptoms: SymptomRecord & { is_published: boolean } };
        return { ...r.symptoms, role: r.role };
      })
      .filter((s) => s.is_published !== false)
      .map(({ is_published: _ignored, ...rest }) => rest as TopicSymptom);

    const LEVEL_ORDER: Difficulty[] = ["beginner", "apprentice", "technician", "advanced"];
    const levels = ((levelRows ?? []) as TopicLevel[])
      .map((l) => ({ ...l, body: (l.body ?? []) as Section[] }))
      .sort((a, b) => LEVEL_ORDER.indexOf(a.level) - LEVEL_ORDER.indexOf(b.level));

    return {
      topic: { ...topic, body: (topic.body ?? []) as Section[] } as TopicPayload["topic"],
      category: (category ?? null) as CategoryRecord | null,
      related,
      practice: {
        questions: countRow?.questions ?? 0,
        quizzes: countRow?.quizzes ?? 0,
        troubleshooting: countRow?.troubleshooting ?? 0,
        equipment: countRow?.equipment ?? 0,
      },
      symptoms,
      levels,
      nextTopic: (nextRow ?? null) as ContentSummary | null,
      diagnostic: (treeRow ?? null) as { slug: string; title: string } | null,
    };
  });

export const topicQuery = (type: ContentType, slug: string) =>
  queryOptions({
    queryKey: ["hvac", "topic", type, slug],
    queryFn: () => getTopic({ data: { type, slug } }),
    staleTime: 5 * 60 * 1000,
  });

/** Fire-and-forget view counter used for "most read" ordering. */
export const recordTopicView = createServerFn({ method: "POST" })
  .inputValidator((data: { contentId: string }) => data)
  .handler(async ({ data }) => {
    const { publicDb } = await import("./hvac.server");
    await publicDb().rpc("record_topic_view", { _content_id: data.contentId });
    return { ok: true };
  });

/* ---------------------------------------------------------------------- *
 * Listings
 * ---------------------------------------------------------------------- */

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

/* ---------------------------------------------------------------------- *
 * Search (indexed, server-side, paginated)
 * ---------------------------------------------------------------------- */

export const PAGE_SIZE = 20;

export const searchContent = createServerFn({ method: "GET" })
  .inputValidator((data: { q: string; kind?: string | null; page?: number }) => data)
  .handler(async ({ data }) => {
    const q = data.q.trim();
    if (!q) return { results: [] as SearchResult[], total: 0 };

    const { publicDb } = await import("./hvac.server");
    const db = publicDb();
    const kind = data.kind && data.kind !== "all" ? data.kind : null;
    const page = Math.max(0, (data.page ?? 1) - 1);

    const [{ data: rows }, { data: total }] = await Promise.all([
      db.rpc("search_all", {
        _q: q,
        _limit: PAGE_SIZE,
        _offset: page * PAGE_SIZE,
        _kind: kind,
      }),
      db.rpc("search_count", { _q: q, _kind: kind }),
    ]);

    return {
      results: (rows ?? []) as SearchResult[],
      total: (typeof total === "number" ? total : 0) as number,
    };
  });

export const searchQuery = (q: string, kind: string, page: number) =>
  queryOptions({
    queryKey: ["hvac", "search", q, kind, page],
    queryFn: () => searchContent({ data: { q, kind, page } }),
    staleTime: 60 * 1000,
  });

/** Small suggestion set used by the command palette. */
export const searchSuggest = createServerFn({ method: "GET" })
  .inputValidator((data: { q: string }) => data)
  .handler(async ({ data }) => {
    const q = data.q.trim();
    const { publicDb } = await import("./hvac.server");
    const db = publicDb();

    if (!q) {
      const { data: rows } = await db
        .from("content")
        .select("id, title, slug, content_type, summary")
        .eq("status", "published")
        .order("view_count", { ascending: false })
        .limit(12);
      return ((rows ?? []) as Record<string, unknown>[]).map((r) => ({
        kind: "topic",
        id: r["id"],
        slug: r["slug"],
        title: r["title"],
        summary: r["summary"],
        content_type: r["content_type"],
        difficulty: null,
        rank: 0,
      })) as SearchResult[];
    }

    const { data: rows } = await db.rpc("search_all", { _q: q, _limit: 12, _offset: 0 });
    return (rows ?? []) as SearchResult[];
  });

export const searchSuggestQuery = (q: string) =>
  queryOptions({
    queryKey: ["hvac", "suggest", q],
    queryFn: () => searchSuggest({ data: { q } }),
    staleTime: 60 * 1000,
  });

/* ---------------------------------------------------------------------- *
 * Category
 * ---------------------------------------------------------------------- */

/** A category landing page: the category, its child categories, and its topics. */
export const getCategory = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const { publicDb } = await import("./hvac.server");
    const db = publicDb();

    const { data: category } = await db
      .from("categories")
      .select("*")
      .eq("slug", data.slug)
      .maybeSingle();

    if (!category) return null;

    const { data: children } = await db
      .from("categories")
      .select("*")
      .eq("parent_id", category.id)
      .order("sort_order")
      .order("title");

    const ids = [category.id, ...(children ?? []).map((c) => c.id)];
    const { data: topics } = await db
      .from("content")
      .select(SUMMARY_COLUMNS)
      .in("category_id", ids)
      .eq("status", "published")
      .order("sort_order")
      .order("title")
      .limit(2000);

    return {
      category: category as CategoryRecord,
      children: (children ?? []) as CategoryRecord[],
      topics: (topics ?? []) as (ContentSummary & { category_id: string | null })[],
    };
  });

export const categoryQuery = (slug: string) =>
  queryOptions({
    queryKey: ["hvac", "category", slug],
    queryFn: () => getCategory({ data: { slug } }),
    staleTime: 5 * 60 * 1000,
  });

/* ---------------------------------------------------------------------- *
 * Symptoms
 * ---------------------------------------------------------------------- */

export const listSymptoms = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./hvac.server");
  const { data } = await publicDb()
    .from("symptoms")
    .select("id, slug, title, description, category, severity")
    .eq("is_published", true)
    .order("category")
    .order("sort_order")
    .order("title");
  return (data ?? []) as SymptomRecord[];
});

export const symptomsQuery = queryOptions({
  queryKey: ["hvac", "symptoms"],
  queryFn: () => listSymptoms(),
  staleTime: 30 * 60 * 1000,
});

export const getSymptom = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const { publicDb } = await import("./hvac.server");
    const db = publicDb();

    const { data: symptom } = await db
      .from("symptoms")
      .select("id, slug, title, description, category, severity")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();

    if (!symptom) return null;

    const [{ data: links }, { data: tree }] = await Promise.all([
      db
        .from("content_symptoms")
        .select(
          "role, sort_order, content!inner(id, title, slug, content_type, summary, difficulty, status)",
        )
        .eq("symptom_id", symptom.id)
        .order("sort_order"),
      db
        .from("diagnostic_trees")
        .select("slug, title")
        .eq("symptom_id", symptom.id)
        .eq("status", "published")
        .limit(1)
        .maybeSingle(),
    ]);

    const topics = ((links ?? []) as unknown[])
      .map((row) => {
        const r = row as { role: string; content: ContentSummary & { status: string } };
        return { role: r.role, topic: r.content };
      })
      .filter((r) => r.topic?.status === "published");

    return {
      symptom: symptom as SymptomRecord,
      topics,
      diagnostic: (tree ?? null) as { slug: string; title: string } | null,
    };
  });

export const symptomQuery = (slug: string) =>
  queryOptions({
    queryKey: ["hvac", "symptom", slug],
    queryFn: () => getSymptom({ data: { slug } }),
    staleTime: 10 * 60 * 1000,
  });

/* ---------------------------------------------------------------------- *
 * Learning paths
 * ---------------------------------------------------------------------- */

export const listLearningPaths = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./hvac.server");
  const db = publicDb();
  const { data: paths } = await db
    .from("learning_paths")
    .select("id, slug, title, description, level, sort_order")
    .eq("is_published", true)
    .order("sort_order");

  const list = (paths ?? []) as LearningPathRecord[];
  if (!list.length) return [] as (LearningPathRecord & { steps: number })[];

  const { data: items } = await db
    .from("learning_path_items")
    .select("path_id")
    .in(
      "path_id",
      list.map((p) => p.id),
    );

  const counts = new Map<string, number>();
  for (const row of (items ?? []) as { path_id: string }[]) {
    counts.set(row.path_id, (counts.get(row.path_id) ?? 0) + 1);
  }

  return list.map((p) => ({ ...p, steps: counts.get(p.id) ?? 0 }));
});

export const learningPathsQuery = queryOptions({
  queryKey: ["hvac", "paths"],
  queryFn: () => listLearningPaths(),
  staleTime: 30 * 60 * 1000,
});

export const getLearningPath = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const { publicDb } = await import("./hvac.server");
    const db = publicDb();

    const { data: path } = await db
      .from("learning_paths")
      .select("id, slug, title, description, level, sort_order")
      .eq("slug", data.slug)
      .eq("is_published", true)
      .maybeSingle();

    if (!path) return null;

    const { data: items } = await db
      .from("learning_path_items")
      .select(
        "sort_order, note, content!inner(id, title, slug, content_type, summary, difficulty, status)",
      )
      .eq("path_id", path.id)
      .order("sort_order");

    const steps = ((items ?? []) as unknown[])
      .map((row) => {
        const r = row as {
          sort_order: number;
          note: string | null;
          content: ContentSummary & { status: string };
        };
        return { sort_order: r.sort_order, note: r.note, topic: r.content };
      })
      .filter((s) => s.topic?.status === "published");

    return { path: path as LearningPathRecord, steps };
  });

export const learningPathQuery = (slug: string) =>
  queryOptions({
    queryKey: ["hvac", "path", slug],
    queryFn: () => getLearningPath({ data: { slug } }),
    staleTime: 10 * 60 * 1000,
  });

/* ---------------------------------------------------------------------- *
 * Diagnostic trees
 * ---------------------------------------------------------------------- */

export const getDiagnosticTree = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => data)
  .handler(async ({ data }) => {
    const { publicDb } = await import("./hvac.server");
    const db = publicDb();

    const { data: tree } = await db
      .from("diagnostic_trees")
      .select("id, slug, title, intro, safety_note")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();

    if (!tree) return null;

    const { data: nodes } = await db
      .from("diagnostic_nodes")
      .select(
        "id, key, is_root, question, observation, safety_note, possible_causes, answers, sort_order, content:related_content_id(slug, title, content_type)",
      )
      .eq("tree_id", tree.id)
      .order("sort_order");

    const parsed = ((nodes ?? []) as unknown[]).map((row) => {
      const r = row as Record<string, unknown>;
      return {
        id: r["id"],
        key: r["key"],
        is_root: r["is_root"],
        question: r["question"],
        observation: r["observation"],
        safety_note: r["safety_note"],
        possible_causes: (r["possible_causes"] ?? []) as string[],
        answers: (r["answers"] ?? []) as DiagnosticNode["answers"],
        related: (r["content"] ?? null) as DiagnosticNode["related"],
      } as DiagnosticNode;
    });

    return { tree: tree as DiagnosticTreeRecord, nodes: parsed };
  });

export const diagnosticTreeQuery = (slug: string) =>
  queryOptions({
    queryKey: ["hvac", "diagnostic", slug],
    queryFn: () => getDiagnosticTree({ data: { slug } }),
    staleTime: 10 * 60 * 1000,
  });

/* ---------------------------------------------------------------------- *
 * Practice catalog
 * ---------------------------------------------------------------------- */

export type PracticeCatalogRow = {
  content_id: string;
  questions: number;
  quizzes: number;
  troubleshooting: number;
  equipment: number;
};

/** Counts of published practice material per topic. Public: counts only, no answers. */
export const getPracticeCatalog = createServerFn({ method: "GET" }).handler(async () => {
  const { publicDb } = await import("./hvac.server");
  const { data } = await publicDb().rpc("practice_catalog");
  return (data ?? []) as PracticeCatalogRow[];
});

export const practiceCatalogQuery = queryOptions({
  queryKey: ["hvac", "practice-catalog"],
  queryFn: () => getPracticeCatalog(),
  staleTime: 5 * 60 * 1000,
});
