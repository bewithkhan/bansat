<a id="p11"></a>
## Part 11 — Delivery plan, quality & operations `[CORE]`

### 11.1 Phased implementation plan

Each phase ends with exit criteria. Don't start the next phase until they're met.

**Phase 0 — Blueprint & compliance foundations** (no production code)
- 0.1 Complete Parts 0–10 for everything in scope, and run the DPIA screening.
- 0.2 Draft the RoPA (9.3), choose vendors, sign their DPAs and fill the register (3.6).
- 0.3 Decide the age position (9.12). Draft the privacy and cookie notices from the RoPA.
- 0.4 Write the threat model (7.3) and accept the ADRs.
- **Exit → G1.**

**Phase 1 — Project initialisation & guardrails**
- 1.1 Create the repo: Next.js + TypeScript strict + Tailwind + ESLint/Prettier, using the folder structure in 3.5.
- 1.2 CI pipeline: typecheck → lint → unit tests → build → secret scan → dependency audit → Playwright smoke → **privacy test (9.9)** → axe on key pages.
- 1.3 Security headers and CSP (report-only first); fonts through `next/font`; error monitoring with PII scrubbing.
- 1.4 Separate Supabase projects per environment, with synthetic seed data (3.2).
- **Exit:** green pipeline on the empty app; zero third-party requests; CSP report clean.

**Phase 2 — Data layer, auth & privacy plumbing**
- 2.1 Prisma schema and migrations (5.3). RLS policies plus **tenant-isolation tests** (5.4).
- 2.2 Auth (Google OAuth + magic link), protected layouts, silent refresh, and states S7/S8.
- 2.3 Sign-up with the age check and consent capture (`consent_records`). Terms acceptance is recorded separately.
- 2.4 `assertCan()` data-access layer, the permission-matrix test (7.2) and the audit log.
- **Exit → G2 in staging:** privacy notice live, consents recorded, RLS and permission tests green.

**Phase 3 — Core features with full state coverage**
- 3.1 Server Actions for task CRUD, with Zod validation, authorisation and optimistic updates (S9, S10).
- 3.2 Board UI with S1–S6, S11 and S15, plus the keyboard and "Move to…" alternative to dragging (2.5.7).
- 3.3 Task detail and real-time comments with sanitised Markdown and conflict handling (S12).
- **Exit:** state matrix complete for these screens; E2E tests green.

**Phase 4 — Privacy centre, consent & communications**
- 4.1 Cookie banner, cookie settings, consent-gated loader and the published cookie register (9.8).
- 4.2 Privacy centre: download my data, delete account (30-day grace), consents, marketing preferences, complaint form.
- 4.3 Email:
  - transactional templates;
  - a marketing stream with one-click unsubscribe headers and the suppression list;
  - double opt-in where needed (9.11).
- 4.4 Admin rights-request queue with due dates and templates (9.15–9.16).
- **Exit:** export, deletion and unsubscribe E2E tests pass; email headers verified in a seed inbox.

**Phase 5 — AI features** `[IF: AI]`
- 5.1 Provider integration under ADR-006: DPA, region and no training confirmed; redaction in place.
- 5.2 Structured outputs validated with Zod; S14 with Cancel; AI labels; S13 for quotas.
- 5.3 Eval suite in CI, spend caps and alerts, and a feature flag (S15).
- **Exit:** evals at or above thresholds; a spend-alert test fired.

**Phase 6 — Hardening & QA**
- 6.1 Accessibility audit: axe, keyboard-only, VoiceOver/NVDA (10.6).
- 6.2 Performance budgets in Lighthouse CI (NFR-PERF); load test of critical paths.
- 6.3 DAST (ZAP baseline), dependency review, secret-rotation check, and a pen test for the High tier.
- 6.4 Backup restore drill and a breach tabletop exercise.
- **Exit:** no open critical or high issues.

**Phase 7 — Launch**
- 7.1 Every item in the **Launch gate (Part 13)** is green. Regulator admin done: ICO fee, NDPC if you're a DCPMI, EU representative if needed.
- 7.2 Deploy to production behind feature flags. Dashboards, alerts and the status page go live.
- **Exit → G3.**

**Phase 8 — First 30 days**
- 8.1 Daily review of errors, performance, AI cost and feedback. Triage weekly.
- 8.2 Hold the G4 review and start the compliance calendar (9.24).

### 11.2 Definition of Ready & Definition of Done

