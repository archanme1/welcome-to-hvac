# Trades Marketplace — Implementation Plan

Adds a public Marketplace to the existing site. Nothing else is redesigned; billing, checkout, auth, AI Tutor, practice and existing routes stay as they are.

## What users get
- **Sidebar:** new collapsible "Marketplace" group (Explore, Post a Listing, My Listings, Messages), visible to everyone.
- **Explore (`/marketplace`)** — public: search (title, brand, model, description), category, price range, condition, listing type, country / region / city filters, sorting, paged results. Cards show photo, title, price + currency, condition, category, city/region, posted date, seller star average.
- **Listing page (`/marketplace/listing/<slug>`)** — public: gallery, details, general location, seller display name + rating, Contact Seller, related listings, disclaimer, Report Listing.
- **Category pages (`/marketplace/c/<slug>`)** — public, indexed only when they hold listings.
- **Post / Edit (`/marketplace/new`, edit)** — Pro only: all required/optional fields from the brief, up to 8 photos, CAD default for Canada, currency by country.
- **My Listings** — Pro only: Active / Sold / Unavailable / Draft tabs; edit, delete (confirm), mark sold/unavailable, reactivate.
- **Messages** — Pro only: one private thread per buyer + listing; seller replies; unread counts; rate limits against spam.
- **Ratings** — 1–5 stars only, no text. A buyer can rate a seller once per listing they had a conversation about (in which the seller replied); they may change it later. Sellers can't rate themselves.
- **Free users / signed-out** see the exact upgrade message from the brief with a link to Pricing.
- **Homepage:** small "The Trades Marketplace" section with Browse Marketplace / Become a Pro Seller.
- **Admin (`/admin/marketplace`):** manage categories, review reports, hide/remove listings.
- **Location:** built-in list of all countries (searchable dropdown), regions for Canada, US, Australia, UK, India, Mexico (manual text elsewhere), city as text. No maps, GPS or external services. Preferred country remembered in the profile (signed in) or browser (signed out).
- **Safety:** disclaimer on marketplace and listing pages; prohibited-items note (stolen goods, regulated refrigerants without required certification, etc.); reports; image type/size limits (JPG/PNG/WebP, 5 MB).

## SEO
Unique title/description/canonical/OG per listing, one H1, breadcrumbs, Product JSON-LD with Offer for priced For Sale listings, alt text from title. Sitemap includes active listings and non-empty categories; drafts, sold, removed and hidden listings are excluded and noindexed. Private pages (post, my listings, messages) are noindex.

## Technical details
- New tables: `marketplace_categories` (parent/child, admin-managed, seeded with the brief's categories without duplicates), `marketplace_listings` (status draft/active/sold/unavailable/removed, search vector, indexes on status/category/country/region/price/created), `marketplace_listing_images`, `marketplace_conversations`, `marketplace_messages`, `marketplace_ratings` (unique buyer+listing), `marketplace_reports`. One added nullable column: `profiles.marketplace_country`.
- RLS: anyone reads active listings/images/categories; owner reads own listings in any status; insert/update require `auth.uid() = seller_id AND is_pro(auth.uid())`; conversations/messages readable only by the two participants and writable only by Pro participants; ratings gated by a security-definer check. Staff moderate via `is_staff`.
- Public seller data exposed through a view/RPC returning only display name/username + rating stats — never email.
- Photos in a new public `marketplace` storage bucket, path `<user_id>/...`, write policies owner + Pro only.
- Server functions for writes reuse `requireSupabaseAuth` and `is_pro`; public reads via the publishable client for SSR.
- Tests: rating eligibility, currency default, filter query building.
- No payments, checkout or fees added. No sample listings in production.

## Delivery
Built in stages: database + public browse/detail, then Pro posting/management, messaging, ratings, then homepage, admin moderation, SEO, and permission/mobile checks. I'll report what was verified at the end.
