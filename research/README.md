# The Bansat experiment: apps built with and without the skill

> **Agreed by the authors on 10 November 2026 and published before any run. Nothing here has been run yet.**

This folder holds the experiment for the Bansat research paper (blueprint item 7 of the scope, FR-22 and workstream R
in Part 11): the app specifications, the harness that prepares and scores runs, the automated checks and their tests.
It's published before the paper so anyone can rerun the experiment and check its numbers.

The authors agreed this plan on 10 November 2026, with the decisions in section 11. It serves as the experiment's
pre-registration: any change after the pilot is recorded in `results/` with its reason. Once the runs are done, their
records and scores go in `results/`.

| Folder | What's in it |
|---|---|
| [`specs/`](specs/) | The six app specifications. Each body is the prompt the agent gets; the front matter is for scoring only. |
| [`checks/`](checks/) | The checks: 12 that read the code, 2 that load the app in a browser, and the blueprint rubric. |
| [`fixtures/`](fixtures/) | A good and a bad fixture app, and a spec for the tests. |
| [`run/`](run/) | `plan.ts`, `prepare.ts`, `score.ts`, `usage.ts`, their tests, and [`OPERATOR.md`](run/OPERATOR.md), the script for running the agent by hand. |

## 1. Research question and hypotheses

**Question.** When an AI coding agent builds an app from a short brief, does having the Bansat skill installed change
how many of the launch failures Bansat targets end up in the app, and what does it cost?

- **H1 (primary).** Apps built with Bansat (condition B) pass a larger share of the checks that apply to them than apps
  built without it (condition A), with the same model and the same specification.
- **H2 (primary).** Apps built with Bansat have fewer defects: fewer separate findings behind their failed checks.
- **H3 (descriptive, not tested).** Bansat costs time and tokens, mostly before the blueprint is approved (G1). We
  report how much, and how complete the blueprints are.

The null hypotheses are no difference in H1 and H2. Exploratory questions: which checks and which kinds of app the
effect comes from, whether the agent actually used the skill, and whether either condition built less of what the spec
asked for.

What the experiment can't show: that a pass makes an app lawful or secure (the checks test a few things, conservatively;
section 5), or that Bansat would have prevented any incident in the breach casebook (BR-10).

## 2. Design

Six specifications × two conditions × *n* repetitions. Each run is one agent session, from the prompt to a finished app.

| | Condition A: without Bansat | Condition B: with Bansat |
|---|---|---|
| Model | The same pinned model ID | The same |
| Agent | Claude Code, the same pinned version and settings | The same |
| Prompt | The spec's body, word for word | The same |
| Workspace | An empty Git repository with one empty commit | The same, plus the skill at `.claude/skills/bansat/`, committed, as the README tells a team to install it |
| Operator | The fixed replies in [`OPERATOR.md`](run/OPERATOR.md) | The same, including the reply when the agent asks for approval |
| Environment | A fresh, credential-free container with a clean Claude Code profile | The same |

The skill is copied from one pinned release with `git archive`, and `research/` and `paper/` are removed from the copy,
so a release made after this folder exists can't give the agent the checks it's scored by. The prompt never names
Bansat, so the agent finds the skill the way a real user's agent would: from its description. Whether it did is
recorded (section 4, the manipulation check).

**Repetitions.** Agents give different results each time, so each spec runs several times in each condition. The
proposal is a pilot of one run per spec and condition (12 runs, not analysed), then *n* = 5 (60 runs, 30 per
condition). The pilot's spread decides whether 5 is enough; we don't yet know the variance or the cost per run.

**Randomisation.** Randomised complete blocks: each block holds every spec in both conditions once, in an order shuffled
by `run/plan.ts` from a seed agreed and written down before the first run. Blocks run in sequence, so drift in the
model or the service over the weeks of running reaches both conditions alike, and a stopped experiment still has
balanced blocks. Run IDs are opaque.

**Blinding.** The agent can't tell it's in an experiment: the workspace holds nothing but the skill (in B), and the run
record lives elsewhere. Reviewers judge apps by run ID, from a copy without `.claude/` and `docs/BLUEPRINT.md`. That
blinding is partial: code written with Bansat may cite its sections in comments. The operator can't be blind, because
only condition B usually stops for G1, which is why the operator may say nothing beyond the fixed replies.

