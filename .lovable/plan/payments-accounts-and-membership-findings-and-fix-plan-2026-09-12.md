# Payments, accounts and membership — findings and fix plan

## How it works today

- **Catalog**: one product, HVAC Pro, with two prices ($5/month, $50/year) held at the payment provider and looked up by name in code.
- **Sign up / sign in**: email + password, username required, admin rights granted server-side from a private allow-list.
- **Checkout**: signed-in members pay inside the pricing page; the provider then notifies the app and a membership row is written.
- **Access**: practice, quizzes, scenarios and the AI Tutor are locked in the database itself, so a member cannot unlock them by editing anything in the browser. This part is solid.
- **Billing management**: a "Manage billing" button opens the provider's hosted billing page.

## Problems found

1. **A returning subscriber cannot re-subscribe.** The database allows only one membership record per person, ever. Someone who cancels and later pays again is charged but never gets access back. This is the most serious issue.
2. **Access does not switch on after payment.** The thank-you page refreshes data, but membership status is only read at sign-in, so the member sees "still locked" until they reload the whole site.
3. **No safety net if the provider notification is missed.** If that one message fails, the payment succeeds and the member stays locked with no way to recover.
4. **Cancelling ends access immediately.** You asked for access to run to the end of the paid period; today access drops as soon as the record flips to cancelled.
5. **A failed renewal cuts access instantly.** You asked for a grace period while the card is retried.
6. **No free trial.** You want 7 days.
7. **The account page shows almost nothing.** No plan, no renewal date, no "cancels on ...", no trial end.
8. **Double-charge risk.** Nothing server-side stops an existing member from buying a second time.
9. **Manual memberships you grant from the admin area fail** for anyone who already has a record, because of problem 1.

## What I will change

**Database**
- Remove the one-record-per-person limit; keep the safeguard that stops duplicate provider records.
- Rewrite the access rule: active, trialing, cancelled-but-paid-through, and payment-retrying all keep access until the paid period ends.

**Checkout and billing**
- Add the 7-day free trial to both plans.
- Refuse a second checkout for someone who already has an active membership.
- Add a "re-check my membership" action that asks the provider directly and repairs the record — used automatically on the thank-you page and available on the account page.
- Handle renewal and payment events so period dates stay current.

**App experience**
- Membership status read from the single database rule, refreshable on demand.
- Thank-you page waits and re-checks for a few seconds, then confirms unlocked.
- Account page shows plan, price interval, trial end, renewal date, and a clear "access ends on ..." notice after cancelling.
- Admin manual grants update an existing record instead of failing.

**Out of scope**: in-app plan switching (you chose the hosted billing page) and any redesign.

## How to test in the preview

Open the preview in its own browser tab (the billing page cannot open inside the editor).

1. Sign up a fresh account, confirm practice and the AI Tutor are locked.
2. Go to Pricing, pick monthly, pay with test card `4242 4242 4242 4242`, any future expiry, any CVC, any postcode.
3. You land on the thank-you page; within a few seconds it should say HVAC Pro is active. Open a topic and confirm practice and the Tutor are unlocked.
4. Account page: check it shows the trial end and next renewal.
5. Click Manage billing, cancel the plan. Back in the app, the account page should say access continues to the period end, and practice should still work.
6. Re-subscribe from Pricing with the same account — this is the case that is broken today and must now succeed.
7. Declined card check: `4000 0000 0000 0002` should fail cleanly with a readable message and no membership granted.
8. Admin area: grant and remove a manual membership on a test account and confirm access follows.

No real money moves in the preview; everything is in test mode.
