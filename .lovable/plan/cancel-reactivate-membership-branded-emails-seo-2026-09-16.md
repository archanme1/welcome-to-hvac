# Cancel & reactivate membership, branded emails, SEO

Three changes only. No redesign, no changes to the AI Tutor, quizzes, auth flow or pricing.

## 1. Cancel and reactivate HVAC Pro from My Account

- Add a **Cancel membership** button in the existing Plan card on the account page (no layout change — it joins the existing button row).
- Cancelling sets the membership to end at the end of the period the member already paid for. Nothing is deleted: the account, progress and history stay exactly as they are, and Pro features keep working until the access date.
- Status line updates immediately to "Cancels on {date}" and the table keeps showing the access-end date.
- While a cancelled membership is still inside its paid period, a **Resume membership** button turns it back on with no new charge.
- After the paid period has ended, the member simply subscribes again from the pricing page. That repeat purchase gets **no 7-day free trial** — the trial is already limited to first-time subscribers, which covers this.
- Work is done through the existing payment provider on the server (two new authenticated server functions: cancel-at-period-end and resume), then the local record is refreshed the same way the existing re-check does.

## 2. Verification emails from the Welcome to HVAC domain

- The sending domain `welcometohvac.com` (delegated through `notify.welcometohvac.com`) is verified, and the branded templates already exist and are addressed from that domain.
- What is missing is the switch that tells the account system to hand its emails to this app instead of sending them itself — that is why new-user verification mail still arrives from the platform address.
- Turn that switch on for this project and re-check that signup, reset, magic link and email-change all route to the branded templates. No change to email content, design, or the verification flow.

## 3. SEO

Content and design stay as they are; this is metadata, structure and discoverability.

- **Sitemap**: add `/sitemap.xml` generated from the router plus published topics, symptoms, categories, learning paths and diagnostics pulled from the database with public access only. Reference it from `robots.txt`.
- **Canonical + og:url** on every public page, self-referencing, on leaf routes only. Admin, account, checkout and auth pages stay `noindex`.
- **Titles and descriptions**: unique, under the length limits, written from the real topic (no keyword stuffing). Topic, symptom, category, path, tool, procedure and troubleshooting pages derive theirs from the record's own title and summary.
- **Structured data**: Organization + WebSite (with search action) sitewide; Article on topic pages; BreadcrumbList on nested pages; Course on learning paths; ItemList on index pages.
- **Headings**: one H1 per page, section headings demoted to H2/H3 where an index page currently uses a small-caps label as its only heading.
- **Internal linking / topic clusters**: category and type index pages get short intro copy and cross-links between related clusters; topic pages already link related topics, symptoms, diagnostics and the next topic — these get descriptive link text.
- **Images**: alt text on the logo and diagram images; diagrams get a caption-derived description.
- **Open Graph / Twitter**: per-page title and description; share image only where a real absolute image exists.
- **Search Console readiness**: robots and sitemap correct and reachable. Connecting the Google account and submitting the sitemap is a separate step I can run once you ask.

## Technical notes

- Payment changes: `src/lib/payments.functions.ts` (new `cancelMySubscription` / `resumeMySubscription` server functions using the existing provider client and auth middleware), `src/routes/account.tsx` (buttons + status), webhook already handles `customer.subscription.updated`.
- Email: project email toggle + verification of the existing `/lovable/email/auth/webhook` route; no template edits.
- SEO: new `src/routes/sitemap[.]xml.tsx` + `src/lib/sitemap.ts`, `public/robots.txt`, `head()` additions across public routes, JSON-LD in route `scripts`.
- Head and sitemap changes reach the live site on the next publish.
