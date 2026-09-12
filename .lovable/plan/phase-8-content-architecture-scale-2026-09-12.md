# Phase 8 — Content Architecture & Scale

Goal: make the knowledge base structured, connected, searchable and fast **before** adding more HVAC content. No redesign, no new visual language, no new animations. Everything below extends what already exists.

## What the audit found

Working today: 76 published topics across 9 categories, topic pages, category pages, type index pages, relationships, practice (questions/quizzes/scenarios), premium gating, grounded AI Tutor, admin CMS, payments, diagrams.

Real gaps to close:

- **Search downloads the whole library to the phone.** Both the search page and the command palette fetch up to 4,000 topics into the browser and filter there. This breaks at scale and is slow on mobile data.
- **The sidebar does the same** — every page load pulls all categories plus all topics.
- **No symptom layer.** "AC freezes", "high head pressure" etc. aren't objects, so nothing can link to them.
- **No learning paths / next topic.** Nothing sequences the library.
- **No learner levels inside a topic.** Beginner→Advanced exists only as one difficulty label per article.
- **Troubleshooting steps are free-form.** Scenarios store steps loosely; no reusable decision-tree shape with causes, safety notes and component links per step.
- **No "Review" status**, no image uploads, no analytics foundation, no public caching.

## Step 1 — Content model (database)

Extend the existing tables; no duplicate tables, nothing dropped.

- `symptoms` — slug, title, description, category, severity. Linkable to equipment, components, concepts, procedures and troubleshooting content.
- `content_symptoms` — link table with a "likelihood/role" field.
- `learning_paths` + `learning_path_items` — ordered sequences of existing topics, powering the path pages and "Next topic".
- `topic_levels` — per-topic explanation for Beginner / Apprentice / Technician / Advanced (optional; topics without them render as they do now).
- `diagnostic_trees` + `diagnostic_nodes` — structured troubleshooting: question, answers, observation, possible causes, next node, related component, safety warning, related doc.
- `content` gains: `review` status, `search_vector` (full-text), `view_count`, `reading_minutes`, `next_content_id`.
- `analytics_events` — topic views, searches, no-result searches, practice completions, tutor usage. Write-only from the app, staff-readable.
- Indexes: full-text GIN on search vector, trigram index on titles for typo tolerance, plus indexes on slug, symptom links, path items, tree nodes and progress.
- HVAC synonyms so "TXV", "expansion valve" and "metering device" find each other.

## Step 2 — Search rebuilt server-side

- One indexed search function in the database returning ranked, categorised, paginated results (topics, symptoms, procedures, tools, practice).
- Search page and command palette both call it with debounced queries — the browser never downloads the library again.
- Results grouped by type, with the matched snippet.
- Empty searches get logged so we can see what content is missing.

## Step 3 — Connect existing content

- Map the 76 existing topics into the master taxonomy groups (Fundamentals, Equipment, Components, Concepts, Procedures, Installation/Code, Troubleshooting, Tools) — the taxonomy stays expandable, no rewrite of article bodies.
- Seed the symptom library (~30 symptoms from the brief) and link them to the existing equipment, components and concepts.
- Backfill relationships so pages like Gas Furnace connect to their components, concepts, procedures, tools and symptoms.
- Seed three learning paths (Beginner, Apprentice, Technician) from existing topics and set "next topic".

## Step 4 — Admin

Extend the existing admin, same look:

- Symptom manager (create/edit, link to topics).
- Learning path builder (drag-free ordered list).
- Diagnostic tree editor for structured troubleshooting.
- Per-level explanations on the topic editor.
- Image upload to cloud storage with automatic resizing, replacing hand-typed image URLs.
- `Review` added to the status control.

## Step 5 — Topic page structure

Topic pages consume the new structured data, keeping current typography and spacing:

- "What you'll learn" summary chips at the top.
- Sections appear only when data exists: Components, Operation, Installation, Service, Maintenance, Troubleshooting (symptoms + diagnostic tree), Tools, Safety, Code & Regulations.
- Level tabs where per-level content exists.
- Related topics grouped by relationship kind; "Next topic" card at the end.
- Practice and AI Tutor stay where they are, still Pro-gated.

## Step 6 — Performance

- Public topic, category and index pages served with cache headers so repeat visits and crawlers are cheap.
- Sidebar navigation switches to a small cached tree instead of the full topic list.
- Single-query topic fetch (no N+1 across relationships, symptoms, practice counts).
- Pagination on index/category/search listings.
- Images served responsively with lazy loading and modern formats.
- Heavy code (AI tutor, practice, admin, interactive diagrams) loaded only on demand, keeping documentation pages light.

## Out of scope this phase

Bulk content generation, 3D, expert marketplace, jurisdiction-specific code rules (the model supports them later).

## Verification

Not just "it compiles". I'll drive the real app: create and publish a topic from admin, link it to equipment/components/concepts/procedures/symptoms, add a question and a quiz, build a diagnostic tree, run searches including abbreviations, walk a learning path, open AI Tutor from a topic, and check mobile page weight and load time.

## Technical notes

TanStack Start server functions for all reads; Postgres `tsvector` + `pg_trgm` for search behind a `SECURITY DEFINER` function with `GRANT` to anon; RLS on every new table (public read for published content, owner-scoped progress, staff writes); Supabase Storage bucket for topic images with a public read policy; `Cache-Control`/`stale-while-revalidate` on public document routes; route-level `React.lazy` for tutor/practice/admin bundles.
