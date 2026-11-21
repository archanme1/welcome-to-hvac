# WelcomeToHVAC.com technical SEO audit

Date: 2026-11-21
Canonical origin: https://www.welcometohvac.com

## Scope and preservation

This audit and correction pass covers the existing public website. No educational lessons, quizzes, calculators, marketplace content, application workflows, or page layouts were replaced. Authentication, subscriptions, billing, AI Tutor, and private account functionality were not changed.

## 1. Public page inventory and metadata

Audited the homepage, Start Here, six documentation indexes, 76 educational topic pages, documentation categories, symptoms, learning paths, diagnostics, Practice, HVAC Pro pricing, calculators and calculator categories, Shop, Marketplace, and public AI Tutor information.

Corrections implemented:

- Reused one metadata helper for titles, descriptions, self-referencing canonicals, Open Graph, and Twitter tags.
- Added content-derived CollectionPage, ItemList, and BreadcrumbList structured data to documentation, symptom, and learning-path indexes.
- Added visible Home breadcrumbs to documentation indexes and categories.
- Gave documentation categories distinct titles such as `Equipment — HVAC Guides & Reference | Welcome to HVAC`, removing duplicate titles with `/equipment` and `/components`.
- Kept title and description text based on existing page content rather than invented claims.
- Added `og:site_name` for Welcome to HVAC.

## 2. Heading and content checks

The automated crawl checks that every sitemap page has exactly one H1. Existing topic pages retain their H1 and section H2 structure. Index and category changes add breadcrumbs without replacing the visible H1 or body content.

No unsupported claims, prices, code requirements, refrigerant data, ratings, or educational copy were added.

## 3. Canonicals and duplicate/filtered URLs

- Indexable pages use absolute, self-referencing canonicals on `https://www.welcometohvac.com`.
- Marketplace filtered/search URLs retain `noindex, follow`.
- Search results retain `noindex, follow`.
- Unavailable topic, symptom, learning-path, and diagnostic records now return noindex metadata rather than indexable unavailable-page metadata.
- Sitemap URL generation deduplicates entries and XML-escapes URLs.

## 4. Structured data

- Educational topics: TechArticle plus BreadcrumbList.
- Documentation/category collections: CollectionPage, ItemList where actual topics exist, and BreadcrumbList.
- Symptoms and diagnostics: WebPage plus BreadcrumbList.
- Learning paths: existing Course schema retained.
- Marketplace listings: existing Product/Offer schema retained, using real listing price, currency, condition, and availability.
- Calculators: free working tools use SoftwareApplication with a $0 offer; Pro tools no longer use a fabricated $5 one-time offer. Checklists use WebPage. Pending tools omit SoftwareApplication schema.
- Site-wide Organization and WebSite schema remains in the root document.

The crawler successfully parsed every JSON-LD block in the updated sitemap audit. External Google Rich Results Test rendering was not available through an API in this pass.

## 5. Crawlable HTML and robots.txt

Public content is server-rendered and readable without signing in. The updated crawler found no missing sitemap-page H1, title, description, canonical, Open Graph, Twitter, or JSON-LD requirements, apart from the development-only `/components` filename conflict described under verification limits.

`public/robots.txt` retains the existing Googlebot, Bingbot, social bot, and wildcard groups. Every group now excludes account, admin, authentication, checkout, private marketplace management/messages, API, and internal webhook paths. The sitemap remains:

`https://www.welcometohvac.com/sitemap.xml`

Robots rules are crawl controls, not a substitute for noindex or access control.

## 6. Sitemap

The updated preview sitemap contains 230 unique canonical URLs. It includes:

- Public static pages.
- Published educational content, categories, symptoms, learning paths, and diagnostics.
- Indexable calculator categories and working tools/checklists only.
- Active Marketplace categories and active listings.

It excludes unfinished calculators, Expert Help/Coming Soon, empty categories, private pages, and filtered URLs. Database-backed sitemap reads now paginate, surface query errors, and avoid a fixed Marketplace result cap.

## 7. Internal links and image text

The original live crawl found 14 outdated diagram destinations returning 404. Those links now point to relevant existing published topics, including refrigeration-cycle, metering-device, thermostat, ignition, airflow, boiler, circulator-pump, and HRV/ERV pages.

