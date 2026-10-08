# SEO, Live Learners, Trade Knowledge, Shop & Engineering Calculators

Everything existing stays as-is: sign-in, billing, AI Tutor, quizzes, lessons, admin, routes and design. Only additions plus metadata improvements.

## Phase 1 — SEO audit and topic-page improvements
- Run the SEO scan and Search Console check (if connected), then fix what they report.
- Every public page (topics, categories, symptoms, paths, diagnostics, index pages, start-here, pricing, practice landing) gets a unique title and description built from its own summary/content, one H1, ordered H2/H3, canonical, Open Graph, and fitting structured data (Article, BreadcrumbList, ItemList, HowTo for procedures where content supports it).
- Find duplicate titles/descriptions and broken internal links across the library and fix them.
- Descriptive alt text on diagrams and images.
- Sitemap extended with calculator pages and Trade Knowledge; robots keeps admin, account, checkout, auth, reset and AI Tutor conversations out; search results stay noindex.
- Keyword research with Semrush (US + Canada) for the listed keyword groups; results used to pick calculator page priorities and wording. No invented volumes — reported as found.

## Phase 2 — Live learners, Trade Knowledge, Shop
**Live learners badge (header, all users)**
- Reuses the existing visitor heartbeat. New public count that returns only a number: distinct signed-in users plus anonymous sessions active in the last 2 minutes (multiple tabs of one user counted once; anonymous tabs share one session id already).
- Header: green pulsing dot + "128 learners online" on desktop, dot + number on mobile; refreshes every 60 s; hidden if the count is unavailable. No names, emails or IPs ever leave the server.

**Today's Trade Knowledge (homepage)**
- New facts library: headline, explanation, category, practical example, Learn-More link, optional scheduled date, month/season tag, status (draft / approved / disabled), last-featured date.
- Daily pick: scheduled fact for today, else a seasonal/month-matched approved fact, else a deterministic date-seeded choice that skips anything shown in the last 60 days. Same fact for everyone all day; cached.
- Admin page to add, edit, approve, schedule, categorize and disable facts, with an "AI draft" button (Lovable AI) that only creates drafts — nothing publishes without admin approval.
- Seeded with ~40 approved facts written and checked against well-known references (HVAC first, plus electrical, building science, refrigeration, renewables, plumbing).

**Shop**
- Sidebar "Shop" entry linking to a small `/shop` page with a "Visit Our Store" button opening https://store.welcometohvac.com/ in a new tab safely.
- Store URL editable in Admin Settings (stored in the existing settings table).

## Phase 3–4 — Engineering Tools & Calculators
New sidebar section "Engineering Tools & Calculators" at `/calculators` (the existing `/tools` HVAC-tools articles are untouched).
- Hub page with search, category filters and cards; each calculator has its own page `/calculators/<slug>`; category pages `/calculators/category/<slug>`.
- Calculators are defined in one registry (slug, category, title, SEO copy, inputs with units, formula, example, mistakes, related calculators/lessons, free or Pro). Adding a calculator = adding a registry entry.
- Shared calculator UI: labeled inputs with units, metric/imperial toggle, live calculation, validation, rounding, formula display, explanation, reset, copy result, related tools, print/export for checklists.
- Calculation functions are pure, unit-tested modules.

