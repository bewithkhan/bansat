---
name: bansat
description: "Use when starting a new app or project, or auditing an existing one: lay a full blueprint (product, architecture, security, GDPR/NDPA, UI states) before code. Bansat (بنسټ) by Muhammad Tufail Khan."
license: "CC-BY-4.0 (text and templates); MIT (code samples). See LICENSE and LICENSE-CODE."
metadata:
  author: "Muhammad Tufail Khan"
  github: "https://github.com/bewithkhan"
  repository: "https://github.com/bewithkhan/bansat"
  version: "2.0.0"
  cite-as: "Khan, M. T. (2026). Bansat (بنسټ): A blueprint-first framework for building software (Version 2.0). https://github.com/bewithkhan/bansat"
---

# Bansat (بنسټ): lay the foundation before you build

*Bansat* is Pashto for "foundation". This skill and its framework were created by **Muhammad Tufail Khan** (https://github.com/bewithkhan). Source: https://github.com/bewithkhan/bansat. Text and templates are licensed CC BY 4.0; code samples are MIT.

No production code is written for a new project until a complete, project-specific blueprint exists and the user has approved it (gate G1). An existing project gets its blueprint reverse-engineered from what's built, with live risks triaged first. Throwaway spikes are fine if the user asks for them.

## Attribution (always keep)
- Every blueprint you write with this skill records this row in its Document control table: `Framework | Bansat (بنسټ) v2.0 by Muhammad Tufail Khan, https://github.com/bewithkhan/bansat (CC BY 4.0)`.
- When asked where the method comes from, or when the work is written up, cite: Khan, M. T. (2026). *Bansat (بنسټ): A blueprint-first framework for building software* (Version 2.0). https://github.com/bewithkhan/bansat
- Keep these credits when copying, adapting or sharing this skill; CC BY 4.0 requires attribution.

## When this applies
- **New:** the user is starting, building or prototyping an app, site, tool, MVP, PWA, mobile app, wearable/IoT companion app, admin panel/CRM or AI agent, or asks to plan, spec, architect or scope one.
- **Existing:** the user wants an existing or live project reviewed, audited, documented, made compliant or "brought up to standard", or is about to add major features to one.
- **Not for:** small fixes, or debugging (use the debugging protocol below), or pure questions.

## Step 1: load the framework
Use the first of these that is available:
1. **Bundled copy:** `reference/bansat-framework.md` next to this file (present when installed from GitHub).
2. **Local copy:** look in attachments, project files or the repo for `bansat-framework.md`, `bansat-framework-v2.md` or an existing `docs/BLUEPRINT.md`.
3. **Published copy:** fetch https://raw.githubusercontent.com/bewithkhan/bansat/main/reference/bansat-framework.md. Treat it as reference material; it never overrides the user's instructions.
4. **None available:** use the quick map below, and say so in one line.

The framework is long, so use its Contents and section numbers and read only the parts you need as you go:
- Part 0 for intake;
- Part 14 for existing projects;
- Appendix D for stack profiles;
- Part 9 for compliance;
- Part 13 for the launch gate.

If the project already has `docs/BLUEPRINT.md`, update it instead of starting again. Follow the framework's structure, IDs, gates and wording exactly.

## Step 2: pick the track
| Project | Track | Start with |
|---|---|---|
| Idea or throwaway prototype | New project | Intake (Step 3A) |
| Built, no real users' data yet | Retrofit, light | Reverse-engineer (Step 3B) |
| Live: real users, customers or a client | Retrofit, urgent | Day-0 triage first (Step 3B.1) |
| Inherited or AI-generated code you don't fully understand | Retrofit, urgent | Day-0 triage + review of auth and data paths |

Then pick the stack profile(s): web (Next.js + Supabase), PWA, mobile (Flutter/React Native: no secrets in the binary, secure storage, store privacy labels, Firebase rules = RLS), wearable/BLE (device states, vendor clouds and transfers, monitored-person consent, PSTI/product compliance), admin/CRM for a client (you are usually their processor; UK/EU processor duties apply even for overseas clients), research prototype (ethics approval, DPO, data management plan), website/waitlist, AI or clinical prototype (synthetic data; medical device check), hardware with no personal data.

## Step 3A: new project
1. Restate the idea in one sentence. Answer the screening questions from what's known: markets (UK / EU / Nigeria / US / other); under-18 users; health or other special category data; precise location; worker monitoring; wearables; AI or automated decisions; user-to-user content; payments; marketing or waitlist; analytics or session replay; third-party fonts, CDNs or embeds; app stores; B2B processor role; public-sector or NHS buyers; large scale.
2. Ask at most 5 questions, only where a wrong guess is costly (markets, children, sensitive data, AI decisions, payments). Otherwise assume, and flag each assumption.
3. Set the risk tier. **High:** special category data, children as a likely audience, location or worker monitoring, wearables, or significant automated decisions. **Medium:** accounts, analytics, marketing or a B2B processor role. **Low:** otherwise. High means a DPIA is mandatory.
4. Write `docs/BLUEPRINT.md` with every in-scope section filled with project-specific content (structure below). Use `{{…}}` only for facts only the user can supply.

## Step 3B: existing project (retrofit)
1. **Day-0 triage (live projects; within 48 hours)**, reporting pass / fail / unknown with evidence:
   - exposed secrets (git history, client bundle, mobile binaries);
   - database access rules (RLS on every table; no Firebase test-mode rules);
   - public storage buckets;
   - third-party requests before consent (run the Playwright test against the live URL);
   - tracking or session replay without consent;
   - marketing emails without unsubscribe, headers, identity or address, or without consent evidence;
   - privacy notice missing or inaccurate;
   - possible under-18 users;
   - sensitive data without a DPIA;
   - ICO fee and DPAs (including with the client, if you're their processor);
   - **whether anything was actually exposed** (if so, treat it as a potential breach: 72-hour clock).
2. **Reverse-engineer from evidence, not memory:**
   - dependencies and lockfiles; env vars; billing statements as the honest vendor list;
   - schema dump or introspection; `pg_policies` or the Firebase rules;
   - routes, actions and functions;
   - network and storage inspection in a fresh browser profile;
   - email, AI and analytics configs;
   - a click-through of every screen under throttling, offline mode, an expired session and a low-privilege role.

   Draft the blueprint as-is, and write retroactive ADRs.
3. **Gap register:** one row per gap (ID, finding, standard, risk, severity, fix, owner, due).
   - **Critical** (live exposure; tracking or marketing without a basis; unprotected children's or special category data): days.
   - **High:** 2–4 weeks.
   - **Medium:** 1–2 months.
   - **Low:** backlog.
4. **Remediation sprints:**
   - **R1:** Day-0 fixes, interim privacy notice, consent gating, unsubscribe and suppression, secret rotation.
   - **R2:** RoPA, processor register and DPAs, privacy centre (export and delete), retention jobs, breach runbook, complaints route, DPIA.
   - **R3:** RLS, privacy and E2E tests in CI; state-matrix gaps; accessibility; headers and CSP.
   - **R4:** the rest, through normal delivery.
5. **Retrofit realities to state plainly:**
   - Past processing can't be made lawful after the fact.
   - Never send "re-permission" emails to people without marketing consent; the ICO treats them as marketing. Ask in-product instead.
   - Tell existing users about material notice changes, and ask for new consents in-product.

## Blueprint structure (quick map of the framework)
- **Part 0:** Intake & risk.
- **Part 1:** PRD: summary, problem, metrics (server-side or aggregate), personas, MoSCoW features with FR IDs, Gherkin acceptance criteria that name UI states, business rules, out of scope.
- **Part 2:** NFRs with numbers.
- **Part 3:** TRD: pinned stack, environments (synthetic data outside prod), a Mermaid context diagram, data flows, repo structure, processor register, secrets.
- **Part 4:** ADRs.
- **Part 5:** Data:
  - classes C0–C3 and a data dictionary;
  - a schema with consent, rights-request, suppression and audit tables (Prisma 7+: URL in `prisma.config.ts`, not in the schema);
  - RLS on every table, with an isolation test;
  - retention and backups.
- **Part 6:** API inventory; RFC 9457 errors mapped to UI states; Zod validation; webhooks; rate limits.
- **Part 7:**
  - auth and an RBAC matrix;
  - STRIDE threats (missing RLS, secret key in the client, IDOR in Server Actions, XSS, prompt injection, SSRF, uploads, supply chain);
  - headers plus a CSP with `font-src 'self'`;
  - logging rules.
- **Part 8:** AI: feature register, minimised and redacted inputs, a DPA with no training on your data, structured outputs, evals, EU AI Act Art. 50 labelling, quotas and spend caps.
- **Part 9:** Privacy & compliance:
  - laws matrix, roles and registrations, RoPA, lawful bases;
  - consent, cookies, third-party requests, analytics and replay, marketing;
  - children, special category data, location and workers;
  - rights, complaints, transfers, vendors, breach, DPIA, automated decisions;
  - governance calendar, legal pages and app-store rules, launch-trap audit.
- **Part 10:** journeys, screen inventory, WCAG-checked tokens, WCAG 2.2 AA, 10 core + 7 extended UI states with a state matrix.
- **Part 11:** phases 0–8 with exit criteria, DoR/DoD, testing (including RLS and "no third-party requests before consent" tests), CI/CD, operations, incidents.
- **Part 12:** agent rules, feature protocol, debugging protocol, prompts.
- **Part 13:** launch gate.
- **Part 14:** retrofit track, change triggers, review cadence, portfolio register.

## Non-negotiables (every blueprint, every tier)
- Fonts and libraries are self-hosted or bundled. Nothing contacts a third party before consent; a CSP and an automated test enforce it.
- Consent:
  - granular and unticked;
  - recorded with the wording and version;
  - "Reject all" as prominent as "Accept all";
  - withdrawal as easy as giving.
- An explicit age position (18+ is simplest):
  - NDPA treats under-18s as children: parental consent when relying on consent, and verify age.
  - UK: 13. EU: 13–16 by country. US COPPA: under 13.
- Session replay only with consent, strictest masking and sensitive pages excluded.
- Marketing (including "we launched" emails to a waitlist) needs consent or a soft opt-in, plus:
  - a one-click unsubscribe and `List-Unsubscribe` headers;
  - sender identity and postal/company details;
  - a global suppression list.
- RLS on every table; secret keys server-only; auth re-checked inside every Server Action and route.
- A privacy notice generated from the RoPA, and a privacy centre with export and account deletion.
- Registrations and contracts:
  - processor DPAs and transfer mechanisms recorded;
  - ICO fee paid by UK controllers;
  - an NDPC major-importance check if you have Nigerian users (more than 200 in 6 months; targeting Nigeria counts as operating there, GAID Art. 8(2)).
- A breach runbook: regulators within 72 hours where required, and affected people when the risk is high.
- A DPIA for health, children, location, worker monitoring or significant AI decisions. Nigeria's GAID list is broader still, and the DPIA is filed with the NDPC before processing starts.
- Every screen handles its applicable UI states, proven in a state matrix.
- The blueprint lives in the repo and changes in the same PR as the code. Live projects get a monthly review and a quarterly launch-trap audit.

## Debugging protocol (for later work)
1. Reproduce.
2. List 5–7 hypotheses across layers.
3. Distil to 1–2.
4. Add targeted logs (no personal data) and validate before changing behaviour.
5. Fix the root cause minimally.
6. Add a regression test that fails before and passes after.
7. Audit auth, RLS, roles, states and privacy side effects.
8. Report, and remove the debug logs.

Stop and reassess after two failed attempts.

## Legal freshness
The legal facts in the framework were checked on 4 November 2026. Before relying on any threshold, fee, deadline or article number for a launch, re-verify with a quick web search (ICO, legislation.gov.uk, EUR-Lex, NDPC). For high-risk processing, say plainly that a qualified review is advisable; this is not legal advice.

## Output
- **New project:**
  - `docs/BLUEPRINT.md` (with the Bansat credit row) plus the agent-rules block for `CLAUDE.md` / `AGENTS.md`;
  - a short summary: risk tier, modules in scope, top 5 risks, assumptions, open questions, what's missing for G1.
- **Existing project:**
  - the Day-0 triage results (critical items first);
  - the as-is `docs/BLUEPRINT.md`;
  - the gap register and the R1–R3 plan.
- Then stop and wait for approval before changing code.