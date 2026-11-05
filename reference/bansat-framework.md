# Bansat (بنسټ): Master Project Framework

*Bansat* is Pashto for **foundation**: lay it before you build.

**Product · Architecture · Design · Security · Privacy & Compliance · Delivery**

Created by **Muhammad Tufail Khan** ([github.com/bewithkhan](https://github.com/bewithkhan)) · Framework version **2.1** · Legal position checked **4 November 2026** against official sources, with AI assistance (not yet reviewed by a lawyer) · Supersedes *Comprehensive App Development Framework & Master Blueprint* (v1)

> **Cite as:** Khan, M. T. (2026). *Bansat (بنسټ): A blueprint-first framework for building software* (Version 2.1). https://github.com/bewithkhan/bansat
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
| Framework | Bansat (بنسټ) v2.1 by Muhammad Tufail Khan, https://github.com/bewithkhan/bansat (CC BY 4.0) |

**Revision history**

| Version | Date | Author | Summary |
|---|---|---|---|
| 0.1 | {{YYYY-MM-DD}} | {{NAME}} | First draft from framework v2.1 |

**Gate approvals**

| Gate | Approver | Date | Notes |
|---|---|---|---|
| G1 Blueprint approved | | | |
| G2 Data-ready | | | |
| G3 Release candidate | | | |
| G4 Post-launch review | | | |

> **Only a person signs a gate.** An AI agent never fills in this table. With the optional G1 hook from the Bansat repo (`hooks/bansat-g1-guard.mjs`), Claude Code refuses code edits until the G1 row names an approver and a date.

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
- [Appendix A — Templates](#appa) · [Appendix B — References](#appb) · [Appendix C — Glossary](#appc) · [Appendix D — Stack & project-type profiles](#appd)

---

<a id="how"></a>
## How to use this blueprint

**Pick your track first:**

| Your project | Track | Start at |
|---|---|---|
| New: an idea or a throwaway prototype | New project | Part 0, then gates G0–G4 |
| Existing: built, with no real users yet | Retrofit, light | Part 14.3 |
| Live: real users, customers or a client | Retrofit, urgent | **Part 14.2 Day-0 triage (within 48 hours)** |

Then add the matching **stack profile** from Appendix D (web, PWA, mobile, wearable, admin/CRM, research, website, AI prototype, hardware).

1. **Copy, don't edit the master.** For each project, copy this file to `docs/BLUEPRINT.md` in the repo, and keep the "Framework" credit row in Document control (CC BY 4.0 attribution). Paste Part 12.1 into `CLAUDE.md`, `AGENTS.md` or `.cursor/rules` (or your Lovable/Bolt project knowledge) so every agent session follows it.
2. **Fill every `{{placeholder}}`.** Before each gate, search the file for `{{`. Nothing in scope may remain.
3. **Respect the tags.** Complete `[CORE]` sections for every project. Complete `[IF: …]` sections when Part 0 says they apply; otherwise write `N/A, because …`.
4. **Use the keywords.** **MUST**, **SHOULD** and **MAY** follow RFC 2119.
5. **Trace everything.** Requirements carry IDs (`FR-`, `NFR-`, `BR-`, `SCR-`, `API-`, `DATA-`, `ROPA-`, `ADR-`, `RISK-`, `TEST-`). Every `FR` links to its screens, endpoints, data, tests and processing record (Appendix A6).
6. **Treat examples as illustrations.** The worked example throughout is **TaskFlow AI** from v1: a team workspace with AI standups. Replace it with your own content.
7. **Your project's rules win.** If the repo already has its own planning stages, templates or agent workflow (in `CLAUDE.md`, `AGENTS.md` or its docs), follow those. Map these gates onto its stages, use this framework to fill the gaps, and note where the two differ.

### Depth by risk tier

| Tier (from Part 0) | Minimum to complete before build |
|---|---|
| **Low**: no accounts, little personal data | Parts 0, 1.1–1.5, 3.1, 9.8–9.9, 9.26, 10.7 and 13 |
| **Medium**: accounts, analytics, email, B2B | Every `[CORE]` section plus the `[IF]` modules that apply |
| **High**: health or biometric data, children, location or worker monitoring, significant automated decisions, large scale | Everything, plus a full DPIA (9.21) and an independent privacy and security review before G3 |

### Gates

| Gate | Unlocks | Exit criteria |
|---|---|---|
| **G0 Idea** | Writing this blueprint | Part 0 and 1.1–1.3 drafted |
| **G1 Blueprint approved** | Production code (throwaway spikes are allowed earlier) | All in-scope sections complete; ADRs accepted; DPIA screening done; no `{{` left in scope |
| **G2 Data-ready** | Collecting **any** real personal data, including waitlists and beta testers | Privacy notice live; RoPA and lawful bases recorded; consent capture working; processor DPAs signed; data-access isolation tests (RLS where supported) passing; ICO fee paid (UK controller) |
| **G3 Release candidate** | Public launch | Part 11 testing complete; every Part 13 item green, or N/A with a reason |
| **G4 Post-launch** | The next major scope | 30-day review: metrics against targets, incidents, rights requests, compliance calendar running |

> A "coming soon" page with an email box is already processing personal data, so G2 applies to it.

---

<a id="p0"></a>
## Part 0 — Project intake & risk classification `[CORE]`

### 0.1 Snapshot

| Field | Answer |
|---|---|
| One-line description | {{e.g. "TaskFlow AI turns a team's task board into a daily standup in one click."}} |
| Problem, and who has it | {{ }} |
| Platforms | {{Web · PWA · iOS · Android · Desktop · Wearable/IoT}} |
| Markets (where users are) | {{e.g. UK, Ireland, Nigeria}} |
| B2C, B2B or internal | {{ }} |
| Target launch · Budget cap | {{date}} · {{£/month infrastructure, £/month AI}} |

### 0.2 Screening questions

Answer every question. Each **Yes** switches on the linked module.

| # | Question | Y/N | If yes, complete |
|---|---|---|---|
| Q1 | Will you collect any personal data at all (emails, names, IP addresses in logs, analytics or device IDs)? | | Part 9. The answer is practically always yes. |
| Q2 | Users in the **UK**? | | UK GDPR, DPA 2018, PECR (9.1) |
| Q3 | Users in the **EU/EEA** (you offer them services or monitor their behaviour)? | | EU GDPR, ePrivacy, EU representative check, AI Act |
| Q4 | Users in **Nigeria**? | | NDPA 2023 + GAID 2025; major-importance check (9.2) |
| Q5 | Users in the **US** or elsewhere? | | COPPA, CAN-SPAM, state laws; add rows to 9.1 |
| Q6 | Could anyone **under 18** use it, even if it isn't aimed at them? | | 9.12 Children |
| Q7 | **Health** or wellbeing, biometric, genetic, sex life or orientation, religion, ethnicity, political or trade-union data? | | 9.13 Special category data; DPIA |
| Q8 | **Precise location** or continuous tracking? | | 9.14; DPIA |
| Q9 | Monitoring **workers** (employees, drivers, contractors)? | | 9.14; DPIA |
| Q10 | **Wearables, IoT** devices or sensors? | | 9.13 and 9.14; device security |
| Q11 | **AI/LLM** features, or **automated decisions** about people? | | Part 8; 9.22 |
| Q12 | Can users share **content with other users** (comments, chat, uploads, profiles)? | | 7.3 abuse threats; Online Safety Act screen (9.1) |
| Q13 | **Payments** or subscriptions? | | 1.8; 9.25 (PCI scope, consumer law) |
| Q14 | **Marketing** email, SMS or push; a waitlist or newsletter? | | 9.11 |
| Q15 | Analytics, heatmaps, **session replay**, ad pixels, A/B tests? | | 9.8–9.10 |
| Q16 | Third-party **fonts, CDNs, embeds** or widgets (maps, video, chat, CAPTCHA)? | | 9.9 |
| Q17 | Distribution through **app stores**? | | 9.25 platform rules |
| Q18 | B2B: will customers put **their own people's data** into it, so you act as their processor? | | 9.2 processor duties; customer DPA |
| Q19 | Selling to the **public sector, NHS or enterprises**? | | 7.4 assurance (Cyber Essentials, ISO 27001 or SOC 2); NHS DTAC and DSPT (9.13) |
| Q20 | Could processing be **large-scale** (thousands of people, or sensitive data in any volume)? | | DPO assessment (9.2); DPIA |

### 0.3 Risk tier

- **High** if Q7, Q8, Q9 or Q10 is yes; if children are a target or likely audience (Q6); or if Q11 involves significant decisions about people. A DPIA is then mandatory and an external review is recommended.
- **Medium** if you have accounts, analytics, marketing or a B2B processor role.
- **Low** otherwise.

**Result:** Tier {{Low / Medium / High}} · DPIA required {{Y/N}} · Modules in scope: {{list}}


---

<a id="p1"></a>
## Part 1 — Product requirements (PRD) `[CORE]`

### 1.1 Executive summary

| Field | Content |
|---|---|
| App name | {{ }}. *Example: TaskFlow AI* |
| Vision | {{ }}. *Example: a streamlined, intelligent workspace that helps remote teams triage tasks and run daily standups from contextual AI summaries, with dependable error handling and state management.* |
| Target audience | {{ }}. *Example: remote engineering and product teams of 5–50 people.* |
| Value proposition | {{What gets faster, cheaper or safer for them, and by how much?}} |
| Business model | {{Free · Freemium · Subscription · One-off · Internal tool}} |

### 1.2 Problem statement & evidence

- **Who** has the problem: {{ }}
- **Current workaround** and its cost: {{ }}
- **Evidence** (interviews, data, sign-ups, support tickets): {{ }}
- **Why now**: {{ }}

### 1.3 Goals, non-goals & success metrics

| Metric | Definition | Target | How it's measured |
|---|---|---|---|
| Activation | % of new workspaces that create ≥ 3 tasks within 24 h | {{≥ 40%}} | Server-side counts |
| Core value | % of active teams generating ≥ 3 standups per week | {{≥ 30%}} | Server-side counts |
| Retention | Week-4 workspace retention | {{≥ 25%}} | Aggregate analytics (9.10) |
| Reliability | Monthly availability | {{≥ 99.5%}} | Uptime monitor |

> **Guide:** Prefer server-side counts and aggregate analytics. A metric that needs invasive tracking is a design smell (9.10).

**Non-goals** (deliberately out of scope for this release): {{e.g. native mobile apps, public task sharing, time tracking}}

### 1.4 Users, personas & roles

| Persona | Context | Goals | Frustrations | Accessibility needs | Data sensitivity |
|---|---|---|---|---|---|
| {{Team lead "Amara"}} | {{Runs a 12-person remote team}} | {{Standup in 2 minutes}} | {{Chasing updates}} | {{Keyboard-heavy user}} | {{Work data, names}} |

Roles map to the permission matrix in 7.2: {{OWNER, ADMIN, MEMBER}}.

### 1.5 Features & prioritisation (MoSCoW)

| ID | Feature | Priority | Release | Personal data? | Notes |
|---|---|---|---|---|---|
| FR-001 | Authentication & workspace setup (Google OAuth, magic link) | Must | MVP | Yes | Age check and consent capture at sign-up (9.7, 9.12) |
| FR-002 | Task triage board: Kanban with AI tagging, priority and assignee suggestions | Must | MVP | Yes | Non-drag way to move cards (WCAG 2.5.7) |
| FR-003 | AI daily standup generator, exported as Markdown | Must | MVP | Yes | Part 8 |
| FR-004 | Real-time threaded comments with optimistic updates | Should | MVP | Yes | Sanitised Markdown; abuse threats (7.3) |
| FR-005 | Organisation & member management | Must | MVP | Yes | Permission matrix (7.2) |
| FR-006 | Privacy centre: export, delete, consents, marketing preferences, complaints | Must | MVP | Yes | **Required for any app with accounts** (9.15) |
| FR-007 | Cookie & consent management | Must | MVP | Yes | **Required if anything non-essential runs** (9.8) |

### 1.6 User stories & acceptance criteria

Write one block per requirement, using this template.

```text
FR-003 — Generate a daily standup
As a team member, I want a one-click summary of yesterday's completed tasks, blockers and today's
commitments, so that standups take two minutes.

Acceptance criteria
  Scenario: Summary generated
    Given I am a member of workspace W with tasks completed in the last 24 h
    When I select "Generate standup"
    Then a structured Markdown summary appears within 15 s, labelled "AI-generated — check before sharing"
    And I can copy it or download it as a .md file

  Scenario: Nothing to summarise                     → Empty state (S1)
    Given no tasks changed in the last 24 h
    Then I see "Nothing to summarise yet" and a link back to the board

  Scenario: AI provider slow or down                 → Slow network (S5), then Error (S3)
    Given the provider has not responded after 5 s
    Then I see "Still working…" with Cancel
    And after 30 s I see an error with Retry, and none of my input is lost

  Scenario: Daily limit reached                      → Rate limited (S13)
    Given my workspace has used today's AI quota
    Then I see when the quota resets and nothing is charged

Traceability: SCR-07 · API-003 · DATA tasks, ai_generations · TEST-E2E-012 · ROPA-03
Privacy: task text is minimised before it is sent to the AI provider (8.2); no special category data
```

### 1.7 Business rules

| ID | Rule |
|---|---|
| BR-01 | A workspace always has at least one OWNER. The last owner cannot leave or be demoted. |
| BR-02 | {{Free plan: maximum 5 members and 20 AI standups per month}} |
| BR-03 | Deleting a workspace starts a 30-day recovery window, then hard-deletes everything (5.6). |

### 1.8 Monetisation & pricing `[IF: payments]`

Plans and limits: {{ }} · Trial: {{ }} · Billing provider: {{e.g. Stripe Checkout or Billing}} · VAT: {{ }} · Cancellation and refunds: {{ }} (consumer law, 9.25) · Failed payments: {{retries, grace period}}

### 1.9 Assumptions, constraints & dependencies

| Type | Statement | Impact if wrong | Owner |
|---|---|---|---|
| Assumption | {{Teams already use Google Workspace}} | {{Add email/password sign-in}} | {{ }} |
| Constraint | {{Data must stay in the UK/EU}} | — | {{ }} |
| Dependency | {{AI provider API availability}} | {{Feature-flag the AI off; the app still works}} | {{ }} |

### 1.10 Out of scope

{{Explicit list. Anything not listed here or in 1.5 is out of scope by default.}}

---

<a id="p2"></a>
## Part 2 — Non-functional requirements `[CORE]`

Every NFR needs a number and a way to verify it. Defaults below are sensible starting points; change them deliberately.

| ID | Category | Requirement | Target (default) | Verified by |
|---|---|---|---|---|
| NFR-PERF-01 | Performance | Core Web Vitals at p75 on mobile | LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1 | Lighthouse CI + real-user monitoring (aggregate) |
| NFR-PERF-02 | Performance | API latency (excluding AI calls) | p95 ≤ {{300}} ms reads, ≤ {{800}} ms writes | APM / logs |
| NFR-PERF-03 | Performance | JavaScript on the initial route | ≤ {{170}} KB gzipped | Bundle analyser in CI |
| NFR-AVL-01 | Availability | Monthly uptime | {{99.5%}} (≈ 3.6 h downtime per 30 days) | Uptime monitor |
| NFR-REL-01 | Recoverability | Backup and restore | RPO ≤ {{24 h}} (≤ 5 min with point-in-time recovery) · RTO ≤ {{4 h}} | Quarterly restore drill |
| NFR-SCL-01 | Scalability | Load | {{N}} concurrent users, {{M}} records, no degradation | Load test before launch |
| NFR-SEC-01 | Security | Verification baseline | OWASP ASVS Level 1 for all; **Level 2** when processing sensitive data or payments | Security review (7.4) |
| NFR-PRIV-01 | Privacy | Privacy by default | Zero non-essential cookies or third-party requests before consent | Playwright test (9.9) |
| NFR-PRIV-02 | Privacy | Rights requests | Completed within 30 days | DSR log (9.15) |
| NFR-PRIV-03 | Privacy | Data residency | Primary data stored in {{UK/EU region}} | Infrastructure review |
| NFR-A11Y-01 | Accessibility | Standard | WCAG 2.2 AA | axe in CI + manual audit (10.6) |
| NFR-CMP-01 | Compatibility | Browsers and devices | Last 2 versions of Chrome, Edge, Firefox and Safari; iOS {{17+}}; Android {{10+}}; viewports from 320 px | Device test matrix |
| NFR-I18N-01 | Localisation | Locale handling | {{en-GB}} default; times stored in UTC and shown in local time; formatting through `Intl` | Unit tests |
| NFR-OBS-01 | Observability | Error alerting | Alert when the error rate exceeds {{2%}} over 5 min | Alert test |
| NFR-MNT-01 | Maintainability | Code quality | TypeScript strict; zero lint errors; ≥ {{80%}} coverage of domain logic | CI |
| NFR-COST-01 | Cost | Budgets | Infrastructure ≤ {{£X}}/month; AI ≤ {{£Y}}/month, with alerts at 50/80/100% | Billing alerts |


---

<a id="p3"></a>
## Part 3 — Technical requirements & architecture (TRD) `[CORE]`

### 3.1 Stack decisions

Pin exact versions at project start (lockfile plus this table), and change them only through an ADR. The reference stack below is the default for web projects.

| Layer | Choice (reference default) | Pinned version | Why | ADR |
|---|---|---|---|---|
| Framework | Next.js (App Router) + React + TypeScript `strict` | {{ }} | One codebase for UI and server; Server Components | ADR-001 |
| Styling & motion | Tailwind CSS · Motion (formerly Framer Motion), honouring `prefers-reduced-motion` | {{ }} | Speed and consistency | — |
| Server logic | Server Actions for internal mutations · Route Handlers for webhooks and the public API | — | Typed end to end | ADR-001 |
| Database | PostgreSQL on Supabase in a {{UK/EU}} region · Prisma ORM · RLS on every table | {{ }} | Relational data, type safety, defence in depth | ADR-002, ADR-005 |
| Auth | Supabase Auth: Google OAuth + magic link; MFA for owners and admins | — | Managed, standards-based | ADR-002 |
| Validation & forms | Zod (schemas shared by client and server) · React Hook Form | {{ }} | One source of truth for input rules | — |
| Client state | TanStack Query for server state · Zustand for UI state (e.g. active filters) | {{ }} | Caching, retries, offline handling | — |
| AI | {{Provider}} through the Vercel AI SDK · model `{{pinned model ID}}` | {{ }} | Structured output, streaming | ADR-006 |
| Email | {{Provider}} with separate transactional and marketing streams | — | Deliverability and compliance | ADR-007 |
| Hosting | Vercel, functions region {{`lhr1` London / `fra1` Frankfurt}} | — | Preview deployments | ADR-005 |
| Monitoring | {{e.g. Sentry}} (EU data region, PII scrubbing, replay off) | — | Error visibility | 9.10 |
| Analytics | {{Privacy-first, aggregate tool}} | — | Measure without tracking people | 9.10 |
| Testing | Vitest · Playwright · @axe-core/playwright | {{ }} | Covers Part 11 | — |

> **Mobile or other stacks** (Flutter, React Native, native): keep this table's structure and add app-store privacy labels, account deletion (9.25), SDK inventories (9.8) and OS permission flows (9.14).

### 3.2 Environments

| Env | Purpose | Data allowed | Access | Secrets |
|---|---|---|---|---|
| Local | Development | Synthetic seed data only | Developer | `.env.local` (git-ignored) |
| Preview | One per pull request | Synthetic only | Team (deployment protection on) | Preview-scoped variables |
| Staging | Release candidate testing | Synthetic, or anonymised extracts with written approval | Team | Staging project and keys |
| Production | Live | Real | Least privilege, MFA | Production project and keys |

**Rule:** real personal data never leaves production. Each environment has its own Supabase project and keys.

### 3.3 System context

```mermaid
flowchart LR
  user([User's browser or app])
  subgraph svc [Your service]
    web[Next.js app on Vercel<br/>UI, Server Actions, Route Handlers]
    jobs[Scheduled jobs<br/>retention, deletion, email]
  end
  subgraph proc [Processors in a UK or EU region]
    db[(Supabase Postgres<br/>RLS on every table)]
    auth[Supabase Auth]
    store[(Private storage<br/>signed URLs)]
  end
  ai[AI provider<br/>DPA, no training on your data]
  mail[Email provider<br/>transactional and marketing streams]
  mon[Error monitoring<br/>PII scrubbed]
  ana[Analytics or replay<br/>consent-gated]

  user -- HTTPS --> web
  web --> auth
  web --> db
  web --> store
  web -- minimised prompts --> ai
  jobs --> db
  jobs --> mail
  web -. errors .-> mon
  user -. only after consent .-> ana
```

### 3.4 Data flows & trust boundaries

| Flow | From → To | Personal data | Boundary crossed | Protection |
|---|---|---|---|---|
| Sign-up | Browser → Auth | Email, name, IP | Internet → processor | TLS; rate limits; no third-party scripts on auth pages |
| Task CRUD | Browser → Server Action → DB | Task content, names | Client → server → DB | Zod validation; authorisation check; RLS |
| AI standup | Server → AI provider | Minimised task text | You → third country | DPA; redaction; transfer mechanism (9.17) |
| Email | Job → email provider | Email address, name | You → processor | DPA; suppression list; one-click unsubscribe |
| Errors | App → monitoring | Stack traces, IDs | You → processor | PII scrubbing; no request bodies |

### 3.5 Repository structure

```text
app/                    routes: (marketing)/, (auth)/, (app)/w/[slug]/…, api/
components/ui/          primitives (button, input, dialog …)
components/states/      the reusable UI-state components (10.7)
components/features/    feature components
lib/schemas/            Zod schemas shared by client and server
lib/server/             server-only code (import 'server-only'): data access, authorisation
lib/privacy/            consent store, script loader, redaction, export and deletion helpers
lib/ai/                 versioned prompts, output schemas, evals
prisma/                 schema.prisma, migrations/   ·   prisma.config.ts at repo root
supabase/policies/      RLS SQL (5.4)          supabase/seed.sql (synthetic data)
tests/                  unit/  integration/  e2e/  privacy/  a11y/  rls/
docs/                   BLUEPRINT.md  adr/  compliance/ (RoPA, DPIA, LIAs, registers)
```

### 3.6 Third-party services & processors register

Every service that receives personal data or runs in the user's browser **must** be listed here before it is added to the code.

| Service | Purpose | Data shared | Runs in browser? | Before consent? | Role | Location · Transfer mechanism | DPA signed | Exit plan |
|---|---|---|---|---|---|---|---|---|
| {{Vercel}} | Hosting | Request logs (IP) | No | n/a | Processor | {{EU/US · DPF + SCCs}} | {{date}} | {{ }} |
| {{Supabase}} | DB, auth, storage | All app data | Client SDK | Yes (strictly necessary) | Processor | {{eu-west-2 London}} | {{ }} | {{ }} |
| {{AI provider}} | Standups | Minimised task text | No | n/a | Processor | {{US · DPF / SCCs}} | {{ }} | {{ }} |
| {{Email provider}} | Email | Email, name | No | n/a | Processor | {{ }} | {{ }} | {{ }} |
| {{Analytics}} | Aggregate metrics | Pseudonymous events | Yes | **No** | Processor | {{ }} | {{ }} | {{ }} |

### 3.7 Configuration & secrets

| Variable | Scope | Purpose | Stored in | Rotation |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Client (public) | Project URL | Vercel env | On project change |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Client (public) | Publishable (anon) key. Safe only because RLS is on. | Vercel env | On leak |
| `SUPABASE_SECRET_KEY` | **Server only** | Secret / service-role key: bypasses RLS | Vercel env | Every 90 days and on leak |
| `DATABASE_URL` · `DIRECT_URL` | **Server only** | Pooled runtime connection · direct connection for migrations | Vercel env | On leak |
| `{{AI}}_API_KEY` · `{{EMAIL}}_API_KEY` | **Server only** | Provider keys | Vercel env | Every 90 days |

Rules:
- Anything prefixed `NEXT_PUBLIC_` ships to every visitor, so it must never be a secret.
- `.env*` files are git-ignored, and secret scanning (e.g. gitleaks) runs in CI.
- Each environment has separate keys.
- CI fails if the built client bundle contains a secret-key pattern.

### 3.8 Coding standards

- TypeScript `strict` with no `any` unless a comment justifies it. ESLint (including `jsx-a11y`) and Prettier run on every commit.
- Server-only modules start with `import 'server-only'`.
- Validate every input at every boundary with Zod: `.strict()` objects and a maximum length on every string.
- Errors use typed codes (6.3) that map to UI states (10.7). Never show stack traces to users.
- Logs are structured JSON with a correlation ID and no personal data (7.5).
- Store times in UTC, money in minor units (integer pence/kobo) and IDs as UUIDs.

---

<a id="p4"></a>
## Part 4 — Architecture decision records (ADRs) `[CORE]`

### 4.1 ADR template

```text
ADR-NNN — {{Title}}
Status: Proposed | Accepted | Superseded by ADR-NNN        Date: {{YYYY-MM-DD}}   Review by: {{date}}
Context: {{forces, constraints, options considered}}
Decision: {{what we will do}}
Consequences: (+) {{benefits}}   (−) {{costs, risks, follow-ups}}
Privacy & security impact: {{new data, vendors, transfers; RoPA/DPIA updates needed}}
```

### 4.2 Baseline ADRs (accepted unless a project overrides them)

**ADR-001 — Next.js App Router for full-stack development.** *Context:* fast iteration, good SEO and no separate backend cluster. *Decision:* Next.js App Router on Vercel. *Consequences:* (+) unified codebase and deployments. (−) Strict Server/Client Component boundaries. **Every Server Action is a public HTTP endpoint**, so each one MUST validate its input and re-check authentication and authorisation itself. Middleware or UI checks are never enough on their own.

**ADR-002 — Supabase Postgres + Prisma, with RLS as defence in depth.** *Context:* relational, multi-tenant data that needs type-safe queries. *Decision:* Prisma for server-side data access through one data-access layer (`lib/server/db/*`) that always scopes by `organizationId` and calls `assertCan()` (7.2). RLS is enabled on **every** table for any access through the Supabase client SDK. *Consequences:* (+) type safety, migrations, layered protection. (−) **Prisma connects as the table owner, which bypasses RLS**, so server code must enforce tenancy itself. Tenant-isolation tests (5.4, 11.3) cover both paths.

**ADR-003 — Mandatory UI-state architecture and systematic debugging.** *Context:* missing states and guessed bug fixes produce dead ends and regressions. *Decision:* every screen implements the applicable states from 10.7, proven by its state matrix, and all bug work follows the protocol in 12.3. *Consequences:* (+) no dead ends and verifiable fixes. (−) More upfront work per screen.

**ADR-004 — Privacy-by-default front end.** *Context:* third-party fonts, CDNs, pixels and widgets disclose visitors' IP addresses and behaviour before any consent (9.9). *Decision:* the browser contacts only first-party and strictly necessary hosts until consent is given. Fonts and libraries are self-hosted or bundled. Non-essential scripts load only through the consent-gated loader (9.8). A CSP allowlist and an automated test enforce this. *Consequences:* (+) compliant by construction, and faster pages. (−) Every new vendor goes through the register (3.6).

**ADR-005 — Data residency.** *Decision:* the primary database, storage and functions run in {{UK/EU}} regions. Any processor outside the UK/EU needs a recorded transfer mechanism (9.17). *Consequences:* (+) simpler transfers and customer trust. (−) Some vendor choices are ruled out.

**ADR-006 — AI provider & data handling.** *Decision:* use providers with a signed DPA that contractually exclude training on your data, with a stated retention period and a region choice where available. Send minimised, redacted inputs. Validate structured outputs. Pin model IDs. *Consequences:* (+) predictable cost and compliance. (−) Model upgrades need an eval run (8.5).

**ADR-007 — Email architecture.** *Decision:* separate transactional and marketing streams, with marketing sent from a subdomain (e.g. `news.{{domain}}`). A global suppression list is the source of truth, and SPF, DKIM and DMARC are set on all sending domains. *Consequences:* (+) deliverability, and unsubscribes are honoured everywhere. (−) Two templates and two configurations to maintain.


---

<a id="p5"></a>
## Part 5 — Data architecture `[CORE]`

### 5.1 Data classification

| Class | Examples | Storage | Logs, analytics, replay, error tools | AI prompts | Access |
|---|---|---|---|---|---|
| **C0 Public** | Marketing pages, docs | Anywhere | Allowed | Allowed | Anyone |
| **C1 Internal** | Aggregate metrics, configuration | App storage | Allowed | Allowed | Team |
| **C2 Personal** | Name, email, IP, user ID, workspace content about people | Encrypted at rest; RLS | IDs only, never content | Minimised and redacted only | Least privilege |
| **C3 Sensitive** | Special category data (9.13), children's data, precise location, government IDs, financial details, credentials | Separate tables; app-level encryption where feasible; access logged | **Never** | Only with an approved DPIA | Named roles; audited |

### 5.2 Data dictionary

Every field has a reason to exist. If you can't fill the "Purpose" column, delete the field.

| Entity.field | Type | Class | Purpose | ROPA | Required | Retention | Shared with |
|---|---|---|---|---|---|---|---|
| profiles.email | text | C2 | Sign-in, service email | ROPA-01 | Yes | Life of account | Auth, email provider |
| profiles.age_status | enum | C2 | Prove the age rule was applied (9.12) | ROPA-01 | Yes | Life of account | — |
| tasks.description | varchar(10000) | C2 | Core feature | ROPA-02 | No | Life of workspace | AI provider (minimised) |
| {{ }} | | | | | | | |

### 5.3 Reference schema (Prisma)

Changes from v1:
- `snake_case` mapping, UUID columns, indexes and length limits.
- `creator` and `author` become `SetNull`, so deleting a user no longer fails or wipes team content.
- New tables: consent evidence, marketing suppressions, rights requests and complaints, audit log, and an AI usage ledger.
- The date of birth is never stored; only the age-check result is.

```prisma
// prisma/schema.prisma — privacy-aware reference schema (example: TaskFlow AI)
// Conventions: snake_case tables/columns (@@map/@map), UUID keys, UTC timestamps.
// Data classes in comments: [C2] personal, [C3] sensitive — see 5.1.

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql" // Prisma 7+: the connection URL lives in prisma.config.ts
}

/// One row per auth user. id = auth.users.id (set by a sign-up trigger).
model Profile {
  id                  String          @id @db.Uuid
  email               String          @unique // [C2]
  displayName         String          @map("display_name") // [C2]
  avatarPath          String?         @map("avatar_path") // [C2] own storage bucket, never Gravatar
  locale              String          @default("en-GB")
  timezone            String          @default("Europe/London")
  ageStatus           AgeStatus       @default(UNVERIFIED) @map("age_status") // store the result, not the DOB
  ageCheckMethod      AgeCheckMethod? @map("age_check_method")
  ageCheckedAt        DateTime?       @map("age_checked_at")
  lastActiveAt        DateTime?       @map("last_active_at") // drives inactive-account deletion
  deletionRequestedAt DateTime?       @map("deletion_requested_at") // starts the 30-day erasure grace period
  createdAt           DateTime        @default(now()) @map("created_at")
  updatedAt           DateTime        @updatedAt @map("updated_at")

  memberships   Membership[]
  assignedTasks Task[]               @relation("AssignedTasks")
  createdTasks  Task[]               @relation("CreatedTasks")
  comments      Comment[]
  consents      ConsentRecord[]
  requests      DataSubjectRequest[]

  @@map("profiles")
}

model Organization {
  id        String    @id @default(uuid()) @db.Uuid
  name      String    @db.VarChar(120)
  slug      String    @unique @db.VarChar(60)
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at") // soft delete; hard delete after 30 days

  memberships   Membership[]
  tasks         Task[]
  comments      Comment[]
  auditLogs     AuditLog[]
  aiGenerations AiGeneration[]

  @@map("organizations")
}

model Membership {
  id             String   @id @default(uuid()) @db.Uuid
  userId         String   @map("user_id") @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  role           Role     @default(MEMBER)
  createdAt      DateTime @default(now()) @map("created_at")

  user         Profile      @relation(fields: [userId], references: [id], onDelete: Cascade)
  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@unique([userId, organizationId])
  @@index([organizationId])
  @@map("memberships")
}

model Task {
  id             String     @id @default(uuid()) @db.Uuid
  organizationId String     @map("organization_id") @db.Uuid
  title          String     @db.VarChar(200)
  description    String?    @db.VarChar(10000) // [C2] may mention people: never sent to analytics
  status         TaskStatus @default(TODO)
  priority       Priority   @default(MEDIUM)
  aiSummary      String?    @map("ai_summary") // AI-generated: labelled in the UI (Part 8.6)
  assigneeId     String?    @map("assignee_id") @db.Uuid
  creatorId      String?    @map("creator_id") @db.Uuid // nullable so erasing a user keeps team content
  createdAt      DateTime   @default(now()) @map("created_at")
  updatedAt      DateTime   @updatedAt @map("updated_at")
  deletedAt      DateTime?  @map("deleted_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  assignee     Profile?     @relation("AssignedTasks", fields: [assigneeId], references: [id], onDelete: SetNull)
  creator      Profile?     @relation("CreatedTasks", fields: [creatorId], references: [id], onDelete: SetNull)
  comments     Comment[]

  @@index([organizationId, status])
  @@index([assigneeId])
  @@map("tasks")
}

model Comment {
  id             String    @id @default(uuid()) @db.Uuid
  organizationId String    @map("organization_id") @db.Uuid // denormalised: simple, fast RLS
  taskId         String    @map("task_id") @db.Uuid
  authorId       String?   @map("author_id") @db.Uuid
  content        String    @db.VarChar(5000) // [C2]
  createdAt      DateTime  @default(now()) @map("created_at")
  editedAt       DateTime? @map("edited_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)
  task         Task         @relation(fields: [taskId], references: [id], onDelete: Cascade)
  author       Profile?     @relation(fields: [authorId], references: [id], onDelete: SetNull)

  @@index([taskId, createdAt])
  @@map("comments")
}

/// Append-only evidence of every consent decision (9.7). Never update rows; insert a new one.
model ConsentRecord {
  id            String         @id @default(uuid()) @db.Uuid
  profileId     String?        @map("profile_id") @db.Uuid
  anonymousId   String?        @map("anonymous_id") // random ID from the consent cookie, before sign-up
  purpose       ConsentPurpose
  granted       Boolean
  noticeVersion String         @map("notice_version") // version of the notice shown
  wording       String // exact text the person saw
  source        ConsentSource
  createdAt     DateTime       @default(now()) @map("created_at")

  profile Profile? @relation(fields: [profileId], references: [id], onDelete: SetNull)

  @@index([profileId, purpose, createdAt])
  @@map("consent_records")
}

/// Minimal record kept after unsubscribe or erasure so the address is never emailed again.
model MarketingSuppression {
  emailHash String            @id @map("email_hash") // SHA-256 of the lower-cased, trimmed email
  reason    SuppressionReason
  createdAt DateTime          @default(now()) @map("created_at")

  @@map("marketing_suppressions")
}

/// Rights requests and privacy complaints (9.15, 9.16).
model DataSubjectRequest {
  id             String    @id @default(uuid()) @db.Uuid
  profileId      String?   @map("profile_id") @db.Uuid
  requesterEmail String    @map("requester_email") // [C2]
  type           DsrType
  status         DsrStatus @default(RECEIVED)
  jurisdiction   String? // e.g. "UK", "EU-IE", "NG"
  receivedAt     DateTime  @default(now()) @map("received_at")
  acknowledgedAt DateTime? @map("acknowledged_at")
  dueAt          DateTime  @map("due_at") // one calendar month from receipt (UK/EU)
  extendedTo     DateTime? @map("extended_to")
  completedAt    DateTime? @map("completed_at")
  outcomeNote    String?   @map("outcome_note") // no special category details

  profile Profile? @relation(fields: [profileId], references: [id], onDelete: SetNull)

  @@index([status, dueAt])
  @@map("data_subject_requests")
}

/// Security and admin events. IDs only: no emails, names or content.
model AuditLog {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String?  @map("organization_id") @db.Uuid
  actorId        String?  @map("actor_id") @db.Uuid
  action         String // e.g. "member.role_changed", "data.exported"
  targetType     String?  @map("target_type")
  targetId       String?  @map("target_id")
  metadata       Json?
  createdAt      DateTime @default(now()) @map("created_at")

  organization Organization? @relation(fields: [organizationId], references: [id], onDelete: SetNull)

  @@index([organizationId, createdAt])
  @@map("audit_logs")
}

/// Usage and cost ledger for AI features. Prompts and outputs are NOT stored here.
model AiGeneration {
  id             String   @id @default(uuid()) @db.Uuid
  organizationId String   @map("organization_id") @db.Uuid
  requestedById  String?  @map("requested_by_id") @db.Uuid
  feature        String // e.g. "standup_summary"
  model          String // pinned model ID
  promptVersion  String   @map("prompt_version")
  inputTokens    Int      @map("input_tokens")
  outputTokens   Int      @map("output_tokens")
  status         String // "succeeded" | "failed" | "cancelled"
  createdAt      DateTime @default(now()) @map("created_at")

  organization Organization @relation(fields: [organizationId], references: [id], onDelete: Cascade)

  @@index([organizationId, createdAt])
  @@map("ai_generations")
}

enum Role {
  OWNER
  ADMIN
  MEMBER
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  IN_REVIEW
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum AgeStatus {
  UNVERIFIED
  ADULT
  MINOR_WITH_PARENTAL_CONSENT
}

enum AgeCheckMethod {
  SELF_DECLARATION
  AGE_ESTIMATION
  ID_CHECK_VIA_PROVIDER
  PARENT_VERIFIED
}

// Extend from your RoPA (9.3). One purpose per independent choice.
enum ConsentPurpose {
  ANALYTICS
  SESSION_REPLAY
  MARKETING_EMAIL
  PRODUCT_UPDATES
  PARENTAL
  SPECIAL_CATEGORY_EXPLICIT
}

enum ConsentSource {
  SIGNUP_FORM
  WAITLIST_FORM
  COOKIE_BANNER
  PRIVACY_SETTINGS
  DOUBLE_OPT_IN
  PARENT_PORTAL
}

enum DsrType {
  ACCESS
  RECTIFICATION
  ERASURE
  RESTRICTION
  OBJECTION
  PORTABILITY
  AUTOMATED_DECISION_REVIEW
  COMPLAINT
}

enum DsrStatus {
  RECEIVED
  VERIFYING
  IN_PROGRESS
  EXTENDED
  COMPLETED
  REFUSED
}

enum SuppressionReason {
  UNSUBSCRIBED
  HARD_BOUNCE
  SPAM_COMPLAINT
  ERASURE_REQUEST
}
```

**Prisma 7+** rejects `url` inside `schema.prisma`. Put the connection in `prisma.config.ts`, and give `PrismaClient` a driver adapter (e.g. `@prisma/adapter-pg`) that uses the pooled `DATABASE_URL` at runtime. On Prisma 6, put `url = env("DATABASE_URL")` and `directUrl = env("DIRECT_URL")` back in the `datasource` block instead.

```ts
// prisma.config.ts (repo root) — Prisma 7+
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: { path: 'prisma/migrations' },
  // Migrations need a direct (non-pooled) connection; the app uses a driver adapter at runtime.
  datasource: { url: env('DIRECT_URL') },
});
```

> **Erasure decision:** when a member deletes their account, decide whether the content they authored is deleted or kept with the author shown as "Deleted user". In B2B, the customer workspace is the controller of that content (9.2), so follow its instructions.

### 5.4 Row-Level Security (Supabase)

Missing or wrong RLS is the most common data-exposure bug in AI-generated Supabase apps. The rules:
- Enable RLS on **every** table.
- Never trust `user_metadata`, which users can edit, in policies.
- Never ship the secret or service-role key to the client.

> **No RLS in your database?** MySQL, MariaDB and SQLite have no row-level security. Enforce the same rules in the data layer: scope every query by tenant and user (for example Laravel global scopes and Policies, Rails Pundit policy scopes, or Django custom managers), allow no raw query that skips the scope, and keep the same isolation tests: as anonymous, as a member, and as another tenant.

```sql
-- supabase/policies/001_rls.sql — run after the Prisma migration that creates the tables.

-- 1) Turn RLS on for EVERY table in the exposed schema. RLS on + no policy = no access (safe default).
alter table public.profiles               enable row level security;
alter table public.organizations          enable row level security;
alter table public.memberships            enable row level security;
alter table public.tasks                  enable row level security;
alter table public.comments               enable row level security;
alter table public.consent_records        enable row level security;  -- server-only: no policies
alter table public.marketing_suppressions enable row level security;  -- server-only: no policies
alter table public.data_subject_requests  enable row level security;  -- server-only: no policies
alter table public.audit_logs             enable row level security;  -- server-only: no policies
alter table public.ai_generations         enable row level security;  -- server-only: no policies

-- 2) Helper functions live in a schema the API does not expose.
--    SECURITY DEFINER avoids recursive RLS on memberships; search_path is pinned for safety.
create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_member(org uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org
      and m.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_role(org uuid, allowed text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.memberships m
    where m.organization_id = org
      and m.user_id = (select auth.uid())
      and m.role::text = any (allowed)
  );
$$;

revoke execute on function private.is_member(uuid) from public;
revoke execute on function private.has_role(uuid, text[]) from public;
grant execute on function private.is_member(uuid) to authenticated;
grant execute on function private.has_role(uuid, text[]) to authenticated;

-- 3) Policies. Always name the role (to authenticated) and wrap auth.uid() in a sub-select (faster).
create policy "profiles: read own"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles: update own"
  on public.profiles for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "organizations: members read"
  on public.organizations for select to authenticated
  using (private.is_member(id));

create policy "memberships: members read their org"
  on public.memberships for select to authenticated
  using (private.is_member(organization_id));

create policy "tasks: members read"
  on public.tasks for select to authenticated
  using (private.is_member(organization_id));

create policy "tasks: members create as themselves"
  on public.tasks for insert to authenticated
  with check (private.is_member(organization_id) and creator_id = (select auth.uid()));

create policy "tasks: members update"
  on public.tasks for update to authenticated
  using (private.is_member(organization_id))
  with check (private.is_member(organization_id));

create policy "tasks: owners and admins delete"
  on public.tasks for delete to authenticated
  using (private.has_role(organization_id, array['OWNER', 'ADMIN']));

create policy "comments: members read"
  on public.comments for select to authenticated
  using (private.is_member(organization_id));

create policy "comments: members write as themselves"
  on public.comments for insert to authenticated
  with check (private.is_member(organization_id) and author_id = (select auth.uid()));
```

Run a tenant-isolation test in CI against a local Supabase stack (never production):

```sql
-- tests/rls/tenant_isolation.sql — run against a local Supabase stack (never production).
begin;
  -- Act as user A (a member of org A only).
  set local role authenticated;
  set local request.jwt.claims = '{"sub": "00000000-0000-0000-0000-00000000000a", "role": "authenticated"}';

  -- Must return 0: user A cannot see org B's tasks.
  select count(*) as leaked_rows
  from public.tasks
  where organization_id = '00000000-0000-0000-0000-0000000000b0';

  -- Must fail with an RLS violation: user A cannot write into org B.
  insert into public.tasks (id, organization_id, title, creator_id, updated_at)
  values (gen_random_uuid(), '00000000-0000-0000-0000-0000000000b0', 'should fail',
          '00000000-0000-0000-0000-00000000000a', now());
rollback;
```

### 5.5 Migrations & seed data

- Every schema change is a committed migration. Never edit a migration that has already been applied.
- Make breaking changes in steps: **expand** (add new) → migrate data → **contract** (remove old).
- `supabase/seed.sql` holds synthetic data only: one user per role, two organisations (to test isolation), and edge cases such as an empty workspace and very long text.

### 5.6 Retention & deletion schedule

Defaults to adjust per project. Deletion is implemented as code (scheduled jobs plus tests), not as a policy promise.

| Data | Retention | Trigger | Method |
|---|---|---|---|
| Account profile | Life of account | User deletes account → 30-day grace period | Hard delete; cascades; processor propagation (9.15) |
| Workspace content | Life of workspace | Owner deletes workspace → 30-day recovery | Hard delete |
| Inactive accounts | {{24 months}} without sign-in | Warning email 30 days before | Hard delete |
| Security & audit logs | {{12 months}} audit · {{90 days}} auth events | Rolling | TTL job |
| Application logs (no personal data) | {{30 days}} | Rolling | Provider setting |
| Error-monitoring events | {{30–90 days}} | Rolling | Provider setting |
| Aggregate analytics | {{≤ 25 months}} | Rolling | Provider setting |
| Session replays (if used at all) | ≤ 30 days | Rolling | Provider setting |
| Consent records | Life of the consent + {{6 years}} | — | Archive, then delete |
| Marketing suppression list | Indefinitely (hashed email only) | Needed to honour the opt-out | — |
| Rights requests & complaints | {{3 years}} after closure | — | Delete |
| Invoices & payment records | 6 years from the end of the financial year (UK tax) | — | Delete |
| AI prompts & outputs held by the provider | Provider's minimum (aim for zero retention) | — | Contract (ADR-006) |
| Backups | {{30 days}} rolling | Deleted data ages out of backups; say so in the privacy notice | Never restore deleted records: re-apply the deletion log after any restore |

> **Nigeria:** where no law sets a period, stop storing data no later than 6 months after its purpose is achieved, unless it's needed for legal claims (GAID Art. 49). Tell people your retention policy (9.6).

### 5.7 Backups & disaster recovery

- Turn on automated daily backups. Add point-in-time recovery if RPO < 24 h. Backups stay encrypted and in-region.
- Run a **quarterly restore drill** into a scratch project: record the time taken and any problems, and re-apply the deletion log afterwards.
- Keep a runbook (11.5) for DB restore, key rotation and rollback.

---

<a id="p6"></a>
## Part 6 — API & integration contract `[CORE]`

### 6.1 Conventions

- JSON with camelCase fields, ISO-8601 UTC timestamps and UUIDs.
- Public and partner routes are versioned (`/api/v1/…`).
- Lists use cursor pagination (`?cursor=&limit=` with a server maximum).
- Writes with side effects (payments, emails, AI jobs) accept an `Idempotency-Key`.
- Server Actions are for first-party UI mutations only. Each one validates input and re-checks authorisation (ADR-001).

### 6.2 Endpoint & action inventory

| ID | Type | Name / path | Purpose | Auth · Roles | Input (Zod) | Errors | Rate limit | FR |
|---|---|---|---|---|---|---|---|---|
| API-001 | Action | `createTask` | Create a task | Member+ | `TaskCreate` | 401 403 422 | 60/min/user | FR-002 |
| API-002 | GET | `/api/v1/tasks` | List tasks (cursor) | Member+ | `TaskQuery` | 401 403 | 120/min/user | FR-002 |
| API-003 | POST | `/api/v1/standups` | Generate an AI standup | Member+ | `StandupRequest` | 401 403 429 504 | {{20/day/workspace}} | FR-003 |
| API-004 | POST | `/api/webhooks/billing` | Billing events | Signature | Provider schema | 400 401 | — | 1.8 |
| API-005 | POST | `/api/privacy/consent` | Record a consent decision | Any | `ConsentDecision` | 422 | 30/min/IP | FR-007 |
| API-006 | POST | `/api/privacy/export` | Start a data export | Self (re-auth) | — | 401 429 | 3/day/user | FR-006 |
| API-007 | POST | `/api/account/delete` | Request account deletion | Self (re-auth) | — | 401 409 | 3/day/user | FR-006 |

### 6.3 Error contract

Use RFC 9457 *Problem Details*. The `code` field drives the UI state (10.7), and `ref` lets support find the log entry.

```json
{
  "type": "https://{{domain}}/errors/forbidden",
  "title": "You don't have permission to do that",
  "status": 403,
  "code": "FORBIDDEN",
  "detail": "Only workspace admins can invite members.",
  "ref": "7F3K-92QD"
}
```

| HTTP | `code` | UI state |
|---|---|---|
| 400 / 422 | `VALIDATION_FAILED` (with a `fields` map) | S9 Form validation |
| 401 | `UNAUTHENTICATED` | S8 Session expired |
| 403 | `FORBIDDEN` | S7 Permission denied |
| 404 / 410 | `NOT_FOUND` | S11 Not found / deleted |
| 409 | `CONFLICT` | S12 Sync conflict |
| 429 | `RATE_LIMITED` (+ `Retry-After` header) | S13 Rate limited |
| 502 / 503 | `UPSTREAM_UNAVAILABLE` | S15 Degraded, or S3 Error |
| 504, or a client timeout | `TIMEOUT` | S5 Slow network, then S3 Error |
| 500 | `INTERNAL` | S3 Error |
| No response (fetch fails, `navigator.onLine === false`) | — | S4 No internet |

### 6.4 Validation & content safety

- Zod schemas live in `lib/schemas` and run on the server, which is the authority. Client-side validation only improves the UX.
- Every string has a maximum length, every number has bounds, and unknown fields are rejected.
- Rich text and Markdown (comments, AI output) is rendered through an allowlist sanitiser. No `dangerouslySetInnerHTML` without one.
- File uploads are checked for type (magic bytes, not the file extension) and size. Files go to private buckets and are served through short-lived signed URLs.

### 6.5 Webhooks

**Inbound:**
- Verify the HMAC signature and reject timestamps older than 5 minutes.
- Deduplicate by event ID.
- Return `2xx` quickly and process asynchronously.

**Outbound:**
- Sign payloads.
- Retry with exponential backoff and send failures to a dead-letter queue.
- Never send C3 data in a payload.

### 6.6 Rate limiting & abuse protection

| Surface | Limit (default) | Response |
|---|---|---|
| Sign-in / magic link / password reset | 5 per 15 min per IP and per account | 429 + generic message (no account enumeration) |
| AI endpoints | Per user {{20/hour}}; per workspace {{quota}} | 429 + reset time (S13) |
| Public forms (waitlist, contact) | 10 per hour per IP; bot protection only on these forms | 429 |
| Exports | 3 per day per user | 429 |


---

<a id="p7"></a>
## Part 7 — Identity, access & security `[CORE]`

### 7.1 Authentication

- **Methods:** {{Google OAuth · magic link · passkeys}}. Request the minimum OAuth scopes (`openid email profile`).
- **Sessions:**
  - Short-lived access tokens (Supabase default: 1 hour) with rotating refresh tokens.
  - Refresh silently, and warn before a hard expiry (S8, WCAG 2.2.1).
  - Sign-out clears local drafts and caches.
- **Re-authentication** is required for deleting the account, changing email, exporting data, changing roles and billing.
- **MFA:** TOTP or passkey, required for OWNER/ADMIN roles in workspaces with {{> 5}} members and for any internal admin console.
- **No account enumeration:** sign-in, sign-up and reset give the same response whether or not the account exists.
- **Recovery:** verified email only. Notify the user when the email, MFA or sign-in method changes.
- **Passwords (if used):** check against breached-password lists, allow paste and password managers (WCAG 3.3.8), set no composition rules beyond length ≥ 12, and rate-limit attempts.

### 7.2 Authorisation

Deny by default. Enforce at three layers:
1. **Database:** RLS (5.4), or the same rules enforced in the data layer where the database has no RLS.
2. **Server:** `assertCan(user, action, resource)` in the data-access layer.
3. **UI:** hide or disable controls. This is a convenience, never protection.

| Action | OWNER | ADMIN | MEMBER |
|---|---|---|---|
| View and create tasks, comment | ✅ | ✅ | ✅ |
| Edit any task | ✅ | ✅ | ✅ |
| Delete any task | ✅ | ✅ | ❌ (own drafts only) |
| Invite and remove members | ✅ | ✅ | ❌ |
| Change roles | ✅ | ❌ | ❌ |
| Billing & plan | ✅ | ❌ | ❌ |
| Export workspace data | ✅ | ✅ | ❌ |
| Delete workspace | ✅ (re-auth, type to confirm) | ❌ | ❌ |
| View audit log | ✅ | ✅ | ❌ |

The matrix is also a test fixture: an automated test checks every cell (11.3).

### 7.3 Threat model

Use STRIDE (Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, Elevation of privilege) on each flow in 3.4. These threats are pre-filled because they are the most common failures in AI-built apps:

| ID | Threat | Scenario | Mitigation | Test |
|---|---|---|---|---|
| T-01 | Information disclosure | RLS missing, a policy uses `using (true)`, or queries aren't scoped | RLS on every table (data-layer scoping where the database has none); review every policy; tenant-isolation tests | 5.4 |
| T-02 | Elevation of privilege | The secret key is shipped in a `NEXT_PUBLIC_` variable or the client bundle | Secrets server-only; CI scans the bundle for key patterns | CI |
| T-03 | Elevation of privilege | IDOR: a Server Action trusts an `orgId` or `taskId` sent by the client | Re-derive tenancy on the server; `assertCan()` on every action | Integration |
| T-04 | Tampering | XSS through comments, Markdown or AI output | Allowlist sanitiser; CSP with nonces; no unsanitised HTML | E2E + DAST |
| T-05 | Tampering | Prompt injection in task or comment text that the AI reads | Treat content as data; no side-effect tools without user confirmation; validate output (8.4) | Eval set |
| T-06 | Information disclosure | SSRF through link previews, URL imports or webhook targets | Allowlist schemes and hosts; block private IP ranges; timeouts | Unit |
| T-07 | Tampering | Malicious or oversized uploads | Type and size checks; private buckets; signed URLs; scan shared files | Integration |
| T-08 | Spoofing | Credential stuffing or magic-link abuse | Rate limits, MFA, short-lived single-use links | E2E |
| T-09 | Denial of service | AI or export endpoints used to run up costs | Auth required; quotas; spend caps (8.7) | Load test |
| T-10 | Information disclosure | Third-party scripts, fonts or replay tools leak data | ADR-004; consent-gated loader; CSP | Privacy test (9.9) |
| T-11 | Information disclosure | Verbose errors or stack traces reach the client | Generic messages + `ref`; details only in logs | E2E |
| T-12 | Tampering | Supply chain: malicious, typosquatted or AI-hallucinated packages | Check that a package exists and is maintained before installing; lockfile; automated updates; audit in CI | CI |
| {{T-13}} | {{ }} | {{ }} | {{ }} | {{ }} |

### 7.4 Security controls baseline

- [ ] **HTTP headers:**
  - `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy` that disables camera, microphone, geolocation and payment unless they're needed
- [ ] **Content Security Policy**, generated per request with a nonce. Start in `Content-Security-Policy-Report-Only`, review the reports, then enforce:

```text
default-src 'self';
script-src 'self' 'nonce-{NONCE}' 'strict-dynamic';
style-src 'self' 'unsafe-inline';
img-src 'self' blob: data: https://{{project-ref}}.supabase.co;
font-src 'self';
connect-src 'self' https://{{project-ref}}.supabase.co wss://{{project-ref}}.supabase.co https://{{error-ingest-host}};
frame-src 'none';
frame-ancestors 'none';
base-uri 'self';
form-action 'self';
object-src 'none';
upgrade-insecure-requests
```

  `font-src 'self'` alone blocks the Google Fonts leak (9.9). Add hosts only when a consented or strictly necessary feature needs them (for example, the payment provider's frame on checkout).
- [ ] **Cookies** are `Secure; HttpOnly; SameSite=Lax`. Session cookies are host-only.
- [ ] **CSRF:** Server Actions are POST-only and checked against the origin by Next.js. Route Handlers that change state verify `Origin` and use SameSite cookies.
- [ ] **Encryption:**
  - TLS 1.2+ everywhere.
  - Provider encryption at rest.
  - App-level encryption for C3 fields where feasible.
- [ ] **Least privilege:** separate DB roles for migrations and runtime; production access only through MFA; quarterly access review.
- [ ] **Scanning in CI:** secrets (gitleaks), dependencies (`npm audit` plus Dependabot or Renovate), static analysis (CodeQL or Semgrep). Run DAST (OWASP ZAP baseline) against staging before launch.
- [ ] **Pen test** before launch for High-tier projects, then annually.
- [ ] **Assurance for B2B and public-sector buyers:** Cyber Essentials (UK); ISO 27001 or SOC 2 when enterprise buyers ask.

### 7.5 Logging & audit

| Log this | Never log this |
|---|---|
| Sign-ins, failures, MFA changes, permission denials, role changes, exports, deletions, consent changes, admin actions (to `audit_logs`) | Passwords, tokens, magic links, API keys, full request bodies, email addresses (use IDs), C3 data, payment data, AI prompts that contain personal data |

Logs are structured, carry a correlation ID, are kept for the periods in 5.6, and only named roles can read them.

### 7.6 Vulnerability management

- **Patch windows:** critical within {{7 days}}, high within {{30 days}}. Update dependencies weekly.
- **Disclosure:** publish `/.well-known/security.txt` (RFC 9116) with `Contact` and `Expires`.
- **Secret leaks:** rotate the secret immediately, purge it from git history, review the access logs and assess whether it's a breach (9.20).

---

<a id="p8"></a>
## Part 8 — AI & LLM features `[IF: AI]`

### 8.1 AI feature register

| AI-ID | Feature | Model (pinned) | Inputs (data class) | Output | Human in the loop | Fallback | Est. cost / 1k calls | Eval metric |
|---|---|---|---|---|---|---|---|---|
| AI-01 | Daily standup | `{{model-id}}` | Task titles and status (C2, minimised) | Markdown summary (JSON schema) | User reviews before sharing | "Generate failed. Retry" (S3) | {{£}} | Format validity ≥ 99%, factual errors ≤ 2% |
| AI-02 | Task triage suggestions | `{{model-id}}` | Task title and description | Tags, priority, assignee suggestion | User accepts or rejects | Manual triage | {{£}} | Acceptance rate ≥ {{60%}} |

### 8.2 Data protection for AI

- **Lawful basis:** usually contract (the feature the user asked for) or legitimate interests (9.4). Optional AI on sensitive content needs consent and a DPIA.
- **Provider terms:**
  - A signed DPA.
  - **No training** on your data.
  - A stated prompt retention period (aim for zero or the minimum).
  - A processing region.
  - Sub-processors listed (3.6). Recorded in ADR-006.
- **Minimise and redact:**
  - Send only the fields the task needs.
  - Replace names and emails with placeholders (`[PERSON_1]`) and rehydrate them server-side.
  - Never send C3 data without an approved DPIA.
- **Storage:**
  - AI output is user content, kept and deleted with its parent record.
  - Prompt and response logging is off by default; if enabled for debugging, keep it ≤ 30 days.
  - `ai_generations` records usage only.
- **Transparency:** the privacy notice names the AI provider, its purpose and any international transfer (9.6, 9.17).

### 8.3 Prompt & output contracts

- Prompts live in `lib/ai/prompts/*.ts` with a `PROMPT_VERSION`, are reviewed like code and are recorded in each `ai_generations` row.
- Structured output is validated with Zod. On failure, retry once with the validation error, then show S3.
- Set `maxOutputTokens`, a timeout ({{30 s}}) with a user-facing Cancel button (S14), and up to 2 retries on 429/5xx with jittered backoff.
- Stream long outputs, but render them as sanitised Markdown only.

### 8.4 Safety & security (OWASP Top 10 for LLM Applications)

- Keep system instructions separate from untrusted content, and wrap user or retrieved text in clear delimiters. **Instructions found inside content are data, not commands.**
- Model output never directly executes SQL, shell commands or HTML, and never triggers an action. Tool calls go through server-side authorisation and **explicit user confirmation for anything with side effects**.
- Moderate user-facing generation where misuse is plausible. Include jailbreak and injection cases in the eval set.
- Quotas and spend caps prevent cost exhaustion (8.7).

### 8.5 Quality & evaluation

- Keep a golden dataset of ≥ {{30}} representative cases, including edge cases: empty input, very long input, other languages, injection attempts.
- Set acceptance thresholds per metric (8.1). Run the eval suite in CI whenever the prompt, model or parameters change. Block the merge on regressions.
- Early on, review a weekly sample of {{20}} real outputs (pseudonymised) and feed what you find back into the dataset.

### 8.6 Transparency & legal duties

- **Label AI output** in the UI: "AI-generated — check before sharing". Make it editable before it's used.
- **EU AI Act Art. 50** (applicable since 2 Aug 2026):
  - Tell people when they are interacting with an AI system, unless it's obvious.
  - Generated synthetic audio, images, video or text must be marked in a machine-readable way. Systems already on the market before 2 Aug 2026 have until 2 Dec 2026 to comply with this marking duty.
  - Deployers of deepfakes and of AI-generated text published to inform the public have disclosure duties.
- **AI literacy** (Art. 4, as amended by the Digital Omnibus on AI, Reg. (EU) 2026/1744, in force 27 Jul 2026): take measures that support AI literacy among the people who operate AI systems for you. No specific individual level has to be guaranteed.
- **High-risk check:**
  - Using AI for recruitment, **worker management or monitoring**, education access or scoring, credit or essential services, or biometrics may make the system *high-risk* (AI Act Annex III). The Digital Omnibus on AI deferred these obligations to 2 Dec 2027.
  - Get advice before building in these areas.
- **Automated decisions** with legal or similarly significant effects follow 9.22, including human review.
- **Nigeria:** before deploying emerging technologies such as AI, GAID Art. 43 expects three things: a DPIA (filed with the NDPC as part of the compliance audit return), an assessment of whether to test first in a low-risk environment, and continuous monitoring once deployed. NDPA s.37 gives rights over automated decisions.

### 8.7 Cost & reliability controls

- Per-user and per-workspace quotas; a monthly spend cap with alerts at 50/80/100%; hard stop at the cap.
- Cache identical requests where that's safe. Use the smallest model that passes the evals.
- Wrap AI behind a feature flag so the rest of the app works without it (S15). Configure a fallback model only after it passes the same evals.


---

<a id="p9"></a>
## Part 9 — Privacy, data protection & compliance `[CORE]`

Compliance here is a set of **product features**, each with acceptance criteria and tests like any other: consent UI, privacy centre, deletion jobs, suppression lists, the age check. Legal position as at **4 November 2026**. Not legal advice.

> **Build rule:** implement once, to the strictest common standard across your markets (EU-style opt-in for all non-essential tracking, NDPA's consent and children's rules, UK complaint handling). One codebase then serves every market.

### 9.1 Which laws apply

| Regime | Applies when | Main build impact | Regulator | Maximum penalty |
|---|---|---|---|---|
| **UK GDPR + Data Protection Act 2018**, as amended by the **Data (Use and Access) Act 2025 (DUAA)**: most changes in force 5 Feb 2026, the complaints duty from 19 Jun 2026 | You're established in the UK, or you offer services to or monitor people in the UK | All of Part 9 | ICO (moving to the Information Commission structure under DUAA) | £17.5m or 4% of worldwide annual turnover, whichever is higher |
| **PECR** (as amended by DUAA) | Cookies or similar technologies on UK users' devices; electronic marketing to UK recipients | 9.8–9.11 | ICO | Now up to UK GDPR levels |
| **EU GDPR** | You're established in the EU, or you offer goods or services to or monitor people in the EU (Art. 3(2)) | All of Part 9, plus an **EU representative** (Art. 27) if you have no EU establishment, unless the processing is occasional, low-risk and not large-scale sensitive data | National DPAs | €20m or 4% of worldwide annual turnover |
| **ePrivacy Directive** (national laws) | Cookies and e-marketing for EU users | Opt-in consent for non-essential storage or access; e-marketing consent or soft opt-in | DPAs / national regulators | National |
| **EU AI Act** | AI systems placed on the EU market, or whose output is used in the EU | 8.6 | National authorities, AI Office | Up to €15m or 3% for most obligations |
| **Nigeria Data Protection Act 2023 (NDPA)** + **GAID 2025** | The controller or processor is in Nigeria, the processing happens in Nigeria, **or you process data of people in Nigeria from abroad** (s.2(2)(c)) | All of Part 9, plus the Nigeria rows below | NDPC | Up to the greater of ₦10m or 2% of annual gross revenue (major-importance controllers) or ₦2m or 2% (others) (s.48). Failing to comply with an NDPC order is an offence (s.49). Civil claims are also possible (s.51). |
| **UK Online Safety Act 2023** `[IF: UGC]` | User-to-user or search services with links to the UK | Illegal-content and children's-access risk assessments; reporting and blocking tools. Check the Schedule 1 exemptions and Ofcom's guidance. | Ofcom | £18m or 10% of qualifying worldwide revenue |
| **US** `[IF: US users]` | COPPA: service directed at under-13s, or actual knowledge of them (amended Rule; compliance date 22 Apr 2026) · CAN-SPAM: commercial email · TCPA: marketing texts and calls · state privacy laws (thresholds vary) | 9.11, 9.12 | FTC, state AGs | Per violation |
| {{Other markets}} | e.g. India DPDP Act 2023 & Rules 2025 (phased to 2027), South Africa POPIA, Kenya DPA 2019. **Pakistan** had no comprehensive data protection law as of March 2026: the Personal Data Protection Bill 2023 was not yet passed, but PECA 2016 and the constitutional right to privacy (Art. 14) apply. | {{ }} | {{ }} | {{ }} |

> **You as a processor for overseas clients:** if you're established in the UK or EU and build or host a system for a client abroad (a school, clinic or shop), UK/EU GDPR **processor** duties apply to your processing even when the client and its users are outside the UK/EU (Art. 3(1)). These cover security, records, sub-processors and breach notice to the client. Sign a DPA with the client (9.2, Appendix D5).

### 9.2 Roles, registration & accountability

**Who is the controller?** {{Legal entity}}. In B2C, you are the controller of user data. In **B2B SaaS**, the customer is the controller of what its people put into the workspace and **you are its processor**: publish a customer DPA and a sub-processor list, notify customers of sub-processor changes ({{30 days}}), and help them with rights requests and breaches. You remain the controller for account, billing and marketing data.

| Obligation | Applies to you if | Action | Status |
|---|---|---|---|
| **ICO data protection fee** (UK) | You're a UK controller processing personal data electronically. Exemptions are narrow. | Pay before G2: Tier 1 £52 (micro: ≤ 10 staff **or** ≤ £632k turnover); Tier 2 £78 (≤ 250 staff or ≤ £36m turnover); Tier 3 £3,763. £5 off by direct debit. Non-payment can cost up to £4,350. | {{ }} |
| **EU representative** (Art. 27) | No EU establishment, but you target or monitor people in the EU | Appoint one in a member state where your users are | {{ }} |
| **UK representative** | You're outside the UK but target or monitor people in the UK | Appoint one | {{ }} |
| **DPO** (UK/EU Art. 37) | Your core activities involve large-scale regular and systematic monitoring, or large-scale special category data | Appoint and publish contact details; otherwise name a privacy lead | {{ }} |
| **NDPC registration as a Data Controller/Processor of Major Importance (DCPMI)** | You're domiciled, resident or **operating in Nigeria** (which, under GAID Art. 8(2), **includes targeting people in Nigeria**) and process the data of **more than 200** people in Nigeria in any 6 months, or you work in a designated sector | Register with NDPC. Tiers by volume: OHL 200–1,000 (₦10,000); EHL 1,000–5,000 (₦100,000); UHL > 5,000 (₦250,000). A DCPMI must also designate a **DPO** (NDPA s.32; GAID Art. 7(i)). | {{ }} |
| **NDPA compliance audit** (GAID Art. 7(b)) | NDPA applies to you | Audit within 15 months of starting business, then annually | {{ }} |
| **Compliance Audit Returns** (GAID Art. 7(c), 10) | UHL/EHL DCPMI | File through a licensed DPCO (Art. 10(14)): by **31 March** each year if established before 12 Jun 2023; otherwise **within 15 months of establishment**, then annually (Art. 10(7)–(8)). Late filing adds a 50% penalty (Art. 10(9)). | {{ }} |
| **NDPA staff training** (GAID Art. 7(v)) | NDPA applies to you | Train staff within 6 months of starting business, then annually | {{ }} |

> **Nigeria nuance:** a UK-based app with Nigerian users is covered by the NDPA (s.2(2)(c)). Under GAID Art. 8(2), **targeting people in Nigeria counts as "operating in Nigeria"**, even with no office there. Once you process the data of more than 200 Nigerian data subjects in 6 months, expect major-importance (DCPMI) duties: registration, a DPO, audits and returns. Confirm the details with a licensed DPCO before you reach that number.

**Accountability pack.** Keep these in `docs/compliance/`, versioned:
- RoPA (9.3)
- LIAs (Appendix A1) and DPIAs (A2)
- Data protection policy and retention schedule (5.6)
- Processor register and signed DPAs (3.6)
- Cookie register (9.8)
- Breach log (A4) and rights-request log (A3)
- Training records
- An **Appropriate Policy Document** if you rely on certain DPA 2018 Schedule 1 conditions for special category data

### 9.3 Record of Processing Activities (RoPA)

The privacy notice is **generated from this table**: if a purpose isn't recorded here, the product doesn't do it.

| ID | Activity / purpose | People | Personal data | Sensitive? | UK/EU basis (Art. 6) | NDPA basis (s.25) | Art. 9 / s.30 condition | Recipients | Transfers & mechanism | Retention |
|---|---|---|---|---|---|---|---|---|---|---|
| ROPA-01 | Accounts & authentication | Users | Name, email, auth IDs, IP, session data, age-check result | No | Contract | s.25(1)(b)(i) contract | — | Auth provider, email provider | {{ }} | Life of account |
| ROPA-02 | Workspace features (tasks, comments) | Users; people mentioned in content | Content, names | Incidental | Contract | s.25(1)(b)(i) | — | DB host | {{ }} | Life of workspace |
| ROPA-03 | AI summaries & suggestions | Users | Minimised task text | Avoid | Contract | s.25(1)(b)(i) | — | AI provider | {{US · DPF/SCCs}} | Provider minimum |
| ROPA-04 | Security, fraud prevention & audit | Users, visitors | IP, device, events | No | Legitimate interests (LIA-01) | s.25(1)(b)(v) | — | Hosting, monitoring | {{ }} | 90 days–12 months |
| ROPA-05 | Aggregate product analytics | Users, visitors | Pseudonymous usage events | No | Legitimate interests; UK storage exception with opt-out, EU consent (9.8) | Consent (GAID Art. 19) | — | Analytics processor | {{ }} | ≤ 25 months |
| ROPA-06 | Session replay (optional) | Visitors who consent | Masked interaction recordings | No | Consent | Consent | — | Replay vendor | {{ }} | ≤ 30 days |
| ROPA-07 | Transactional email | Users | Email, account events | No | Contract | s.25(1)(b)(i) | — | Email provider | {{ }} | {{ }} |
| ROPA-08 | Marketing email & waitlist | Subscribers | Email, name, preferences | No | Consent / soft opt-in (PECR reg. 22) | Consent (GAID Art. 18(1)(a)) | — | Email provider | {{ }} | Until unsubscribe; then hash in the suppression list |
| ROPA-09 | Support | Users | Messages, attachments | Possibly | Contract / legitimate interests | s.25(1)(b)(i)/(v) | {{if health data appears}} | Help-desk tool | {{ }} | {{24 months}} |
| ROPA-10 | Billing | Customers | Name, billing address, payment tokens (no card numbers), invoices | No | Contract + legal obligation (tax) | s.25(1)(b)(i)/(ii) | — | Payment provider | {{ }} | 6 years |
| ROPA-11 | Rights requests & complaints | Requesters | Identity check, correspondence | Possibly | Legal obligation | s.25(1)(b)(ii) | {{ }} | — | — | 3 years |
| {{ROPA-12}} | {{ }} | | | | | | | | | |

### 9.4 Choosing the lawful basis

| Processing | Typical basis (UK/EU) | Typical basis (NDPA) | Notes |
|---|---|---|---|
| Running the service the user asked for | Contract | s.25(1)(b)(i) | Only what's *necessary*. Analytics and marketing never count as necessary. |
| Security, fraud prevention, abuse handling | Legitimate interests | s.25(1)(b)(v) | Document an LIA. Under the DUAA, some purposes (e.g. crime prevention, safeguarding, emergencies) are **recognised legitimate interests** in the UK with no balancing test. They are narrow, and don't cover commercial analytics. |
| Aggregate product analytics | Legitimate interests (plus the cookie rules in 9.8) | Consent (GAID Art. 19 cookies) | |
| Non-essential cookies, replay, ad pixels | Consent | Consent | |
| B2C marketing email/SMS | Consent, or the UK/EU soft opt-in | Consent (GAID Art. 18(1)(a)) | 9.11 |
| B2B marketing to corporate addresses | Legitimate interests (UK PECR permits it with an opt-out) | Consent is the safe default | |
| Special category data | Explicit consent (typical for apps) | s.30(1)(a) consent | DPIA (9.13) |
| Children's data relying on consent | Parental consent below the national age | Parental consent under 18 (s.31) | 9.12 |
| Tax and accounting records | Legal obligation | s.25(1)(b)(ii) | |

**Legitimate interests require a documented LIA** (Appendix A1): purpose test, necessity test and balancing test. Under the NDPA, legitimate interests are invalid where they override the person's rights, conflict with the other bases, or go beyond what the person would reasonably expect (s.25(2)). The GAID expects the assessment to be completed *before* processing starts (Art. 26).

**Valid consent** is freely given, specific, informed, unambiguous and an affirmative act. It is not bundled with the terms, and it is as easy to withdraw as to give (UK/EU Art. 7; NDPA s.26, s.35). Under the NDPA:
- Silence or inactivity is not consent (s.26(3)).
- Pre-selected boxes are invalid (s.26(7)(a)).
- You must tell people about their right to withdraw *before* they consent (s.26(4)).
- You carry the burden of proof (s.26(1)).

### 9.5 Privacy by design & default

- [ ] **DP-01** Collect only fields with a documented purpose (5.2). Mark optional fields "optional".
- [ ] **DP-02** Defaults are the most protective: profiles private, marketing off, analytics and replay off until consent, location off.
- [ ] **DP-03** Store results, not evidence: an age-check result rather than a date of birth, and no ID scans unless a specialist provider handles them.
- [ ] **DP-04** Pseudonymise analytics and logs with internal IDs, never emails.
- [ ] **DP-05** C3 data lives in separate tables with stricter RLS and app-level encryption where feasible.
- [ ] **DP-06** Retention and deletion are automated (5.6).
- [ ] **DP-07** An in-product privacy centre covers export, delete, consents, marketing preferences, cookie settings and complaints.
- [ ] **DP-08** Show a just-in-time notice at every point where data is collected (9.6).
- [ ] **DP-09** UK services likely to be accessed by children take the **children's higher protection matters** into account in their design (UK GDPR Art. 25(1A)–(1B), inserted by DUAA s.81, in force since 5 Feb 2026). See also the Age Appropriate Design Code (9.12).
- [ ] **DP-10** No dark patterns: Accept and Reject carry equal weight, there's no confirmshaming, cancelling is easy, and nothing is pre-ticked.
- [ ] **DP-11** Every PR that touches personal data answers the privacy questions in the PR template (11.4).

### 9.6 Transparency: privacy notice & just-in-time notices

The privacy notice **must** cover the items below (UK/EU Arts. 13–14; NDPA s.27; GAID Art. 27(3)):

- [ ] Controller identity, place of business and contact details; representative and DPO, where applicable
- [ ] Each purpose **and its lawful basis**, including the legitimate interests pursued
- [ ] The categories of data, and their source where they weren't collected from the person
- [ ] Recipients, naming key processors and the AI provider
- [ ] International transfers and the safeguards used (9.17)
- [ ] Retention periods, or the criteria for them (5.6)
- [ ] Rights and how to use them (9.15), including withdrawing consent and **objecting to direct marketing**
- [ ] Your complaints route (9.16), and the right to complain to the **ICO**, the relevant **EU DPA** and the **NDPC** (NDPA s.27(1)(f))
- [ ] Automated decision-making and profiling: meaningful information about the logic involved (UK/EU), plus its significance, the envisaged consequences, and the right to object and challenge (NDPA s.27(1)(g))
- [ ] Whether giving the data is a requirement, and what happens if someone doesn't
- [ ] Cookies and tracking, with a link to the cookie notice
- [ ] A child-friendly version, if children can use the service
- [ ] Version number, effective date and a changelog

Write it in plain language, in layers, linked from every footer and every collection point. It must describe what the product *actually* does, generated from the RoPA, never copied. Update it **before** new processing starts, and tell users about material changes.

**Just-in-time examples:**
- *Sign-up:* "We use your email to create your account and send essential service messages. See our [Privacy Notice]."
- *Waitlist:* "We'll email you **once**, when we launch. Want occasional product news too? ☐ Yes (optional)."
- *AI feature:* "Your task text is sent to {{provider}} to write this summary. It isn't used to train their models."

### 9.7 Consent architecture

| ID | Requirement |
|---|---|
| CR-01 | One choice per purpose (analytics, replay, marketing …), kept separate from accepting the terms. |
| CR-02 | Consent takes an affirmative action. No pre-ticked boxes, and never "by continuing you agree". |
| CR-03 | Before asking, say who is asking (including named third parties), what for, and how to withdraw (NDPA s.26(4)). |
| CR-04 | Withdrawing takes the same effort as consenting: a persistent "Privacy settings" link, and the same number of clicks (UK/EU Art. 7(3); NDPA s.35(2)). |
| CR-05 | Record who, what, when, how, the notice version and the **exact wording** in the append-only `consent_records` table. Include these records in access requests. |
| CR-06 | Enforce consent at runtime: the server checks it before any marketing send, and the client loader checks it before any script loads. |
| CR-07 | Ask again when the purpose changes materially or a new third party is added (bump `CONSENT_VERSION`). |
| CR-08 | Never make consent a condition of the service unless the processing is genuinely necessary for it. |
| CR-09 | Where the law requires it, children's consent comes from a parent (9.12). |

**Sign-up form pattern:**

```text
Email           [                    ]      [Continue with Google]
Year of birth   [ Select ▾ ]                 ← no default, no hint of the cut-off (9.12)
☐ Send me product news and tips (optional; unsubscribe any time)
By creating an account you agree to our Terms. Our Privacy Notice explains how we use your data.
[ Create account ]
```

> Don't add an "I agree to the Privacy Policy" checkbox. A privacy notice is information, not a contract or a consent. Asking people to "agree" to it misrepresents the lawful basis.

**Client consent module** (`lib/privacy/consent.ts`, type-checked):

```ts
// lib/privacy/consent.ts — first-party consent state and a consent-gated script loader (client only)
export type ConsentPurpose = 'analytics' | 'replay' | 'marketing';
export type ConsentState = Record<ConsentPurpose, boolean> & { version: string; decidedAt: string };

const COOKIE_NAME = 'consent_v1'; // strictly necessary: it only remembers the choice itself
export const CONSENT_VERSION = '2026-11-01'; // bump when purposes or vendors change, so people are asked again

export function readConsent(): ConsentState | null {
  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!raw) return null;
  try {
    const state = JSON.parse(decodeURIComponent(raw)) as ConsentState;
    return state.version === CONSENT_VERSION ? state : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: Record<ConsentPurpose, boolean>): ConsentState {
  const state: ConsentState = { ...choice, version: CONSENT_VERSION, decidedAt: new Date().toISOString() };
  const sixMonths = 60 * 60 * 24 * 182;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(state))}; Max-Age=${sixMonths}; Path=/; SameSite=Lax; Secure`;
  window.dispatchEvent(new CustomEvent<ConsentState>('consentchange', { detail: state }));
  // Evidence for the append-only consent log (ConsentRecord); keepalive survives navigation.
  void fetch('/api/privacy/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
    keepalive: true,
  });
  return state;
}

/** Injects a third-party script only after its purpose is granted. On withdrawal, clear the vendor's cookies and reload. */
export function loadWhenConsented(purpose: ConsentPurpose, src: string, onLoad?: () => void): void {
  const inject = (state: ConsentState | null) => {
    if (!state?.[purpose] || document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    if (onLoad) s.addEventListener('load', onLoad);
    document.head.appendChild(s);
  };
  inject(readConsent());
  window.addEventListener('consentchange', (e) => inject((e as CustomEvent<ConsentState>).detail));
}
```

For Microsoft Clarity: load its official snippet only after consent, then immediately pass the signal with `window.clarity('consentv2', { ad_Storage: "denied", analytics_Storage: "granted" })`. Clarity has enforced consent signals for UK, EEA and Swiss traffic since 31 October 2025. For Google tags, use Consent Mode with every type set to `denied` by default.

### 9.8 Cookies, local storage, SDKs & tracking technologies

**Scope:** cookies, `localStorage`/`sessionStorage`/IndexedDB, pixels, fingerprinting, and mobile SDKs that read device identifiers. The ICO calls these "storage and access technologies" (final guidance, 29 Apr 2026).

| Category | Examples | UK (PECR as amended) | EU (ePrivacy) | Nigeria (GAID Art. 19) |
|---|---|---|---|---|
| Strictly necessary | Session and auth cookies, CSRF, load balancing, the consent-choice cookie, basket | No consent | No consent | No tick-box for necessary cookies that don't process sensitive, financial or privately stored data (Art. 19(5)); still disclose them |
| Security & fraud prevention | Bot defence, account security | No consent (DUAA exception) | Case by case. Usually fine if it's strictly for security of the requested service. | Treat as necessary only if it's limited to security |
| Appearance & preferences | Theme, language, layout | **No consent** if solely to remember the user's own choices. Give clear information and a free, simple opt-out. | Consent unless strictly necessary for a function the user requested | Consent ("specific selection") |
| Statistics / analytics (first-party, aggregate, solely to improve your service) | Page views, feature usage | **No consent** if that is the *sole* purpose. Give clear information and a free, simple opt-out. | **Consent**, apart from narrow national exemptions (e.g. CNIL-approved audience measurement) | **Consent** |
| Session replay, heatmaps, user-level journeys | Hotjar, Clarity, replay SDKs | Consent | Consent | Consent |
| Advertising, retargeting, social pixels | Meta, TikTok, Google Ads, LinkedIn | Consent | Consent | Consent |
| Third-party embeds that set cookies or read the device | YouTube, maps, chat widgets | Consent, or click-to-load (S17) | Consent / click-to-load | Consent / click-to-load |

**Banner & settings requirements (all markets):**

1. **Nothing non-essential runs before a choice is made.** No implied consent, and scrolling doesn't count.
2. The first layer has **Accept all** and **Reject all** with equal prominence (size, colour, position), plus **Manage choices**.
3. It's visible without scrolling on the homepage and every entry page. For Nigeria it must also cover the middle, left or right of the homepage; a bottom bar is treated as a transparency failure (GAID Art. 7(l), Art. 19). A centred or side panel satisfies every market.
4. Every category is **off by default**. The GAID lists pre-selected non-necessary cookies as a complaint category.
5. Name the providers and purposes, and link to the cookie notice table.
6. Store the choice in a necessary cookie with a version. Ask again only on material change, and never nag after a rejection.
7. A **"Cookie settings"** link in the footer of every page lets people change their mind.
8. Withdrawal works immediately: stop the vendor, delete its cookies where possible, and reload.
9. For UK exempt analytics, show the opt-out toggle and an explanation in cookie settings.
10. Respect **Global Privacy Control** where US state law requires it. As good practice, treat it as "Reject non-essential" everywhere.
11. In mobile apps, apply the same rules to SDKs. Cross-app tracking needs the iOS **App Tracking Transparency** prompt. Declare SDK data use in privacy manifests and store labels (9.25).

**Cookie & storage register** (published in the cookie notice):

| Name | Provider | Purpose | Category | Duration | 1st/3rd party | Basis or exception | Set before consent? |
|---|---|---|---|---|---|---|---|
| `consent_v1` | Us | Remembers the cookie choice | Strictly necessary | 6 months | 1st | Strictly necessary | Yes |
| `sb-*-auth-token` | Supabase (ours) | Keeps you signed in | Strictly necessary | Session / refresh | 1st | Strictly necessary | Yes (after sign-in) |
| {{ }} | | | | | | | |

### 9.9 Third-party requests & embedded resources (the "Google Fonts problem")

**Why it matters.** Every request the visitor's browser makes to another company's server discloses their **IP address**, user agent and, through the Referer, the page they're on. An IP address is personal data: an "online identifier" under the NDPA (s.65) and the GDPR (Art. 4(1)). In 2022 a Munich court ordered a site that loaded Google Fonts from Google's servers without consent to pay €100 in damages (LG München I, 3 O 17493/20), and a wave of claim letters followed. Under the NDPA, the same request can also be an unrecorded cross-border transfer (s.41).

**Rule (ADR-004).** Until consent is given, the browser may contact only:
- your own domains;
- your backend (e.g. `{{project-ref}}.supabase.co`);
- services strictly necessary for the specific page, such as the payment provider on checkout.

Everything else is consent-gated or click-to-load.

| Resource | Risky pattern | Compliant pattern |
|---|---|---|
| Web fonts | `<link href="https://fonts.googleapis.com/…">` or a CSS `@import` | `next/font/google` (downloads at build time and self-hosts; the browser sends no requests to Google), `@fontsource/*` packages, or local `woff2` files with `font-src 'self'` |
| JS/CSS libraries | `<script src="https://cdn.jsdelivr.net/…">`, unpkg, cdnjs | Install from npm and bundle |
| Icons | Icon-font CDNs | Bundled SVG icons (e.g. `lucide-react`) |
| Images | Hotlinked stock photos or remote avatars | Serve from your own storage or CDN |
| Avatars | Gravatar (it receives a hash of the email) | Uploaded avatar in your own storage, or generated initials |
| Maps | Map JavaScript loaded with the page | A static map image rendered server-side, or click-to-load with a notice (S17) |
| Video | A YouTube or Vimeo iframe on load | A facade (thumbnail + "Load video — YouTube will set cookies"). `youtube-nocookie.com` still contacts Google on play. |
| Social embeds & share buttons | Vendor SDK widgets | Plain links |
| Chat or support widget | Loaded on every page | Loaded on click ("Chat with us"), after a notice |
| CAPTCHA | On every page | Only on the form that needs it, with a privacy-friendly option, disclosed |
| Payments | The provider's script on every page | Load it on checkout and billing pages only. If you load it site-wide for fraud signals, justify that in an ADR and disclose it. |
| Error monitoring / RUM | SDK with session replay on | Replay off or consent-gated; PII scrubbing; EU data region |
| Analytics & pixels | In the root layout | Only through the consent loader (9.7), or privacy-first aggregate analytics |

**Verify it three ways:**
1. **Manually:** open DevTools → Network in a fresh profile, hard-reload and check every domain.
2. **CSP:** the policy in 7.4 enforces the allowlist.
3. **Automated CI test** (it fails when a page contacts a third party before consent):

```ts
// tests/privacy/no-third-party-before-consent.spec.ts — fails CI if any page contacts a third party before consent
import { test, expect, type Page } from '@playwright/test';

const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS ?? 'localhost,127.0.0.1').split(','); // add your app domain + <project-ref>.supabase.co
const PAGES = (process.env.PAGES ?? '/,/pricing,/signup,/login').split(',');

function recordThirdPartyHosts(page: Page): Set<string> {
  const hosts = new Set<string>();
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (!url.protocol.startsWith('http')) return; // ignore data:, blob:
    const allowed = ALLOWED_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
    if (!allowed) hosts.add(url.hostname);
  });
  return hosts;
}

for (const path of PAGES) {
  test(`no third-party requests before consent: ${path}`, async ({ page }) => {
    const hosts = recordThirdPartyHosts(page);
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // catch late-loading tags
    expect([...hosts], 'third-party hosts contacted before consent').toEqual([]);
  });
}

test('nothing non-essential loads after "Reject all"', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject all' }).click();
  const hosts = recordThirdPartyHosts(page);
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  expect([...hosts], 'third-party hosts contacted after rejecting').toEqual([]);
});
```

### 9.10 Analytics & session replay

**Preferred analytics setup:**
- Aggregate, first-party or processor-run analytics.
- No cross-site tracking, and no vendor reuse of your data for its own purposes.
- IP addresses truncated or discarded; UK/EU hosting; short retention.

**Legal footing:**
- **UK:** may use the *statistical purposes* exception for storage and access (9.8).
- **EU and Nigeria:** get consent. A "cookieless" tool only avoids the consent rule if it truly stores and reads nothing on the device; fingerprinting counts as access.

**Session replay** is optional. If you use it at all:

- [ ] **SR-01** Consent only. It's a separate "Session recordings" choice and off by default.
- [ ] **SR-02** Use the **strictest masking mode** (all text and inputs masked). Mark sensitive elements as well: Hotjar `data-hj-suppress`, Clarity `data-clarity-mask="True"`.
- [ ] **SR-03** Never record auth, password reset, payment, billing, account and privacy settings, admin pages, or any screen showing C3 data (health, children, location).
- [ ] **SR-04** Don't link recordings to identity: no `identify` calls or tags carrying emails or names.
- [ ] **SR-05** Keep recordings ≤ 30 days, restrict access to named people, and don't export them.
- [ ] **SR-06** Name the vendor, the purpose and the retention in the cookie and privacy notices.
- [ ] **SR-07** Before launch, watch 10 staging recordings and confirm nothing personal shows. Pay special attention to custom inputs: rich-text editors, `contenteditable`, canvas and shadow DOM.

### 9.11 Electronic marketing: email, SMS, push, WhatsApp `[IF: marketing]`

**Classify every message first.**

| Type | Examples | Marketing? | Marketing consent needed? |
|---|---|---|---|
| Transactional / service | Verification, password reset, receipts, security alerts, legal or service changes | No. Keep promotions out of these. | No |
| Marketing | "We launched", newsletters, offers, re-engagement, product tips with promotional intent | **Yes** | **Yes** (rules below) |

> A "We launched" email to a waitlist **is marketing**. The waitlist consent covers only what you said you'd send at sign-up.

**Rules by market:**

| Market | Rule |
|---|---|
| **UK** (PECR regs 22–23) | **Individuals** (including sole traders and partnerships) need consent, or the **soft opt-in**: their details were collected during a sale or negotiation, you're marketing your own similar products, and they had an opt-out when you collected the details and in every message. **Corporate addresses** need no consent, but you must identify yourself and give an opt-out; staff can still object (UK GDPR Art. 21). Charities have a soft opt-in for charitable purposes (DUAA). |
| **EU** (ePrivacy + national law) | Consent, or the soft opt-in for existing customers. Double opt-in is strongly advised, and is the practical standard in Germany for proving consent. |
| **Nigeria** (NDPA s.36; GAID Art. 18(1)(a)) | Consent for direct marketing. People can object at any time, and you must stop (s.36(3)–(4)). Withdrawing must be as easy as consenting (s.35(2)). |
| **US** (CAN-SPAM; TCPA for texts) | Opt-out model. Every commercial email needs accurate headers and subject line, a **valid physical postal address** and a working opt-out honoured within **10 business days**. Marketing texts generally need prior express written consent. |

**Every marketing message MUST:**

- [ ] **EM-01** Identify the sender (brand + legal entity).
- [ ] **EM-02** Have a visible **one-step unsubscribe** that needs no sign-in.
- [ ] **EM-03** Send `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers (RFC 8058). Gmail and Yahoo require one-click unsubscribe from bulk senders.
- [ ] **EM-04** Include a **postal address**, which CAN-SPAM requires. UK companies must also show their registered name, number, place of registration and registered office on websites and in business correspondence, including email.
- [ ] **EM-05** Say why the person is getting it: "You joined the {{App}} waitlist on {{date}}."
- [ ] **EM-06** Process unsubscribes immediately (Gmail expects within 2 days; CAN-SPAM allows 10 business days) and add the address to the **global suppression list**.
- [ ] **EM-07** Never email a bought or scraped list, or an import with no consent evidence.
- [ ] **EM-08** Offer preference categories where useful. "Unsubscribe from all" is always there.
- [ ] **EM-09** After an erasure request, keep a **hashed** suppression entry so the address is never re-added.
- [ ] **EM-10** Deliverability: SPF, DKIM and DMARC on the sending domain; marketing on a subdomain; spam complaint rate below 0.1%, and never reaching 0.3% (Gmail's guidelines); bounces handled.

**Footer template:**

```text
You're receiving this because you joined the {{App}} waitlist on {{12 Oct 2026}}.
Unsubscribe in one click: {{link}} · Email preferences: {{link}} · Privacy notice: {{link}}
{{Legal entity name}} · {{Registered office / postal address}} · Company no. {{12345678}} (registered in {{Scotland}})
```

**Waitlist flow:**
1. The form records the consent wording and a timestamp.
2. (EU/Germany) Send a double opt-in confirmation email.
3. Send the **launch email only**.
4. Ask for ongoing updates as a separate, optional choice.

**Push, SMS and WhatsApp:**
- The OS notification permission is **not** marketing consent. Marketing pushes need their own in-app toggle, off by default.
- SMS follows the email rules.
- WhatsApp Business requires an opt-in.


### 9.12 Children & age assurance `[IF: under-18s could use it]`

**Step 1: choose a position.**

| Position | What it takes |
|---|---|
| **Adults only (18+)**: simplest | Terms say 18+. A neutral age check at sign-up blocks under-18s. Accounts found to be underage are suspended and their data deleted. There's a "report an underage user" route. This sidesteps the NDPA parental-consent rule, which applies to everyone under 18. |
| **Teens allowed** | Thresholds per market (below), parental consent where it's required, child-appropriate defaults, a DPIA |
| **Child-directed** (e.g. under-13s, education) | **High risk.** Verifiable parental consent (COPPA, if US), full Age Appropriate Design Code conformance, a DPIA and specialist review |

**Thresholds by market:**

| Market | Who is a child | When parental consent is needed for online services that rely on consent | Notes |
|---|---|---|---|
| **UK** | Under 18 (Age Appropriate Design Code scope) | Under **13** (DPA 2018 s.9) | The AADC's 15 standards apply to services *likely to be accessed* by under-18s. DUAA adds the children's higher protection matters (DP-09). |
| **EU** | Under 18 | Under **16** by default; member states may set 13–16 (e.g. Ireland, Germany and the Netherlands 16; France 15; Italy 14; Belgium, Denmark and Sweden 13). Check current national law. | Art. 8: make reasonable efforts to verify parental consent |
| **Nigeria** | Under **18** (Child's Rights Act; NDPA s.65) | Under **18** whenever you rely on consent (s.31(1)). Exceptions: vital interests; education, medical or social care by a professional bound by confidentiality; court proceedings (s.31(4)). | You must **verify age and consent** with appropriate mechanisms (s.31(2)). Government-approved ID counts as appropriate (s.31(3)). The NDPC must make regulations for children aged 13+ who request online services themselves (s.31(5)). |
| **US** | — | Under **13** (COPPA verifiable parental consent) | Applies to child-directed services, or where you have actual knowledge of under-13s |

**Step 2: design the age check.**

- [ ] **AG-01** Ask neutrally: year (and month) of birth, with no default and no hint of the cut-off. Compute the age on the server and store only the **result** (`age_status`) and the **method**, not the date of birth.
- [ ] **AG-02** Stop instant retries after a block: a short-lived, strictly necessary session flag is enough.
- [ ] **AG-03** Match the strength of the check to the risk. Self-declaration suits low-risk services. Use age estimation or ID checks through a specialist provider (so you never hold the documents) where the risk is higher or the NDPA's verification duty applies.
- [ ] **AG-04** Parental consent flow, where it applies:
  1. Collect the parent's email.
  2. Send a link explaining the processing in plain language.
  3. The parent confirms. Record a `PARENTAL` consent record.
  4. Activate the account with child defaults. Use stronger verification for higher-risk services.
- [ ] **AG-05** Child defaults (AADC):
  - high privacy settings and no public profile;
  - geolocation and profiling off;
  - no nudge techniques and no marketing;
  - parental controls the child can see;
  - privacy information the child can understand.
- [ ] **AG-06** Never use children's data for marketing, profiling or ads. No session replay or AI processing of children's content without a DPIA.
- [ ] **AG-07** When you learn an account is underage: suspend it, then within {{14}} days either get valid parental consent or delete the data.
- [ ] **AG-08** If users can communicate or share content and you have UK users, complete the Online Safety Act children's-access and risk assessments (9.1).

### 9.13 Special category & sensitive data `[IF: health, biometric, etc.]`

- **What counts:** health (including wellbeing and fitness data such as heart rate, sleep or symptoms where they reveal health), biometric data used for identification, genetic data, sex life or orientation, religion or beliefs, racial or ethnic origin, political opinions, trade-union membership. NDPA s.65 has a similar list.
- **Two legal conditions are needed:** an Art. 6 basis **plus** an Art. 9 condition (for consumer apps, usually **explicit consent**). In the UK, some DPA 2018 Schedule 1 conditions also require an Appropriate Policy Document. In Nigeria, a s.30 condition is needed.
- **Explicit consent UX:** a separate, specific statement, e.g. "I agree to {{App}} processing my heart-rate and sleep data to show trends and alerts." It's never bundled. Withdrawal stops the processing and switches the feature off.
- **Controls:**
  - A DPIA (mandatory; 9.21).
  - Segregated tables with app-level encryption where feasible.
  - Owner-only RLS, plus explicitly shared carers.
  - Access logging and UK/EU residency.
  - No analytics, replay or error-monitoring payloads on these screens.
  - AI only with DPIA approval and provider assurances.
  - Short retention.
- **Monitoring other people** (family, carers): the monitored adult must be told and must consent themselves. For a child, the parent acts, but the child is told in age-appropriate terms.
- **Medical device check:** software intended to diagnose, prevent, monitor, predict, treat or alleviate disease (beyond general wellness) may be a **medical device** under UK MDR 2002 or EU MDR 2017/745. Get regulatory advice before making clinical claims. Selling to the NHS brings in DTAC, the DSPT and clinical safety standards (DCB0129 for manufacturers).
- **Connected devices (UK PSTI regime, since 29 Apr 2024):** consumer connectable products need no universal default passwords, a published vulnerability disclosure policy, and a stated minimum security-update period. Also: secure pairing, encrypted transport and signed firmware updates.

### 9.14 Location, tracking & worker monitoring `[IF: location / monitoring]`

- **Precise location is high-risk:**
  - Collect it only while a feature needs it (e.g. during an active delivery or shift), at the lowest precision that works, with a visible indicator.
  - Stop when the task ends. Never track workers outside working time.
- **Workers** (employees, drivers, contractors):
  - Publish a monitoring policy: what is monitored, when, why, and who sees it.
  - Do a DPIA, following the ICO's guidance on monitoring workers.
  - The basis is usually legitimate interests or contract. Consent is rarely valid because of the power imbalance.
  - No covert monitoring except in exceptional, documented circumstances.
  - Workers can see their own data. Retention is short (e.g. route history {{30–90 days}}).
  - Data isn't used for undisclosed purposes such as discipline.
  - If AI scores or monitors workers, see 8.6 (AI Act high-risk).
- **Mobile OS:**
  - Request "while using the app" first, and justify "always" or background access.
  - Android shows a foreground-service notification during tracking.
  - Disclose location use in the store listings.
- **Sharing location** (e.g. a customer sees a driver approaching): only during the active job, approximate where possible, through expiring links.

### 9.15 Data subject rights: operations

| Right | UK/EU | NDPA | How it's fulfilled | Target |
|---|---|---|---|---|
| Be informed | Arts. 13–14 | s.27 | Privacy notice and just-in-time notices | — |
| Access | Art. 15 | s.34(1)(a)–(b) | Self-service **Download my data** (JSON + CSV), plus a manual search for everything else: logs, emails, support | ≤ 30 days |
| Rectification | Art. 16 | s.34(1)(c) | Edit profile; request form | ≤ 30 days |
| Erasure | Art. 17 | s.34(1)(d), 34(2) | In-app **Delete account** → 30-day grace → hard delete + processor propagation | ≤ 30 days |
| Restriction | Art. 18 | s.34(1)(e) | A restriction flag plus a manual process | ≤ 30 days |
| Portability | Art. 20 | s.38 | Machine-readable JSON export | ≤ 30 days |
| Object (absolute for direct marketing) | Art. 21 | s.36 | Unsubscribe and marketing toggles; objection form | Marketing: immediately |
| Withdraw consent | Art. 7(3) | s.35 | Privacy and cookie settings | Immediately |
| Automated decisions | UK Arts. 22A–22D · EU Art. 22 | s.37 | "Request human review" (9.22) | ≤ 30 days |
| Complain | To you (UK s.164A) and to the regulator | s.46 (to NDPC) | 9.16 | Acknowledge ≤ 30 days |

**Timelines:**
- **UK/EU:** one month from receipt, extendable by two months for complex or numerous requests (tell the person within the first month). The UK DUAA confirms that searches need only be reasonable and proportionate, and that the clock pauses while you wait for clarification you genuinely need.
- **NDPA:** "without constraint or unreasonable delay". Operate to 30 days at most.

**Operating checklist:**

- [ ] **DSR-01** Accept requests through any channel (privacy@, web form, in-app, support) with no special wording required. Train anyone who might receive one.
- [ ] **DSR-02** Verify identity proportionately. A signed-in session is enough for self-service. Don't demand ID documents by default.
- [ ] **DSR-03** Log every request in `data_subject_requests`, with the due date calculated automatically and alerts at 7 and 3 days before it.
- [ ] **DSR-04** Keep a data map for searches: DB tables, storage buckets, logs, email provider, help desk, analytics, AI logs, backups.
- [ ] **DSR-05** Erasure propagates everywhere:
  - DB cascade, storage objects and the auth user;
  - email provider contacts (keep the suppression hash);
  - the analytics deletion API, error-monitoring user data and the AI provider (per retention);
  - backups age out, and the deletion log is re-applied after any restore.
- [ ] **DSR-06** Document any exemption you rely on (e.g. invoices kept for tax).
- [ ] **DSR-07** Keep templates ready: acknowledgement, clarification, extension, completion, refusal (with reasons and the right to complain).
- [ ] **DSR-08** App stores: Apple requires in-app account deletion for apps that create accounts. Google Play requires an in-app path and a web link.

### 9.16 Complaints handling

- **UK** (DPA 2018 s.164A, for complaints received on or after 19 June 2026), per the ICO's complaints guidance (Feb 2026):
  - Give people a way to complain, such as an electronic form.
  - **Acknowledge within 30 days.**
  - Investigate without undue delay and keep the complainant updated.
  - Tell them the outcome.
- **Nigeria:**
  - People can complain to the NDPC (NDPA s.46), and the privacy notice must say so.
  - The GAID expects a prompt internal remediation contact (Art. 27(3)(i)) and sets out a grievance-notice procedure (Art. 40).
  - If you receive a grievance notice (SNAG), respond within the period it states, and report your decision to the NDPC (Art. 40(6)).
  - Reply to any NDPC notice of investigation within 21 days (Art. 39(8)).
  - Use the UK's 30-day acknowledgement as your internal maximum in every market.
- **Build it:**
  - A "Raise a privacy concern" form in the privacy centre and the privacy notice.
  - An automatic acknowledgement email, tracked as `COMPLAINT` in `data_subject_requests`.
  - An outcome message that includes the right to complain to the regulator.

### 9.17 International transfers

Map where every processor stores or accesses data (3.6). Remote access from another country counts as a transfer.

| From | Mechanisms |
|---|---|
| **UK** | Adequacy regulations (e.g. the EEA); the **UK–US data bridge** for US companies certified under the DPF with the UK Extension; otherwise the IDTA or the UK Addendum to the EU SCCs, plus a transfer risk assessment under the DUAA's "not materially lower" data protection test |
| **EU/EEA** | Adequacy: the **UK** (renewed 19 Dec 2025, valid to 27 Dec 2031) and the **US** for DPF-certified companies. The DPF was upheld by the General Court on 3 Sep 2025, but an appeal is pending at the CJEU (C‑703/25 P), so keep SCCs ready as a fallback. Otherwise use the 2021 SCCs plus a transfer impact assessment. |
| **Nigeria** | The recipient must be subject to a law, binding corporate rules, contractual clauses, a code of conduct or a certification giving adequate protection (s.41(1)(a), assessed under s.42), **or** a s.43 basis must apply: informed consent after being told the risks, contract necessity, the person's sole benefit, public interest, legal claims or vital interests. **Record the basis and the adequacy assessment** (s.41(2)). The GAID adds approved transfer instruments (Art. 45, Schedule 5) and lists consent among its consent cases for transfers to countries without an NDPC adequacy decision (Art. 18). Confirm your approach with a DPCO. |

Choose UK/EU regions for databases and storage, and use EU/UK processing options for AI, email and monitoring vendors wherever they exist.

### 9.18 Processors & vendor management

Before adding any vendor that touches personal data or runs in the browser:

1. Confirm its role (processor or independent controller).
2. Sign a DPA (UK/EU Art. 28; a written agreement under NDPA s.29). Most SaaS vendors offer click-through DPAs.
3. Review its sub-processors and their locations.
4. Check its security assurance (SOC 2 Type II or ISO 27001, encryption, a breach notice period of ≤ {{48 h}}).
5. Check data retention and deletion at the end of the contract.
6. Make sure training on your data, or other secondary use, is off.
7. Add it to the register (3.6), the privacy notice (if it's a new recipient category) and the cookie register (if it runs in the browser).

### 9.19 Security of processing

The legal duty (UK/EU Art. 32; NDPA s.39) is met through Part 7. Keep evidence: test results, scans, access reviews, restore drills.

### 9.20 Personal data breach response

T0 is the moment you become aware of the breach.

| When | Step |
|---|---|
| **T0** | Contain: revoke keys, disable the feature, block access. Preserve evidence. Open an entry in the **breach log**. Record *every* breach, even unreported ones (Art. 33(5); NDPA s.40(8)). |
| **≤ 24 h** | Assess what data, how many people, how sensitive, the likely consequences, whether it was encrypted, and what mitigations exist. |
| **≤ 72 h** | **Notify regulators where required:** the **ICO** if there's a risk to individuals (Art. 33); the **lead/relevant EU DPA** if there's a risk; the **NDPC** if a risk is likely (NDPA s.40(2); GAID Art. 7(p)). Report in phases if facts are still emerging (Art. 33(4); NDPA s.40(9)). |
| **Without undue delay / immediately** | **Tell affected people** if the risk is high (Art. 34; NDPA s.40(3) and GAID Art. 33(3) say "immediately"). Say in plain language what happened, the likely consequences, what you're doing, what they should do, and who to contact. |
| **Processors** | Tell the controller without undue delay (UK/EU Art. 33(2)); under the NDPA, on becoming aware (s.40(1)). For B2B customers, follow the DPA terms. |
| **After** | Root cause, fixes, lessons learned. Update the threat model, the DPIA and this runbook. |

**Contacts:**
- **ICO:** 0303 123 1113 or the online breach form.
- **NDPC:** via ndpc.gov.ng.
- **EU DPA:** {{lead authority}}.
- **Legal / insurer:** {{ }}.

### 9.21 Data protection impact assessment (DPIA)

- **UK/EU** (Art. 35): required where processing is likely to be high-risk. The ICO's list includes:
  - innovative technology, decisions that deny a service, large-scale profiling;
  - biometric or genetic data, data matching, invisible processing;
  - **tracking** (location or online behaviour);
  - **targeting children** or vulnerable people;
  - risk of physical harm.
- **Nigeria** (NDPA s.28; GAID Art. 28):
  - The list is **very broad**: profiling, automated decisions, systematic monitoring, sensitive data, vulnerable people (including children), new technologies, health, education, e-commerce, cross-border transfers and more.
  - In the listed cases the DPIA must be **submitted to the NDPC before processing starts**, vetted and signed by an NDPC-accredited DPO, and its outcome reported in the compliance audit return (GAID Art. 28(3)–(5), (9), (12)). Expect to need one for most apps that serve Nigeria.
- **Practice:**
  - Screen every project (Part 0) and do a full DPIA (Appendix A2) for the High tier.
  - Review it on every material change.
  - Consult the regulator if high risk remains after mitigation (Art. 36; NDPA s.28(2)).

### 9.22 Automated decision-making & profiling

- **Identify** decisions made **solely** by automated means with legal or similarly significant effects: account bans, eligibility, pricing, hiring, worker deactivation.
- **UK** (Arts. 22A–22D, substituted by the DUAA): broadly permitted with safeguards (information, the chance to make representations, human intervention, the right to contest), but restricted where special category data is involved.
- **EU** (Art. 22): only with contract necessity, legal authorisation or explicit consent, and with safeguards.
- **Nigeria** (NDPA s.37): the right not to be subject to such decisions unless they rest on contract, law or consent, plus safeguards (human intervention, a chance to give one's view, a way to contest). The GAID lists such decisions among its consent cases (Art. 18).
- **Build:** a "Request human review" action, a plain explanation of the main factors, logging of decision inputs, and an appeal SLA of {{5 working days}}.

### 9.23 Retention

See 5.6. The schedule is enforced by jobs and tests, disclosed in the privacy notice and reviewed annually.

### 9.24 Governance, training & compliance calendar

**Roles:** privacy lead / DPO {{ }} · security lead {{ }} · product owner {{ }}. Solo founders hold all three, so write that down.

**Policies:**
- data protection
- retention
- breach response
- rights requests
- information security
- acceptable use
- AI use
- an Appropriate Policy Document, if one is needed

**Training:** before anyone gets access to personal data, then annually. For Nigeria, train within 6 months of starting business, then annually (GAID Art. 7(v)).

| Task | Frequency | Next due | Owner |
|---|---|---|---|
| ICO fee renewal | Annual | {{ }} | {{ }} |
| NDPC registration renewal (OHL) or Compliance Audit Returns (UHL/EHL: 31 March if established before 12 Jun 2023; otherwise 15 months after establishment, then annually) | Annual | {{ }} | {{ }} |
| NDPA compliance audit | Within 15 months of starting, then annual | {{ }} | {{ }} |
| RoPA and privacy notice review | On every data change; at least every 6 months | {{ }} | {{ }} |
| DPIA review | Annual or on change | {{ }} | {{ }} |
| Vendor, DPA and sub-processor review | Annual | {{ }} | {{ }} |
| Cookie scan and register update | Quarterly, and on every release that adds a script | {{ }} | {{ }} |
| Access review (admin, DB, providers) | Quarterly | {{ }} | {{ }} |
| Backup restore drill | Quarterly | {{ }} | {{ }} |
| DAST / pen test | Before launch; then annually | {{ }} | {{ }} |
| Breach tabletop exercise | Annual | {{ }} | {{ }} |
| Regulatory watch (ICO, EDPB, NDPC, EU Digital Omnibus) | Monthly | {{ }} | {{ }} |

### 9.25 Legal pages, product surfaces & platform rules

| Item | Required when | Where |
|---|---|---|
| Privacy notice | Always | Footer, sign-up, settings |
| Cookie notice + **Cookie settings** | Anything beyond strictly necessary storage (good practice always) | Banner + footer |
| Terms of service | Accounts or payments | Sign-up |
| Acceptable use / community rules | UGC | Sign-up, report flow |
| Customer DPA + sub-processor list | You're a B2B processor | Trust/legal page |
| Complaints procedure | UK (s.164A), Nigeria | Privacy centre |
| Company information | UK companies: registered name, number, place of registration, registered office (website and emails). Germany: an Impressum (§5 DDG) if you target German users. | Footer |
| `security.txt` | Always | `/.well-known/` |
| Accessibility statement | Good practice; required for UK public-sector bodies | Footer |
| Children's privacy information | Under-18s allowed | Sign-up, settings |
| Consumer information (B2C paid) | UK: pre-contract information; 14-day cancellation for digital services/content (Consumer Contracts Regulations 2013) unless validly waived; no drip pricing and no fake reviews (DMCC Act 2024). Check the commencement status of the DMCC subscription-contract rules. | Checkout |
| App stores | Apple: privacy "nutrition" label, privacy policy URL, in-app account deletion, App Tracking Transparency, SDK privacy manifests. Google Play: Data safety form, in-app + web account deletion, Families policy if children are targeted. | Store listings |
| Payments | Hosted checkout or fields, so card data never touches your servers (PCI DSS SAQ A scope). Strong customer authentication is handled by the provider. | Checkout |
| Accessibility law | UK Equality Act 2010 (reasonable adjustments). The European Accessibility Act (since 28 Jun 2025) covers e-commerce and certain consumer services in the EU, with an exemption for micro-enterprises providing services. Target WCAG 2.2 AA (10.6). | Whole product |

### 9.26 Launch-trap audit: the vibe-coding failures that get apps fined

Run this before G2 and again before G3. Each row needs evidence.

| # | Trap | Why it bites | Fix | Verify |
|---|---|---|---|---|
| 1 | **The sign-up form never asks for age** | You may be processing children's data without parental consent, verification or child safeguards (UK DPA 2018 s.9 and the AADC; EU Art. 8; **NDPA s.31: anyone under 18**) | Pick a position and add a neutral age check (9.12) | E2E test of the underage path |
| 2 | **Fonts from `fonts.googleapis.com`** (or any CDN) | Visitor IP addresses go to a third party with no basis; German courts have awarded damages; under the NDPA it's an unrecorded transfer (s.41) | Self-host (`next/font`, `@fontsource`); `font-src 'self'` | Privacy test (9.9) + CSP |
| 3 | **Session replay or heatmaps load without consent** | A PECR/ePrivacy/GAID consent breach, and recordings may capture personal data | Consent-gated loader, strictest masking, excluded pages (9.10) | Test + review staging recordings |
| 4 | **"We launched" email with no unsubscribe, sender identity or address** | Breaches PECR regs 22–23 (UK), CAN-SPAM (US) and NDPA s.36 + GAID Art. 18 (Nigeria); fails Gmail and Yahoo sender rules | Compliant template, one-click unsubscribe, suppression list (9.11) | Seed-inbox test; check the headers |
| 5 | **RLS off (or unscoped queries), or the secret key in the client** | Anyone can read or write your database: a breach with 72-hour deadlines | RLS on every table (data-layer scoping where there's no RLS); keys server-only; bundle scan (5.4, 7.3) | Isolation tests in CI |
| 6 | **A template or AI-written privacy policy** that doesn't match reality | Breaches transparency (Arts. 13–14; NDPA s.27) and misleads users | Generate it from the RoPA; review on every release | Checklist 9.6 |
| 7 | **Ad or analytics pixels in the root layout** | Consent breach; data shared with ad platforms | Consent loader; Consent Mode set to denied by default | Privacy test |
| 8 | **User data sent to an LLM** without disclosure or a DPA | Transparency, transfer and processor-contract breaches; possible training on your data | ADR-006; DPA; redaction; notice wording | Vendor register |
| 9 | **No way to delete an account or export data** | A rights breach, and App Store rejection | Privacy centre (9.15) | E2E tests |
| 10 | **Personal data in logs or error trackers** | Breaches minimisation and widens any breach | Scrubbing; logging rules (7.5) | Log review |
| 11 | **Pre-ticked boxes or "by using this site you agree"** | Invalid consent (NDPA s.26(3), s.26(7)(a); GDPR Arts. 4(11) and 7; CJEU *Planet49*) | Unticked, granular choices (9.7) | UI review |
| 12 | **A cookie banner with no "Reject all"** | Invalid consent, and a top regulator enforcement theme | Equal Accept and Reject on the first layer | Screenshot review |
| 13 | **Real customer data in preview or staging** | Security and purpose-limitation breach | Synthetic seed data only (3.2) | Environment audit |
| 14 | **A public storage bucket for user uploads** | Data exposure | Private buckets + signed URLs | Integration test |
| 15 | **ICO fee unpaid; NDPC status unchecked** | ICO penalties up to £4,350; missed DCPMI duties | Pay and register before G2 (9.2) | Calendar |
| 16 | **No breach plan** | Missed 72-hour clocks | Runbook (9.20) | Tabletop drill |
| 17 | **DOB or ID scans collected "just in case"** | Minimisation breach, and a honeypot for attackers | Store the result, not the evidence (DP-03) | Data dictionary review |

### 9.27 Myth vs fact: what the viral compliance threads get right and wrong

| Claim | What the law actually says |
|---|---|
| "Your app can be fined ₦10m before its first sale." | The NDPC **may** impose a penalty up to a cap after investigating: the greater of ₦10m or 2% of annual gross revenue for major-importance controllers, or ₦2m or 2% for others (NDPA s.48(3)–(5)). It weighs gravity, intent, cooperation and other factors (s.48(6)). The risk is real, but these are discretionary maximums, not automatic fines. Note: targeting Nigerian users counts as operating in Nigeria (GAID Art. 8(2)), so the major-importance threshold is just **200** Nigerian users in 6 months. |
| "Every email without an unsubscribe = a ₦10m fine." | There's no per-email tariff. Ignoring an objection to direct marketing *is* a clear breach (s.36(3)–(4)), each complaint can trigger an investigation, and in the UK PECR fines now reach UK GDPR levels. |
| "Hotjar and Clarity record every keystroke, including passwords, by default." | Not by default. Hotjar suppresses keystrokes and never captures password or email-type fields. Clarity masks sensitive content by default and has enforced consent signals for UK, EEA and Swiss traffic since 31 Oct 2025. The real failures are **missing consent**, relaxed masking and unmasked custom inputs (9.10). |
| "The NDPA requires a physical address in emails." | The postal-address rule comes from US CAN-SPAM, and UK companies must show company details in business email. The NDPA's rules are about consent and the right to object. Use one footer template that satisfies them all (9.11). |
| "IP addresses are personal data." | Correct in practice: both the NDPA (s.65) and the GDPR (Art. 4(1)) treat online identifiers as personal data. |
| "Anyone under 18 needs parental consent." | Under the NDPA, yes, when you rely on consent, with limited exceptions (s.31). UK and EU thresholds for consenting to online services are 13–16. Build to your markets, or make the service 18+ (9.12). |


---

<a id="p10"></a>
## Part 10 — Experience design: flows, design system, accessibility, UI states `[CORE]`

### 10.1 Primary user journey

```mermaid
flowchart TD
  A[Landing page] --> B{Cookie choice made?}
  B -- No --> C[Consent banner: Accept all, Reject all, Manage]
  C --> D
  B -- Yes --> D[Sign up or log in]
  D --> E[Age check]
  E -- Below the minimum age --> E1[Blocked, or parental consent flow]
  E -- Meets the age rule --> F[Account details and optional marketing opt-in]
  F --> G[Verify email]
  G --> H[Onboarding: create or join a workspace]
  H --> I[Workspace board]
  I --> J[Task detail and comments]
  I --> K[Generate AI standup]
  K --> K1[Review AI output] --> K2[Copy or export Markdown]
  I --> L[Settings]
  L --> L1[Organisation and members]
  L --> L2[Privacy centre: export, delete, consents, marketing, complaints]
```

**Navigation:** client-side routing via the App Router. The URL holds shareable state (workspace, filters, open task); Zustand holds ephemeral UI state only.

### 10.2 Key secondary flow: account deletion

```mermaid
sequenceDiagram
  actor U as User
  participant App
  participant API
  participant Job as Deletion job
  U->>App: Settings, then Delete account
  App->>U: Explain consequences and ask to re-authenticate
  U->>App: Confirm after re-authentication
  App->>API: POST /api/account/delete
  API->>API: Set deletion_requested_at, revoke sessions, stop marketing
  API-->>U: Confirmation email with a 30-day cancel link
  Job->>Job: After 30 days, delete rows, storage objects and the auth user
  Job->>Job: Call processor deletion APIs, keep only the suppression hash
  Job-->>U: Final confirmation email
```

Also diagram: **session expiry and draft restore** (S8), **data export** (async job → email with an expiring link), **invite member**, **AI standup generation** (S14 with cancel).

### 10.3 Route & screen inventory

| SCR | Route | Screen | Access | Primary action | Data shown | Analytics | Replay |
|---|---|---|---|---|---|---|---|
| SCR-01 | `/` | Landing | Public | Sign up | C0 | Aggregate | If consented |
| SCR-02 | `/signup` | Sign-up + age check | Public | Create account | C2 | Aggregate | **Never** |
| SCR-03 | `/login` | Log in | Public | Sign in | C2 | Aggregate | **Never** |
| SCR-04 | `/onboarding` | Create or join workspace | Authenticated | Create | C2 | Aggregate | If consented |
| SCR-05 | `/w/[slug]` | Board | Member | Create task | C2 | Aggregate | If consented, masked |
| SCR-06 | `/w/[slug]/t/[id]` | Task detail (modal) | Member | Comment | C2 | Aggregate | If consented, masked |
| SCR-07 | `/w/[slug]/standup` | AI standup | Member | Generate | C2 | Aggregate | If consented, masked |
| SCR-08 | `/w/[slug]/settings/members` | Members | Admin+ | Invite | C2 | Aggregate | **Never** |
| SCR-09 | `/settings/privacy` | Privacy centre | Self | Export / delete | C2 | None | **Never** |
| SCR-10 | `/legal/privacy` · `/legal/cookies` · `/legal/terms` | Legal pages | Public | — | C0 | Aggregate | If consented |

### 10.4 Screen specification template

```text
SCR-NN — {{Screen name}}                         Route: {{ }}     Access: {{roles}}
Purpose & primary action: {{ }}
Components: {{ }}              Data (DATA- refs, classes): {{ }}       API: {{API- refs}}
States (10.7): S1 {{…}} · S2 {{…}} · S3 {{…}} · … (or N/A + reason)
Copy: title, empty-state text, error text, success text (10.5 content rules)
Accessibility: heading order, focus on open, keyboard path, live regions, target sizes
Analytics events (aggregate only): {{ }}          Replay: allowed / never
Responsive: 320 / 768 / 1280 behaviour
```

### 10.5 Design system

**Principles:**
- Calm and fast.
- Accessible by default.
- Honest UI: no dark patterns.
- Every state is designed.

**Colour tokens.** Contrast ratios are calculated with the WCAG formula. Status colours always come with an icon and text, never colour alone.

| Token | Dark (default) | Light | Contrast (on surface) |
|---|---|---|---|
| `bg` | `#09090B` (zinc-950) | `#FFFFFF` | — |
| `surface` | `#18181B` (zinc-900) | `#FAFAFA` (zinc-50) | — |
| `surface-raised` | `#27272A` (zinc-800) | `#FFFFFF` + shadow | — |
| `text` | `#FAFAFA` (zinc-50) | `#18181B` (zinc-900) | 16.97:1 · 16.97:1 |
| `text-muted` | `#A1A1AA` (zinc-400) | `#52525B` (zinc-600) | 6.91:1 · 7.41:1 |
| `link`, `accent-text` | `#818CF8` (indigo-400) | `#4F46E5` (indigo-600) | 5.94:1 · 6.02:1 |
| `primary` (button fill, white label) | `#4F46E5` (indigo-600) | `#4F46E5` | White label 6.29:1 |
| `primary-hover` | `#4338CA` (indigo-700) | `#4338CA` | White label 7.90:1 |
| `border-control` (inputs, checkboxes) | `#71717A` (zinc-500) | `#71717A` | 3.67:1 · 4.83:1 on white (needs ≥ 3:1) |
| `border-subtle` (decorative only) | `#27272A` | `#E4E4E7` | Decorative |
| `focus-ring` (2 px + 2 px offset) | `#818CF8` | `#4F46E5` | 5.94:1 · 6.29:1 |
| `success` | `#4ADE80` | `#15803D` | 10.17:1 · 5.02:1 on white |
| `warning` | `#FBBF24` | `#B45309` | 10.61:1 · 5.02:1 on white |
| `danger` | `#F87171` | `#DC2626` | 6.40:1 · 4.83:1 on white |
| `info` | `#38BDF8` | `#0369A1` | 8.27:1 · 5.93:1 on white |

> v1's indigo-500 (`#6366F1`) is kept only for decorative accents. With a white label it gives 4.47:1, and as text on near-black 4.43:1; both are below the 4.5:1 that normal text needs.

**Typography:**
- Inter for the UI; JetBrains Mono for code, IDs and timestamps. Both are **self-hosted** through `next/font` (9.9).
- Scale (px): 12 · 14 · **16 (body)** · 18 · 20 · 24 · 30 · 36. Line height 1.5 for body text and 1.2 for headings.
- Form inputs use ≥ 16 px so iOS Safari doesn't auto-zoom.

**Layout & motion:**
- Spacing on a 4 px base (4, 8, 12, 16, 24, 32, 48, 64). Radius 6 / 8 / 12.
- Breakpoints: 640 / 768 / 1024 / 1280.
- Motion lasts 150–250 ms, ease-out. With `prefers-reduced-motion`, cross-fade or skip it.
- A z-index scale for dropdowns, modals and toasts.

**Components** (each designed for all of its states):
- button: default / hover / focus / active / disabled / loading
- input: default / focus / error / disabled / read-only
- select, checkbox, radio, switch
- dialog: focus trap, Esc, focus returned on close
- toast: never the only feedback
- banner, skeleton
- empty-state, error-panel, permission-panel, offline-banner, consent-placeholder

**Content rules:**
- Error messages follow **what happened → why (if it helps) → what to do next**.
- Never blame the user. Put codes in a small reference line, not the headline.
- Use British English for `en-GB`. Write labels as verbs ("Create task", not "Submit").

### 10.6 Accessibility requirements (WCAG 2.2 AA)

- [ ] **Structure:** semantic HTML, a `lang` attribute, one `h1` and logical headings, landmarks, and a skip link.
- [ ] **Keyboard:** everything is operable with a keyboard, in a logical focus order, with **visible focus** (≥ 3:1). Nothing is focus-trapped except modals.
- [ ] **Contrast:** text ≥ 4.5:1 (large text ≥ 3:1); UI components and focus indicators ≥ 3:1 (1.4.3, 1.4.11).
- [ ] **Forms:** visible labels, errors identified in text with suggested fixes, `aria-invalid` and `aria-describedby` (3.3.1, 3.3.3).
- [ ] **Async status** is announced through `aria-live` (loading, saved, errors). `aria-busy` is set on regions that are loading.
- [ ] **Reflow and zoom:** works at 320 px wide and at 200% zoom with no horizontal scrolling.
- [ ] **Reduced motion** is respected, and nothing flashes more than 3 times per second.
- [ ] **Time limits:** warn before the session expires and allow extending it with a simple action and at least 20 seconds to respond (2.2.1).
- [ ] **New in WCAG 2.2:**
  - **2.4.11 Focus Not Obscured:** sticky headers and toasts never hide the focused element.
  - **2.5.7 Dragging Movements:** every drag (e.g. Kanban cards) has a single-pointer alternative, such as a "Move to…" menu.
  - **2.5.8 Target Size:** targets are ≥ 24 × 24 CSS px, or adequately spaced.
  - **3.2.6 Consistent Help:** help links appear in the same place on every page.
  - **3.3.7 Redundant Entry:** don't ask for the same information twice in one process.
  - **3.3.8 Accessible Authentication:** no memory or puzzle tests; paste and password managers allowed; magic links and passkeys are fine.
- [ ] **Testing:** axe in CI on every key page, a manual keyboard-only run of critical journeys, a screen-reader smoke test (VoiceOver and NVDA) each release, and an accessibility statement.

### 10.7 Mandatory UI states

Every screen and async component **must** handle each applicable state below and prove it in its state matrix. "N/A" needs a reason. States S1–S10 are the v1 core set; S11–S17 are required wherever they can occur.

| # | State | Detect when | Required UX | Example copy | Accessibility | Acceptance test |
|---|---|---|---|---|---|---|
| S1 | **Empty** | First use, or the list is empty without filters | Say what goes here and why it's useful, with one primary call to action. Distinguish from S6. | "No tasks yet. Create your first task to start your board." [Create task] | Heading + reachable CTA | A new workspace shows S1 with a CTA |
| S2 | **Loading** | The request is in flight | Skeletons shaped like the final layout (no layout shift). For in-place actions, show inline progress after 300 ms. Never a blank screen. | — | `aria-busy`; polite "Loading tasks" | Throttled network shows a skeleton, not a blank |
| S3 | **Error** | 5xx, or an unknown error | What happened + what to do, a **Retry** button, input preserved, and a reference ID. A section-level error boundary keeps the rest of the page working. | "We couldn't load your tasks. Check your connection and try again." [Try again] · Ref 7F3K | Focus moves to the message; `role="alert"` | A mocked 500 shows S3; Retry recovers |
| S4 | **No internet** | `offline` event or failed fetches | A non-blocking banner. Keep showing cached data read-only or queue changes (S12). Auto-retry on reconnect. | "You're offline. Changes will sync when you're back online." | Polite announcement | `context.setOffline(true)` shows the banner, and data is still visible |
| S5 | **Slow network** | > 1 s: progress; > 5 s: message; > 15–30 s: timeout | Progressive feedback, Cancel (AbortController) and Retry. Never an endless spinner. | "Still working… this is taking longer than usual." [Cancel] | Polite announcement | A 6 s delayed route shows the "Still working" message |
| S6 | **No search results** | A query or filter returns nothing | Echo the query and filters, suggest changes, offer **Clear filters**. | "No tasks match "invoice" in Done." [Clear filters] | Results count announced | Searching nonsense shows S6, and clearing restores the list |
| S7 | **Permission denied** | 403 | Explain who can do it and offer a path (ask an admin), with safe navigation back. For resources the user can't see, use S11 so their existence isn't revealed. | "Only workspace admins can invite members. Ask an admin for access." [Back to board] | Focus on the heading | A MEMBER on the members page sees S7; the API returns 403 |
| S8 | **Session expired** | 401, or the refresh fails | Try a silent refresh first; warn before a hard expiry; re-authenticate in a modal and **return to the same place**. Restore the in-progress draft, which is saved locally, scoped to the user, **excludes passwords, payment and C3 fields**, is cleared on submit or sign-out, and expires after 24 h. | "Your session ended for security. Sign in again to continue. We kept your draft." | 20 s+ warning (2.2.1) | Expiring the token mid-form, then re-login, restores the draft |
| S9 | **Form validation** | Client check on blur and submit; server 422 | Inline message at the field saying how to fix it, a summary with links for long forms, and **input never cleared**. Server errors are mapped to fields. | "Enter an email address like name@example.com" | `aria-invalid`, `aria-describedby`; focus moves to the first error | Submitting invalid input shows inline errors and keeps the values |
| S10 | **Success** | Mutation confirmed | Confirm what happened and the next step. Offer Undo where possible. Use a toast for minor actions and a page or panel for major ones. | "Standup copied. Paste it into Slack or email." [Undo] | Polite announcement; not colour alone | Completing an action shows confirmation + next step |
| S11 | **Not found / deleted** | 404 / 410 | Neutral message and a way back. Don't reveal whether a resource exists. | "This task was deleted or you don't have access." [Back to board] | Heading focus | Opening a deleted ID shows S11 |
| S12 | **Offline queue / sync conflict** | Queued writes; 409 | A "Pending sync" badge. For conflicts: keep mine / keep theirs / merge, or a documented last-write-wins. | "This task changed while you were offline." [Review changes] | Announced | A 409 shows the conflict UI |
| S13 | **Rate limited / quota reached** | 429 | Say what the limit is, when it resets (`Retry-After`), and the upgrade path if it's plan-based. No blame. | "You've used today's 20 AI standups. More are available at 00:00 UTC." | Announced | A mocked 429 shows the reset time |
| S14 | **Long-running / background task** | AI generation, export, import | Streaming output or progress, **Cancel**, and the option to leave and be notified. Timeout fallback to S3. | "Writing your standup…" [Cancel] | Progress is announced at sensible intervals | Cancel stops the job; nothing is charged |
| S15 | **Degraded / partial** | One section or a third party failed; a feature flag is off; maintenance | Only the failing section shows S3; the rest works. Link to the status page. | "AI summaries are temporarily unavailable. Everything else works." | — | Disabling the AI flag leaves the board working |
| S16 | **Destructive confirmation & undo** | Delete or remove actions | State the exact consequence. High-impact actions require typing the name to confirm. Reversible actions get an Undo window. | "Delete 'Q3 plan' and its 12 comments? This can't be undone." | Focus on Cancel by default | Delete requires confirmation; Undo restores |
| S17 | **Consent-gated content** | An embed (video, map, chat) is blocked until consent | A placeholder saying what loading it will do, with a button that consents for that item only. | "Loading this video lets YouTube set cookies and see your IP address." [Load video] | Button labelled clearly | No third-party request until the click (9.9) |

**State matrix** (one row per screen; ✅ = designed, built and tested · N/A = not applicable, with the reason in a note):

| Screen | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 | S11 | S12 | S13 | S14 | S15 | S16 | S17 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| SCR-05 Board | | | | | | | | | | | | | | | | | |
| SCR-07 Standup | | | | | | | | | | | | | | | | | |
| {{ }} | | | | | | | | | | | | | | | | | |

**Implementation pattern.** One typed union per async view, with an exhaustive `switch`, so the build fails if a state isn't handled (type-checked):

```tsx
// lib/ui/view-state.tsx — one discriminated union for every async screen
export type AppErrorCode =
  | 'VALIDATION_FAILED' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT'
  | 'RATE_LIMITED' | 'TIMEOUT' | 'UPSTREAM_UNAVAILABLE' | 'INTERNAL';

export type ViewState<T> =
  | { kind: 'loading'; slow: boolean }                        // S2 / S5
  | { kind: 'empty' }                                         // S1
  | { kind: 'noResults'; query: string }                      // S6
  | { kind: 'ready'; data: T; stale: boolean }                // normal (+ stale after reconnect)
  | { kind: 'error'; code: AppErrorCode; ref: string }        // S3
  | { kind: 'offline'; cached?: T }                           // S4
  | { kind: 'forbidden'; reason: string }                     // S7
  | { kind: 'sessionExpired' }                                // S8
  | { kind: 'notFound' }                                      // S11
  | { kind: 'rateLimited'; retryAfterSeconds: number };       // S13

export function assertNever(x: never): never {
  throw new Error(`Unhandled view state: ${JSON.stringify(x)}`);
}

// ---- usage: the compiler fails the build if a new state is added but not handled ----
// (Task and the state components are imported from your domain types and components/states/)
export function TaskBoardView({ state, onRetry }: { state: ViewState<Task[]>; onRetry: () => void }) {
  switch (state.kind) {
    case 'loading':        return <BoardSkeleton slow={state.slow} />;
    case 'empty':          return <EmptyBoard />;
    case 'noResults':      return <NoResults query={state.query} />;
    case 'ready':          return <Board tasks={state.data} stale={state.stale} />;
    case 'error':          return <ErrorPanel code={state.code} refId={state.ref} onRetry={onRetry} />;
    case 'offline':        return <OfflineBanner>{state.cached && <Board tasks={state.cached} readOnly />}</OfflineBanner>;
    case 'forbidden':      return <PermissionDenied reason={state.reason} />;
    case 'sessionExpired': return <SessionExpired />;
    case 'notFound':       return <NotFound />;
    case 'rateLimited':    return <RateLimited retryAfterSeconds={state.retryAfterSeconds} />;
    default:               return assertNever(state);
  }
}
```

Map API errors to states using the table in 6.3. Keep shared state components in `components/states/` so every screen uses the same pieces.


---

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

---

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


---

<a id="p13"></a>
## Part 13 — Launch readiness gate (Go / No-Go) `[CORE]`

Every item must be ✅, or N/A with a reason. Any open ⛔ item means **no launch**.

**A. Product**
- [ ] All MVP `FR`s meet their acceptance criteria; known issues are triaged and documented
- [ ] A support channel and help content are live

**B. Engineering & quality**
- [ ] ⛔ CI is green: typecheck, lint, unit, integration, E2E for critical journeys
- [ ] ⛔ State matrix (10.7) complete for every screen
- [ ] Performance budgets met (NFR-PERF); a load test was run on critical paths
- [ ] Error monitoring, uptime checks and alerts are live and tested
- [ ] ⛔ A backup **restore** has been tested; a rollback has been tested

**C. Security**
- [ ] ⛔ Access enforced at the data layer on every table (RLS where the database supports it), with tenant-isolation tests passing (5.4)
- [ ] ⛔ No secrets in the repo or the client bundle (scans clean)
- [ ] ⛔ No critical dependency vulnerabilities; high ones have a plan
- [ ] Security headers in place and the CSP **enforced** (7.4)
- [ ] MFA for admins and provider consoles; rate limits on auth, AI and forms
- [ ] DAST baseline run; pen test done (High tier); `security.txt` published

**D. Privacy & compliance**
- [ ] ⛔ The privacy notice is live, matches the RoPA, and is linked at sign-up and in the footer (9.6)
- [ ] ⛔ The age position is implemented and tested: age check, block or parental flow (9.12)
- [ ] ⛔ **No non-essential cookies, tracking or third-party requests before consent**; fonts self-hosted; privacy test green (9.9)
- [ ] ⛔ The cookie banner has equal Accept and Reject; a "Cookie settings" link is in the footer; the register is published (9.8)
- [ ] ⛔ Session replay, if used: consent-gated, strictest masking, sensitive pages excluded (9.10)
- [ ] ⛔ Marketing email: consent evidence, one-click unsubscribe plus `List-Unsubscribe` headers, sender identity, postal/company details, suppression list. Transactional email contains no promotions (9.11).
- [ ] ⛔ Processor DPAs signed; transfer mechanisms recorded (3.6, 9.17)
- [ ] ⛔ Privacy centre: export and account deletion work end to end, and meet app-store rules (9.15)
- [ ] Rights-request and complaints procedures live, with a 30-day acknowledgement for UK complaints; templates ready (9.15–9.16)
- [ ] Breach runbook, contacts and breach log ready (9.20)
- [ ] DPIA completed and signed off where it's required (9.21)
- [ ] Retention and deletion jobs scheduled and tested (5.6)
- [ ] AI: output labelled; provider no-training and retention terms confirmed; Art. 50 duties met (8.6)
- [ ] ⛔ Registrations: ICO fee paid (UK); EU/UK representative appointed if needed; NDPC registration and DPO if you're a DCPMI (9.2)
- [ ] The launch-trap audit (9.26) has every row evidenced, and the compliance calendar is set (9.24)

**E. Accessibility**
- [ ] ⛔ axe clean on key pages; keyboard-only run of critical journeys passes
- [ ] Screen-reader smoke test done; drag alternative, target sizes and accessible auth confirmed (10.6)
- [ ] Accessibility statement published

**F. Operations**
- [ ] Runbooks written; on-call routing tested; status page ready
- [ ] Cost alerts set for infrastructure and AI

**G. Legal & commercial**
- [ ] Terms of service and acceptable-use rules published; company information shown on the site (9.25)
- [ ] B2C paid: pre-contract information and cancellation rights in place; pricing shown with no drip pricing
- [ ] App stores: privacy labels, data safety form, in-app deletion, tracking prompts configured
- [ ] Payments through hosted checkout or fields only

| Sign-off | Name | Decision | Date |
|---|---|---|---|
| Product | | Go / No-go | |
| Engineering & security | | Go / No-go | |
| Privacy | | Go / No-go | |


---

<a id="p14"></a>
## Part 14 — Existing & live projects: retrofit track and keeping every blueprint current `[CORE for existing projects]`

Most real projects already have code, and many already have users. This track turns what's built into a complete blueprint, closes the riskiest gaps first, and keeps every project's blueprint current from then on.

### 14.1 Pick the track

| Your project is… | Track | Start with |
|---|---|---|
| An idea, or a prototype that has never held real people's data | **New project** | Part 0, then gates G0–G4 |
| Built, but used only by you or testers with synthetic data | **Retrofit, light** | 14.3 → 14.4. Pass G2 before any real data. |
| **Live** with real users, customers or a client | **Retrofit, urgent** | **14.2 Day-0 triage within 48 hours**, then 14.3 → 14.4 → 14.5 |
| Inherited, built by someone else, or generated by an AI tool you don't fully understand | **Retrofit, urgent** | As for live projects, plus a line-by-line review of every auth and data-access path |

**Retrofit gates:**
- **R0** Triage done.
- **R1** Critical gaps closed.
- **R2** Blueprint complete: the as-is state documented and every gap registered.

After R2, all new scope follows the normal Definition of Done (11.2) and gates.

### 14.2 Day-0 triage for live projects (first 48 hours)

| # | Check | How to check | If it fails |
|---|---|---|---|
| T1 | **Exposed secrets** | Scan the git history (gitleaks), the built client bundle and any mobile binaries for secret or service keys. Check public-prefixed variables (`NEXT_PUBLIC_`, `VITE_`, `EXPO_PUBLIC_`). | Rotate immediately, purge from history and review access logs (9.20) |
| T2 | **Database access rules** | Supabase: run the query below and review every policy (5.4). Firebase: confirm Security Rules aren't test-mode rules (`allow read, write: if true`) and test them with the emulator. MySQL or another database without RLS: confirm every query runs through a tenant scope and an authorisation policy, and test it (5.4). | Lock down today; assess exposure (T11) |
| T3 | **Storage buckets** | List the buckets and confirm user uploads are private and served through signed URLs | Make them private; invalidate public links |
| T4 | **Third-party requests before consent** | Run the 9.9 Playwright test against the live site (`use.baseURL` = production URL; `ALLOWED_HOSTS` = your domains) | Remove or consent-gate fonts, CDNs and pixels this week |
| T5 | **Tracking & replay** | Inventory analytics, replay, pixels and A/B tools | Switch off anything non-essential until consent gating ships; delete recordings collected without consent |
| T6 | **Marketing email** | Inspect the last campaign: unsubscribe link, `List-Unsubscribe` headers, sender identity, address. Check that each list has consent evidence. | Pause sends; fix the template; suppress contacts with no evidence |
| T7 | **Privacy notice** | It exists, is linked from the footer and sign-up, and matches what the app actually does | Publish an accurate interim notice now; the full one follows 14.3 |
| T8 | **Children** | Could under-18s be using it (students, learner drivers, families, pupils)? | Decide the position (9.12); add an age check at next sign-in if needed |
| T9 | **Sensitive data** | Health, location, religion, biometrics or other C3 data present? Is there a DPIA? | Start the DPIA (9.21); restrict access; stop sending it to AI or analytics |
| T10 | **Registration & contracts** | ICO fee paid; DPAs with processors; a DPA with your client if you're their processor (9.2) | Pay and sign this week |
| T11 | **Was anything exposed?** | If T1–T3 failed, check access logs for unauthorised access | Treat it as a potential breach (9.20). The 72-hour clock runs from when you become aware a breach has occurred. |

**Find tables without RLS** (Supabase SQL editor):

```sql
select c.relname as table_without_rls
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
order by 1;
```

> **Retrofit legal realities**
> - Past processing can't be made lawful after the fact. Stop it, delete what you shouldn't hold, and do it right from now on.
> - **Don't email people to ask for marketing consent** if you didn't already have consent to email them. The ICO treats "re-permission" emails as marketing in themselves; in 2017 it fined Flybe £70,000 and Honda £13,000 for exactly this. Ask in-product instead, e.g. at the next sign-in.
> - Tell existing users about material changes to the privacy notice. Request new consents in-product; never infer them from silence.

### 14.3 Reverse-engineer the blueprint from what's built

Work from **evidence, not memory**. Record the as-is state in each section, and log every difference from the blueprint standard as a `GAP` (14.4).

| Blueprint part | Evidence | How |
|---|---|---|
| Part 0 intake | Who uses it, where they are, which data types | Aggregate analytics, the database, the support inbox |
| 3.1 stack · 3.6 processors | Dependencies, environment variables, hosting and SaaS accounts | `package.json` / `pubspec.yaml` and lockfiles. Billing statements are the honest vendor list. |
| 3.6 · 9.8 · 9.9 browser and device traffic | Every domain contacted; every cookie and storage key; mobile SDKs | DevTools Network and Application tabs in a fresh profile; the 9.9 test; a proxy or network inspector for mobile |
| 5.2 data dictionary | Every table, collection and field | `prisma db pull`, `supabase db dump`, a Firestore export |
| 5.4 access rules | Policies or rules per table | `select * from pg_policies;`, the Firebase rules file, the query above |
| 6.2 API inventory | Routes, Server Actions, cloud functions, webhooks | Code search; framework route listing |
| 9.3 RoPA | What each data set is for and who receives it | All of the above, plus email, AI and analytics settings |
| 10.3 screens · 10.7 state matrix | Every screen, and which states it handles | Click through with throttling, offline mode, an expired session and a low-privilege account |
| 7.3 threats | Auth flows, uploads, rendering of user content, AI prompts | Code review of every auth and data path |
| Part 4 ADRs | Key past decisions | Write them retroactively with "Status: Accepted (retroactive)" |

### 14.4 Gap register & remediation plan

| GAP | Area | Finding (as-is) | Standard (ref) | Risk | Severity | Fix | Owner | Due | Status |
|---|---|---|---|---|---|---|---|---|---|
| GAP-01 | {{Privacy}} | {{Google Fonts loaded from Google on every page}} | 9.9 | {{Legal}} | {{Critical}} | {{Switch to next/font}} | {{ }} | {{ }} | Open |

**Severity → deadline:**
- **Critical:** live exposure of personal data or secrets; tracking or marketing without a lawful basis; children's or special category data without safeguards. Fix within **days** (R1).
- **High:** missing rights features or DPAs; an inaccurate privacy notice; no access-isolation (RLS) tests; no breach plan. Fix within **2–4 weeks**.
- **Medium:** missing UI states on key journeys, accessibility failures, incomplete retention jobs. Fix within **1–2 months**.
- **Low:** documentation and polish. Backlog.

**Remediation sprints:**

| Sprint | Focus |
|---|---|
| R1 (week 1) | Day-0 failures fixed; interim privacy notice; consent gating; unsubscribe and suppression; secrets rotated |
| R2 (weeks 2–4) | RoPA, processor register and DPAs, privacy centre (export and delete), retention jobs, breach runbook, complaints route, DPIA for the High tier |
| R3 (weeks 4–8) | RLS, privacy and E2E tests in CI; state-matrix gaps on the top journeys; accessibility fixes; security headers and CSP |
| R4 (ongoing) | Remaining gaps through normal delivery; launch-trap audit (9.26) every quarter |

### 14.5 Keep every blueprint current (new and existing projects)

The blueprint lives in the repo (`docs/BLUEPRINT.md`) and **changes in the same PR as the code** (Definition of Done, 11.2).

| When you… | Update |
|---|---|
| Add or change a feature | FR and acceptance criteria (1.5–1.6), screens and state matrix (10.3, 10.7), API (6.2), tests |
| Add a data field or table | Data dictionary (5.2), RoPA (9.3), privacy notice (9.6), access rule (RLS where supported) and its isolation test (5.4), retention (5.6) |
| Add a vendor, SDK, script, font or embed | Processor register (3.6), cookie register (9.8), CSP (7.4), DPA (9.18), consent loader |
| Launch in a new country | Laws (9.1), registrations (9.2), transfers (9.17), notice |
| Serve a new group (children, patients, workers) | Re-run the Part 0 screening; DPIA (9.21) |
| Add or change AI | Part 8, evals, notice wording |
| Change the stack or a key decision | A new ADR (Part 4) |
| Have an incident | Post-incident review (A7), threat model (7.3), runbooks |

**Cadence for live projects:**
- **Monthly** 15-minute review: open gaps, new vendors, calendar items.
- **Quarterly:** launch-trap audit (9.26) and cookie scan.
- **Annually:** full review, plus a framework-version check.

**Framework versioning:** each project blueprint records `Framework: Bansat v2.1`. When this master framework changes (a law, a guideline, a better pattern), its revision history lists what to re-check. Apply that list to each project at its next monthly review.

### 14.6 Portfolio register

If you run several projects, keep one row per project and review it monthly.

| Project | Stage (idea / build / beta / live) | Users & markets | Risk tier | Track | Blueprint (none / partial / complete) | Day-0 triage | Open critical gaps | Next review |
|---|---|---|---|---|---|---|---|---|
| {{ }} | | | | | | | | |


---

<a id="appa"></a>
## Appendix A — Templates

### A1 Legitimate interests assessment (LIA)

```text
LIA-NN — {{Processing activity}}  (ROPA-__)          Date: {{ }}   Reviewer: {{ }}
1. Purpose test     What is the interest? Who benefits? Would it be lawful and ethical?
2. Necessity test   Is the processing necessary for that interest? Is there a less intrusive way?
3. Balancing test   Data types · reasonable expectations · impact on people · vulnerable groups (e.g. children)
                    · safeguards (minimisation, opt-out, retention, security)
Outcome: Proceed / Proceed with safeguards / Use another basis   ·   Review date: {{ }}
(Nigeria: complete before processing starts — GAID Art. 26 and Schedule 8)
```

### A2 DPIA

```text
DPIA-NN — {{Project / feature}}                      Version: {{ }}   Owner: {{ }}   Status: {{ }}
1. Description     nature, scope, context, purposes; data flows (3.4); people affected; volumes; vendors
2. Consultation    who was consulted (users, security, DPO, processors)
3. Necessity       lawful basis; minimisation; retention; rights; transfers; processor controls
4. Risks           likelihood × severity for each risk to people (not to the business)
5. Measures        controls that reduce each risk; residual risk; who accepts it
6. Sign-off        DPO/privacy lead advice; decision; prior consultation needed? (UK/EU Art. 36; NDPA s.28(2))
7. Review          trigger events and review date
```

### A3 Rights request & complaint log

| Ref | Type | Received | Identity verified | Due (+ extension) | Systems searched | Outcome | Closed | Notes |
|---|---|---|---|---|---|---|---|---|
| DSR-001 | Access | {{ }} | {{ }} | {{ }} | DB, storage, email, help desk, logs | {{ }} | {{ }} | {{ }} |

### A4 Breach log

| Ref | Found (T0) | What happened | Data & people affected | Risk level | Regulators notified (when) | People notified (when) | Actions | Lessons |
|---|---|---|---|---|---|---|---|---|
| BR-001 | {{ }} | {{ }} | {{ }} | Low / Risk / High | ICO / DPA / NDPC — {{ }} | {{ }} | {{ }} | {{ }} |

### A5 Risk register

| RISK | Description | Likelihood (1–5) | Impact (1–5) | Score | Owner | Mitigation | Status |
|---|---|---|---|---|---|---|---|
| RISK-01 | {{AI provider changes its terms or prices}} | 3 | 3 | 9 | {{ }} | {{Second provider evaluated; feature flag}} | Open |

### A6 Traceability matrix

| FR | Screens (SCR) | API | Data | ROPA | Tests | States verified |
|---|---|---|---|---|---|---|
| FR-003 | SCR-07 | API-003 | tasks, ai_generations | ROPA-03 | TEST-E2E-012, EVAL-01 | S1 S3 S5 S13 S14 |

### A7 Post-incident review

```text
PIR — {{Incident title}}   Severity: {{ }}   Date: {{ }}   Facilitator: {{ }}
Summary · Impact (users, data, duration) · Timeline (detected → mitigated → resolved)
Root cause (5 whys) · What went well · What went badly · Where we got lucky
Actions (owner, due date) · Docs to update (runbook, threat model, DPIA, blueprint)
```

---

<a id="appb"></a>
## Appendix B — Key references

Check these sources again before each launch; guidance changes.

**UK**
- Data (Use and Access) Act 2025: https://www.legislation.gov.uk/ukpga/2025/18 · commencement plan: https://www.gov.uk/guidance/data-use-and-access-act-2025-plans-for-commencement
- Data Protection Act 2018: https://www.legislation.gov.uk/ukpga/2018/12 · PECR 2003: https://www.legislation.gov.uk/uksi/2003/2426
- ICO guidance, including the storage and access technologies guidance (29 Apr 2026), data protection complaints (Feb 2026), the Age Appropriate Design Code and employment monitoring: https://ico.org.uk · data protection fee: https://ico.org.uk/for-organisations/data-protection-fee/
- Ofcom Online Safety Act guidance: https://www.ofcom.org.uk

**EU**
- GDPR: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- AI Act transparency (Art. 50) guidelines: https://digital-strategy.ec.europa.eu/en/policies/guidelines-ai-transparency-obligations
- UK adequacy renewal: Commission Implementing Decision (EU) 2025/2574 (to 27 Dec 2031) · EU–US DPF: General Court T‑553/23 (3 Sep 2025), appeal C‑703/25 P
- Consent cases: CJEU C‑673/17 *Planet49* (pre-ticked boxes) · LG München I, 3 O 17493/20 (Google Fonts, 20 Jan 2022)

**Nigeria**
- Nigeria Data Protection Act 2023 (Official Gazette copy): https://ncc.gov.ng/media/801/view
- GAID 2025: https://ndpc.gov.ng/wp-content/uploads/2025/07/NDP-ACT-GAID-2025-MARCH-20TH.pdf · NDPC: https://ndpc.gov.ng

**US**
- FTC COPPA Rule (amended; compliance date 22 Apr 2026) and the CAN-SPAM compliance guide: https://www.ftc.gov

**Technical**
- Prisma 7 configuration: https://pris.ly/d/config-datasource
- Next.js fonts (self-hosting): https://nextjs.org/docs/app/getting-started/fonts
- Supabase Row Level Security: https://supabase.com/docs/guides/database/postgres/row-level-security
- Microsoft Clarity consent: https://learn.microsoft.com/en-us/clarity/setup-and-installation/consent-management
- Hotjar data suppression: https://help.hotjar.com/hc/en-us/articles/36819956605329-How-to-Suppress-Text-Images-Videos-and-User-Input-from-Collected-Data
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/ · OWASP Top 10 for LLM Applications: https://owasp.org/www-project-top-10-for-large-language-model-applications/
- RFC 8058 (one-click unsubscribe): https://www.rfc-editor.org/rfc/rfc8058 · RFC 9457 (Problem Details): https://www.rfc-editor.org/rfc/rfc9457 · RFC 9116 (security.txt): https://www.rfc-editor.org/rfc/rfc9116
- Gmail sender guidelines: https://support.google.com/a/answer/81126

---

<a id="appc"></a>
## Appendix C — Glossary

| Term | Meaning |
|---|---|
| **AADC** | The ICO's Age Appropriate Design Code ("Children's Code"): 15 standards for online services likely to be accessed by under-18s in the UK |
| **ADM** | Automated decision-making: decisions made solely by automated means with legal or similarly significant effects |
| **C0–C3** | This blueprint's data classes: public, internal, personal, sensitive (5.1) |
| **Controller / processor** | The controller decides why and how data is processed; the processor acts on the controller's instructions |
| **CSP** | Content Security Policy: a browser-enforced allowlist of where scripts, styles, fonts and connections may come from |
| **DCPMI** | Data Controller/Processor of Major Importance (Nigeria). Tiers: UHL, EHL, OHL. |
| **DPA** | A data processing agreement with a vendor, or a data protection authority (a regulator), depending on context |
| **DPCO** | Data Protection Compliance Organisation: licensed by the NDPC to audit and file returns |
| **DPF / UK–US data bridge** | The EU–US Data Privacy Framework and its UK Extension for transfers to certified US companies |
| **DPIA** | Data protection impact assessment (in the NDPA: data privacy impact assessment) |
| **DSR / DSAR** | A data subject (access) request: a person exercising their rights |
| **GAID** | NDPC's General Application and Implementation Directive 2025 under the NDPA |
| **IDTA / SCCs** | The UK International Data Transfer Agreement / the EU Standard Contractual Clauses |
| **LIA** | Legitimate interests assessment |
| **PECR** | UK Privacy and Electronic Communications Regulations: cookies and e-marketing |
| **RLS** | Row-Level Security: Postgres policies that decide which rows a user may read or write |
| **RoPA** | Record of Processing Activities |
| **RPO / RTO** | The maximum acceptable data loss / time to restore after an incident |
| **Soft opt-in** | The UK/EU exception allowing marketing to existing customers about similar products, with an opt-out every time |
| **Special category data** | Health, biometric (for ID), genetic, sex life/orientation, religion, ethnicity, political opinions, trade-union membership |



---

<a id="appd"></a>
## Appendix D — Stack & project-type profiles

Use these with Part 3. Each profile lists what changes from the web reference stack. A project can match several profiles; a mobile app for a wearable, for example, uses D3 and D4.

Other server stacks (Laravel, Rails, Django, Express) keep the same rules. Enforce access in the data layer where the database has no RLS (5.4), and treat controllers and route handlers like Server Actions: re-check authorisation in each one. A dedicated profile for these stacks is planned.

### D1 Web app (Next.js + Supabase): the reference

Parts 3–7 as written.

### D2 Progressive web app (PWA)

- **Caching:**
  - The service worker caches static assets only.
  - If personal data must work offline, keep it in IndexedDB scoped to the user.
  - Clear Cache Storage and IndexedDB on sign-out, and version every cache.
- **Background location doesn't exist on the web.** Tracking stops, or becomes unreliable, when the screen locks or the tab is hidden. If driver or worker tracking must continue in the background, use a native or wrapped app with the OS background-location permission, plus a DPIA (9.14).
- **Web push:** ask only after a user action that explains the value. On iOS (16.4+), web push works only for PWAs added to the Home Screen.
- **Updates:** when a new service worker is waiting, show "Update available — refresh".
- **Mandatory states:** S4 (offline) and S12 (queued, syncing, conflict).

### D3 Mobile app (Flutter, React Native, native)

- **No secrets in the binary:** anything you ship can be extracted. Ship only the publishable key; access is enforced by RLS or Security Rules, and privileged work runs on your server or in edge/cloud functions.
- **Local storage:**
  - Keep tokens in the Keychain or Keystore (e.g. `flutter_secure_storage`).
  - Encrypt local databases that hold C2/C3 data (e.g. SQLCipher).
  - Exclude sensitive files from device and cloud backups.
- **SDK inventory:** derive it from `pubspec.yaml` or `package.json`. It feeds iOS privacy manifests and the App Store privacy label (9.25), the Google Play Data safety form and the cookie/SDK register (9.8). Cross-app tracking requires App Tracking Transparency.
- **Permissions:**
  - Request each one at the moment of use, with a clear purpose string (e.g. `NSLocationWhenInUseUsageDescription`, `NSMicrophoneUsageDescription`, `NSBluetoothAlwaysUsageDescription`).
  - Design the "denied" state as well.
- **Firebase backends:**
  - Security Rules are your RLS: never ship test-mode rules, and test the rules with the emulator in CI.
  - Choose the Firestore location (e.g. `europe-west2`, London) at creation; it can't be changed later.
- **Store rules:** in-app account deletion (both stores; Google also needs a web link), age-rating questionnaires, and push permission kept separate from marketing consent.
- **Crash reporting:** no personal data in custom keys or logs, and declare it in the store labels.
- **Extra states:** OS permission denied, update required, and deep links to deleted content (S11).

### D4 Wearables, BLE & connected devices

- **Minimise at the source:** collect only the metrics a feature uses. Raw audio, ECG and continuous vitals are C3.
- **Device states** (add them to the state matrix): pairing, connected, disconnected or out of range, syncing, low battery, firmware updating, Bluetooth permission denied, sensor error.
- **Permissions:**
  - Android 12+: `BLUETOOTH_SCAN` (flagged `neverForLocation` if you don't derive location) and `BLUETOOTH_CONNECT`.
  - iOS: `NSBluetoothAlwaysUsageDescription`.
- **Security:**
  - LE Secure Connections pairing and encrypted sensitive payloads.
  - Signed firmware updates and no default passwords.
  - A published vulnerability disclosure policy (UK PSTI, 9.13).
- **Vendor clouds:**
  - Map exactly where device data goes. Many white-label devices send data to the manufacturer's cloud, often outside the UK/EU.
  - Each such flow needs a DPA, a transfer mechanism (9.17) and a line in the privacy notice. Where the SDK allows a direct device-to-app connection, consider bypassing the vendor cloud.
- **Monitoring other people** (family, carers):
  - The monitored adult gives their own informed consent; a child is told in age-appropriate terms.
  - Sharing is easy to pause or stop, with limits on location precision and history.
  - Recordings may also capture **bystanders**: be transparent with them, and keep only what the feature needs.
- **Selling the hardware:** product compliance goes beyond data. For example: radio equipment conformity (UKCA/CE marking), a PSTI statement of compliance, WEEE and battery obligations. Get product-compliance advice before importing.
- **Health claims:** see the medical device check (9.13). ECG, SpO₂ or "health alert" features marketed for health purposes need particular care.

### D5 Admin panels, CRMs & internal tools (schools, clinics, small businesses)

- **Roles:**
  - Your client is usually the **controller** and you are their **processor**. Sign a DPA with them (9.2), act only on their instructions, and help them meet their duties.
  - **If you're established in the UK or EU, UK/EU GDPR processor duties apply to you even when the client and its users are abroad** (Art. 3(1)).
- **Access:**
  - Least-privilege roles, with MFA for staff.
  - Audit logs for viewing and exporting records.
  - Session timeouts on shared computers.
- **Exports are the biggest leak:** limit CSV/PDF exports to specific roles, log them, and never email attachments that contain personal data.
- **Children's records (pupils):**
  - Parents and guardians see only their own children; staff see only the classes they teach.
  - No pupil data in analytics, and minimal data on fee and finance screens.
- **HR and health records:** separate tables, restricted roles.
- **Local law:** check the client's country. For example, Pakistan had no comprehensive data protection law as of March 2026 (the Personal Data Protection Bill 2023 was not yet passed), though PECA 2016 and the constitutional right to privacy (Art. 14) apply. Build to this blueprint's standard regardless, and agree the hosting region in the DPA.

### D6 Research prototypes & participant data (academic)

- **Ethics approval** comes before collecting any participant data, with a participant information sheet and consent form.
- **Ethics consent is separate from the GDPR lawful basis.** UK universities commonly rely on public task plus Art. 9(2)(j) research safeguards; confirm with the university's DPO.
- **Data management plan:**
  - Use university-approved storage.
  - Pseudonymise at collection, and keep the keys separate.
  - Retain data as the protocol says, and share only through approved repositories or agreements.
- **Vulnerable participants** (e.g. disabled or older people): expect a DPIA and provide accessible consent materials.
- **Sensors that capture people** (cameras, microphones, radar, Wi-Fi sensing) are monitoring:
  - Tell bystanders.
  - Prefer on-device processing and non-identifying sensing.
- **Prototype → product:** research data can't simply be reused for a commercial product. A product needs its own lawful basis, consent where required, and the new-project track.

### D7 Websites, landing pages & waitlists

- **Minimum set:**
  - self-hosted fonts and assets;
  - no analytics or pixels before consent (or UK-exempt analytics with an opt-out);
  - waitlist consent wording and a timestamp (9.11);
  - a privacy notice and company details;
  - the ICO fee if you process personal data electronically.
- **Charities and religious organisations:**
  - Membership, attendance and donation data can reveal **religious beliefs**, which is special category data: collect less and restrict access.
  - Registered charities can use the UK **charity soft opt-in** for supporters (9.11).
  - Keep Gift Aid declarations for as long as HMRC requires.

### D8 AI agents & clinical or decision-support prototypes

- **Data:** synthetic or properly anonymised only, until Parts 8, 9.13, 9.21 and 9.22 are complete.
- **Medical devices:** triage, diagnosis or clinical decision-support software is likely to be a **medical device** (9.13). In the EU, AI in medical devices falls under the AI Act's high-risk rules for regulated products (Annex I), deferred to 2 Aug 2028 by the Digital Omnibus on AI.
- **Design:** human in the loop; log decisions and model versions; evals that include safety-critical cases.

### D9 Hardware or embedded projects with no personal data

- **Which parts apply:** Parts 3, 4, 11 and 12 (architecture, decisions, plan, debugging).
- **When Part 9 switches on:** as soon as a camera, microphone or sensor can capture people, the project processes personal data.

*End of blueprint. Keep it current: an out-of-date blueprint is worse than none.*
