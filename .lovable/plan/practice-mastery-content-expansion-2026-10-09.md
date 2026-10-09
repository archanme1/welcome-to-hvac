# Practice & Mastery content expansion

## Where things stand today

- 76 published topics (30 concepts, 17 components, 8 tools, 8 troubleshooting guides, 7 procedures, 6 equipment).
- 60 practice questions across 35 topics, 19 quizzes averaging about 2 questions each, and 150 troubleshooting scenarios (about 2 per topic).
- Each topic page already has a Practice section with Questions / Quiz / Troubleshooting / Equipment Scenarios tabs.

## Target per topic (all 76 topics)

- 10 standalone practice questions
- 1 topic quiz with 10 of its own quiz questions (separate from the practice questions, no reuse)
- 10 troubleshooting scenarios

That works out to about 1,460 new practice and quiz questions and about 610 new scenarios. Existing items count toward the 10, are kept as they are, and nothing is deleted. Learner progress, scores and accounts stay the same.

## Content rules

- Question types are mixed: multiple choice, true/false, calculation (units and worked steps go in the explanation), conceptual, and scenario-based. Each question has a difficulty level from Beginner to Advanced.
- Every scenario includes the complaint, equipment and operating conditions, observations, readings, possible causes, diagnostic steps, the most likely cause, the fix, an explanation, safety notes and a difficulty level. All readings are realistic for the stated conditions.
- Every topic gets its own original wording, so near-duplicates (the same question with only the numbers or part names changed) are left out. Code references are never invented, and gas, electrical and refrigerant work always carries safety guidance. Ontario/Canadian context is included where it fits.
- Each batch is checked for duplicates against what's already there before it's saved. If a batch is rerun, it skips items that already exist.

## Delivery in batches (topic groups)

1. Start Here and fundamentals concepts (22 topics)
2. Equipment (6 topics)
3. Components (17 topics)
4. Installation and procedures
5. Troubleshooting guides and tools
6. Remaining concepts, plus building science and safety

After each batch I count what's saved for every topic in that batch and check a sample topic page. I'll report a topic as complete only after its content is saved and showing on the site.

## Navigation

- Topic pages can open straight to a specific tab, for example `/equipment/gas-furnace#troubleshooting`, `#questions` or `#quiz`. The page scrolls to Practice and selects that tab, using the tabs that already exist.
- The Practice page links and the Symptoms pages point to the matching tab. The Practice page also lists counts for each type.
- Sidebar: Search and Experts (Soon) are removed. No other sidebar changes are made.

## Final report

A table for every topic showing existing, added and total counts for questions, quiz questions and scenarios.

## Technical notes

- Data is inserted as rows in the existing `practice_questions`, `quizzes` (with `question_ids`) and `scenarios` (`kind='troubleshooting'` with `details` JSON) tables. No schema changes are needed.
- Duplicates are prevented by an insert guard of the form `WHERE NOT EXISTS` on (content_id, prompt/title).
- Each topic has one quiz, named "<Topic> Quiz". If a quiz already exists, its `question_ids` list is extended rather than a new quiz being created.
- For hash-to-tab support, `practice-section.tsx` reads `location.hash` on mount and on hash changes.
- Search and Experts are removed from `src/lib/site-nav.ts`. Their routes stay.
- Because of the volume, this will take several work sessions. Free-tier visibility stays the same: practice remains HVAC Pro.