## 3. The specifications

Short briefs, as a founder or an organisation would write them, spanning an individual, a startup and an organisation,
and a spread of risk. The names are invented; any resemblance to a real company is unintended. Every prompt ends with
the same three practicalities (build it all here, ready to launch; placeholders, no deployment; say how to run it).

| Spec | Who | The app | Markets | Stack | Risks it brings in | Tier |
|---|---|---|---|---|---|---|
| [`s1-waitlist`](specs/s1-waitlist.md) | Individual | A landing page with a waitlist and a launch email | UK, Ireland, Germany | Astro, Supabase, Resend | Marketing email, Google Analytics, the Inter font | Medium |
| [`s2-saas`](specs/s2-saas.md) | Startup | Project workspaces for architecture practices, with a client portal | UK, Netherlands, US | Next.js, Supabase, Resend | Multi-tenant access, uploads, PostHog, a product-update email, a B2B processor role | Medium |
| [`s3-children`](specs/s3-children.md) | Organisation (a charity) | Reading and spelling practice for children aged 7 to 11 | UK, Nigeria | Next.js (PWA), Supabase, Resend | Children and parental consent, a parents' newsletter, usage statistics | High |
| [`s4-health`](specs/s4-health.md) | Individual (a personal trainer) | Training, sleep, heart-rate and injury logs | UK, France | SvelteKit, Supabase, Resend | Special category data, progress photos, open sign-up, a newsletter with offers | High |
| [`s5-ai-chat`](specs/s5-ai-chat.md) | Organisation (an insurance broker) | A customer portal with an AI assistant that reads the customer's policies | UK | Next.js, Supabase, Anthropic API | Personal data sent to an LLM, claim photos, Microsoft Clarity session recordings | Medium |
| [`s6-marketplace`](specs/s6-marketplace.md) | Startup | A marketplace for second-hand climbing gear with payments and payouts | UK, Ireland, Germany, France | Laravel, MySQL, Stripe | Payments, a database without RLS, listing photos, a weekly digest | Medium |

The stacks come from Bansat's stack profiles: Next.js with Supabase is the reference (Appendix D1), and the Astro,
SvelteKit, Supabase and Laravel profiles are written in Phase 3 (blueprint 3.8). Five of the six use Supabase, so the
RLS check can run on them; the Laravel spec tests a database without RLS, where that check can only ask for review.

**The prompts never name a control the checks test** (no "consent", "privacy", "unsubscribe", "RLS", "GDPR" or
"compliant"; a test enforces this). They state facts a careful builder would act on: who the users are, where, and what
the app does. Asking for compliance outright would measure how well the agent follows instructions, not what Bansat adds.

**The front matter** records, for scoring only, what the spec implies (`facts`), the tier Bansat's own intake would give
it (0.3), the hosts the app may contact before consent (its backend), and the features a reviewer ticks off. It's never
shown to the agent: `prepare.ts` writes only the body to the prompt.

## 4. Metrics

