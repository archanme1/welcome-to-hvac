# Phase 3 — Build out the content library

Today the library has 11 articles. Phase 3 fills it out with original Welcome to HVAC writing across all six topic groups, using the page structure and callouts already built in Phase 2.

## What gets written

Roughly 70-80 articles, added in six batches so you can read and correct as we go:

1. **HVAC Fundamentals** — heat transfer, temperature vs. heat, pressure/temperature relationship, states of matter, latent and sensible heat, airflow basics, electricity basics, Ohm's law, series and parallel circuits, psychrometrics, load basics, comfort.
2. **Electrical components and diagnostics** — run and start capacitors, contactors, relays, transformers, sequencers, limit and pressure switches, motors (PSC, ECM, shaded pole), compressors, wiring and 24V control circuits, plus the matching diagnostic articles.
3. **Gas furnaces, heat pumps, air conditioners** — sequence of operation, ignition systems, flame sensing, defrost, reversing valve, metering devices, staging, plus per-system troubleshooting guides.
4. **Refrigeration and refrigerant work** — refrigeration cycle detail, superheat/subcooling application, charging methods, recovery and evacuation, leak detection, restrictions, non-condensables, refrigerant types and handling.
5. **Hydronics and combustion** — boilers, circulators, zoning, expansion tanks, water heaters, HRV/ERV, combustion basics, venting categories, combustion air, gas piping and pressure.
6. **Airflow, building science, installation, service, tools** — duct design basics, static pressure, filters, balancing, insulation and infiltration, commissioning, maintenance procedures, and the tool inventory (gauges, meters, combustion analyzer, anemometer, recovery machine, vacuum pump, and more).

## Every article follows the same shape

What it is, why it matters, where it's used, how it works, what can go wrong, how to diagnose it, the tools involved, safety, and links to related topics. Levels are tagged Beginner through Advanced.

## Safety and code rules (applied to every batch)

- Never present bypassing or defeating a safety control, working energized unnecessarily, improvised repairs, or improper refrigerant handling as normal practice.
- Install, venting, gas, and electrical topics carry the standard local-code notice: requirements vary by jurisdiction, adopted code edition, permits, manufacturer instructions, and equipment.
- All writing is original. Internal source references stay editorial-only and never appear on the site.

## Relationships and navigation

Each new article is linked to its category, tagged, and connected to related equipment, components, concepts, procedures, tools, and troubleshooting guides, so the related-topic blocks and sidebar fill in automatically. Diagrams are attached where one of the existing diagram types fits.

## Technical notes

Content is inserted as data (categories, `content` rows with structured JSON bodies, `content_relationships`), not as code. No new routes, components, or schema changes are required — Phase 2's renderer already handles every block type used. After each batch I check the affected pages render and search returns the new topics.

## Out of scope here

Practice questions, quizzes, and scenarios (Phase 4), AI Tutor tuning (Phase 5), admin panel (Phase 6).
