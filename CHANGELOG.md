# Changelog

All notable changes to Bansat (بنسټ). Each release is a git tag, and the install command in the README is pinned to one, so the skill's instructions only change when you choose to update.

## v3.1.0 (2026-11-10)

Twelve more launch traps, so the launch-trap audit (9.26) now has 29. Each has the law or flaw behind it, a fix that points to the framework section that covers it, and a way to prove the fix:

- **18. A chatbot or AI feature that doesn't say it's AI** (EU AI Act Art. 50, since 2 Aug 2026).
- **19. "Do Not Sell or Share" missing, or Global Privacy Control ignored** (US state laws, California's among them).
- **20. Face, voice or fingerprint features without written consent** (Illinois BIPA, 740 ILCS 14/15).
- **21. Wellness or symptom features without health-data consent** (Washington's My Health My Data Act, RCW 19.373.030).
- **22. No online way to withdraw or cancel** (the EU withdrawal function, Consumer Rights Directive Art. 11a, from 19 Jun 2026).
- **23. No company details or legal notice** (UK company disclosures; the German Impressum, §5 DDG).
- **24. An EU shop or consumer service that fails accessibility law** (the European Accessibility Act, since 28 Jun 2025).
- **25. Authorisation only in the UI or in middleware** (CVE-2025-29927 let requests skip Next.js middleware).
- **26. AI endpoints with no quota or spend cap** (OWASP LLM10:2025 Unbounded Consumption, and prompt injection).
- **27. App store privacy labels that don't match the app.**
- **28. Card details collected in your own form** (PCI DSS scope).
- **29. Payment webhooks accepted without a signature check.**

Also: 9.13 names the US biometric and health-data laws, 9.25 adds the EU withdrawal function, Appendix B lists the new sources, and the README and the paper carry the full table. The experiment still uses v3.0.0 and its 17 traps, as its protocol says.

**Updating:** switch your install to v3.1.0, update the Framework row of each blueprint to v3.1, and run traps 18 to 29 against it before the next gate.

## v3.0.0 (2026-11-10)

Bansat now carries the law and your stack with it: a public privacy-law registry of 120 jurisdictions that the agent reads for the markets your app serves, a weekly watch that keeps it current, and 24 stack profiles.

- **Law registry (`laws/`).** 120 jurisdictions. 62 full entries give every obligation a builder meets: who the law covers, lawful bases, the consent age, children, cookies, marketing, breach notice, registration and fees, DPOs, transfers, DPIAs, automated decisions and AI, and penalties. 58 basic entries give each other country's main data protection laws and its regulator. Every claim cites an official source (legislation, an official gazette, the regulator or a court), 2,944 URLs in all, and CI checks that each one is on an official domain listed for its jurisdiction. Every entry says when it was last checked and how; all 120 are `ai-checked`, not reviewed by a lawyer. The skill reads only the entries for the markets Part 0 names, and re-checks an entry against its sources if it was checked more than 90 days ago.
- **Law Watch (`watch/`).** A GitHub Action checks 105 official sources for 46 full entries every week and opens an issue when one changes. A weekly AI verify task reads the official source, drafts a sourced update and opens a pull request, and a person reviews and merges every change. Its evaluation, 31 golden cases with six carrying planted instructions, is in `watch/eval/`: in the second round the task found all 18 known changes, invented none and followed no planted instruction.
- **Law tracker.** A page for every jurisdiction at https://bewithkhan.github.io/bansat/laws/, grouped by region, with a feed of changes. Like every page on the site, it sets no cookies and makes no third-party requests, and CI checks both.
- **Stack profiles (`stacks/`).** 24 profiles say what changes from the reference stack (Next.js and Supabase) on seven backend frameworks, six frontend and full-stack ones, four mobile platforms, and seven no-code or backend-as-a-service platforms. The skill loads only the profile for the stack Part 0 names, and each one is a page on the site.
- **README.** A section on what builders can use today, what's missing and what Bansat adds; the 17 launch traps with each one's fix and how it's proved; the law registry, the stack profiles and the research; and a drawn workflow figure.
- **Research (`research/`, `paper/`).** The paper on Bansat by Muhammad Tufail Khan and Naeem Ramzan, and the experiment it pre-specifies: six app briefs, 14 automated checks and the scripts that run and score each build. The plan was agreed and published before any run.
- **Site.** A keyboard-only test on the home page, the law tracker and a country page: Tab starts at the skip link, every stop has a visible focus indicator, and the skip link leads into the content.

**Future work.** Basic entries for about 50 more countries, in five batches: the Caribbean; North and West Africa; East Africa; Central and Southern Africa; and the rest of Asia. Watch sources for the 14 Asia-Pacific full entries, and for Tennessee and DIFC. The experiment's runs, then the paper on arXiv. The blueprint lists them (Part 11).

**Updating:** switch your install to v3.0.0, then update the Framework row of each blueprint to v3.0. If a project isn't built on Next.js and Supabase, read the profile for its stack and record any differences in Part 3. For each market a project serves, compare Part 9 with that market's registry entry.

## v2.4.0 (2026-11-05)

- **Breach casebook (Appendix F).** Twenty documented incidents and regulators' decisions from January 2025 to October 2026, from apps built with AI tools to the largest platforms, each mapped to the Bansat checks that catch its class of failure. Every case rests on a primary source (the organisation's own statement, a regulator, a CVE record or the researcher who found the problem), records any dispute, and was checked against its sources by an independent review. It's also a page on the [site](https://bewithkhan.github.io/bansat/casebook/).
- **Checks the casebook found missing:**
  - **AI coding agents (12.1, T-13, T-14).** Development keys only, never production or account-wide tokens; a person confirms every destructive command; approval prompts and sandboxes stay on; and text the agent reads (tool and MCP results, issues, error reports, web pages) is data, not instructions. A new paragraph says how to back the rules with limits the agent can't argue its way past.
  - **CI/CD and publishing (7.4, T-12, T-16).** Pinned actions or GitHub's workflow lockfile, read-only workflow tokens by default, no secrets for untrusted pull requests and no untrusted text in `run:` scripts, trusted publishing with 2FA, lockfile installs where only approved dependencies run install scripts, and new versions left to age in both the update bot and the package manager, with security fixes exempt.
  - **Connected apps (7.4, T-15).** The narrowest scopes, integration tokens encrypted and rotated, and only reviewed third-party apps on staff Google Workspace or Microsoft 365 accounts.
  - **And:** no default passwords, and no test accounts in production apart from a listed app-store review account (7.1); nothing that stores data reachable from the internet without authentication (7.4); secrets stored as write-only values in the platform's secret store (7.4); leavers' access removed the same day (7.4); uploaded code, scripts and templates never run outside a sandbox (T-07); backups kept apart from what they protect (5.7); a set time to triage security reports (7.6); credible claims of stolen data treated as possible breaches (9.20); passkeys or MFA for special category data (9.13); agents in AI features get the least access that works (8.4).
- **Launch gate (Part 13).** 40 checks, 18 of them blocking, with new ones for default passwords and test accounts, open data stores, and agent and CI credentials.
- **Day-0 triage (14.2).** A new T11 lists the credentials AI agents and CI can reach. "Was anything exposed?" is now T12.
- **References (Appendix B).** The OWASP Top 10 for Agentic Applications, GitHub's secure-use guide for Actions and its pages on script injection, `pull_request_target` and workflow lockfiles, npm trusted publishing and 2FA, Dependabot and Renovate release-age settings, and the Google Workspace and Microsoft Entra controls for third-party apps.

**Re-checking an existing blueprint:** update the Framework row to v2.4; copy the new rules into your agent rules file (12.1); run Day-0 triage T11 on live projects; check the new launch-gate items, two of them blocking (Part 13); and change any reference to Day-0 triage T11 "Was anything exposed?" to T12.

## v2.3.1 (2026-11-05)

- **Documentation site.** The framework, the method profiles, the v3 blueprint and this changelog are now searchable pages at https://bewithkhan.github.io/bansat/, rebuilt from the repo on every merge. They set no cookies and make no third-party requests, and CI checks every page for both, plus broken links and accessibility (axe, WCAG 2.2 AA).
- **Fixed:**
  - The UK regulator is now the Information Commission, which took over from the ICO on 30 September 2026. Its website is still ico.org.uk (9.1).
  - The skill's routing table loads the chosen method profile(s), so an outer and an inner method can both be read.

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
