<a id="appe2"></a>
### E2 — Kanban

**What it is:** a strategy for improving how work flows: make the workflow visible, limit the work in progress, and measure flow so you can improve it. Source: the [Kanban Guide](https://kanbanguides.org/the-kanban-guide/) (version 2025.5, May 2025).

**Fits:** a stream of requests, fixes and small changes; live apps and retrofits (Part 14), where the gap register is the board; teams that want forecasts without estimates. It can sit alongside another method. **Doesn't fit on its own:** a large fixed-scope contract that needs stage approvals (add E3 around it).

**The strategy, in brief:**
- **Three practices:** define and visualise the workflow; actively manage the items in it; improve the workflow.
- **A Definition of Workflow** states the work items, where work starts and finishes, the states in between, how work in progress (WIP) is limited, the explicit policies, and a **service level expectation** (SLE): how long an item should take, with a probability, such as "90% of items within 12 days".
- **Four flow measures:** WIP (started, not finished), throughput (finished per week), work item age (time since an unfinished item started) and cycle time (start to finish).
- There are no required roles or meetings. The Kanban Method from [Kanban University](https://kanban.university/kanban-guide/) is a different, larger body of practice, with change-management principles, a set of cadences and optional roles.

**Where Bansat fits:**

| Bansat | In Kanban |
|---|---|
| G0 | The first item, "Write the blueprint", enters the board |
| FRs, gap register rows (14.4), bugs | Work items on the board |
| Definition of Ready and Done (11.2) | The policies for entering and leaving the board |
| G1 | The "Write the blueprint" item is done before any build item starts |
| G2 | A policy: no item that collects real personal data passes "Ready to release" before G2 |
| G3 | The release policy on the "Release" column: Part 13 green |
| G4 | A regular review of the four flow measures, plus the 30-day review |
| Severity in the gap register (14.4) | A separate SLE for Critical items, which go first |

**Agent notes:** take the oldest item in progress before starting a new one; respect the WIP limit; say when an item has aged past the SLE rather than starting something else.

**How it commonly fails:** [a board with no WIP limits or explicit policies, and flow measures collected but never used](https://www.scrum.org/resources/blog/8-critical-red-flags-your-kanban-adoption-incomplete), so queues grow and items stall unseen.

**Measures:** the four flow measures, and the share of items finished within the SLE. Forecast from throughput, not estimates (11.8).
