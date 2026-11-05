<a id="appe4"></a>
### E4 — Shape Up

**What it is:** Basecamp's method for product teams. Senior people shape the work before it's scheduled, teams get a fixed amount of time to build it, and the scope bends to fit the time. Source: [Shape Up](https://basecamp.com/shapeup) by Ryan Singer, free to read online.

**Fits:** a product team that controls its own roadmap, with no client deadline; work that can be cut down to fit a fixed time. **Doesn't fit:** client contracts with fixed scope (E3), a stream of small reactive requests (E2), or a team too small to give anyone time for shaping.

**The method, in brief:**
- **Cycles:** six weeks of building, then a two-week cool-down with nothing scheduled, for fixes, exploration and planning.
- **Shaping:** a small senior group turns a problem into a pitch with five parts: the problem, the appetite, the solution, the rabbit holes to avoid, and the no-gos.
- **Appetite:** how much time the work is worth, set before the work, as opposed to an estimate. Work comes in small batches (one or two weeks) or big ones (a whole cycle).
- **The betting table:** in the cool-down, senior people choose which pitches to bet the next cycle on. There's no central backlog; good ideas come back if they matter.
- **The circuit breaker:** a project that doesn't finish in its cycle doesn't get extended by default.
- **Hill charts:** progress shown as uphill (still working out what to do) or downhill (only execution left).

**Where Bansat fits:**

| Bansat | In Shape Up |
|---|---|
| G0 | A shaped pitch |
| The blueprint | Written for the first bet; later pitches add or update FRs and ADRs |
| G1 | The betting table bets on the first cycle |
| G2 | In the scope of whichever cycle first brings in real users |
| G3 | The end of the cycle that ships, with Part 13 green |
| G4 | The cool-down after launch, plus the 30-day review |
| The state matrix (10.7) | Part of "done" for every scope the team finishes |

**Agent notes:** cut scope to fit the appetite instead of overrunning; flag rabbit holes early; when the cycle ends, report what shipped and what didn't, without carrying unfinished work forward automatically.

**How it commonly fails:** [the appetite treated as a target to hit rather than a limit, and the cool-down eaten by bugs](https://scalex.dev/blog/2-years-with-shape-up/), so nobody has time to shape the next cycle.

**Measures:** what shipped in each cycle against its pitch; how often the circuit breaker fires; Part 13 status at release.

Shape Up is © 37signals LLC, all rights reserved, and is summarised here in Bansat's own words.
