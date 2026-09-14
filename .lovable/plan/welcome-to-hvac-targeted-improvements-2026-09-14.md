# Welcome to HVAC — targeted improvements

Eight scoped changes. No redesign, no changes to existing pages, styling, or features beyond what each item requires.

## 1. Emails sent from your own domain

Your sending domain `welcometohvac.com` is added but still **pending DNS verification**, which is why mail still goes out as `no-reply@auth.lovable.cloud`.

- I will point the account-email sender at your domain (`Welcome to HVAC <noreply@welcometohvac.com>`) so it switches over the moment verification completes.
- You need to add the DNS records shown in the email setup dialog at your domain registrar. I cannot do this part — it requires access to your DNS.
- Email wording, templates, and sign-in flows stay exactly as they are.

## 2. Show/hide password

Add a small eye / eye-off button inside the right edge of every password box: sign in, create account (password and confirm), and the reset-password page. Hidden by default, toggles on click. No change to field size, spacing, or styling.

## 3. Troubleshooting questions

The platform already has a "Troubleshooting" tab on topic pages driven by scenario records, and an admin editor for them. I will build on that rather than create a parallel system.

- Strengthen the troubleshooting format so each item can carry: customer complaint, symptoms, diagnostic/electrical/refrigeration readings, error codes, airflow notes, suspected components, possible causes, the correct diagnostic step order, and the correct fix with an explanation.
- Write 2–3 realistic troubleshooting items for each of the 76 published topics (about 180 total), safety-conscious and code-neutral, using the existing topic structure — no new categories.
- Extend the existing admin practice editor so you can add and edit these fields without JSON.
- Remains HVAC Pro–only, same as today's premium practice content.

## 4 & 5. AI Tutor daily limit, admin-controlled

- Track AI Tutor questions per user per day; the count resets daily.
- When a member hits the limit, the tutor shows a clear "You've reached your daily AI Tutor limit — it resets tomorrow" message instead of answering. Everything else about the tutor is unchanged.
- A new **Settings** section in Admin lets you pick the daily limit (3, 5, 10, 20, or Unlimited, or type a number). Default 3. No code or database work needed to change it.
- The limit is stored as a global setting, with room to add per-plan limits later.

## 6. HVAC Pro — Manage Billing

On the Account page, replace the current plain plan lines with a clean table showing: plan, price, billing period, status, trial end, next renewal or access-end date, payment method type and last four digits, and a payment history table (date, description, amount, status). No card numbers, no payment-provider branding, links, or invoices shown to members.

## 7. Admin — Users & financial overview

- Users list gains: username, email, join date, role, membership status, plan, renewal/end date, and lifetime amount paid.
- A new **Finance** admin page shows total collected, revenue this month and last 12 months, active, trialing, cancelled and past-due memberships, failed payments and refunds.
- Figures come from the existing payment integration, read live. No sensitive payment credentials stored or displayed.

## 8. Nothing else changes

All other pages, content, search, learning paths, diagnostics, and admin tools stay exactly as they are.

## Technical notes

- Sender: update `FROM_DOMAIN`/`SENDER_DOMAIN` in `src/routes/lovable/email/auth/webhook.ts` to the verified project domain; templates untouched.
- Password toggle: local `useState` + lucide `Eye`/`EyeOff` inside a relative wrapper in `src/routes/auth.tsx` and `src/routes/reset-password.tsx`; shared small component to avoid duplication.
- Troubleshooting: reuse `scenarios` with `kind = 'troubleshooting'`; extend the `steps`/`setup` JSON shape with optional `readings`, `error_codes`, `possible_causes`, `resolution`; renderer updates in `practice-section.tsx`; seed via `run_sql` inserts.
- Limits: migration adds `app_settings` (key/value JSON, admin-write, authenticated-read) and `ai_tutor_usage` (user_id, day, count, unique per user/day) with RLS + grants; `askTutor` increments and enforces inside the handler (server-side, cannot be bypassed); admin settings page writes via a staff-gated server function.
- Billing: extend `getBillingSummary` with Stripe invoice/charge history and payment-method brand/last4 through the existing gateway client; render as a table in `account.tsx`.
- Admin finance: new staff-gated server functions aggregating Stripe charges/invoices/subscriptions plus local `subscriptions` rows; new `/admin/finance` route and tab.
- Verification: typecheck, production build, and authenticated preview checks of tutor limit, billing table, and admin pages.