| | Metric | Definition | Source |
|---|---|---|---|
| **M1** | Check pass rate | Checks passed ÷ checks that apply, per app. A check applies unless it's *not applicable*; after review, no check is left *needs review*. Before review, the report gives the range: needs-review counted as not passed, and as passed. | `score.ts` |
| **M2** | Defects per app | The number of separate findings behind the app's failed checks: each table without RLS, each exposed secret, each third-party host, each processor the privacy notice leaves out. | `score.ts` |
| **M3** | Time and tokens | Agent working time (from each operator message to the agent's last action before the next one), wall-clock time, and input, output and cache tokens, including subagents. For condition B, also split at the moment G1 was signed. Measured for both conditions, so the cost of Bansat is the difference. | `usage.ts`, from the session transcript |
| **M4** | Blueprint completeness | For condition B (and any A run that writes `docs/BLUEPRINT.md`): rubric items met ÷ items the spec's tier needs; plus the tier the blueprint states, placeholders left and whether G1 was signed. Never part of M1, so documents can't earn checks. | `checks/blueprint.ts` |

Secondary measures, reported beside M1 and M2 so that building less can't look like building better:

- **Features built**: the reviewer ticks each feature in the spec's front matter. An app that leaves out the marketing
  email has one less check that applies; this shows it.
- **Builds and runs**: whether the app built and started on one attempt by its own instructions.
- **Skill used** (manipulation check): whether the transcript shows the agent calling the Bansat skill or reading its
  `SKILL.md`. Condition B runs where it didn't are kept in the primary analysis (intention to treat) and reported.
- **Operator messages**, and how each run ended (finished, reply limit, time limit).
- **Reviewer corrections**: how often a reviewer overturns an automated pass or fail. This is the checks' measured
  error rate, and it's published with the results.

**Blueprint rubric (version 0).** Each framework Part the tier needs must have a "Part N" heading and at least 150
characters that aren't placeholders. Low needs Parts 0, 1, 3, 9, 10, 11 and 13 (the framework's depth table); Medium
needs Parts 0 to 7 and 9 to 13, plus 8 for AI; High is Medium plus a DPIA. Key elements are found by their words: the
risk tier, a G1 row, the Bansat credit row, the launch-trap audit, UI states, and (Medium and up) the processor
register, RoPA, lawful bases and data-layer access; plus the age position, marketing rules, AI register and special
category data where the spec has them. It works at the level of Parts because a blueprint numbers its own subsections.

## 5. The checks