The updated preview crawl found no broken internal links across the sitemap pages. Existing topic, category, symptom, diagnostic, practice, related-topic, and calculator links remain intact. All images in the crawl had non-empty alt text. Marketplace card images now use asynchronous decoding; existing lazy loading remains.

## 8. Marketplace SEO

- Active listing/category pages remain indexable; expired, draft, removed, and private management pages remain excluded.
- Public listing/category sitemap reads are fully paginated and propagate errors.
- Active-listing photos remain server-signed because storage is private.
- Social sharing now requests a 1200×630 transformed image when a listing has a photo, with matching og:image/twitter:image and dimensions/alt text.
- No active public listings were available during this pass, so a real listing share-image response was not verified end to end.

## 9. Private-page indexing

Verified noindex on authentication, account, admin, checkout return, and marketplace messages. Search and filtered Marketplace URLs use `noindex, follow`. Expert Help and all six pending reference calculators use noindex and are absent from the sitemap.

No private analytics, billing, AI Tutor conversation, account, or administration data was added to public metadata or structured data.

## 10. Page speed and Core Web Vitals

The audit uses server-rendered HTML, existing lazy/async image behavior, and lightweight metadata changes. The 230-page preview crawl found no missing images' alt text or broken internal links.

Field Core Web Vitals were not available in this pass. Search Console/CrUX field data must be reviewed after sufficient real-user data exists; this audit does not claim a CWV pass. No performance budget or ranking guarantee is implied.

## 11. Search Console and Bing readiness

- Google Search Console account connection was authorized.
- The exact Google META verification tag was added to the root document head.
- Publishing was requested. Live tag verification, property verification/addition, and sitemap submission remain pending until the deployed root HTML contains the exact tag.
- No verified Search Console property was present when the account was first listed.
- Bing Webmaster Tools verification is not confirmed. Owner action: verify `https://www.welcometohvac.com` in Bing Webmaster Tools and submit `https://www.welcometohvac.com/sitemap.xml` if Bing has not imported the site from Search Console.

## 12. Canadian keyword opportunities

Semrush Canadian-database estimates, retrieved 2026-11-21. These are third-party estimates, not guaranteed traffic or rankings.

| Existing opportunity | Estimated Canadian volume | Estimated difficulty | Recommended page |
|---|---:|---:|---|
| cycle of refrigerant | 880/month | Not separately assessed | Support the existing refrigeration-cycle page naturally; do not create a duplicate page |
| refrigeration cycle | 720/month | 33/100 | `/concepts/refrigeration-cycle` |
| superheat | 480/month | Not separately assessed | Existing superheat/subcooling topic and calculator |
| furnace troubleshooting | 480/month | 18/100 | Existing furnace troubleshooting/symptom content |
| superheat calculator | 140/month | Not separately assessed | Existing superheat calculator |
| HVAC training Ontario | 110/month | 41/100 | Existing Start Here and learning-path content |
| HVAC certification Ontario | 110/month | 35/100 | Future owner-reviewed opportunity only; no certification guide was created in this pass |
| superheat and subcooling | 90/month | 16/100 | `/concepts/superheat-and-subcooling` |
| gas furnace sequence of operation | 20/month | 0/100 | `/concepts/gas-furnace-sequence-of-operation` |

The certification-guide suggestion remains outside this implementation because the requested scope prohibits generating new educational content.

## 13. Verification performed and limits

- All 18 tests pass across four files, including three focused SEO tests and the existing navigation/calculator/marketplace suites.
- Latest preview build reports `build OK`.
- Updated sitemap: 230 URLs, no duplicates, no non-200 sitemap destinations, no canonical mismatches, no duplicate titles/descriptions, no broken internal links, no invalid JSON-LD, no missing image alt text, and no noindex URLs in the sitemap.
- Heading-level audit found no hierarchy jumps across 229 checkable preview pages.
- Desktop homepage/topic and phone category rendering checked in Chromium; settled pages rendered with no console errors or failed requests.
- Development-only limitation: `/components` can be intercepted by Vite as the root `components.json` configuration file. The published production route works; no application file was renamed to work around a development-server-only conflict.
- Marketplace had no active public listings for an end-to-end listing/social-image browser check.
- Live Search Console completion and the post-publish full crawl are pending deployment propagation at the time of this draft.
