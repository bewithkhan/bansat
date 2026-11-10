# Bansat (بنسټ): Master Project Framework

*Bansat* is Pashto for **foundation**: lay it before you build.

**Product · Architecture · Design · Security · Privacy & Compliance · Delivery**

Created by **Muhammad Tufail Khan** ([github.com/bewithkhan](https://github.com/bewithkhan)) · Framework version **3.0** · Legal position checked **4 November 2026** against official sources, with AI assistance (not yet reviewed by a lawyer) · Supersedes *Comprehensive App Development Framework & Master Blueprint* (v1)

> **Cite as:** Khan, M. T. (2026). *Bansat (بنسټ): A blueprint-first framework for building software* (Version 3.0). https://github.com/bewithkhan/bansat
> Text and templates: **CC BY 4.0**. Code samples: **MIT**. Keep this credit when you copy, adapt or share the framework.

This is the single source of truth for **every project, new or existing**. For a new project, complete it **before any code is generated**. For an existing or live project, use the **retrofit track (Part 14)**: reverse-engineer the blueprint from what's built, triage the live risks first, then close the gaps. Either way, it turns your product into decisions that an AI coding agent (Claude, Cursor, Lovable, Bolt, Copilot) can build from without guessing. Privacy and security are built in from the first commit rather than bolted on after launch: UK GDPR, PECR, EU GDPR, Nigeria's NDPA 2023 and GAID 2025, and the EU AI Act.

> **Not legal advice.** This framework summarises the law and regulator guidance as at the date above. Its legal sections were checked against the official sources in Appendix B with AI assistance, and no lawyer has reviewed them yet. Laws change; the EU's Digital Omnibus, for example, is still being negotiated. For high-risk processing (health, children, biometrics, worker monitoring, large-scale tracking), get a qualified review before launch.

---

## Document control

| Field | Value |
|---|---|
| Project | {{APP_NAME}} |
| Blueprint version | {{0.1}} |
| Status | Draft · In review · Approved for build · Superseded |
| Accountable owner | {{NAME, ROLE}} |
| Data controller (legal entity) | {{LEGAL NAME, COMPANY NO., REGISTERED ADDRESS}}. A sole trader is personally the controller. |
| Privacy contact / DPO | {{NAME, privacy@DOMAIN}} |
| Repository | {{URL}} |
| Last updated · Next review | {{YYYY-MM-DD}} · {{YYYY-MM-DD}} |
| Framework | Bansat (بنسټ) v3.0 by Muhammad Tufail Khan, https://github.com/bewithkhan/bansat (CC BY 4.0) |

**Revision history**

| Version | Date | Author | Summary |
|---|---|---|---|
| 0.1 | {{YYYY-MM-DD}} | {{NAME}} | First draft from framework v3.0 |

**Gate approvals**

| Gate | Approver | Date | Notes |
|---|---|---|---|
| G1 Blueprint approved | | | |
| G2 Data-ready | | | |
| G3 Release candidate | | | |
| G4 Post-launch review | | | |

> **Only a person signs a gate.** An AI agent never fills in this table. With the optional G1 hook from the Bansat repo (`hooks/bansat-g1-guard.mjs`), Claude Code refuses code edits until the G1 row names an approver and a date.

### What changed in v3.0

To re-check an existing blueprint, update its Framework row to v3.0. If the project isn't built on Next.js and Supabase, read the profile for its stack (`stacks/`) and record any differences in Part 3. For each market the project serves, compare Part 9 with that market's entry in the law registry (`laws/`), and re-check the entry against its official sources if it was checked more than 90 days ago.

| Area | Change |
|---|---|
| Stack profiles ★ | 24 profiles say what changes from the reference stack (Next.js and Supabase) on seven backend frameworks, six frontend and full-stack ones, four mobile platforms and seven no-code or backend-as-a-service platforms. The skill loads only the one a project uses (`stacks/`). |
| Law registry ★ | 120 jurisdictions: 62 full entries with every obligation and 58 basic entries with the main laws and the regulator. Every claim cites an official source, 2,944 URLs in all (`laws/`). |
| Law Watch | A weekly watch of 105 official sources for 46 full entries. An AI verify task drafts each update with its sources, and a person reviews every change (`watch/`). |
| Law tracker | A page for every jurisdiction on the site, grouped by region, with a feed of changes and no cookies or trackers. |

### What changed in v2.4

To re-check an existing blueprint, update its Framework row to v2.4; copy the new rules into your agent rules file (12.1); run Day-0 triage T11 (14.2) on live projects; check the new launch-gate items, two of them blocking (Part 13); and change any reference to Day-0 triage T11 "Was anything exposed?" to T12.

| Area | Change |
|---|---|
| Breach casebook ★ | 20 documented incidents and regulators' decisions from 2025 and 2026, each mapped to the checks that catch its class of failure (Appendix F). |
| AI coding agents ★ | The agent works with development keys only, asks before destructive commands, never switches off its own approval prompts, and treats text it reads in tool results, issues and error reports as data (12.1, T-13, T-14, Day-0 triage T11). |
| CI/CD and connected apps | Pinned actions, read-only workflow tokens, trusted publishing with 2FA and aged dependency updates; integration tokens and third-party app grants (7.4, T-15, T-16). |
| Launch gate | Three new checks, two of them blocking: no default passwords or test accounts, no open data stores, and agent and CI credentials (Part 13). |
| Other checks | No default passwords or test accounts at launch (7.1); nothing that stores data open to the internet (7.4); backups kept apart (5.7); report triage (7.6); credible claims treated as possible breaches (9.20); passkeys or MFA for special category data (9.13); leavers' access removed the same day (7.4); uploaded code never run outside a sandbox (T-07); secrets stored as write-only values (7.4); agents in AI features get the least access that works (8.4). |

### What changed in v2.3

To re-check an existing blueprint, update its Framework row to v2.3, answer the delivery questions (0.4) and record the method you choose in an ADR.

| Area | Change |
|---|---|
| Delivery questions ★ | Eight questions on team size, teams, how settled the requirements are, what's fixed, the contract, evidence needs, the kind of work and any method already in use (0.4). |
| Choosing a method ★ | A picker recommends an outer method for approvals, when one is needed, and an inner method for the build. It's hybrid by default, and the choice goes in an ADR (11.7). |
| Method profiles | Scrum, Kanban, stage gates (the PRINCE2® method and the *PMBOK® Guide*), Shape Up, a solo loop and scaled methods, each showing where G0–G4 and Bansat's documents fall (Appendix E). |
| Toolkit | RACI, RAID log, stakeholder map, status report, change request, a Mermaid timeline, and forecasting from throughput, each with the way it usually goes wrong (11.8). |
| UK regulator (v2.3.1) | The Information Commission took over from the ICO on 30 September 2026 (9.1). |

### What changed in v2.2

To re-check an existing blueprint, update its Framework row to v2.2 and add the new research rule to your agent rules file (12.1). The rows marked ★ change how you work.

| Area | Change |
|---|---|
| Research first ★ | Before building anything new, look at how others have done it: official docs, GitHub repositories and issues, Stack Overflow. Note the problems they hit, then reuse, adapt or build, and say why (12.1, 12.2 step 0, 12.3, the ADR template in 4.1, Definition of Ready in 11.2). |
| Prompts ★ | New prompts: Research first, Logic first and Full audit. The Debug prompt now carries the whole method on its own: 5–7 possible sources, distilled to 1–2, with logs to confirm before any fix (12.4). |
| App flow | A navigation map (screen → action → next screen, and the state each failure shows) sits alongside the journey diagram (10.1, 10.3). The screen template adds Layout and Actions lines (10.4). |
| Design brief | A look-and-feel brief to fill in before choosing tokens (10.5). |
| Diagrams | An authentication flow based on the OWASP cheat sheets (7.1), and an entity-relationship diagram of the reference schema (5.3). |
| UI states | The typed pattern now covers forms as well: validation (S9) and success (S10) (10.7). |
| Privacy test ★ | The "Reject all" check now records requests from the start, so a leak fired by the click itself fails it (9.9). Copy the new version into your tests. |
| Tested code | The framework is split into modules (`framework/` in the repo) and this file is generated from them. The code samples run in CI from `examples/`, and CI fails if a sample in the text and its tested copy differ. |

### What changed in v2.1

From reviewer feedback ([issue #1](https://github.com/bewithkhan/bansat/issues/1)). To re-check an existing blueprint, update its Framework row to v2.1 and look at the rows marked ★.

| Area | Change |
|---|---|
| Gates | Described as instructions the agent follows. An optional Claude Code hook makes G1 a hard stop, and only a person may sign a gate (Document control). |
| Data access ★ | The rule is now "enforce per-user and per-tenant access at the data layer, with RLS where the database supports it" (5.4, 7.2, 9.26, Part 13, 14.2). Databases without RLS, such as MySQL, use scoped queries and policies with the same isolation tests. |
| Server entry points ★ | Authorisation is re-checked in every server entry point (Server Action, route handler, controller, function), not only in Server Actions (12.1). |
| Your process | A project's own rules, `CLAUDE.md` workflow and planning stages take priority; this framework fills the gaps (How to use, item 7). |
| Legal review | The header and the disclaimer say how the law was checked, and that no lawyer has reviewed it yet. |

### What changed from framework v1

| Area | v1 | v2 |
|---|---|---|
| Scope | 8 sections | 15 parts + 4 appendices: intake, non-functional requirements, security, AI, privacy & compliance, testing & operations, agent rules, launch gate, retrofit track, stack profiles |
| Existing projects | Not covered | Retrofit track (Part 14): Day-0 triage for live apps, reverse-engineering the blueprint from code, a gap register with deadlines, keeping blueprints current, and a portfolio register. Stack profiles (Appendix D) cover PWAs, mobile, wearables, admin/CRM tools, research prototypes, websites and AI prototypes. |
| Schema | Prisma with `url = env(...)` in the schema | Prisma 7 rejects `url` in the schema, so the connection now lives in `prisma.config.ts`. Adds consent, rights-request, suppression, audit and AI-usage tables, snake_case mapping, indexes and length limits. Fixes the `creator` relation that blocked account deletion. Adds tested RLS policies. |
| Colours | Indigo-500 `#6366F1` as primary | White on `#6366F1` is 4.47:1 and `#6366F1` on near-black is 4.43:1, so both fail WCAG AA (4.5:1). Buttons now use indigo-600 and links on dark use indigo-400. Zinc-950 is corrected to `#09090B` (`#0A0A0A` is neutral-950). |
| UI states | 10 states | 10 core + 7 extended states, a per-screen state matrix, a typed implementation pattern and an acceptance test for each state |
| Debugging | 5 steps | 8 steps with a stop rule and a mandatory regression test |
| Plan | 5 phases | 9 phases with exit criteria; compliance work starts in Phase 0 |
| Stack | Fixed versions (Next.js 15, gpt-4o-mini) | Versions are chosen and pinned per project in an ADR, because they age |

---

## Contents

- [How to use this blueprint](#how)
- [Part 0 — Project intake & risk classification](#p0)
- [Part 1 — Product requirements (PRD)](#p1)
- [Part 2 — Non-functional requirements](#p2)
- [Part 3 — Technical requirements & architecture (TRD)](#p3)
- [Part 4 — Architecture decision records (ADRs)](#p4)
- [Part 5 — Data architecture](#p5)
- [Part 6 — API & integration contract](#p6)
- [Part 7 — Identity, access & security](#p7)
- [Part 8 — AI & LLM features](#p8)
- [Part 9 — Privacy, data protection & compliance](#p9)
- [Part 10 — Experience design: flows, design system, accessibility, UI states](#p10)
- [Part 11 — Delivery plan, quality & operations](#p11)
- [Part 12 — AI coding agent operating manual](#p12)
- [Part 13 — Launch readiness gate](#p13)
- [Part 14 — Existing & live projects: retrofit track and keeping every blueprint current](#p14)
- [Appendix A — Templates](#appa) · [Appendix B — References](#appb) · [Appendix C — Glossary](#appc) · [Appendix D — Stack & project-type profiles](#appd) · [Appendix E — Delivery method profiles](#appe) · [Appendix F — Breach casebook](#appf)
