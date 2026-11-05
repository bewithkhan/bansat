<a id="p4"></a>
## Part 4 — Architecture decision records (ADRs) `[CORE]`

### 4.1 ADR template

```text
ADR-NNN — {{Title}}
Status: Proposed | Accepted | Superseded by ADR-NNN        Date: {{YYYY-MM-DD}}   Review by: {{date}}
Context: {{forces, constraints, options considered}}
Prior art: {{how others solved this (docs, GitHub repos and issues, Stack Overflow, with links) and the problems they hit}}
Decision: {{what we will do: reuse, adapt or build, and why}}
Consequences: (+) {{benefits}}   (−) {{costs, risks, follow-ups}}
Privacy & security impact: {{new data, vendors, transfers; RoPA/DPIA updates needed}}
```

### 4.2 Baseline ADRs (accepted unless a project overrides them)

**ADR-001 — Next.js App Router for full-stack development.** *Context:* fast iteration, good SEO and no separate backend cluster. *Decision:* Next.js App Router on Vercel. *Consequences:* (+) unified codebase and deployments. (−) Strict Server/Client Component boundaries. **Every Server Action is a public HTTP endpoint**, so each one MUST validate its input and re-check authentication and authorisation itself. Middleware or UI checks are never enough on their own.

**ADR-002 — Supabase Postgres + Prisma, with RLS as defence in depth.** *Context:* relational, multi-tenant data that needs type-safe queries. *Decision:* Prisma for server-side data access through one data-access layer (`lib/server/db/*`) that always scopes by `organizationId` and calls `assertCan()` (7.2). RLS is enabled on **every** table for any access through the Supabase client SDK. *Consequences:* (+) type safety, migrations, layered protection. (−) **Prisma connects as the table owner, which bypasses RLS**, so server code must enforce tenancy itself. Tenant-isolation tests (5.4, 11.3) cover both paths.

**ADR-003 — Mandatory UI-state architecture and systematic debugging.** *Context:* missing states and guessed bug fixes produce dead ends and regressions. *Decision:* every screen implements the applicable states from 10.7, proven by its state matrix, and all bug work follows the protocol in 12.3. *Consequences:* (+) no dead ends and verifiable fixes. (−) More upfront work per screen.

**ADR-004 — Privacy-by-default front end.** *Context:* third-party fonts, CDNs, pixels and widgets disclose visitors' IP addresses and behaviour before any consent (9.9). *Decision:* the browser contacts only first-party and strictly necessary hosts until consent is given. Fonts and libraries are self-hosted or bundled. Non-essential scripts load only through the consent-gated loader (9.7). A CSP allowlist and an automated test enforce this. *Consequences:* (+) compliant by construction, and faster pages. (−) Every new vendor goes through the register (3.6).

**ADR-005 — Data residency.** *Decision:* the primary database, storage and functions run in {{UK/EU}} regions. Any processor outside the UK/EU needs a recorded transfer mechanism (9.17). *Consequences:* (+) simpler transfers and customer trust. (−) Some vendor choices are ruled out.

**ADR-006 — AI provider & data handling.** *Decision:* use providers with a signed DPA that contractually exclude training on your data, with a stated retention period and a region choice where available. Send minimised, redacted inputs. Validate structured outputs. Pin model IDs. *Consequences:* (+) predictable cost and compliance. (−) Model upgrades need an eval run (8.5).

**ADR-007 — Email architecture.** *Decision:* separate transactional and marketing streams, with marketing sent from a subdomain (e.g. `news.{{domain}}`). A global suppression list is the source of truth, and SPF, DKIM and DMARC are set on all sending domains. *Consequences:* (+) deliverability, and unsubscribes are honoured everywhere. (−) Two templates and two configurations to maintain.
