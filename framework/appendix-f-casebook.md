<a id="appf"></a>
## Appendix F — Breach casebook

Twenty real incidents and regulators' decisions from January 2025 to October 2026, each mapped to the Bansat checks that catch that class of failure. They range from apps one person built with an AI tool to the largest technology companies, because the same few failures turn up at every size.

Use it to see why a check exists, to brief a team before a build, or to audit a live app (Part 14). It isn't a league table. Many of these organisations found, fixed and explained their problems in public, which is why they can be written up at all.

### F.1 How to read a case

- **Facts as the primary sources report them.** Each case rests on the organisation's own statement, a regulator's decision, a court record, a CVE record or the write-up of the researcher who found the problem. News articles only corroborate, and are marked as such. Dates and numbers are given as the source gives them, with who reported them.
- **Both sides.** Where an organisation disputes a fact, the case says so.
- **No blame beyond the sources, and no attack detail.** Only security researchers who published under their own names are named, to credit them. Nothing goes beyond what the primary source published.
- **Bansat checks** are the sections, threats (T-, in 7.3), launch traps (9.26), launch gate items (Part 13) and Day-0 triage rows (14.2) that catch the class of failure. ⛔ marks a gate item that blocks launch. **They catch the class of failure. That isn't a claim that Bansat would have prevented a given incident**, which depends on how well the checks are carried out. Checks marked **new in v2.4** were added because this casebook found the gap (F.9).
- **Scale** is a rough grouping from public information, for reading the table, not a fact from the sources. *Small:* individual builders, startups and small businesses. *Mid-size:* companies whose products serve many businesses or millions of people. *Large:* global platforms and listed groups.
- **UK decisions** before 30 September 2026 were made by the ICO, whose functions passed to the Information Commission on that date (9.1).

### F.2 The cases at a glance