Each check reads only the app's own code: never `docs/`, top-level Markdown, tests, `node_modules` or the installed
skill in `.claude/`, which quotes many of the patterns the checks look for. Each gives **pass**, **fail**, **not
applicable** or **needs review**, with evidence (file, line, the line's text and a note). Where a check can't decide,
it says *needs review* or *not applicable* and never guesses; a reviewer then decides (section 9). Secret values are
never copied into a report.

| Check | Kind | What fails it | Launch traps | Launch gate (Part 13) | Day-0 | Threats | Framework | Casebook |
|---|---|---|---|---|---|---|---|---|
| `rls-every-table` | static | A table in `public` without RLS, or with it switched off again; a policy that trusts `user_metadata` | 5 | 13.C1 ⛔ | T2 | T-01 | 5.4, 7.2 | F-01, F-02, F-03 |
| `secrets-not-in-client` | static | A secret behind a public prefix (`NEXT_PUBLIC_…SERVICE_ROLE…`), an LLM SDK in the browser, or a real-looking key in source, built files or an .env file Git would commit | 5 | 13.C2 ⛔ | T1 | T-02 | 3.7, 7.4, 12.1 | F-02, F-09, F-12, F-13, F-14 |
| `self-hosted-fonts` | static | Fonts from Google Fonts, Adobe, Bunny, Font Awesome kits or a CDN | 2 | 13.D3 ⛔ | T4 | T-10 | 9.9, 7.4 | – |
| `consent-gated-tracking` | static | Analytics, session replay or an ad pixel in a root layout or HTML page with no consent condition | 3, 7 | 13.D3 ⛔, 13.D5 ⛔ | T5 | T-10 | 9.7, 9.8, 9.10 | F-18 |
| `security-headers` | static | No enforced CSP, `X-Content-Type-Options` or `Referrer-Policy` anywhere the app sets headers | – | 13.C7 | – | T-04, T-10 | 7.4 | – |
| `marketing-email-unsubscribe` | static | A marketing email with no unsubscribe link | 4 | 13.D6 ⛔ | T6 | – | 9.11 EM-02 | – |
| `marketing-email-list-unsubscribe` | static | Marketing email sent without `List-Unsubscribe` and `List-Unsubscribe-Post` | 4 | 13.D6 ⛔ | T6 | – | 9.11 EM-03 | – |
| `age-gate` | static | Nothing asks for age where the spec needs it; a children's app with no parent or guardian involved | 1 | 13.D2 ⛔ | T8 | – | 9.12 AG-01, AG-04 | F-17, F-19 |
| `privacy-notice-names-processors` | static | No privacy notice, or one that leaves out a processor the code uses (the AI provider included) | 6, 8 | 13.D1 ⛔ | T7 | – | 9.6, 3.6, 8.2 | F-19 |
| `no-preticked-consent` | static | A consent box that starts ticked, a consent column defaulting to true, "by using this site you agree" | 11 | – | – | – | 9.7 CR-02, 9.5 DP-10 | – |
| `private-storage-buckets` | static | A public bucket whose name says it holds people's files | 14 | – | T3 | T-07 | 7.3 T-07 | – |
| `account-deletion-export` | static | No way to delete an account, or none to download one's data | 9 | 13.D8 ⛔ | – | – | 9.15, 10.2 | – |
| `no-third-party-before-consent` | dynamic | In Chromium, before any click: a request to a third-party host, or a tracker cookie | 2, 3, 7 | 13.D3 ⛔ | T4 | T-10 | 9.9 | F-18 |
| `reject-all-honoured` | dynamic | A banner with Accept and no Reject; anything third-party after clicking Reject and reloading | 12 | 13.D4 ⛔ | – | – | 9.8, 9.9 | F-18 |

Part 13 doesn't number its items, so `13.C1` means the first item under "C. Security"; ⛔ marks the items Part 13 marks
as blocking. The casebook column names the cases whose *class* of failure the check catches (F.3), never a claim that
the check would have prevented them. `checks/index.ts` holds these mappings, and each check's file explains its rules.

**What needs review rather than a verdict.** A database without RLS (MySQL, SQLite; the Laravel spec), or tables made
outside the code. A read policy that's always true, or a view that skips RLS: right for public data, a leak otherwise.
A tracker in a component a parent may mount behind consent, and cookieless analytics, which some markets allow without
consent (9.10). A public variable with a vague name (`VITE_API_KEY`). A public bucket for files that may be meant for
everyone (listing photos). Marketing sent through a newsletter provider that may add the headers itself. A privacy
notice too short to judge. A host that's strictly necessary on some pages only (payments, a consent vendor, CAPTCHA).
An app that couldn't be loaded.

**The pass bars, briefly.** RLS on with no policy passes: it denies everyone but the service role, which the framework
itself uses for server-only tables (5.4). An always-true policy for inserts only (a public sign-up form) passes with a
note. The headers check asks only for what a host doesn't set for you: an enforced CSP, `X-Content-Type-Options` and
`Referrer-Policy`; HSTS and `Permissions-Policy` are reported, not required. The age check tests that a gate exists, not
that it's neutral (a "18 or over" box passes, with a note that 9.12 asks for a neutral question). The deletion and
export check tests that they exist, not that they work end to end. The dynamic check blocks every third-party request
after recording it, so scoring sends nothing to real vendors; that can hide later links in a chain of tags, never the
first, so it never hides a failure.

**What the checks can't see.** Whether RLS policies are *correct* for each tenant and role (that needs the isolation
tests in 5.4 against a database); runtime behaviour beyond the pages the crawler reaches before signing in; anything
configured outside the repository, in a dashboard or a tag manager. Five of the 17 launch traps in v3.0.0, the version condition B uses, have no check (v3.1.0 added traps 18–29, which the experiment doesn't test):
10 (personal data in logs, which needs the running app's logs), 13 (real data in staging, an environment question),
15 (ICO fee and NDPC registration) and 16 (a breach plan), which are organisational and would only reward documents,
and 17 (dates of birth kept "just in case"), where a column is only a defect if no feature needs it.

**The checks are tested.** Every check passes the good fixture app and fails the bad one, whose `docs/` and README
are full of the right words to prove documents earn nothing; the edge cases that decide between the four outcomes have
tests of their own (`node research/checks/checks.test.ts`).

## 6. Analysis plan

- **Unit**: the run. Primary outcomes per run: M1 after review, and M2.
- **H1 and H2**: the difference between conditions in the mean per run, tested with a permutation test that shuffles
  condition labels within each spec (10,000 permutations, two-sided), with a 95% bootstrap interval resampled within
  spec and condition. Holm's correction across H1 and H2, at α = 0.05.
- **Sensitivity**: the automated scores before review; needs-review counted all as fails, and all as passes; only the
  B runs where the skill was used (per protocol); without the runs that didn't build.
- **Exploratory**: pass rates per check and per spec, and, if the co-authors want a model-based estimate, a mixed-effects
  logistic model of each check outcome on condition, with random effects for spec, check and run.
- **Reported in full**: every run's score, review and transcript summary, including the pilot's, in `results/`.

## 7. Threats to validity

**Internal**

- *Variation between runs.* Repetitions and randomised blocks spread it across conditions; the pilot sizes it.
- *Drift over time.* Model or service changes mid-experiment hit both conditions inside each block. Model ID, Claude
  Code version and dates are recorded for every run.
- *Contamination.* A user-level Bansat skill, `CLAUDE.md` or memory would reach condition A. Runs use a clean profile in
  a fresh container, and `prepare.ts` warns about what it finds. The skill copy never contains `research/` or `paper/`.
- *The operator.* Fixed replies, written down, logged with times, and the same for both conditions. The operator signs
  G1 without reading the blueprint, so no person improves it.
- *Treatment not received.* The agent may not invoke the skill; the transcript records it, and the analysis reports
  both intention to treat and per protocol.

**Construct**

- *A pass isn't compliance.* The checks test presence and a few clear patterns; they can't judge whether a privacy notice
  is accurate in every respect or whether policies isolate tenants. Section 5 lists what each can't see.
- *The checks come from Bansat.* They test Bansat's own rules, which favours condition B by design: the question is
  whether the skill changes those outcomes, and each rule is tied to a law, a regulator's decision or a published
  incident (sections 9.26, Part 13 and Appendix F). To keep them fair to condition A, each accepts common alternatives,
  not only Bansat's way (any visible consent condition, not only its loader; `helmet`, framework config, host files or
  a `<meta>` tag for headers; several wordings for deleting an account or downloading one's data). Reviewer corrections
  are published as the checks' error rate.
- *Documents can't earn checks.* The checks read code only; the blueprint is measured separately (M4).
- *Building less.* An app that skips a feature has fewer applicable checks. Features built are reported beside M1.

**External**

- One agent (Claude Code) and one model; six specs on four stacks; English prompts; markets weighted to the UK and the
  EU. Apps are built once, from scratch, with no real users, no iteration and no human review of the blueprint, unlike
  a real team. The results say nothing directly about other agents, larger codebases or the retrofit track.

**Conclusion**

- Few runs per cell, and checks within an app aren't independent. The analysis treats the run as the unit, uses
  permutation tests that don't assume normality, and reports intervals, not only p-values.

**Ethics.** No human participants and no personal data: the specs are fictional, the apps run locally with placeholder
keys and are never deployed, and the dynamic check blocks every third-party request it records.

## 8. How to run

You need Node.js 24 (or 22.18 or later, with type stripping), Git and `tar`, and for scoring, Playwright 1.63 with
Chromium (`npm i -g playwright@1.63.0 && npx playwright install chromium`, or a copy on `NODE_PATH`). The scripts use
only the repository's own dependencies (`yaml`) and Playwright. Run `npm ci` at the repository root first.

1. **Plan** the order, once, with the agreed seed and repetitions, and keep the plan away from the agent and the
   reviewers (it names each run's condition):

   ```bash
   node research/run/plan.ts --seed <agreed seed> --reps 5 --out plan.json
   ```

2. **Prepare** each run, outside this repository (the script refuses otherwise), with the agreed release:

   ```bash
   node research/run/prepare.ts --plan plan.json --run <run-id> --out /srv/bansat-runs --skill-ref <release tag>
   ```

3. **Run the agent by hand**, following [`run/OPERATOR.md`](run/OPERATOR.md). This step isn't automated, on purpose:
   a person pastes the prompt and gives only the fixed replies.
4. **Collect** the transcript into `records/<run-id>/transcripts/`, and fill in the operator fields of `run.json`.
5. **Build and serve** the app once, by its own instructions, and **score** it (next section).
6. **Review** what needs it, blind, and score again with the review.

## 9. How to score

```bash
node research/run/score.ts --app /srv/bansat-runs/workspaces/<run-id> --spec <spec-id> \
  --out /srv/bansat-runs/records/<run-id>/score \
  --url http://localhost:3000 --start "npm run start" \
  --run /srv/bansat-runs/records/<run-id>/run.json \
  --transcript /srv/bansat-runs/records/<run-id>/transcripts/<session>.jsonl
```

To serve the app, give `--url` for an app that's already running, `--url` with `--start "<command>"` to have the
script start it and wait for it, or `--static <folder>` for built files. If the app didn't build, use `--no-dynamic`:
the two browser checks then stay *needs review* until the reviewer records that it didn't run.

It writes `score.json` (every result with its evidence, the totals, blueprint completeness, time and tokens),
`score.md` (the same as a report) and, the first time, `review.json`: a form listing every needs-review item with its
evidence, the spec's features to tick, and whether the app built and ran.

**Reviewing.** A reviewer who doesn't know the run's condition fills in `review.json` from a copy of the app without
`.claude/` and `docs/BLUEPRINT.md`. For each open item they set `pass`, `fail` or `not-applicable`, with a one-line note
and, for a fail, the number of findings. They may also correct an automated verdict they're sure is wrong, with a note;
those corrections are counted. Then score again with `--reviews review.json`; the report shows the automated and the
reviewed totals side by side. The proposal is a second reviewer on a random fifth of the apps, with agreement reported
as Cohen's kappa.

`usage.ts` can also be run on its own (`node research/run/usage.ts --transcript <file> --split-at <g1 time>`). It reads
Claude Code's local transcript format, which isn't a published interface, so check it against `/cost` in the pilot.

**Testing the harness**: `node research/checks/checks.test.ts` (82 tests: every check on both fixtures, the edge cases,
the specs and the registry; it launches Chromium) and `node research/run/run.test.ts` (16 tests: plan, prepare, score
and usage). Neither runs an agent.

## 10. Layout

```
research/
  README.md                this protocol
  specs/s1-…s6-….md        the six app specifications
  checks/lib.ts            result types, the file index (what's read and what's skipped), the spec loader
  checks/index.ts          the list of checks and their mappings
  checks/rls.ts            RLS, with a small SQL statement reader and Prisma models
  checks/secrets.ts        secrets in client code, built files and .env files
  checks/browser.ts        fonts, and trackers behind consent
  checks/headers.ts        security headers and the CSP
  checks/email.ts          unsubscribe links and List-Unsubscribe headers
  checks/privacy.ts        age gate, privacy notice, pre-ticked consent, deletion and export
  checks/storage.ts        public buckets
  checks/dynamic.ts        the two browser checks, a static file server and the crawler
  checks/blueprint.ts      blueprint completeness (M4)
  checks/checks.test.ts    the checks' tests
  fixtures/                good-app/, bad-app/ and fixture-spec.md, for the tests
  run/plan.ts              the randomised run order
  run/prepare.ts           a workspace and a record for one run
  run/OPERATOR.md          the manual step: running the agent
  run/score.ts             scoring one app, and applying a review
  run/usage.ts             time, tokens and the manipulation check, from a transcript
  run/run.test.ts          the run scripts' tests
```

## 11. Decisions agreed by the authors (10 November 2026)

The draft left twelve questions open. The authors settled them as proposed:

1. **Repetitions.** Five per spec and condition, reviewed once against the pilot's spread.
2. **The model and the release.** Condition B pins v3.0.0, the first release with the stack profiles. The model ID
   and agent version are pinned when the pilot starts and reported with the results.
3. **Invoking the skill.** By its description, as for a real user; the transcript records whether it was used.
4. **Permission mode.** Permission prompts are skipped inside the disposable, credential-free container.
5. **The G1 stop.** The operator signs G1 without reading the blueprint, and the optional G1 hook isn't installed, so
   the experiment measures the skill's instructions alone. An arm with a person's review is future work.
6. **The pass bars.** As written in section 5: RLS on with no policy passes; HSTS and `Permissions-Policy` are reported,
   not required; an "18 or over" box passes the age check, with a note.
7. **Apps that don't build.** No fix request; they're scored without the dynamic checks and reported.
8. **The checks not written.** None added; traps 10, 13, 15, 16 and 17 stay outside the experiment's claims.
9. **Analysis and pre-registration.** The stratified permutation test is primary and the mixed-effects model
   exploratory. This plan, public before the pilot, is the pre-registration.
10. **Reviewers.** The first author reviews every app, the second author independently reviews a random fifth, and
    disagreements are settled by discussion and recorded.
11. **Publishing.** The generated apps, every run's score and review, and a summary of each transcript go in
    `results/`; full transcripts follow once machine paths and account details are removed.
12. **Other agents.** A second agent or model is future work.
