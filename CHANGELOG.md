# Changelog

All notable changes to Bansat (بنسټ). Each release is a git tag, and the install command in the README is pinned to one, so the skill's instructions only change when you choose to update.

## v2.3.0 (2026-11-05)

- **Delivery questions (0.4).** Eight questions on team size, number of teams, how settled the requirements are, what's fixed, the contract, any need for formal evidence, the kind of work, and any method already in use.
- **Choosing a method (11.7).** A picker turns those answers into a method in two steps, reading each answer on its own rather than adding up a score: an outer method for approvals when a client, contract, auditor or the organisation needs one, then an inner method for the build, with a default when nothing else fits. It's hybrid by default (the blueprint up front, an iterative build after G1), and the choice goes in an ADR.
- **Method profiles (Appendix E).** Scrum, Kanban, stage gates (the PRINCE2® method and the *PMBOK® Guide*), Shape Up, a solo loop, and scaled methods (LeSS and SAFe®). Each one says when it fits, how it commonly fails, and where every gate (G0–G4) and Bansat document falls. The methods are summarised in Bansat's own words, with links to their official sources: their texts are ShareAlike or all rights reserved, and several names are trademarks.
- **Project-management toolkit (11.8).** RACI, RAID log, stakeholder map, status report, change request, a Mermaid timeline, and forecasting from throughput, each with the way it usually goes wrong.
- **Skill.** For new and existing projects, it asks the delivery questions, loads only the chosen profile(s), and reports the method and the reason in its summary.

**Re-checking an existing blueprint:** update the Framework row to v2.3, answer the delivery questions (0.4), and record your method in an ADR.

## v2.2.0 (2026-11-05)

- **Research first.** Before building anything new, the agent looks at how others have done it (official docs, GitHub repositories and issues, Stack Overflow), notes the problems they hit, and says why it's reusing, adapting or building from scratch. It's in the agent rules (12.1), the feature protocol (new step 0 in 12.2), the debugging protocol (12.3), the ADR template (4.1), the Definition of Ready (11.2) and the skill.
- **New prompts (12.4).** Research first, Logic first and Full audit, which checks logic, authentication, database reads and writes, role-based access, responsive UI and interactive elements, then reports issues by severity and confirms what fully works. The Debug prompt now carries the whole method: 5–7 possible sources, distilled to 1–2, with logs to confirm before any fix.
- **App flow and design brief.** A navigation map (screen → action → next screen, and the state each failure shows) in 10.3, Layout and Actions lines in the screen template (10.4), and a look-and-feel brief before the design tokens (10.5).
- **Diagrams.** An authentication flow based on the OWASP cheat sheets (7.1) and an entity-relationship diagram of the reference schema (5.3).
- **Form states.** The typed UI-state pattern now covers validation (S9) and success (S10) as well (10.7).
- **Where the usual documents live.** How to use maps the PRD, TRD, app flow, UI/UX brief, backend schema and implementation plan to their parts.
- **Modules.** The framework is split into `framework/`, one file per part, and the skill reads only the modules each step needs. `reference/bansat-framework.md` is generated from them, so links and older installs keep working.
- **Tested examples, in CI.** `examples/` runs the framework's code: the Prisma schema and RLS policies on a real Postgres, the consent loader and privacy test in Chromium, and the UI-state types. CI fails if a sample in the framework and its tested copy differ ([issue #1](https://github.com/bewithkhan/bansat/issues/1), point 2).
- **Fixed:**
  - The privacy test's "Reject all" check now records requests from the start, so a leak fired by the click itself fails it (9.9). Copy the new version into your tests.
  - The journey diagram sends returning users straight to their workspace, matching the navigation map (10.1).
  - The authentication notes say when cookies can't be `HttpOnly` (some SSR clients, Supabase's among them, read them in the browser) and that an access token stays valid until it expires after sign-out (7.1).
  - The consent loader is in 9.7, not 9.8 (ADR-004); Part 13 has 16 blocking checks, not 17 (README).
  - The Debug prompt's `<symptom>` placeholder was hidden when GitHub rendered it.

**Re-checking an existing blueprint:** update the Framework row in Document control to v2.2, and add the research rule to your agent rules file (12.1).

## v2.1.0 (2026-11-05)

Changes from the review in [issue #1](https://github.com/bewithkhan/bansat/issues/1). Thanks to @jcc2010.

- **Gates are described honestly.** The README and framework now say the gates are instructions Claude follows, not blocks.
- **New: an optional G1 hook.** `hooks/bansat-g1-guard.mjs` is a Claude Code PreToolUse hook that refuses Claude's code edits until a person signs the G1 row in `docs/BLUEPRINT.md`, and never lets Claude sign it. Its tests run with `node hooks/bansat-g1-guard.test.mjs`. Setup is in the README.
- **Only a person signs a gate.** The skill, the framework's Document control and the agent rules (12.1) say an AI agent never fills in the Gate approvals table.
- **Who checked the law.** The README, framework and skill now say the legal sections were checked against official sources with AI assistance, and that no lawyer has reviewed them yet.
- **Pinned releases.** The install command and the skill's fallback download point to a release tag instead of `main`.
- **Any stack.** The data-access rule now reads "enforce per-user and per-tenant access at the data layer, with RLS where the database supports it" in the skill, the gates, 5.4, 7.2, trap 5 in 9.26, the launch gate, the Day-0 triage and the agent rules. Authorisation is re-checked in every server entry point, not only in Server Actions.
- **Your process wins.** A project's own `CLAUDE.md`, `AGENTS.md` or planning stages take priority, and Bansat fills the gaps.

**Re-checking an existing blueprint:** update the Framework row in Document control to v2.1. If your database has no RLS (MySQL, MariaDB, SQLite), replace "RLS on every table" with the data-layer rule and keep the isolation tests.

## v2.0.0 (2026-11-05)

First public release: the framework (15 parts and 4 appendices), the Agent Skill, citation metadata and licences.
