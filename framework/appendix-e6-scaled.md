<a id="appe6"></a>
### E6 — Scaled methods (several teams, one product)

**What it is:** ways for several teams to build one product together without each team optimising its own corner. The two best known take different routes:
- [LeSS](https://less.works/less/rules/index) (Large-Scale Scrum) keeps Scrum's simplicity and scales it.
- SAFe® ([Scaled Agile Framework®](https://framework.scaledagile.com/safe-6-0-configurations)) adds roles, levels and planning events for large organisations.

**Fits:** two or more teams on the same product (D2); an organisation that already runs a scaled framework (D8), in which case use theirs. It's a coordination layer around Scrum (E1), or around one shared Kanban board (E2) for a stream or a retrofit. **Doesn't fit:** one team. Scaling adds coordination cost, so don't start here unless you must.

**Which one:** LeSS for 2–8 Scrum teams sharing one Product Owner and one backlog (LeSS Huge above 8). SAFe® when the organisation already runs it (D8), or needs portfolio governance across several Agile Release Trains of 50–125 people each.

**The methods, in brief:**
- **LeSS:**
  - For 2–8 teams: one Product Owner, one Product Backlog, one Definition of Done, one product-level Sprint and one shippable increment, plus an Overall Retrospective across teams.
  - LeSS Huge, for more than 8 teams, keeps one Product Backlog, grouped into requirement areas of 4–8 teams, each with an Area Product Owner.
- **SAFe® 6.0:**
  - Four configurations: Essential, Large Solution, Portfolio and Full.
  - Teams of teams called Agile Release Trains, generally 50–125 people.
  - A planning event every 8–12 weeks, usually over two days.
  - In June 2026 Scaled Agile released AI-Native SAFe® in early access: a new version of the framework that sits alongside Core SAFe rather than replacing it.

**Where Bansat fits:**

| Bansat | Across several teams |
|---|---|
| G0 | A product vision and one backlog |
| The blueprint | One blueprint for the product, owned by one person; teams add to it through pull requests |
| The FR list | One product backlog, not one per team |
| Definition of Done (11.2), state matrix (10.7), privacy test (9.9) | One shared Definition of Done for every team |
| G1 | Before the first product-level Sprint, or the first planning event |
| G2, G3 | Decided once, for the integrated product, not per team |
| G4 | An overall retrospective across teams, plus the 30-day review |
| Part 14 portfolio register | One row per product, across the organisation |

**Agent notes:** check that a change in one team's area doesn't break another team's FRs or access rules (5.4); flag cross-team dependencies in the RAID log (11.8).

**How it commonly fails:** scaling before one team works well; one backlog per team, so nobody sees the whole product; and, as Scrum's co-creator Ken Schwaber [argued about SAFe](https://kenschwaber.wordpress.com/2013/08/06/unsafe-at-any-speed/) in 2013, a one-size-fits-all process imposed from above, when the people doing the work should decide how to do it.

**Measures:** the flow measures (E2) for the whole product, not per team; integration failures; Part 13 status for the integrated release.

SAFe® and Scaled Agile Framework® are registered trademarks of Scaled Agile, Inc. The LeSS rules are © The LeSS Company B.V. Both are summarised here in Bansat's own words.
