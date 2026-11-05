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
8. **Research before you build.** For anything new, look at how others have done something similar (official docs, GitHub repositories and issues, Stack Overflow) and the problems they hit, before making assumptions or building from scratch (12.2, step 0).

### Where the usual planning documents live

Many builders plan with six documents plus decision records and prompts. In Bansat they're parts of one blueprint, so they can't contradict each other:

| Document | Where it lives |
|---|---|
| Product requirements (PRD) | Part 1, with the numbers in Part 2 |
| Technical requirements (TRD) | Part 3 |
| Architecture decision records (ADRs) | Part 4 |
| App flow | 10.1 journey diagram, 10.2 key flows, 10.3 screen inventory and navigation map |
| UI/UX design brief | 10.4 screen specs, 10.5 look-and-feel brief and design system, 10.6 accessibility, 10.7 UI states |
| Backend schema | Part 5: data dictionary, entity-relationship diagram, schema, access rules; Part 6: API |
| Implementation plan | 11.1 phased plan, with 11.2 Definition of Ready and Done |
| Prompts for agents | 12.4: research first, logic first, feature, debug, full audit and more |

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
