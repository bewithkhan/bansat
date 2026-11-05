# The Bansat framework, in modules

The framework is split into one file per part, so the skill (and you) can read only what a project needs. `reference/bansat-framework.md` is the same text as a single file. It's generated from these modules by `scripts/build-framework.ts`, and CI fails if the two drift apart, so edit the modules, never the combined file.

| Module | What it covers | Read it when |
|---|---|---|
| [cover.md](cover.md) | Title, credit, Document control template, what changed in each version | Starting any blueprint |
| [how-to-use.md](how-to-use.md) | Tracks, depth by risk tier, gates G0–G4 | Starting any blueprint |
| [00-intake.md](00-intake.md) | Part 0: snapshot, screening questions, risk tier, delivery questions | First, for every project |
| [01-prd.md](01-prd.md) | Part 1: product requirements (PRD), features, acceptance criteria | Every project |
| [02-nfr.md](02-nfr.md) | Part 2: non-functional requirements with numbers | Medium and High tier |
| [03-trd.md](03-trd.md) | Part 3: technical requirements and architecture (TRD) | Every project |
| [04-adrs.md](04-adrs.md) | Part 4: architecture decision records, with prior art | Medium and High tier, or any big choice |
| [05-data.md](05-data.md) | Part 5: data classes, dictionary, ER diagram, schema, access rules (RLS) | Any project that stores data |
| [06-api.md](06-api.md) | Part 6: API inventory, error contract, validation, webhooks, rate limits | Any project with a backend |
| [07-security.md](07-security.md) | Part 7: authentication flow, RBAC, threat model, security baseline | Any project with accounts |
| [08-ai.md](08-ai.md) | Part 8: AI and LLM features | Only when Part 0 says the project uses AI |
| [09-privacy.md](09-privacy.md) | Part 9: privacy law, consent, cookies, rights, breach, DPIA | Every project (Low tier: 9.8, 9.9 and 9.26) |
| [10-experience.md](10-experience.md) | Part 10: app flow and navigation map, screens, look-and-feel brief, design system, accessibility, UI states | Any project with a UI |
| [11-delivery.md](11-delivery.md) | Part 11: implementation plan, testing, CI/CD, operations, choosing a delivery method, project-management toolkit | Every project for 11.7; the toolkit (11.8) and the rest for Medium and High tier |
| [12-agent-manual.md](12-agent-manual.md) | Part 12: agent rules, research-first feature protocol, debugging protocol, prompts | Before any code is written |
| [13-launch-gate.md](13-launch-gate.md) | Part 13: launch readiness gate | Before launch |
| [14-retrofit.md](14-retrofit.md) | Part 14: existing and live projects, Day-0 triage, gap register | Existing or live projects, first |
| [appendix-a-templates.md](appendix-a-templates.md) | Templates | When filling in the blueprint |
| [appendix-b-references.md](appendix-b-references.md) | Official sources behind the legal facts | When checking the law |
| [appendix-c-glossary.md](appendix-c-glossary.md) | Glossary | As needed |
| [appendix-d-stacks.md](appendix-d-stacks.md) | Stack and project-type profiles | After Part 0, for the project's stack |
| [appendix-e-methods.md](appendix-e-methods.md) | Delivery method profiles: where each gate falls in every method, sources and trademarks | After 11.7 |
| [appendix-e1-scrum.md](appendix-e1-scrum.md) · [e2-kanban](appendix-e2-kanban.md) · [e3-stage-gates](appendix-e3-stage-gates.md) · [e4-shape-up](appendix-e4-shape-up.md) · [e5-solo](appendix-e5-solo.md) · [e6-scaled](appendix-e6-scaled.md) | One profile per method family | Only the ones 11.7 chose (an outer and an inner method can both apply) |

**Editing:** change a module, then run `node scripts/build-framework.ts` and commit both. Every module except `cover.md` starts with an `<a id="…"></a>` anchor and a heading (`##` for a part or appendix, `###` for a section of Appendix E), so links in the combined file keep working. Section numbers (5.4, 10.7, 12.3) are the same in both forms.
