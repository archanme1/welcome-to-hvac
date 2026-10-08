<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->
- Calculators are defined in `src/lib/calculators/registry.ts` (metadata) with formulas in `compute-free.ts` (runs in browser) and `compute-pro.ts` (only imported by the server function, which checks `is_pro`) — keeps Pro results server-gated and new tools a one-entry addition.
- Live learner count comes from the `live_learner_count()` RPC over the existing presence heartbeat — returns only a number, never visitor details.
- Today's Trade Knowledge is picked in the database (`todays_trade_fact()`, Toronto date) so every visitor sees the same fact all day; AI only creates drafts.
