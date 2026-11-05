<a id="p12"></a>
## Part 12 — AI coding agent operating manual `[CORE]`

### 12.1 Rules file

Paste this into `CLAUDE.md`, `AGENTS.md`, `.cursor/rules` or your Lovable/Bolt project knowledge. Rules are instructions an agent can still skip; in Claude Code, the optional G1 hook from the Bansat repo turns G1 into a hard stop.

```markdown
# Agent rules for {{APP_NAME}}
Source of truth: docs/BLUEPRINT.md. If a request conflicts with it, stop and say so before writing code.

## Always
- Reference blueprint IDs (FR-, API-, SCR-, ADR-) in plans, commits and PRs.
- Validate every input on the server with the shared Zod schemas, and re-check authentication and
  authorisation inside every server entry point (Server Action, route handler, controller, function).
- Implement every applicable UI state from the screen's state matrix (BLUEPRINT 10.7).
- Write or update tests with every change; run typecheck, lint and tests before saying "done".
- Make every schema change a migration; keep data-layer access rules on every table (RLS where the
  database supports it); add isolation tests for new tables.
- Keep secrets server-side. Only NEXT_PUBLIC_* values reach the browser, and they are never secrets.
- Use synthetic data in development, tests and previews.
- On an existing project, work from the gap register (BLUEPRINT 14.4), highest severity first, and keep
  changes scoped: no unrelated refactors.

## Never
- Add a third-party script, font, SDK, pixel, iframe or CDN link without: adding it to the processor
  register (3.6) and cookie register (9.8), loading it through the consent loader, and updating the CSP.
  Fonts are self-hosted with next/font.
- Log, or send to analytics / error tracking / AI providers: passwords, tokens, magic links, email
  addresses, special category data, children's data or payment data.
- Disable RLS or access scoping, security headers, tests, lint rules or type checks to make something work.
- Sign a gate (G1–G4) in docs/BLUEPRINT.md. Only a person approves a gate.
- Add tracking, marketing email or new personal-data fields without updating the RoPA, data dictionary
  and privacy notice.
- Install a package you haven't confirmed exists, is maintained and is the one intended.
- Guess at a bug fix. Follow the debugging protocol (BLUEPRINT 12.3).
```

### 12.2 Feature implementation protocol

1. **Plan:** list the files to change, the actions or endpoints, schema and RLS changes, UI states, tests, privacy impact and blueprint IDs. Wait for approval on anything that isn't trivial.
2. **Build in vertical slices:** schema → server → UI → tests, one small commit each.
3. **Verify:** typecheck, lint, unit, integration and E2E tests; privacy test; axe.
4. **Self-review:** go through the DoD (11.2), the PR template (11.4) and the threat list (7.3) for the changed surface.
5. **Report** using this template:

```text
Done: FR-___  (files: …)
Tests: added … · ran … → all passing (paste summary)
UI states implemented: S1 S2 S3 …   N/A: S__ (reason)
Privacy/security impact: none | new field X (dictionary/RoPA updated) | new vendor Y (register/CSP/consent updated)
Follow-ups / risks: …
```

### 12.3 Systematic debugging protocol

1. **Reproduce:** exact steps, environment, expected vs actual, the full error text, and the first bad commit if known (`git bisect`).
2. **Reflect:** list **5–7 plausible root causes** across the layers: UI state, client cache, network, auth/session, RLS/permissions, server logic, data, third party, configuration/environment.
3. **Distil:** narrow to the **1–2 most likely** causes, with the evidence for and against each.
4. **Instrument & validate:** add targeted logs, breakpoints or assertions that confirm or reject each hypothesis **before changing behaviour**. Debug logs contain no personal data or secrets, and are tagged `[DEBUG-<id>]` for removal.
5. **Fix the root cause:** the smallest change that addresses the confirmed cause. No unrelated refactors. No masking the symptom: no swallowed errors, disabled checks or arbitrary timeouts.
6. **Prove it:** add a **regression test that fails before the fix and passes after**, then run the full suite.
7. **Audit scope:** re-check logic, auth, RLS and roles, database reads and writes, every UI state, responsive layouts, performance and privacy side effects.
8. **Report & clean up:** root cause, evidence, fix, tests and residual risks. Remove the debug logs, and update docs or ADRs if the design changed.

**Stop rule:** after two failed fix attempts, stop, revert to the last good state and go back to step 2 with the new evidence. Never claim "fixed" without the regression test passing.

### 12.4 Prompt library

- **Kick-off:** "Read `docs/BLUEPRINT.md`. Summarise the scope (FR list), risk tier, compliance modules in scope, data classes and state matrix. List every unresolved `{{placeholder}}` and any contradictions. Don't write code yet."
- **Fill the blueprint:** "Here's my idea: … Draft Parts 0–2 of the blueprint. Ask me at most 5 questions, and only where a wrong guess would be costly."
- **Feature:** "Implement FR-0XX following BLUEPRINT 12.2. Start with the plan (files, actions, schema/RLS, UI states S1–S17 that apply, tests, privacy impact) and wait for my approval."
- **Debug:** "Follow the debugging protocol (BLUEPRINT 12.3) for: <symptom>. Do steps 1–4 first and show me the hypotheses and the logs you'll add. Don't change behaviour until a hypothesis is confirmed."
- **Privacy review:** "Act as a privacy reviewer. Using BLUEPRINT Part 9, audit this diff for new personal data, lawful basis, consent gating, third-party requests, logging, retention and impact on rights. Output findings by severity, each with a fix."
- **Pre-launch audit:** "Run the Launch Gate (BLUEPRINT Part 13) against the codebase and the staging URL. For every item, give pass / fail / unknown with evidence (file, test or screenshot). Blockers first."
- **Day-0 triage (live project):** "Run the Day-0 triage (BLUEPRINT 14.2) on this repo and the live URL {{url}}. Report T1–T11 as pass / fail / unknown with evidence, critical failures first. Don't change any code until I approve the fixes."
- **Reverse-engineer (existing project):** "This repo is an existing project. Following BLUEPRINT 14.3, inventory screens, routes and actions, the data model, access rules, third-party services, browser and device requests, cookies and storage, emails, AI calls and background jobs. Draft `docs/BLUEPRINT.md` as-is, and log every difference from the blueprint standard in the gap register (14.4) with a severity. Don't change code."
