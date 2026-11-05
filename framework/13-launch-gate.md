<a id="p13"></a>
## Part 13 — Launch readiness gate (Go / No-Go) `[CORE]`

Every item must be ✅, or N/A with a reason. Any open ⛔ item means **no launch**.

**A. Product**
- [ ] All MVP `FR`s meet their acceptance criteria; known issues are triaged and documented
- [ ] A support channel and help content are live

**B. Engineering & quality**
- [ ] ⛔ CI is green: typecheck, lint, unit, integration, E2E for critical journeys
- [ ] ⛔ State matrix (10.7) complete for every screen
- [ ] Performance budgets met (NFR-PERF); a load test was run on critical paths
- [ ] Error monitoring, uptime checks and alerts are live and tested
- [ ] ⛔ A backup **restore** has been tested; a rollback has been tested

**C. Security**
- [ ] ⛔ Access enforced at the data layer on every table (RLS where the database supports it), with tenant-isolation tests passing (5.4)
- [ ] ⛔ No secrets in the repo or the client bundle (scans clean)
- [ ] ⛔ No default or shared passwords, and no test or demo accounts in production (7.1)
- [ ] ⛔ No database, cache, search index or log store reachable from the internet without authentication (scan clean) (7.4)
- [ ] Coding agents and CI hold no production or account-wide credentials; production changes go through CI/CD with approval; CI/CD hardened (7.4, 12.1)
- [ ] ⛔ No critical dependency vulnerabilities; high ones have a plan
- [ ] Security headers in place and the CSP **enforced** (7.4)
- [ ] MFA for admins and provider consoles; rate limits on auth, AI and forms
- [ ] DAST baseline run; pen test done (High tier); `security.txt` published

**D. Privacy & compliance**
- [ ] ⛔ The privacy notice is live, matches the RoPA, and is linked at sign-up and in the footer (9.6)
- [ ] ⛔ The age position is implemented and tested: age check, block or parental flow (9.12)
- [ ] ⛔ **No non-essential cookies, tracking or third-party requests before consent**; fonts self-hosted; privacy test green (9.9)
- [ ] ⛔ The cookie banner has equal Accept and Reject; a "Cookie settings" link is in the footer; the register is published (9.8)
- [ ] ⛔ Session replay, if used: consent-gated, strictest masking, sensitive pages excluded (9.10)
- [ ] ⛔ Marketing email: consent evidence, one-click unsubscribe plus `List-Unsubscribe` headers, sender identity, postal/company details, suppression list. Transactional email contains no promotions (9.11).
- [ ] ⛔ Processor DPAs signed; transfer mechanisms recorded (3.6, 9.17)
- [ ] ⛔ Privacy centre: export and account deletion work end to end, and meet app-store rules (9.15)
- [ ] Rights-request and complaints procedures live, with a 30-day acknowledgement for UK complaints; templates ready (9.15–9.16)
- [ ] Breach runbook, contacts and breach log ready (9.20)
- [ ] DPIA completed and signed off where it's required (9.21)
- [ ] Retention and deletion jobs scheduled and tested (5.6)
- [ ] AI: output labelled; provider no-training and retention terms confirmed; Art. 50 duties met (8.6)
- [ ] ⛔ Registrations: ICO fee paid (UK); EU/UK representative appointed if needed; NDPC registration and DPO if you're a DCPMI (9.2)
- [ ] The launch-trap audit (9.26) has every row evidenced, and the compliance calendar is set (9.24)

**E. Accessibility**
- [ ] ⛔ axe clean on key pages; keyboard-only run of critical journeys passes
- [ ] Screen-reader smoke test done; drag alternative, target sizes and accessible auth confirmed (10.6)
- [ ] Accessibility statement published

**F. Operations**
- [ ] Runbooks written; on-call routing tested; status page ready
- [ ] Cost alerts set for infrastructure and AI

**G. Legal & commercial**
- [ ] Terms of service and acceptable-use rules published; company information shown on the site (9.25)
- [ ] B2C paid: pre-contract information and cancellation rights in place; pricing shown with no drip pricing
- [ ] App stores: privacy labels, data safety form, in-app deletion, tracking prompts configured
- [ ] Payments through hosted checkout or fields only

| Sign-off | Name | Decision | Date |
|---|---|---|---|
| Product | | Go / No-go | |
| Engineering & security | | Go / No-go | |
| Privacy | | Go / No-go | |
