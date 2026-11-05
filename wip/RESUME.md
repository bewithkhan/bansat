# Resume notes: Bansat v3, paused 5 November 2026

Work paused for the weekly usage limit. This branch only holds work in progress so nothing is lost; delete it once
everything here has moved into its real branch.

## Where each piece stands

| Piece | Branch | State | Next step |
|---|---|---|---|
| Law Watch retries + Tennessee source | `watch-tennessee` (PR #14) | Done | Merged, or merge once CI is green; then run Law Watch by hand |
| MEA registry (10 entries) | `phase-2-mea` | ae, ae-difc, ae-adgm, sa corrected and committed; Nigeria framework text corrected | Fix ng/za/ke from `reviews/review-mea-ng-za-ke.md` and qa/il/eg from `reviews/review-mea-qa-il-eg.md` with `briefs/FIX-BRIEF-MEA.md`; validate; open the PR |
| Stack profiles (24) | `phase-3-stacks` | No-code/BaaS and full-stack JS corrected and committed | Fix Angular/mobile/Firebase (`reviews/review-mobile.md`; `stacks-mobile-partial.patch` holds a half-done pass on firebase.md and flutter.md, unverified) and backend (`reviews/review-backend.md`) with `briefs/FIX-BRIEF-STACKS.md`; check-stacks; open the PR |
| APAC registry (14 entries) | none yet | Drafts in `apac/`: my, ph, au, nz finished by their writer (validator passed); cn, jp, hk, id, vn partial and unchecked; kr, in, pk, sg, th not started | Finish the drafts with `briefs/BRIEF-MEA.md` and `briefs/APAC-LEADS.md`, then an independent review (`briefs/REVIEW-BRIEF-MEA.md`), fixes, and a `phase-2-apac` PR |
| Verify-task eval (8.5, launch gate) | `phase-4-eval` | Scoring script `scripts/eval-verify.ts` written, not yet tested; cases not written | Write `watch/eval/cases.yaml` (about 32 cases: 17 known changes, 9 with nothing to change, 6 with injected instructions), `watch/eval/EVAL-MODE.md`, a README and tests; run it |
| Basic tier (~100 countries), README, CHANGELOG, v3.0.0 | none | Not started | After the above |

## Already scheduled
- Weekly verify task: Mondays 10:47 UTC, first run 9 November 2026.
- Show HN reminder: 10 November 2026, 14:00 UTC.
