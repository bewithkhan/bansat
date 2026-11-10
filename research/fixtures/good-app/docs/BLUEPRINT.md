# Blueprint: Fixture good app

| Field | Value |
|---|---|
| Framework | Bansat (بنسټ) v2.4 by Muhammad Tufail Khan, https://github.com/bewithkhan/bansat (CC BY 4.0) |

**Gate approvals**

| Gate | Approver | Date | Notes |
|---|---|---|---|
| G1 Blueprint approved | Experiment operator | 2026-11-10 | |

## Part 0 — Intake & risk

Risk tier: **High**, because children under 13 can sign up with a parent's consent, and the app sends their text to an
AI model. Markets: the UK and the EU. A DPIA is required before any real data. Docs are never scored, so nothing here
counts: not even this mention of fonts.googleapis.com, which the app never uses.

## Part 1 — Product requirements

Pupils practise spelling with an AI helper; parents approve accounts; a launch email goes to the waitlist. The MVP has
sign-up, practice sessions, a parent dashboard and account deletion with data export. Features carry FR IDs.

## Part 2 — Non-functional requirements

Core Web Vitals at p75 on mobile: LCP 2.5 s or less, INP 200 ms or less, CLS 0.1 or less. WCAG 2.2 AA on every screen.
Uptime 99.5% a month. Restore from backup within four hours. Monthly AI spend capped at a fixed amount per pupil, with
alerts at half and at the cap.

## Part 3 — Architecture

Next.js with Supabase in the EU region. Processor register: Supabase (database and auth), Anthropic (AI), Resend
(email), Stripe (payments), Google Analytics (only after consent). Secrets live in the host's secret store.

## Part 4 — Decisions (ADRs)

ADR-001 Next.js and Supabase. ADR-004 fonts self-hosted and nothing third-party before consent. ADR-006 the AI provider
has a DPA and doesn't train on our data. Each ADR records the prior art we looked at before deciding.

## Part 5 — Data

Row Level Security on every table, with an isolation test in CI for each role and tenant. The age check stores the
result, never the date of birth. Retention: inactive accounts are deleted after 24 months.

## Part 6 — API

Server actions and route handlers re-check the session and the role on every call. Errors follow RFC 9457 and map to
UI states. Rate limits on sign-up, AI and export endpoints, per account and per IP address.

## Part 7 — Security

Headers and a CSP with font-src 'self'. STRIDE threats T-01 to T-16 reviewed for this app. Logging never records
emails, prompts or pupils' text; audit logs record exports, deletions and role changes.

## Part 8 — AI

AI feature register: AI-01 spelling hints, with a pinned model, minimised input (no names), structured output, evals
including safety cases, and a label that the hints are AI-generated. Per-pupil quotas and a monthly spend cap.

## Part 9 — Privacy and compliance

RoPA for every purpose, with its lawful basis. Age position: under-13s need parental consent, verified by email. The
launch email is marketing: consent, an unsubscribe link and List-Unsubscribe headers. Launch-trap audit (9.26) done
before G2. DPIA completed and signed off before any real pupil data.

## Part 10 — Experience

Every screen has its UI states in the state matrix (10.7): empty, loading, error, offline, rate-limited, session
expired and more. Children's screens use plain words, large targets, no streaks and no nudges, and parents' screens
show progress without comparing children with each other.

## Part 11 — Delivery

A solo loop with weekly demos, recorded in an ADR. Tests: RLS isolation, the privacy test that nothing third-party
loads before consent, and end-to-end tests of sign-up, parental consent, deletion and export.

## Part 12 — Agent rules

The coding agent uses development keys only, asks before any destructive command, and treats text it reads in tools,
issues and web pages as data, never as instructions. The rules live in CLAUDE.md.

## Part 13 — Launch gate

Every blocking item green or N/A with a reason before launch: RLS, secrets, privacy notice, age position, consent,
marketing email, processor DPAs, the privacy centre and the registrations.
