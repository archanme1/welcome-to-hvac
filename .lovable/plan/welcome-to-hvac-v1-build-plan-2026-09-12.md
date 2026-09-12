# Welcome to HVAC — V1 Build Plan

A mobile-first HVAC knowledge platform: free documentation, premium practice and AI tutor. Documentation-style design (neutral, typographic, collapsible sidebar, command-palette search, light/dark).

Because the topic inventory is huge, everything is database-driven. The owner adds equipment, components, concepts, procedures, tools, troubleshooting, questions, quizzes and scenarios from the admin panel — never from code.

## Phase 1 — Foundation (backend + shell)

- Enable Lovable Cloud (database, accounts, server logic).
- Content model: one `content` table with a type field (equipment, component, concept, procedure, troubleshooting, tool), plus slug, category, subcategory, description, body (structured blocks), difficulty level, status (draft/published/archived), safety note, code notice, tags, featured image.
- `content_relationships` table so any topic can link to any other with a labelled relationship (component-of, related-concept, uses-tool, troubleshoots). Related Equipment / Components / Concepts / Tools / Troubleshooting blocks are generated from this on every page.
- Categories/taxonomy table matching the navigation tree.
- Accounts: sign up / sign in, single "HVAC Pro" entitlement flag, admin role in a separate roles table.
- App shell: top bar (menu, title, search), collapsible sidebar with the specified top-level navigation, breadcrumbs, "On this page" rail on wide screens, dark/light mode.

## Phase 2 — Reading experience

- Topic page renderer: intro, What You'll Learn, How It Works, Sequence of Operation, Components, Diagram, Installation, Service, Maintenance, Troubleshooting, Common Problems, Tools, Safety, Related Topics. Empty sections are omitted.
- Troubleshooting pages use the structured model: Symptom, What You Observe, Possible Causes, What to Check, Measurement/Test, What the Result Means, Likely Cause, Next Step, Safety Note, Related Topics.
- Reusable callouts: Note, Safety, Technician Tip, Important, Local Code Notice (standard jurisdiction wording on all install/venting/gas/electrical pages).
- Clean URLs: `/hvac-fundamentals`, `/equipment/gas-furnace`, `/components/capacitor`, `/concepts/superheat`, `/procedures/refrigerant-charging`, `/troubleshooting/gas-furnace`, `/tools/manometer`.
- Fuzzy command-palette search across all content types.
- Home page: hero, search, Start Learning, equipment grid, Practice & Mastery, HVAC Pro pricing ($5/mo or $50/yr, save $10).
- Level filter: Beginner / Apprentice / Technician / Advanced.

## Phase 3 — Seeded content

Original Welcome to HVAC writing (no copied source material), with professional documentation titles rather than video-style titles. Every seeded topic gets a real explanation, relationships, and safety/code notices where relevant. Seeded in batches:

1. HVAC Fundamentals (full list from the spec)
2. Electrical components + electrical diagnostics (capacitors, relays, contactors, transformers, motors, compressors)
3. Gas furnaces, heat pumps, air conditioners
4. Refrigeration, charging, leak detection
5. Boilers/hydronics, water heaters, HRV/ERV, venting/combustion, gas piping
6. Airflow/ductwork, building science, installation, service, tools

Safety rule applied throughout: bypassing or defeating safety controls is never presented as a repair method; high-risk topics emphasize training, PPE, lockout/tagout, manufacturer instructions and local requirements. Internal `source_reference` fields exist for editorial review only and are never shown as site content.

## Phase 4 — Practice & Mastery (premium)

- Questions, quizzes, troubleshooting scenarios, equipment scenarios — all attachable to any topic.
- Question types: multiple choice, true/false, multi-select, short answer, calculation, diagnostic decision, identify the component, identify the problem, sequence of operation. Every answer includes an explanation of why.
- Branching scenarios that teach diagnostic reasoning rather than "replace this part".
- Locked previews for free users; progress tracking for Pro.

## Phase 5 — AI Tutor (premium)

- Grounded in the knowledge base and aware of the current topic ("Ask AI about Gas Furnaces").
- Quick prompts: explain simply, give an example, go deeper, quiz me, give me a scenario, explain like an apprentice, compare two concepts, help me diagnose.
- Code-sensitive questions always defer to local code and manufacturer instructions.

## Phase 6 — Admin panel

`/admin` with Dashboard, Content (all types), Practice (questions, quizzes, scenarios), Media, Categories, Users, Subscriptions, Settings. Create, edit, draft, preview, publish, archive, search, categorize, tag, relate, attach images/diagrams, add safety and code notices. Block editor with headings, lists, tables, images with captions, links, formulas, diagrams, callouts and related-topic blocks.

## Phase 7 — Diagrams, visualization, payments

- Lightweight SVG diagrams (refrigeration cycle, furnace sequence, heat pump modes, 24V control circuit, capacitor terminals, contactor, relay, transformer, duct and venting systems), clickable to open the component explanation, horizontally scrollable on phones.
- Simple animated walkthroughs (furnace sequence, refrigeration cycle, reversing valve) — no 3D in V1.
- Stripe subscriptions for HVAC Pro monthly/annual.
- Experts section shows "Coming Soon" only.

## Technical notes

TanStack Start with server-rendered documentation pages, route-level data loading, lazy images, code splitting, and minimal client JavaScript on text pages. Content is fetched by slug from the database; no page is hard-coded. Payments require a Stripe account connection from you.

## Scope note

This is a large V1. I'll build in the phase order above so the documentation core is usable early, and expand seeded content in batches.
