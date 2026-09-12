export type ContentType =
  | "equipment"
  | "component"
  | "concept"
  | "procedure"
  | "troubleshooting"
  | "tool";

export type Difficulty = "beginner" | "apprentice" | "technician" | "advanced";

export type ContentStatus = "draft" | "review" | "published" | "archived";

/** A single block inside a topic body. Stored as JSONB so the admin can add
 *  sections without code changes. */
export type Block =
  | { type: "heading"; text: string }
  | { type: "subheading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | { type: "steps"; items: string[] }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "definition"; term: string; text: string }
  | { type: "formula"; expression: string; text?: string }
  | { type: "callout"; variant: CalloutVariant; title?: string; text: string }
  | { type: "diagram"; diagram: string; caption?: string }
  | { type: "image"; url: string; alt: string; caption?: string }
  | { type: "symptom"; text: string }
  | { type: "checks"; items: { check: string; meaning: string }[] };

export type CalloutVariant = "note" | "safety" | "tip" | "important" | "code-notice";

/** A body section: an optional named section wrapper around blocks.
 *  Sections that have no blocks are never rendered. */
export type Section = {
  id: string;
  title: string;
  blocks: Block[];
};

export type ContentRecord = {
  id: string;
  title: string;
  slug: string;
  content_type: ContentType;
  category_id: string | null;
  subcategory: string | null;
  summary: string | null;
  body: Section[];
  difficulty: Difficulty;
  status: ContentStatus;
  featured_image: string | null;
  tags: string[];
  safety_note: string | null;
  code_notice: string | null;
  diagram_key: string | null;
  sort_order: number;
  updated_at: string;
};

export type ContentSummary = Pick<
  ContentRecord,
  "id" | "title" | "slug" | "content_type" | "summary" | "difficulty" | "tags" | "subcategory"
>;

export type CategoryRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  parent_id: string | null;
  content_type: ContentType | null;
  icon: string | null;
  sort_order: number;
};

export type RelationshipGroupKey =
  | "equipment"
  | "component"
  | "concept"
  | "procedure"
  | "troubleshooting"
  | "tool";

export const CONTENT_TYPE_PATH: Record<ContentType, string> = {
  equipment: "/equipment",
  component: "/components",
  concept: "/concepts",
  procedure: "/procedures",
  troubleshooting: "/troubleshooting",
  tool: "/tools",
};

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  equipment: "Equipment",
  component: "Component",
  concept: "Concept",
  procedure: "Procedure",
  troubleshooting: "Troubleshooting",
  tool: "Tool",
};

export const CONTENT_TYPE_PLURAL: Record<ContentType, string> = {
  equipment: "Equipment",
  component: "Components",
  concept: "Concepts",
  procedure: "Procedures",
  troubleshooting: "Troubleshooting",
  tool: "Tools",
};

export const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "Beginner",
  apprentice: "Apprentice",
  technician: "Technician",
  advanced: "Advanced",
};

export function topicHref(type: ContentType, slug: string) {
  return `${CONTENT_TYPE_PATH[type]}/${slug}`;
}

/* ---------------------------------------------------------------------- *
 * Structured entities (symptoms, levels, learning paths, diagnostics)
 * ---------------------------------------------------------------------- */

export type SymptomRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  category: string | null;
  severity: string | null;
};

/** A symptom as it appears on a topic page, with the role it plays there. */
export type TopicSymptom = SymptomRecord & { role: string };

export const SYMPTOM_ROLE_LABEL: Record<string, string> = {
  diagnoses: "Diagnosed here",
  cause: "Possible cause",
  affects: "Affected equipment",
  explains: "Background",
  procedure: "Related procedure",
  related: "Related",
};

export type TopicLevel = {
  level: Difficulty;
  summary: string | null;
  body: Section[];
};

export type LearningPathRecord = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  level: Difficulty;
  sort_order: number;
};

export type DiagnosticAnswer = {
  label: string;
  next?: string | null;
  result?: string | null;
};

export type DiagnosticNode = {
  id: string;
  key: string;
  is_root: boolean;
  question: string;
  observation: string | null;
  safety_note: string | null;
  possible_causes: string[];
  answers: DiagnosticAnswer[];
  related: { slug: string; title: string; content_type: ContentType } | null;
};

export type DiagnosticTreeRecord = {
  id: string;
  slug: string;
  title: string;
  intro: string | null;
  safety_note: string | null;
};

export type SearchKind = "topic" | "symptom";

export type SearchResult = {
  kind: SearchKind;
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  content_type: ContentType | null;
  difficulty: Difficulty | null;
  rank: number;
};

export function searchResultHref(result: SearchResult) {
  return result.kind === "symptom"
    ? `/symptoms/${result.slug}`
    : topicHref(result.content_type ?? "concept", result.slug);
}

export const LOCAL_CODE_NOTICE =
  "HVAC installation, venting, combustion air, ventilation air, gas piping, clearances, termination locations, electrical requirements, permits, and equipment requirements vary by jurisdiction and equipment. Always verify the applicable local codes, adopted code edition, regulations, permits, and manufacturer installation instructions before installation or service.";
