<a id="appe1"></a>
### E1 — Scrum

**What it is:** a lightweight framework for one team working on complex problems, where the answer is found by building, inspecting and adapting in short cycles. Source: the [Scrum Guide](https://scrumguides.org/scrum-guide.html) (November 2020, still the current edition).

**Fits:** one team of up to about ten people; requirements that will change as you learn; a product owner who can decide quickly. **Doesn't fit:** fixed-scope contracts with no room to reorder work (use E3, with Scrum inside each stage), a stream of unplanned requests (E2), or one person on their own (E5).

**The framework, in brief:**
- **People:** one Scrum Team with three accountabilities. The Product Owner (one person, not a committee) orders the work. The Scrum Master helps the team use Scrum well. The Developers build each Increment.
- **Events:** the Sprint (one month or less, back to back) contains Sprint Planning, a 15-minute Daily Scrum, the Sprint Review and the Sprint Retrospective. For a one-month Sprint the time-boxes are 8 hours for planning, 4 for the review and 3 for the retrospective; shorter Sprints get shorter events.
- **Artefacts, each with a commitment:** the Product Backlog and its Product Goal, the Sprint Backlog and its Sprint Goal, and the Increment and its Definition of Done.
- The Guide calls the framework immutable: running only parts of it isn't Scrum.

**Where Bansat fits:**

| Bansat | In Scrum |
|---|---|
| The FR list (1.5) and its acceptance criteria (1.6) | Product Backlog items, ordered by the Product Owner |
| The product's purpose and metrics (1.1, 1.3) | The Product Goal |
| Definition of Done (11.2), state matrix (10.7), privacy test (9.9) | Part of the team's Definition of Done |
| Definition of Ready (11.2) | A Bansat add-on: the Scrum Guide doesn't have one, so treat it as a team agreement, not a rule |
| G1 | Before the first Sprint; the blueprint is what the first Sprint Planning works from |
| G2 and G3 | Inspected at a Sprint Review; G3 is a release decision once Part 13 is green |
| G4 | A Retrospective, plus the 30-day review (11.1, Phase 8) |

**Agent notes:** keep each backlog item to one FR (or a slice of one) with its blueprint IDs; put the Sprint Goal in the PR descriptions for that Sprint; never mark an item done until the Definition of Done is met, tests included.

**How it commonly fails:**
- [Zombie Scrum](https://www.scrum.org/resources/blog/four-symptoms-zombie-scrum): the events happen, but nothing valuable ships and nobody asks users.
- [Flaccid Scrum](https://martinfowler.com/bliki/FlaccidScrum.html): the process is adopted but engineering quality is neglected, so each Sprint gets slower.
- [Dark Scrum](https://ronjeffries.com/articles/016-09ff/defense): the events are used to micromanage the Developers.

**Measures:** the Increment against the Product Goal; escaped defects and Part 13 failures; flow measures (E2) if you want forecasts. Velocity and story points aren't part of Scrum; if you use them, see 11.8.

**Related:** the [Scrum Guide Expansion Pack](https://scrumexpansion.org/scrum-guide-expanded/) (first published June 2025) is a companion by some of Scrum's practitioners. It adds roles and a split Definition of Done, departs from the 2020 Guide in places, and isn't endorsed by Scrum.org. Read the 2020 Guide first.
