# Admin editing for the new content structures

Everything added in the last phase — symptoms, learning paths, diagnostic walkthroughs and per-level explanations — currently lives in the database with no way to edit it from `/admin`. This plan adds those screens so content can be maintained without code changes.

No redesign: the new screens reuse the existing admin tab layout, forms and shadcn components already used by Content, Practice and Categories.

## New admin tabs

**Symptoms** (`/admin/symptoms`)
- List all 35 symptoms with category, severity and published state; search box to filter.
- Create/edit a symptom: title, slug (auto-suggested from title), description, category, severity, published toggle, sort order.
- Link symptoms to topics from the symptom's own editor: pick a topic, choose the role (diagnosed here / background / related), add an optional note, reorder or remove.
- Delete a symptom (admin only), which also clears its topic links.

**Learning paths** (`/admin/paths`)
- List the three paths with level, step count and published state.
- Create/edit a path: title, slug, description, level, published toggle, sort order.
- Manage the ordered steps: add a topic, add an optional note, move a step up or down, remove it.

**Diagnostics** (`/admin/diagnostics`)
- List diagnostic trees with their linked topic or symptom, step count and status.
- Create/edit a tree: title, slug, intro, safety note, status, and which topic/symptom it belongs to.
- Edit the steps of a tree: each step has a key, question, optional observation, optional safety note, possible causes, an optional "read more" topic link, and its answer buttons. Each answer has a label and either the next step or a final result. One step is marked as the starting step.
- Basic integrity checks shown inline: exactly one starting step, every answer points to a real step, and a warning for steps nothing links to.

## Added to the existing Content editor

Inside the topic editor at `/admin/content/:id`, two new sections:
- **Level explanations** — optional Beginner / Apprentice / Technician / Advanced versions of the topic, each with its own summary and body, edited with the block editor already used for the main body.
- **Reading order** — pick the topic that comes next, so the "Next topic" link at the bottom of an article can be set by hand.
- The status dropdown gains the existing **Review** state alongside Draft, Published and Archived.

## Dashboard

The admin dashboard adds counts for symptoms, learning paths and diagnostic trees next to the existing topic, category and practice counts.

## Technical notes

- All reads/writes go through new staff-gated `createServerFn` handlers appended to `src/lib/admin.functions.ts`, following the existing `assertStaff` / `assertAdmin` pattern. Deletes require admin.
- Row-level security already grants staff full write access on `symptoms`, `content_symptoms`, `learning_paths`, `learning_path_items`, `topic_levels`, `diagnostic_trees` and `diagnostic_nodes`, so no database migration is needed.
- New routes `src/routes/admin.symptoms.tsx`, `admin.paths.tsx`, `admin.diagnostics.tsx`, registered in the `TABS` array in `src/routes/admin.tsx`.
- Diagnostic answers and possible causes are stored as JSON; the editor writes the same `{ label, next?, result? }` shape the public walkthrough already reads.
- Public queries are invalidated after each save so the live pages reflect edits immediately.

## Out of scope

- Bulk import/export of content.
- Media library and image uploads (still to come in a later pass).
- Authoring new symptoms/paths content itself — this is the tooling, not the content.