**Categories and first release scope**
- General: Universal Unit Converter (pressure, temperature, flow, power, energy, force, torque, density, velocity, length, area, volume, mass, electrical, thermal, R/RSI, vacuum/micron) — free.
- HVAC Fundamentals: BTU/kW/tons, sensible/latent/total heat, ΔT, specific heat, energy use and operating cost, COP/EER/SEER conversions.
- AC, Heat Pumps & Refrigeration: heat pump COP and cost, HP vs electric resistance, backup heat, superheat, subcooling, pressure ratio, enthalpy difference, capacity, evaporator/condenser split, line velocity, efficiency comparison.
- HVAC Electrical: Ohm's law/power wheel, single and three-phase power, voltage drop, wire resistance, motor current/efficiency, transformer VA, capacitor/capacitive reactance, series/parallel resistance, power factor, load and cost, low-voltage circuit.
- Airflow & Ducts: CFM (sensible), CFM↔L/s↔m³/h, round and rectangular duct sizing (equal friction), velocity, friction loss, TESP, ACH, ventilation airflow, CFM/ton, duct area, fan power, fan affinity laws.
- Insulation & Building Science: R/RSI/U, wall/ceiling/floor/window heat loss, building heat loss estimate, batt and blown-in quantity, vapor barrier area, dew point, RH, condensation risk, degree-day estimate — clearly labeled estimates, not Manual J.
- Combustion & Heating: furnace input/output, efficiency, electric furnace kW and amps, temperature rise, gas and fuel cost, combustion air (labeled educational, verify local code).
- Piping & Mechanical: pipe volume, weight, insulation, thermal expansion, torque conversion, pump head/TDH, pump power and efficiency, heat exchanger effectiveness.
- Safety & Maintenance: PPE, LOTO, electrical safety, heights, maintenance, commissioning, heat pump commissioning, AC/furnace service, refrigerant handling, inspection checklists, measurement log — printable, labeled "not a substitute for required procedures".

**Needs verified reference data (shipped as "coming soon" until sourced data is added, not invented)**
- Refrigerant P-T charts and saturation lookups (superheat/subcooling initially take user-entered saturation temperature).
- Refrigerant pipe sizing tables, conductor ampacity/breaker references (CEC/NEC), pipe schedule charts (ASME B36.10M/B36.19M), bolt torque/preload and flange tables, flue-gas efficiency tables, Ontario code-specific values.

## Phase 5 — Free vs Pro gating and calculator SEO
- Free: unit converter, plus one basic tool per category (e.g. BTU↔kW, Ohm's law, CFM conversion, R-value↔RSI). Everything else Pro, set per calculator in the registry.
- Pro pages remain fully visible (description, inputs, formula, worked example). The result area shows a tasteful locked panel with "Unlock with HVAC Pro".
- Pro results are computed by a server function that checks the existing `is_pro` entitlement (cancelled/expired handled as today); the Pro formulas are not used in the browser for non-Pro users, so direct requests cannot bypass it.
- Each calculator page: unique title/description, H1, intro, calculator, formula and variables, example, units, practical HVAC use, common mistakes, related lessons and calculators, and SoftwareApplication + BreadcrumbList (+ HowTo for examples) structured data. Only fully built calculators are listed in the sitemap; coming-soon ones are noindex.

## Phase 6 — Testing
- Unit tests for every calculation function against hand-checked examples.
- Browser checks: header badge (mobile/desktop), homepage fact, shop link, calculator hub search/filter, free tool working signed out, Pro lock for free user, Pro result for Pro user.
- Regression: sign-in, account/billing, AI Tutor, quizzes, admin pages, sitemap, robots, metadata per route.
- Final report lists added routes, functional calculators, data-pending calculators, free vs Pro, and remaining SEO issues.

## Technical details
- New tables: `trade_facts` (RLS: public reads approved only; admin/staff write). Public `live_learner_count()` security-definer RPC returning an integer. Shop URL as a key in `app_settings`.
- Routes: `/shop`, `/calculators`, `/calculators/category/$slug`, `/calculators/$slug`, `/admin/trade-facts`.
- Files: `src/lib/calculators/registry.ts`, `src/lib/calculators/<category>.ts` (pure functions + vitest), `src/lib/calculators.functions.ts` (Pro server compute), `src/components/calculators/*`, `src/components/layout/live-learners.tsx`, homepage section component.
- Heartbeat interval unchanged (45 s); count polled every 60 s and cached, no extra writes.
- Delivered across several turns given the size; each phase verified before the next.