**Ready (per story):**
- [ ] The story has an `FR` ID and acceptance criteria (1.6).
- [ ] Applicable UI states are listed.
- [ ] Data fields are mapped in the dictionary (5.2).
- [ ] The API is defined (6.2).
- [ ] Privacy impact is noted: new data? new vendor? consent needed?
- [ ] The design exists, if there's UI.
- [ ] The test approach is agreed.

**Done (per story):**
- [ ] Code + tests pass in CI.
- [ ] **All applicable UI states** are implemented and tested.
- [ ] Input is validated on the server, and authorisation is enforced and tested.
- [ ] No personal data in logs.
- [ ] **No new third-party requests**, or the service is registered (3.6), consent-gated and allowed in the CSP.
- [ ] axe is clean and the keyboard path works.
- [ ] Docs are updated: blueprint IDs; an ADR if you deviated; the RoPA, data dictionary, cookie register and privacy notice if data changed.
- [ ] Self-review checklist done (12.2), smoke-tested in preview, behind a flag if risky.

### 11.3 Testing strategy

| Level | Tool | Covers | Runs |
|---|---|---|---|
| Static | TypeScript strict, ESLint (+ `jsx-a11y`), Prettier | Types, lint, accessibility lint | Every commit |
| Unit | Vitest | Domain logic, Zod schemas, `assertCan()`, the permission matrix | Every PR |
| Integration | Vitest + local Supabase (Docker) | Server Actions, **RLS as anon / member / other tenant** (5.4), migrations | Every PR |
| End-to-end | Playwright | Critical journeys: sign-up with age check, consent banner, export and delete, invite, standup. **State coverage:** offline with `context.setOffline(true)`, slow with a delayed `page.route`, 401/403/429/500 mocks. | Smoke per PR, full nightly |
| Privacy | Playwright | No third-party requests before consent or after rejection (9.9); consent enforced; email headers | Every PR |
| Accessibility | @axe-core/playwright + manual | WCAG 2.2 AA (10.6) | PR (automated), each release (manual) |
| Performance | Lighthouse CI, k6 | NFR-PERF budgets, load | PR (Lighthouse), before launch (k6) |
| Security | gitleaks, `npm audit`/Renovate, CodeQL or Semgrep, OWASP ZAP | 7.4 | PR; ZAP before launch |
| AI evals | Custom runner | 8.5 | When the prompt or model changes |

- **Test data:** synthetic only, with fixtures per role and two tenants.
- **Coverage target:** ≥ {{80%}} on domain logic. Coverage is a signal, not the goal.

### 11.4 CI/CD & release management

- **Branching:** trunk-based, short-lived branches; PRs are small and reference blueprint IDs.
- **Preview deployments** use synthetic data and are behind deployment protection.
- **Migrations:** `prisma migrate deploy` runs in the release step. Changes are backwards-compatible, using expand → migrate → contract (5.5).
- **Feature flags** for risky features. Releases use semantic versioning with a changelog.
- **Rollback:** redeploy the previous build and fix the database forwards. Practise it once before launch.

**PR template** (`.github/pull_request_template.md`):

```markdown
## What & why
FR/ADR/SCR IDs:

## Checklist
- [ ] UI states covered (list): 
- [ ] Server-side validation + authorisation re-checked in every action/route touched
- [ ] Tests added/updated and passing (unit / integration / e2e)
- [ ] No new third-party requests, or: registered (3.6), consent-gated, CSP updated
- [ ] No personal data in logs, analytics, error events or AI prompts
- [ ] Data changes reflected in data dictionary / RoPA / privacy notice / cookie register
- [ ] Accessibility: keyboard path + axe clean
```

### 11.5 Observability & operations

- **SLOs:** availability {{99.5%}}; p95 latency (NFR-PERF-02); error rate < {{1%}}. Alert on burn rate, not on single errors.
- **Signals:** structured logs with correlation IDs, error monitoring, uptime checks on the key routes and API, cost dashboards (infrastructure and AI).
- **On-call:** even if you're solo, route alerts to your phone and keep a phone-friendly runbook.
- **Runbooks** (`docs/runbooks/`):
  - deploy and rollback;
  - rotate keys;
  - restore the database (5.7);
  - AI provider outage (turn the flag off);
  - email deliverability problem;
  - breach response (9.20).
- **Status page** for customer-facing incidents.

### 11.6 Incident response

| Severity | Example | Respond within | Communicate |
|---|---|---|---|
| SEV1 | Outage, data breach, security incident | 15 min | Status page; customers; regulators if it's a breach (9.20) |
| SEV2 | Core feature broken for many users | 1 h | Status page |
| SEV3 | Minor bug, workaround exists | Next working day | Changelog |

Run a blameless post-incident review within 5 working days (Appendix A7), and track its actions to completion.