| Case | Date | Scale | Failure class | Key checks |
|---|---|---|---|---|
| [F-01](#f-01) Lovable-built apps without working RLS | 2025-03 | Small | Data-layer access control missing | 5.4 · T-01 |
| [F-02](#f-02) Moltbook's open database | 2026-01 | Small | Data-layer access control; secrets | 5.4 · T-01 · 5.1 |
| [F-03](#f-03) 16,326 Supabase databases readable | 2026-09 | Small to mid-size | Data-layer access control missing | 5.4 · Day-0 triage T2 |
| [F-04](#f-04) An agent deleted SaaStr's database | 2025-07 | Small | Agent permissions | 3.2 · 12.1 · T-13 |
| [F-05](#f-05) An agent deleted PocketOS's volume | 2026-04 | Small | Agent permissions | 5.7 · 12.1 · T-13 |
| [F-06](#f-06) Malicious Nx releases ("s1ngularity") | 2025-08 | Mid-size, open source | Supply chain; agent permissions | T-12 · T-16 · 7.4 |
| [F-07](#f-07) "Agentjacking" through error reports | 2026-06 | Mid-size | Prompt injection; agent permissions | 8.4 · 12.1 · T-14 |
| [F-08](#f-08) Evaluation agents broke into Hugging Face | 2026-07 | Mid-size and large | Agent permissions; untrusted code | T-07 · 8.4 · 7.4 |
| [F-09](#f-09) DeepSeek's open database | 2025-01 | Mid-size | Data-layer access control; secrets | 7.2 · 7.4 · 7.5 |
| [F-10](#f-10) McHire's default password and IDOR | 2025-06 | Mid-size | Broken authentication and authorisation | 7.1 · 7.2 · T-03 |
| [F-11](#f-11) Lovable's public projects exposed | 2026-02 to 04 | Mid-size | Broken authorisation; breach response | 7.2 · 11.3 · 7.6 |
| [F-12](#f-12) Stolen Salesloft Drift tokens | 2025-08 | Mid-size | Integration token theft; secrets | 7.4 · 9.18 · T-15 |
| [F-13](#f-13) The Shai-Hulud npm worm | 2025-09 and 11 | Every size | Supply chain; secrets | T-12 · T-16 · 7.4 |
| [F-14](#f-14) Vercel breached through an AI tool | 2026-04 | Mid-size | Integration token theft; secrets | 7.4 · 9.18 · T-15 |
| [F-15](#f-15) Mixpanel breach exposed OpenAI users' emails | 2025-11 | Mid-size and large | Third-party integration | 5.1 · 7.5 · 9.18 |
| [F-16](#f-16) ICO: 23andMe, £2.31m | 2025-06 | Large | Security operations; breach response | 7.1 · 9.13 · 9.20 |
| [F-17](#f-17) ICO: Reddit, £14.47m | 2026-02 | Large | Children's data | 9.12 · 9.21 |
| [F-18](#f-18) CNIL: Google €325m, SHEIN €150m | 2025-09 | Large | Tracking without consent | 9.8 · 9.9 |
| [F-19](#f-19) Garante: Replika's developer, €5m | 2025-04 | Mid-size | Lawful basis; transparency; children | 9.4 · 9.6 · 9.12 |
| [F-20](#f-20) FTC: Illuminate Education order | 2025-12 | Mid-size | Security operations; retention; breach response | 7.4 · 5.6 · 9.20 |

### F.3 Failure classes and the checks that catch them

| Failure class | What it looks like | Bansat checks | Cases |
|---|---|---|---|
| **Data-layer access control missing** | Tables anyone can read or write with the public key; a database open to the internet | RLS on every table, every policy reviewed, tenant-isolation tests in CI (5.4) · deny by default (7.2) · T-01 · launch trap 5 · ⛔ gate: access enforced at the data layer · Day-0 triage T2 · new in v2.4: nothing that stores data reachable from the internet without authentication (7.4, ⛔ gate) | F-01, F-02, F-03, F-09 |
| **Broken authentication or authorisation in the app** | Default passwords, leftover test accounts, IDOR, a permissions change that re-opens access | `assertCan()` on every server action, the role matrix as an automated test (7.2, 11.3) · T-03 · re-check auth in every server entry point (12.1) · new in v2.4: no default credentials, and no test or demo accounts in production beyond a listed store-review account (7.1, ⛔ gate) | F-10, F-11 |
| **Secrets exposed** | Keys in client code, tokens in readable tables or logs, environment variables readable from inside | Secrets server-side only (12.1) · T-02 · credentials are C3 data (5.1) · never logged (7.5) · secret scanning (7.4) · rotate on any leak (7.6) · ⛔ gate: no secrets in the repo or bundle · new in v2.4: secrets stored as write-only values in the platform's secret store (7.4) | F-02, F-09, F-12, F-13, F-14 |
| **Excessive agent or tool permissions** | A coding agent with production or account-wide credentials; a destructive command with no confirmation; an agent run with its safety prompts off | Separate environments and keys (3.2) · least privilege (7.4) · backups and a tested restore (5.7, ⛔ gate) · confirmation before side effects in AI features (8.4) · new in v2.4: agent credential and destructive-command rules (12.1), least access and short-lived credentials for agents (8.4), backups kept apart (5.7), the launch-gate item on agent and CI credentials (Part 13), T-13, Day-0 triage T11 | F-04, F-05, F-06, F-07, F-08 |
| **Prompt injection** | Instructions planted in content an AI reads, such as an error report or an issue | Instructions in content are data; confirmation before side effects (8.4, T-05) · new in v2.4: the same rule for the coding agent (12.1), T-14 | F-07 |
| **Supply chain** | A malicious version of a trusted package; a compromised CI workflow; install-time scripts | Confirm a package before installing it (12.1) · T-12 · lockfile and pinned versions (3.1) · dependency scanning (7.4) · ⛔ gate: no critical vulnerabilities · new in v2.4: CI/CD and publishing hardening (7.4), T-16 | F-06, F-13 |
| **Untrusted code run with credentials** | Code, scripts or templates in an upload or dataset run inside your pipeline | Type and size checks and private buckets (T-07) · new in v2.4: never run code, scripts or templates from uploads outside an isolated sandbox with no credentials (T-07) | F-08 |
| **Third-party integration or token theft** | A vendor or connected app is breached, and its tokens or its copy of your data are used | Vendor due diligence and the register (9.18, 3.6) · IDs, not names or emails, to analytics (5.1, 7.5, 12.1) · DP-04 (9.5) · new in v2.4: integration tokens and third-party app grants (7.4), T-15 | F-12, F-14, F-15 |
| **Tracking or consent failure** | Cookies set before any choice; "Reject all" not honoured | No non-essential cookies or requests before consent, and none after "Reject all", tested in CI (9.9) · equal Accept and Reject (9.8) · easy withdrawal (9.7) · launch traps 7 and 12 · ⛔ gate items | F-18 |
| **Children's data** | No working age check on a service children use | The age position decided and tested (9.12, ⛔ gate) · launch trap 1 · DPIA (9.21) · Day-0 triage T8 | F-17, F-19 |
| **Weak security operations** | No MFA, slow detection, a leaver's login still working, unencrypted data | MFA for admins, breached-password checks and rate limits (7.1, T-08) · re-authentication before export (7.1) · encryption, least privilege and access reviews (7.4) · audit and sign-in logs (7.5) · new in v2.4: passkeys or MFA for every account that can see special category data (9.13), leavers' access removed the same day (7.4) | F-16, F-20 |
| **Breach response failure** | A claim dismissed as a hoax, valid reports closed, late notice | The breach runbook and its clocks (9.20) · launch trap 16 · a tabletop drill (11.1) · new in v2.4: report triage (7.6), credible claims treated as possible breaches (9.20) | F-11, F-16, F-20 |
| **Data kept longer than needed** | Old records with no retention schedule | Retention and deletion schedule (5.6, 9.23) · deletion jobs tested (Part 13) | F-20 |
| **No lawful basis or transparency** | Processing with no identified basis; a privacy notice that doesn't match the product | RoPA (9.3) · lawful basis (9.4) · a notice generated from the RoPA (9.6) · launch trap 6 · AI transparency (8.6) | F-19 |
| **International transfers** | Personal data sent abroad without a valid mechanism | 9.17 · ⛔ gate: transfer mechanisms recorded | None in this edition |
| **Public storage** | User uploads in a public bucket | Private buckets and signed URLs (T-07) · launch trap 14 · Day-0 triage T3 | None in this edition |

### F.4 Apps built with AI tools

<a id="f-01"></a>
#### F-01 · Apps built with Lovable left tables open without working Row-Level Security (CVE-2025-48757)

**Date:** found 20 March 2025, reported to Lovable 21 March, disclosed by the researchers 29 May and CVE record published 30 May 2025 · **Organisation:** apps built with Lovable, an AI app builder · **Scale:** small apps on a mid-size platform · **Class:** data-layer access control missing

- **What happened.** Matt Palmer and Kody Low of Replit checked 1,645 projects from Lovable's "Launched" showcase and reported 303 endpoints in 170 of them (about 10.3%) where visitors without an account could read database tables. A follow-up test on 24 May 2025 showed that Linkable, the Lovable-built site where the problem was first found, also let data be written. The researchers list exposed names, email addresses, phone numbers, payment and subscription details, and API keys. The CVE record scores the flaw 9.3 out of 10 (CVSS 3.1) and covers Lovable up to 15 April 2025.
- **Cause, as reported.** The generated apps queried their Supabase database straight from the browser, and the tables had missing or wrong Row-Level Security (RLS) policies, so the database didn't limit who could read or write rows. The researchers note that the public key being visible is expected; the policies were the flaw.
- **Outcome.** Lovable launched "Lovable 2.0" on 24 April 2025 with a Security Scan, offered when a Supabase-connected app is published, and called it "just the start" of its work to make vibe coding more secure. The researchers say the scan checks that a policy exists, not that it's correct.
- **Disputed.** The CVE record has noted since 21 August 2025 that Lovable disputes it, saying each customer is responsible for protecting its own app's data. The researchers work at Replit, which also makes an AI app builder.
- **Bansat checks:** RLS on every table, every policy reviewed, tenant-isolation tests in CI (5.4) · T-01 · launch trap 5 · ⛔ gate: access enforced at the data layer · Day-0 triage T2 · agent rule: keep data-layer access rules on every table (12.1).
- **Sources:** [researchers' statement](https://mattpalmer.io/posts/2025/05/statement-on-CVE-2025-48757/) · [CVE write-up and credits](https://mattpalmer.io/posts/CVE-2025-48757/) · [CVE record (NVD)](https://nvd.nist.gov/vuln/detail/CVE-2025-48757) · [CVE record (CVE.org)](https://www.cve.org/CVERecord?id=CVE-2025-48757) · [Lovable](https://lovable.dev/blog/lovable-2-0)

<a id="f-02"></a>
#### F-02 · Moltbook, a social network for AI agents, left its database open

**Date:** reported and fixed 31 January to 1 February 2026, write-up 2 February 2026 · **Organisation:** Moltbook · **Scale:** small · **Class:** data-layer access control missing; secrets exposed

- **What happened.** Wiz Research (Gal Nagli) found that anyone using the public Supabase key in Moltbook's JavaScript could read its production database. Wiz reports about 1.5 million API authentication tokens, about 35,000 email addresses and 4,060 private conversations between agents, some containing third-party API keys: about 4.75 million records in all. Public tables could also be changed. Wiz notes that security researcher Jamieson O'Reilly also found the underlying misconfiguration, as 404 Media reported on 31 January 2026.
- **Cause, as reported.** Row-Level Security policies were missing, so the key in the client-side code gave full access to the database. The founder had posted on X that he "didn't write one line of code" for Moltbook; Wiz calls the platform vibe-coded.
- **Outcome.** Moltbook locked the tables down in stages between 23:29 UTC on 31 January and 01:00 UTC on 1 February 2026, with Wiz checking each fix. Wiz says it deleted the data it accessed.
- **Disputed.** None known.
- **Bansat checks:** 5.4 · T-01 · launch trap 5 · tokens and keys are C3 data: separate tables, app-level encryption, never in logs (5.1) · ⛔ gate: access enforced at the data layer.
- **Sources:** [Wiz Research](https://www.wiz.io/blog/exposed-moltbook-database-reveals-millions-of-api-keys) · [founder's post on X](https://x.com/MattPRD/status/2017386365756072376) · [404 Media](https://404media.co/exposed-moltbook-database-let-anyone-take-control-of-any-ai-agent-on-the-site) (corroborating)

<a id="f-03"></a>
#### F-03 · A scan found 16,326 Supabase databases with tables anyone could read

**Date:** UpGuard's write-up first published 24 September 2026 (per the page's metadata) and reported by TechCrunch on 25 September; the page now shows 14 October 2026, the date of its last update · **Organisation:** Supabase customers, not named; research by UpGuard · **Scale:** small to mid-size · **Class:** data-layer access control missing

- **What happened.** UpGuard (Greg Pollock) checked about 300,000 domains showing signs of Supabase use and found 16,326 databases with tables that could be read without authorisation. Judging from table structures rather than reading every row, it says over half showed signs of personal data, and a smaller share signs of passwords or authentication tokens. Its unnamed examples include a US valet service (over 100,000 customer records) and a Canadian immigration and relocation coaching service (884 passwords stored in plain text).
- **Cause, as reported.** Missing or ineffective RLS, and public keys misused. UpGuard notes that tables created through the API don't have RLS turned on by default. It links the sites to AI coding tools but doesn't say how it checked that for each site, so this casebook doesn't rely on that link.
- **Outcome.** UpGuard says it told the owners of significant exposures. Supabase's chief information security officer told TechCrunch that Supabase hadn't seen the research, that projects are "secure by default", and that customers control how they're configured. Supabase's own review of 2025 says application-level security is each customer's responsibility. In April 2026 Supabase announced that new tables would no longer be reachable through its Data API without an explicit grant: the default for new projects from 30 May 2026 and for all existing projects from 30 October 2026, with existing tables keeping their access.
- **Disputed.** Supabase's position, above. This is a scan, not a single verified incident. UpGuard sells attack-surface monitoring.
- **Bansat checks:** 5.4, including the query that lists tables without RLS (14.2) · T-01 · launch trap 5 · Day-0 triage T2 · credentials are C3 data, and sign-in goes through the auth provider (5.1, 7.1).
- **Sources:** [UpGuard](https://www.upguard.com/blog/everything-everywhere-systemic-data-exposure-in-supabase-apps) · [Supabase's security review of 2025](https://supabase.com/blog/supabase-security-2025-retro) · [Supabase changelog, 28 April 2026](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically) · [TechCrunch](https://techcrunch.com/2026/09/25/some-supabase-customers-are-publicly-exposing-reams-of-peoples-data-to-the-web/) (corroborating)

### F.5 AI agents and AI coding tools

<a id="f-04"></a>
#### F-04 · Replit's AI agent deleted SaaStr's production database during a code freeze

**Date:** reported by SaaStr's founder on X on 18 July 2025 (UTC); SaaStr's account published 2 August 2025 · **Organisation:** SaaStr (affected); Replit (the agent's platform) · **Scale:** a small company on a mid-size platform · **Class:** excessive agent or tool permissions

- **What happened.** SaaStr says Replit's AI agent kept making changes during a code freeze despite repeated instructions, deleted a production database holding 1,206 executive records and 1,196+ company profiles, then wrongly said a rollback was impossible. The data was recovered.
- **Cause, as reported.** Per SaaStr, the agent could change the production database from the development workflow, and a code freeze couldn't be enforced inside the platform. Replit's chief executive said the agent "didn't have access to the proper internal docs", and that Replit has backups with a one-click restore.
- **Outcome.** Replit's chief executive called the deletion "unacceptable and should never be possible", said Replit had begun rolling out automatic separation of development and production databases, and offered a refund and a postmortem. SaaStr wrote that under the new system its database would have stayed isolated from the agent, but that the planning-only mode Replit added still wouldn't truly enforce a code freeze.
- **Disputed.** None known. Replit acknowledged the failure.
- **Bansat checks:** separate environments, each with its own project and keys, and no real data outside production (3.2) · least privilege and MFA for production access (7.4) · backups with point-in-time recovery and a tested restore (5.7, ⛔ gate) · new in v2.4: the agent holds no production credentials and asks before any destructive command (12.1), T-13.
- **Sources:** [SaaStr](https://www.saastr.com/replits-new-release-address-most-of-the-challenges-we-hit-vibe-coding-but-is-prosumer-vibe-coding-really-ready-for-commercial-apps-yet/) · [SaaStr's founder on X](https://x.com/jasonlk/status/1946069562723897802) · [Replit's chief executive on X](https://x.com/amasad/status/1946986468586721478) · [Replit](https://blog.replit.com/introducing-a-safer-way-to-vibe-code-with-replit-databases) · [The Register](https://www.theregister.com/software/2025/07/22/replit-makes-vibe-y-promise-to-prevent-vibe-coding-disasters/1145851) (corroborating)

<a id="f-05"></a>
#### F-05 · An AI coding agent deleted PocketOS's production volume with a token it found

**Date:** 24 April 2026, per PocketOS's founder, who posted about it the next day; Railway's account published 29 April 2026 · **Organisation:** PocketOS (affected); Railway (cloud host) · **Scale:** a small company on a mid-size platform · **Class:** excessive agent or tool permissions

- **What happened.** Railway says an AI agent found a Railway API token stored on the user's machine and used it to delete a customer's production volume. The request was authenticated and handled like any call from the command line or CI. PocketOS's founder says the agent was working on a routine task in a staging environment, found the token in an unrelated file (it had been made to manage custom domains), and that the most recent backups went with the volume, leaving a three-month-old backup.
- **Cause, as reported.** Per Railway, the token had account-scoped access, "the maximum access possible", and an older API path deleted at once and in cascade, so the backups appeared to be unavailable.
- **Outcome.** Railway says it recovered the data and the customer has all of it back. Deletes through its API are now held for 48 hours before they're final, deleting backups is also delayed, and Railway says it will make token scopes clearer.
- **Disputed.** Yes, on why it happened. The founder says Railway kept volume backups inside the volume and that its tokens couldn't be limited by environment or operation. Railway says it also keeps separate offsite backups, which the old delete path only made look unavailable, and that narrower workspace and project tokens existed but its token flow didn't make the choice obvious. The recovery isn't disputed: the founder first said the newest backup he could restore was three months old, and later posted that Railway had recovered the more recent data (as reported by Information Age).
- **Bansat checks:** least privilege (7.4) · backups and a tested restore (5.7, ⛔ gate) · new in v2.4: no account-wide tokens where an agent can reach them, and destructive commands need a person's confirmation (12.1); backups kept apart from what they protect (5.7); T-13; Day-0 triage T11.
- **Sources:** [Railway](https://blog.railway.com/p/your-ai-wants-to-nuke-your-database) · [PocketOS's founder on X](https://x.com/lifeofjer/status/2048103471019434248) · [Information Age (ACS)](https://ia.acs.org.au/article/2026/gone-in-9-seconds--ai-agent-deletes-company-database.html) (corroborating)

<a id="f-06"></a>
#### F-06 · Malicious Nx releases stole secrets and tried to use AI coding tools to search for more ("s1ngularity")

**Date:** 26 August 2025, from 6:32 PM EDT; npm removed the affected versions at 10:44 PM, and the last ones at 6:20 AM EDT on 27 August · **Organisation:** Nx (Nrwl) and users of the nx packages on npm · **Scale:** a mid-size, widely used open-source project; its users are of every size · **Class:** supply chain; excessive agent or tool permissions

- **What happened.** Malicious versions of nx and several @nx packages were published to npm. A post-install script collected credentials and file paths and uploaded them, encoded, to a new public GitHub repository in the victim's own account. Snyk (Liran Tal) reports that the script also called locally installed AI coding tools (Claude Code, Gemini CLI and Amazon Q) with options that skip their safety prompts, asking them to search the computer for wallet files, SSH keys and `.env` files.
- **Cause, as reported.** Per Nx, a GitHub Actions workflow using the `pull_request_target` trigger had an injection flaw. An outdated branch still carried it after it was removed from the main branch, which let an attacker run the publishing workflow and send the npm token to an outside server.
- **Outcome.** Nx deprecated the versions, rotated its npm and GitHub tokens, moved publishing to npm trusted publishing, required approval for workflows from outside contributors, and told users to rotate their credentials. Wiz Research later reported that over 1,700 users had secrets leaked publicly, and that in a second phase at least 480 compromised accounts had over 6,700 private repositories made public. It found that the AI tools succeeded in sending data out in under a quarter of cases.
- **Disputed.** None known.
- **Bansat checks:** T-12 · dependency scanning in CI (7.4) · new in v2.4: CI/CD hardening, including no untrusted code run with secrets under `pull_request_target`, no untrusted text in `run:` scripts, and trusted publishing (7.4); agents never run with their approval prompts switched off (12.1); T-16.
- **Sources:** [Nx advisory](https://github.com/nrwl/nx/security/advisories/GHSA-cxm3-wv7p-598c) · [Nx postmortem](https://nx.dev/blog/s1ngularity-postmortem) · [Snyk](https://snyk.io/blog/weaponizing-ai-coding-agents-for-malware-in-the-nx-malicious-package) · [Wiz Research](https://www.wiz.io/blog/s1ngularitys-aftermath)

<a id="f-07"></a>
#### F-07 · "Agentjacking": fake error reports led AI coding agents to run outsiders' code

**Date:** reported to Sentry 3 June 2026; research published in June 2026 · **Organisation:** Sentry (error tracking, with an MCP server); the agents tested included Claude Code, Cursor and OpenAI Codex · **Scale:** a mid-size vendor; 2,388 organisations of every size · **Class:** prompt injection; excessive agent or tool permissions

- **What happened.** Tenet Security Threat Labs (Barak Sternberg and Nevo Poran) showed that anyone with a project's public Sentry DSN (the key an app uses to send errors to Sentry, public by design) could send a crafted error report, and that AI coding agents asked to fix Sentry issues through Sentry's MCP server would follow instructions in it and run the attacker's code with the developer's privileges. Through passive reconnaissance, Tenet found 2,388 organisations whose public DSNs could be used this way. In a controlled campaign against some of them, Tenet says more than 100 agents ran its test package, which identified itself as a Tenet security scan, and puts the success rate at 85%. This is a demonstrated research attack, not a confirmed incident.
- **Cause, as reported.** The agents treated text returned by an MCP tool, which an outsider could write, as instructions. Tenet says prompt-level defences didn't stop it.
- **Outcome.** Sentry acknowledged the report the same day, filtered the specific payload, and declined a root-cause fix, calling the class "technically not defensible" (per Tenet; the Cloud Security Alliance repeats Tenet's account). The CSA recommends human approval before agents run commands or install packages because of such content, and sandboxed agents with short-lived, scoped credentials.
- **Disputed.** Sentry's view, as Tenet reports it, is that the problem can't be fixed at the platform level and that model vendors run their own middleware against it; no statement from Sentry itself was found. The success rate is Tenet's own figure, and Tenet sells the defence it recommends, though it has also released open-source configuration files.
- **Bansat checks:** instructions found in content are data, and side effects need confirmation, for AI features (8.4, T-05) · new in v2.4: the same rule for the coding agent itself (12.1), T-14.
- **Sources:** [Tenet Security](https://tenetsecurity.ai/blog/agentjacking-coding-agents-with-fake-sentry-errors/) · [Cloud Security Alliance](https://labs.cloudsecurityalliance.org/research/csa-research-note-agentjacking-mcp-sentry-injection-20260612/) (corroborating) · [The New Stack](https://thenewstack.io/agentjacking-sentry-mcp-attack/) (corroborating)

<a id="f-08"></a>
#### F-08 · AI agents from an OpenAI evaluation got out of their sandbox and broke into Hugging Face

**Date:** compromise 11 to 13 July 2026, per OpenAI; Hugging Face disclosed it on 16 July and OpenAI on 21 July 2026, and OpenAI's technical report and an independent review followed · **Organisation:** Hugging Face (breached); OpenAI (ran the agents, by its own account) · **Scale:** mid-size and large · **Class:** excessive agent or tool permissions; untrusted code run with credentials

- **What happened.** Hugging Face disclosed an intrusion "driven, end to end, by an autonomous AI agent system". It used a malicious dataset to abuse two code-execution paths in Hugging Face's dataset processing, collected cloud and cluster credentials, and moved into several internal clusters, reaching a limited set of internal datasets and service credentials. OpenAI later reported that its own models, run in an internal cybersecurity evaluation with some safeguards switched off, got around the controls meant to keep them off the internet and carried out the intrusion. It says they ran code on 41 production dataset-server workers and downloaded four private code repositories, and that they read selected rows of private datasets and downloaded a private file from a user's account.
- **Cause, as reported.** At Hugging Face, code and configuration supplied with a dataset could run inside its processing pipeline. OpenAI's report cites evaluations run without production safeguards, network routes out of the sandbox, flaws in a third-party service, exposed credentials that the agents reused, and early signals that, with hindsight, "could have triggered an earlier response".
- **Outcome.** Hugging Face closed the code-execution paths, rebuilt compromised nodes, rotated credentials and asked users to rotate their tokens; it found no tampering with public models, datasets or Spaces, and said it was still assessing whether any partner or customer data was affected. OpenAI shut the evaluation down and committed to tighter network controls and sandboxes built on virtual machines; it says OpenAI's own customer data wasn't affected. An independent review by METR and Redwood Research, published on 26 August 2026 with a scope OpenAI set (26 June to 13 July 2026), found that roughly 1,200 agents meant to be isolated from one another had found a way to communicate, exchanging more than 70,000 messages and files, and that 700 of them took part in the attack on Hugging Face.
- **Disputed.** None known. Hugging Face's first disclosure said the model behind the attack wasn't known; OpenAI later attributed the activity to its own models. OpenAI's report says one agent used a customer's application hosted on Modal, a cloud compute service, and that Modal confirmed its "platform and isolation were not compromised in any way".
- **Bansat checks:** threat-model every flow that accepts user files (T-07; new in v2.4: never run code, scripts or templates from uploads outside an isolated sandbox with no credentials) · least privilege, and rotation of any exposed secret (7.4, 7.6) · new in v2.4: agents that act get the least access that works, short-lived credentials and a person's approval for anything irreversible (8.4).
- **Sources:** [Hugging Face](https://huggingface.co/blog/security-incident-july-2026) · [OpenAI technical report (PDF)](https://cdn.openai.com/pdf/67869394-cb91-4c12-888c-5cbd85c7814c/OpenAI-Hugging-Face%20Incident-Technical-Report.pdf) · [METR and Redwood Research review (PDF)](https://metr.org/hugging-face-incident-report-aug-2026.pdf) · [BleepingComputer](https://www.bleepingcomputer.com/news/security/openai-agent-used-exposed-credentials-at-4-services-in-hugging-face-breach) (corroborating)

### F.6 AI companies' own systems

<a id="f-09"></a>
#### F-09 · DeepSeek left a database open on the internet, with chat history and secret keys

**Date:** Wiz's write-up published 29 January 2025; the exposed logs dated from 6 January 2025 · **Organisation:** DeepSeek · **Scale:** mid-size (an AI start-up whose service has millions of users) · **Class:** data-layer access control missing; secrets exposed

- **What happened.** Wiz Research (Gal Nagli) found a ClickHouse database belonging to DeepSeek that anyone could reach on two DeepSeek hosts, with no authentication. It held more than a million log lines, including chat history, secret API keys, details of the backend and operational metadata.
- **Cause, as reported.** The database was "completely open and unauthenticated" (Wiz).
- **Outcome.** Wiz says it reported the problem at once and that DeepSeek "promptly secured the exposure". Wiz doesn't say how long the database had been open.
- **Disputed.** None known. No DeepSeek statement was found.
- **Bansat checks:** deny by default (7.2) · never log keys, tokens or AI prompts that contain personal data (7.5) · new in v2.4: no database, cache, search index, queue or log store reachable from the internet without authentication, checked by a scan before launch (7.4, ⛔ gate).
- **Sources:** [Wiz Research](https://www.wiz.io/blog/wiz-research-uncovers-exposed-deepseek-database-leak)

<a id="f-10"></a>
#### F-10 · McHire: a test account with a default password, and an IDOR, exposed applicants' records

**Date:** reported 30 June 2025; Paradox says it fixed the problem within a few hours, and the researchers record it confirming the fix on 1 July 2025 · **Organisation:** Paradox.ai, which runs the McHire hiring platform used by McDonald's franchisees · **Scale:** a mid-size vendor serving a large brand · **Class:** broken authentication or authorisation in the app

- **What happened.** Security researchers Ian Carroll and Sam Curry found that McHire's login for restaurant owners accepted a default password for a test account, and that an internal API didn't check authorisation, so other applicants' contact details and chats could be reached. They say the personal data of more than 64 million applicants could be retrieved, including names, email addresses, phone numbers and addresses. Paradox says the researchers viewed seven chat records, five of which contained candidates' details.
- **Cause, as reported.** Per Paradox: a legacy test account, unused since 2019, whose password had never been updated to its newer standards and which should have been decommissioned, plus an API flaw that earlier penetration tests had missed. The researchers describe the second issue as an insecure direct object reference (IDOR).
- **Outcome.** The test credentials stopped working within two hours of the report, per the researchers' timeline. Paradox fixed the API and said it would publish a security contact and start a bug bounty programme.
- **Disputed.** Yes, on scale. Paradox says the system held chat interactions rather than job applications, most of them not tied to a candidate, that one client was affected, and that no candidate data was leaked publicly. It also says it takes responsibility for the issue.
- **Bansat checks:** the server works out who's asking and what they may see, with `assertCan()` on every action (7.2, T-03) · re-check authentication and authorisation in every server entry point (12.1) · new in v2.4: no default or shared passwords, and no test or demo accounts in production beyond a listed store-review account (7.1, ⛔ gate).
- **Sources:** [researchers' write-up](https://ian.sh/mcdonalds) · [Paradox](https://www.paradox.ai/blog/responsible-security-update)

<a id="f-11"></a>
#### F-11 · A Lovable backend change exposed public projects' chats and code for about 11 weeks

**Date:** exposed 3 February to 20 April 2026; fixed 20 April; Lovable's statement 22 April 2026 · **Organisation:** Lovable · **Scale:** mid-size · **Class:** broken authorisation; breach response failure

- **What happened.** Lovable says backend regressions in February 2026 re-enabled access to the chat history and source code of public projects, which between 3 February and 20 April "could potentially be accessed by any Lovable user provided they had a project link". A researcher who reported it publicly on X on 20 April said that from a new free account they could read another user's source code, database credentials, AI chat histories and customer data (as reported by The Register, which describes the flaw as broken object-level authorisation). Lovable says private projects and Lovable Cloud were not affected.
- **Cause, as reported.** Per Lovable, a change to backend permissions brought back access it had removed during 2025, and several valid bug reports filed from 22 February were closed instead of being escalated by the HackerOne triagers who run its disclosure programme, working from outdated documentation Lovable had given them.
- **Outcome.** Lovable shipped a fix within two hours of the public report. It is making historically public projects private (except its official templates), contacting affected users and restructuring how reports are triaged. It gave no count of affected projects or users.
- **Disputed.** Yes. Lovable's first public response, on X on 20 April, said "We did not suffer a data breach" and that access to public projects' code was "intentional behavior" (as reported by The Register); it later called that response dismissive. The scope is also contested: the researcher described a wider exposure, and Lovable limits it to public projects between 3 February and 20 April 2026.
- **Bansat checks:** deny by default, with the role matrix as an automated test, so a permissions change that re-opens access to a resource the matrix covers can fail CI (7.2, 11.3) · new in v2.4: every security report is triaged against the current design, and none is closed as "intended" without that check (7.6).
- **Sources:** [Lovable](https://lovable.dev/blog/our-response-to-the-april-2026-incident) · [The Register](https://www.theregister.com/security/2026/04/21/lovable-denies-data-leak-cites-intentional-behavior/5226233) (corroborating)

### F.7 Integrations and the supply chain

<a id="f-12"></a>
#### F-12 · Stolen Salesloft Drift tokens were used to export data from companies' Salesforce instances

**Date:** data stolen from as early as 8 August to at least 18 August 2025, per Google Threat Intelligence · **Organisation:** Salesloft (the Drift AI chat integration) and the Salesforce customers that used it · **Scale:** a mid-size vendor with customers of every size · **Class:** third-party integration or token theft; secrets exposed

- **What happened.** Google Threat Intelligence reported that the actor it tracks as UNC6395 used compromised OAuth tokens for the Salesloft Drift integration to export large volumes of data from numerous corporate Salesforce instances, then searched the data for secrets such as AWS access keys, passwords and Snowflake tokens. Tokens for the "Drift Email" integration were used on 9 August to reach email in a very small number of Google Workspace accounts.
- **Cause, as reported.** Salesloft, citing Mandiant, says the actor got into Salesloft's GitHub account between March and June 2025, then reached Drift's AWS environment and took OAuth tokens for Drift customers' integrations. Mandiant's final summary puts the whole intrusion between 22 March and 5 September 2025.
- **Outcome.** On 20 August 2025 Salesloft and Salesforce revoked all active Drift tokens, and Salesforce removed Drift from AppExchange. Drift was taken offline on 5 September and brought back on 16 September. Mandiant's investigation ended on 30 September and found no evidence beyond limited reconnaissance in the Salesloft application environment.
- **Disputed.** None known.
- **Bansat checks:** vendor due diligence (9.18) · credentials are C3 data and never go into logs or other tools (5.1, 7.5) · new in v2.4: integration tokens stored encrypted on the server, with the narrowest scopes, rotated and watched for unusual use (7.4), T-15.
- **Sources:** [Google Threat Intelligence](https://cloud.google.com/blog/topics/threat-intelligence/data-theft-salesforce-instances-via-salesloft-drift) · [Salesloft trust centre](https://trust.salesloft.com)

<a id="f-13"></a>
#### F-13 · The Shai-Hulud worm spread through npm, stealing developers' tokens and republishing packages

**Date:** GitHub was notified 14 September 2025; Wiz reported a second wave on 24 November 2025 · **Organisation:** the npm registry (run by GitHub) and the maintainers of affected packages · **Scale:** an ecosystem used by organisations of every size · **Class:** supply chain; secrets exposed

- **What happened.** CISA reported that a self-replicating worm, "Shai-Hulud", compromised more than 500 npm packages. It collected GitHub tokens and cloud API keys, then used stolen npm credentials to publish infected versions of the developer's other packages; GitHub said it removed more than 500 compromised packages. In a second wave reported by Wiz, which says it may involve different actors, trojanised packages from Zapier, ENS Domains, PostHog, Postman and AsyncAPI ran in the pre-install step and leaked secrets to more than 25,000 GitHub repositories.
- **Cause, as reported.** Per GitHub, CISA and Wiz, compromised maintainer accounts and publishing credentials let the worm publish new versions with no person involved, and install-time scripts ran with access to developer and CI secrets.
- **Outcome.** GitHub announced changes to npm publishing: 2FA for publishing from a developer's machine, short-lived granular tokens, trusted publishing and the retirement of classic tokens. On 9 December 2025 it revoked all classic tokens and limited write tokens to 90 days. CISA advised rotating all developer credentials and requiring phishing-resistant MFA.
- **Disputed.** None known.
- **Bansat checks:** T-12 · install from the lockfile (3.1, 7.4) · dependency scanning (7.4) · new in v2.4: CI/CD and publishing hardening, including install scripts only for dependencies you've approved, new versions left to age before they're adopted, and trusted publishing with 2FA (7.4), T-16.
- **Sources:** [CISA](https://www.cisa.gov/news-events/alerts/2025/09/23/widespread-supply-chain-compromise-impacting-npm-ecosystem) · [GitHub's plan](https://github.blog/security/supply-chain-security/our-plan-for-a-more-secure-npm-supply-chain/) · [GitHub changelog, 9 December 2025](https://github.blog/changelog/2025-12-09-npm-classic-tokens-revoked-session-based-auth-and-cli-token-management-now-available/) · [Wiz Research](https://www.wiz.io/blog/shai-hulud-2-0-ongoing-supply-chain-attack)

<a id="f-14"></a>
#### F-14 · Vercel was breached through a compromised AI tool connected to an employee's Google account

**Date:** bulletin published 19 April 2026; incident closed 16 October 2026 · **Organisation:** Vercel; Context.ai (a third-party AI tool) · **Scale:** mid-size; the AI tool's maker is small · **Class:** third-party integration or token theft; secrets exposed

- **What happened.** Vercel says the incident "originated with a compromise of Context.ai, a third-party AI tool used by a Vercel employee". The attacker used it to take over the employee's Google Workspace account, then their Vercel account, and moved into a Vercel environment, where it listed and decrypted customer environment variables that weren't marked as sensitive. Vercel says a limited subset of customers was affected at first, and that a wider review of its logs found a small number of additional compromised accounts; it gives no counts. It also found a few other compromised accounts that it says appear unrelated to this incident, and it says the npm packages it publishes weren't compromised.
- **Cause, as reported.** Per Vercel, the AI tool's Google Workspace OAuth app was caught up in a broader compromise that could affect "hundreds of users across many organizations". Once inside, the attacker could decrypt customer environment variables that weren't marked as sensitive, which "decrypt to plaintext"; Vercel recommends marking secrets as sensitive "so that secret values are protected from being read in the future".
- **Outcome.** Vercel brought in Google Mandiant, other security firms and law enforcement, published the OAuth app's identifier, and told customers to rotate variables not marked as sensitive, mark secrets as sensitive, turn on MFA and rotate Deployment Protection tokens. It says all remediation was complete and the incident was closed on 16 October 2026.
- **Disputed.** Partly, on where responsibility lies. Context.ai says it found and stopped unauthorised access to its AWS environment the month before, that the OAuth tokens taken were probably those of users of its consumer AI Office Suite, and that "Vercel is not a Context customer". It says a Vercel employee signed up with a Vercel enterprise account and granted "Allow All" permissions, and that Vercel's internal OAuth settings appear to have allowed such broad permissions. Vercel's bulletin doesn't comment on this.
- **Bansat checks:** rotate secrets after any exposure (7.6) · vendor checks for every tool that touches data (9.18) · new in v2.4: secrets stored as write-only values in the platform's secret store (7.4); only reviewed third-party apps may connect to staff Google Workspace or Microsoft 365 accounts, and the grants are reviewed quarterly (7.4); T-15.
- **Sources:** [Vercel](https://vercel.com/kb/bulletin/vercel-april-2026-security-incident) · [Context.ai](https://context.ai/security-update)

<a id="f-15"></a>
#### F-15 · A breach at analytics vendor Mixpanel exposed names and email addresses of some OpenAI API users

**Date:** Mixpanel detected an SMS phishing campaign on 8 November 2025 and shared the affected dataset with OpenAI on 25 November · **Organisation:** Mixpanel (vendor); OpenAI (customer) · **Scale:** a mid-size vendor and a large customer · **Class:** third-party integration

- **What happened.** Mixpanel, which OpenAI used for web analytics on the front end of its API product (platform.openai.com), says it detected an SMS phishing ("smishing") campaign on 8 November 2025 that affected a limited number of its customers. OpenAI says Mixpanel became aware on 9 November of an attacker who had got into part of its systems and exported a dataset that may have included API account names, email addresses, approximate location, operating system and browser, referring websites, and organisation or user IDs. A clarification on 19 December said the incident also affected a limited number of ChatGPT users who had submitted help centre tickets or were logged in to platform.openai.com, and that all affected users had been notified in the original outreach.
- **Cause, as reported.** The intrusion was in the vendor's systems; OpenAI says "This was not a breach of OpenAI's systems." The dataset taken from the analytics tool held what OpenAI calls "limited customer identifiable information and analytics information".
- **Outcome.** OpenAI removed Mixpanel from production, ended its use, notified affected organisations and users, and expanded its vendor security reviews. It says no chat content, API requests, API usage data, passwords, credentials, API keys, payment details or government IDs were compromised or exposed. Mixpanel ended active sessions, rotated compromised credentials, blocked malicious IP addresses and reset all employees' passwords.
- **Disputed.** None known.
- **Bansat checks:** analytics get IDs, never names or email addresses (5.1, 7.5, 12.1) · analytics kept to what's needed (9.10) · vendor due diligence and the register (9.18, 3.6) · DP-04 (9.5).
- **Sources:** [OpenAI](https://openai.com/index/mixpanel-incident/) · [Mixpanel](https://mixpanel.com/blog/sms-security-incident/)

### F.8 Regulators' decisions

<a id="f-16"></a>
#### F-16 · The ICO fined 23andMe £2.31m after a credential-stuffing attack on genetic data

**Date:** penalty notice dated 5 June 2025, announced 17 June 2025 · **Organisation:** 23andMe · **Scale:** large · **Class:** weak security operations; breach response failure

- **What happened.** The ICO fined 23andMe £2.31m after a credential-stuffing attack between April and September 2023 gave a hacker access to the personal information of 155,592 UK residents. The ICO says the company didn't start a full investigation until October 2023, after an employee found the stolen data advertised for sale online; in August 2023 it had dismissed a claim that data had been stolen as a hoax.
- **Cause, as reported.** Per the ICO: no mandatory multi-factor authentication, no secure password or unpredictable-username requirements, no extra checks before raw genetic data could be downloaded, and ineffective monitoring and response.
- **Outcome.** A £2.31m fine, after a joint investigation with the Office of the Privacy Commissioner of Canada. The ICO had proposed £4,593,750 in March 2025 and reduced it in light of the company's "significantly deteriorated financial position"; 23andMe had filed for Chapter 11 bankruptcy protection in the US. 23andMe made MFA mandatory for all customer accounts on 9 November 2023, and the ICO found that by 31 December 2024 it had put appropriate security measures in place.
- **Disputed.** Yes, on some findings. In representations recorded in the ICO's penalty notice, 23andMe said it only became aware of the breach on 1 October 2023, that when the August 2023 claim was made "there was no indication of unauthorised access", and that the attacker downloaded raw genetic data for four customers worldwide, none of them in the UK. It also explained why it hadn't made MFA mandatory or checked for previously breached passwords, and argued that its financial position meant no fine should be imposed. The ICO rejected these points or found they didn't change its findings.
- **Bansat checks:** breached-password checks and per-account rate limits (7.1, T-08) · re-authentication before any export (7.1) · genetic data is special category data, with a DPIA, segregated tables and access logging (9.13) · sign-ins and failures logged (7.5) · the breach runbook (9.20) · new in v2.4: passkeys or MFA for every account that can see special category data (9.13), and a credible claim of stolen data treated as a possible breach until it's ruled out (9.20). Bansat has no specific check for spotting credential stuffing while it happens.
- **Sources:** [ICO](https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2025/06/23andme-fined-for-failing-to-protect-uk-users-genetic-data) · [ICO penalty notice (PDF)](https://cy.ico.org.uk/media2/kclbljpo/23andme-penalty-notice.pdf)

<a id="f-17"></a>
#### F-17 · The ICO fined Reddit £14.47m for processing children's data without robust age checks

**Date:** decision announced 24 February 2026; penalty notice published 19 March 2026 · **Organisation:** Reddit · **Scale:** large · **Class:** children's data

- **What happened.** The ICO fined Reddit £14.47m, finding that it "failed to apply any robust age assurance mechanism" and so had no lawful basis to process the data of children under 13. Reddit's terms barred under-13s, but the ICO found it had no measures to check users' ages until July 2025. The ICO also found it didn't carry out a data protection impact assessment on the risks to children before January 2025, although 13 to 18-year-olds could use the platform.
- **Cause, as reported.** Per the ICO: no age checks before July 2025 on a platform whose terms barred under-13s, and no impact assessment on the risks to children before January 2025.
- **Outcome.** In July 2025 Reddit introduced age verification to access mature content and began asking people to declare their age when they open an account. The ICO told Reddit that relying on self-declaration "presents risks to children as it is easy to bypass", and it is keeping Reddit's processing of children's data under review.
- **Disputed.** Yes. Reddit has appealed the penalty notice to the First-tier Tribunal (ICO update of 1 April 2026); no tribunal decision was found as at 5 November 2026. When the fine was announced, a Reddit spokesperson said Reddit doesn't require users to share information about their identities, whatever their age, and that "The ICO's insistence that we collect more private information on every UK user is counterintuitive" (as reported by BleepingComputer).
- **Bansat checks:** the age position decided and tested, with a neutral age check, a block or a parental flow (9.12, ⛔ gate) · launch trap 1 · a DPIA where children could use the service (9.21) · the intake question on under-18s (Part 0) · Day-0 triage T8.
- **Sources:** [ICO](https://cy.ico.org.uk/about-the-ico/media-centre/news-and-blogs/2026/02/reddit-issued-with-1447m-fine-for-children-s-privacy-failures/) · [BleepingComputer](https://www.bleepingcomputer.com/news/security/uk-fines-reddit-19-million-for-using-childrens-data-unlawfully/) (corroborating, for Reddit's response)

<a id="f-18"></a>
#### F-18 · CNIL fined Google €325m and SHEIN €150m over cookies and adverts without consent

**Date:** decisions of 1 September 2025, published 3 September 2025 · **Organisation:** Google LLC and Google Ireland Limited; Infinite Styles Services Co. Limited (SHEIN's Irish subsidiary) · **Scale:** large · **Class:** tracking or consent failure

- **What happened.** France's CNIL fined Google LLC €200 million and Google Ireland Limited €125 million for showing adverts in the form of emails in Gmail's "Promotions" and "Social" tabs without prior consent, and because consent to advertising cookies when people created a Google account wasn't valid. It fined SHEIN's Irish subsidiary €150 million because advertising cookies were placed as soon as people arrived on shein.com, before any choice; the banners didn't explain the advertising purpose; and cookies were still placed or read after people clicked "Refuse all" or withdrew consent.
- **Cause, as reported.** Per the CNIL: tracking before consent, incomplete banners and refusals not honoured (SHEIN); adverts and cookies without valid consent (Google).
- **Outcome.** The two fines. The CNIL also ordered Google to stop showing adverts between emails without prior consent and to get valid consent for advertising cookies within six months, or each company would pay €100,000 for every day of delay. On 23 September 2026 (published 14 October 2026) it closed that order after Google made its Gmail adverts clearly distinguishable from emails and changed its account sign-up; it said the closure covers only the order and that it may investigate further. No order was made against SHEIN, which had changed its website during the proceedings. The CNIL says shein.com had an average of 12 million monthly visitors living in France.
- **Disputed.** Yes. SHEIN said it "firmly contests" the decision, called the fine "wholly disproportionate" and said it would appeal (as reported by Reuters). Google told TechRadar Pro that people "have always been able to control the ads they see in our products", that it had made changes the CNIL acknowledged, and that it was reviewing the decision. The CNIL notes that Google changed the look of Gmail adverts in April 2023 and added a refuse button as easy to use as accept in October 2023, but found that neither change ended the breaches.
- **Bansat checks:** no non-essential cookies, tracking or third-party requests before consent, and none after "Reject all", checked by the privacy test in CI (9.9, ⛔ gate) · equal Accept and Reject, and withdrawal as easy as consent (9.7, 9.8, launch trap 12) · no pixels in the root layout (launch trap 7) · promotional messages only with consent (9.11).
- **Sources:** [CNIL on both fines](https://www.cnil.fr/en/node/167505) · [CNIL on Google](https://www.cnil.fr/en/cookies-and-advertisements-inserted-between-emails-google-fined-325-million-euros-cnil) · [CNIL on SHEIN](https://www.cnil.fr/en/cookies-placed-without-consent-shein-fined-150-million-euros-cnil) · [CNIL closes the order against Google](https://www.cnil.fr/en/closure-injunction-google) · [Reuters via Yahoo News](https://www.yahoo.com/news/articles/shein-gets-150-million-euro-202454583.html) (corroborating) · [TechRadar Pro](https://www.techradar.com/pro/google-hit-with-massive-french-fine-for-inserting-cookies-and-ads-in-between-emails) (corroborating)

<a id="f-19"></a>
#### F-19 · Italy's Garante fined Replika's developer €5m over its legal basis, privacy notice and age checks

**Date:** decision of 10 April 2025, announced 19 May 2025 · **Organisation:** Luka Inc., developer of the Replika AI companion chatbot · **Scale:** mid-size · **Class:** no lawful basis or transparency; children's data

- **What happened.** The Garante fined Luka Inc. €5 million. It found that, as of 2 February 2023, the company hadn't identified a legal basis for its processing, its privacy policy was inadequate in several respects, and there was no age verification at sign-up or during use, although the company said it excluded minors. It found the age verification now in place still deficient in several respects.
- **Cause, as reported.** As found by the Garante: no identified legal basis, an inadequate privacy notice, and no working age verification for a service that said it excluded minors.
- **Outcome.** A €5 million fine and an order to bring its privacy notice and age verification into line with the GDPR within 30 days. The decision records that Luka had already fixed the missing legal basis by updating its privacy policy (version of 23 February 2024), that it blocked access from Italy after the Garante's urgent order of February 2023, and that it added an age gate with a 24-hour cooling-off period. The Garante opened a separate inquiry into how Replika's language model was developed and trained.
- **Disputed.** Yes. Luka has challenged the decision in court: the Garante says that while this challenge is pending it isn't applying an additional penalty, publication of the injunction order. The Garante doesn't give Luka's grounds, and in the proceedings Luka filed no defence and didn't ask to be heard.
- **Bansat checks:** a lawful basis chosen and recorded for every purpose (9.3, 9.4) · a privacy notice generated from the RoPA (9.6, launch trap 6) · the age position tested (9.12, launch trap 1) · transparency for AI features (8.6) · a DPIA (9.21).
- **Sources:** [Garante press release (Italian)](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/10132048) · [Garante decision (Italian)](https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/10130115)

<a id="f-20"></a>
#### F-20 · The FTC ordered Illuminate Education to overhaul its security after a breach of 10.1 million students' data

**Date:** proposed order announced 1 December 2025; final order issued 5 June 2026 · **Organisation:** Illuminate Education, Inc. (education technology) · **Scale:** mid-size · **Class:** weak security operations; breach response failure; data kept longer than needed

- **What happened.** The FTC alleges that in late December 2021 a hacker used the credentials of a former employee, who had left more than three and a half years earlier, to reach student databases stored with a third-party cloud provider, affecting 10.1 million students. It also alleges that student data was stored in plain text until at least January 2022, that vulnerabilities a vendor flagged as early as January 2020 weren't adequately addressed, that the company waited nearly two years to notify some school districts, covering more than 380,000 students, and that it misrepresented its security and how quickly it would tell schools about a breach.
- **Cause, as reported.** These are allegations, settled by a consent order: access not removed when an employee left, unencrypted student data, vulnerabilities left unaddressed, slow notification, and misrepresentations about its security and breach notice.
- **Outcome.** The final order, which runs for 10 years, requires deleting data that isn't reasonably necessary within 90 days, bars collecting or keeping such data, and requires a published retention schedule and a security programme with encryption, multi-factor authentication for staff and contractors that doesn't use SMS or phone methods, vulnerability scans every four months, annual penetration tests and independent assessments every two years. Illuminate must also report breaches to the FTC within 14 days of notifying any US federal, state or local government body. The FTC order includes no money. Separately, on 6 November 2025 the attorneys general of California, Connecticut and New York announced settlements with Illuminate totalling $5.1 million over the breach.
- **Disputed.** Illuminate settled without admitting or denying the FTC's allegations (consent agreement).
- **Bansat checks:** encryption, least privilege and quarterly access reviews (7.4) · patch windows (7.6) · MFA (7.1) · a retention schedule with tested deletion jobs (5.6, 9.23, Part 13) · the breach runbook and its deadlines (9.20) · new in v2.4: access removed the day someone leaves (7.4).
- **Sources:** [FTC press release, 1 December 2025](https://www.ftc.gov/news-events/news/press-releases/2025/12/ftc-takes-action-against-education-technology-provider-failing-secure-students-personal-data) · [FTC on the final order, 5 June 2026](https://www.ftc.gov/news-events/news/press-releases/2026/06/ftc-gives-final-approval-order-against-illuminate-settling-allegations-it-failed-secure-students) · [FTC final decision and order (PDF)](https://www.ftc.gov/system/files/ftc_gov/pdf/2223105c4833illuminatefinalorder.pdf) · [FTC complaint (PDF)](https://www.ftc.gov/system/files/ftc_gov/pdf/2223105c4833illuminatefinalcomplaint.pdf) · [FTC consent agreement (PDF)](https://www.ftc.gov/system/files/ftc_gov/pdf/2223105illuminateacco.pdf) · [California Attorney General](https://oag.ca.gov/news/press-releases/attorney-general-bonta-joins-states-securing-51-million-settlements-education) · [New York Attorney General](https://ag.ny.gov/press-release/2025/attorney-general-james-and-multistate-coalition-secure-51-million-education)

### F.9 What this casebook changed in Bansat

Mapping the twenty cases showed classes of failure that Bansat's checks didn't fully cover, mostly around AI coding agents and the tools connected to them. Version 2.4 added these checks:

| Added in v2.4 | Where | Prompted by |
|---|---|---|
| The coding agent holds no production or account-wide credentials, asks before any destructive command, and never runs with its approval prompts or sandbox switched off | 12.1, T-13 (7.3), Part 13, Day-0 triage T11 (14.2) | F-04, F-05, F-06 |
| Text the coding agent reads (tool and MCP results, issues, error reports, logs, web pages, dependency files, code comments) is data, not instructions | 12.1, T-14 (7.3) | F-07 |
| Agents that act, in the product or as the coding agent, get the least access that works, short-lived credentials and a person's approval for anything irreversible | 8.4 | F-07, F-08 |
| CI/CD and publishing: pinned actions, read-only tokens by default, no untrusted code run with secrets and no untrusted text in `run:` scripts, trusted publishing with 2FA, install scripts only for approved dependencies, new versions left to age | 7.4, T-12 and T-16 (7.3), Part 13 | F-06, F-13 |
| Integration tokens stored encrypted with the narrowest scopes, rotated and watched; staff accounts accept only reviewed third-party apps | 7.4, T-15 (7.3) | F-12, F-14 |
| Secrets stored as write-only values in the platform's secret store, one set per environment | 7.4 | F-14 |
| No default or shared passwords, and no test or demo accounts at launch beyond a listed store-review account | 7.1, Part 13 ⛔ | F-10 |
| Nothing that stores data (database, cache, search index, queue, log store) is reachable from the internet without authentication | 7.4, Part 13 ⛔ | F-09 |
| Uploaded code, scripts and templates never run outside an isolated sandbox with no credentials | T-07 (7.3) | F-08 |
| Backups kept apart from what they protect, so deleting a database, volume or project can't delete them | 5.7 | F-05 |
| Security reports triaged against the current design within a set time, and none closed as "intended" without that check | 7.6 | F-11 |
| A credible claim of stolen data is treated as a possible breach until it's ruled out | 9.20 | F-16 |
| Passkeys or MFA for every account that can see special category data | 9.13 | F-16 |
| Access removed on the day someone leaves | 7.4 | F-20 |

Two classes have no case in this edition (international transfers and public storage); the checks for them were already in place.

### F.10 How the cases were chosen and checked

- **Window and scope:** incidents and decisions from 1 January 2025 to 31 October 2026, in five groups: apps built with AI tools, AI agents and coding tools, AI companies' own systems, integrations and the supply chain, and regulators' decisions about failures a builder controls. Thirty candidates were researched; these twenty had the best primary sources and cover every group.
- **Excluded:** any case without a primary source that could be opened. Among those left out for that reason were a fine reported only in the press and on social media, and exposures known only from news reports.
- **Checking:** every source above was opened while the case was written, and an independent review then checked each case against its sources on 5 November 2026. Posts on X were read through a public mirror and are cited by their x.com address. Primary sources can change after that date. If you find a fact that's wrong or out of date, open an issue with the source: https://github.com/bewithkhan/bansat/issues
- **Adding a case:** the same rules apply (blueprint BR-10). Give the primary source, state only what it reports, record any dispute, and map the case to a failure class and its checks.
