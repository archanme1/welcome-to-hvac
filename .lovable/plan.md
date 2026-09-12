# Accounts, usernames, password recovery and branding

Work stays inside the existing design and architecture — no redesign.

## 1. Administrator access (server-enforced)

Neither `welcometohvac@gmail.com` nor `archanme1@gmail.com` has an account yet, so they can't be upgraded today. Instead I'll add a private, server-only approved-admin list containing both addresses:

- A new `admin_emails` table that only backend code can read or change (no access at all from the browser).
- The existing "new account" database trigger checks that list and grants the admin role automatically — whether the account is created today or later, and whether they sign up with email/password or Google later on.
- If either account is created by other means, the same rule still applies on first sign-in.

Admin rights continue to live in the separate roles table already used by the app and are checked on the server for every admin action, so nobody can gain them by editing the page, storage, a URL, or a request.

## 2. Hide Google sign-in

Remove the "Continue with Google" button from the sign-in/sign-up screen behind a single on/off switch in the code. The Google configuration stays untouched so it can be switched back on later.

## 3. Usernames at registration

Signup becomes: Username, Email, Password, Confirm password.

Rules (enforced both in the form and in the database, so they can't be bypassed):
- Required, trimmed, 3–24 characters
- Letters, numbers, `_` and `-` only
- Unique regardless of capitalisation
- Clear "That username is taken" message, checked as they type via a lookup that reveals nothing except availability

The username is saved to the profile automatically when the account is created, and shown as the person's name in the account area and the header menu instead of their email.

## 4. Existing accounts

Nothing is deleted and no progress, roles or paid status is touched. The username field is simply added as optional for existing profiles; anyone without one sees a "Choose your username" card in Account and can set it once, with the same rules.

## 5. Forgot password

- "Forgot password?" link on the sign-in form opens an email-entry step.
- Always shows the same confirmation message whether or not the address exists, so no one can probe for accounts.
- Reset email links to a new public `/reset-password` page where a new password is set (with confirmation), then sends them into the app.
- Expired or already-used links show a friendly message with a "Send a new link" action. Loading, success and error states throughout.

## 6 & 7. Email branding — what I can and can't do

The reset/verification email content and sender are controlled by the email provider, not by app code, and a branded sender requires a **real domain that you own and can add DNS records for**. `welcometohvac@gmail.com` is a Gmail mailbox, not a domain, so it cannot be used as the sending identity.

What I'll do now: set the app's public name so links and the site identity read "Welcome to HVAC", and keep all in-app wording branded.

What still needs you (I won't fake it):
- A domain you own (e.g. `welcometohvac.com`). Once it's connected for email, I'll build fully branded reset/verification/welcome emails — "Reset your Welcome to HVAC password", logo, explanation, reset button, security notice and expiry.
- Until then, authentication emails go out from the platform's default sender with default wording.

## 8. Platform branding cleanup

One user-visible mention of the development platform exists (a billing message); I'll reword it. Everything else is internal plumbing users never see.

## Verification

Production build, then a run through: admin grant rules, signup with username, duplicate-username rejection, email/password login, no Google button, forgot-password request, reset page behaviour with a valid and an invalid link, and account page showing the username.

## Technical notes

- Migration: `profiles.username` + unique index on `lower(username)` + format check; `admin_emails` table (no anon/authenticated grants); update `handle_new_user()` to copy `username` from signup metadata and grant `admin` when the email is on the list; `username_available(text)` and `set_my_username(text)` security-definer functions.
- Frontend: `src/routes/auth.tsx` (signup fields, forgot-password step, Google flag), new `src/routes/reset-password.tsx`, `src/routes/account.tsx` and `src/components/layout/app-shell.tsx` (username display), `src/hooks/use-auth.tsx` (expose profile username).
