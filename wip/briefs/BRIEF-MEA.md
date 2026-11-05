# Brief: write Middle East & Africa entries for the Bansat law registry (Phase 2, third batch)

Bansat is an open framework (github.com/bewithkhan/bansat). Its law registry gives people who build software each
jurisdiction's data protection rules, one YAML file per jurisdiction. You are writing full-tier entries. Accuracy
matters more than speed: people will build products on these facts, and an independent reviewer will re-open every
source after you.

## Read first
- The format: /home/claude/bansat-mea/laws/schema.json and /home/claude/bansat-mea/laws/README.md.
- Style, length and tone: /home/claude/bansat-mea/laws/full/uk.yaml (plain English, short sentences, facts in our own
  words, at most 600 characters per summary or note). For a non-European entry with its own regulator, see
  /home/claude/bansat-americas/laws/full/br.yaml; for a sub-national entry read with a national one, see
  /home/claude/bansat-americas/laws/full/ca-qc.yaml (`applies_with: [ca]`).
- Blueprint rules: /home/claude/bansat-mea/docs/BLUEPRINT.md, section 5 (data dictionary) and BR-02.

## Rules
1. **Official sources only.** Every URL in `official_url`, a regulator's `url` and `obligations.*.source` must be
   official: the official gazette or legislation portal, the regulator's own site, other government sites, or courts.
   Law firms, trackers (IAPP, DLA Piper, DataGuidance, UNCTAD), Wikipedia and news are leads at most: put one under that
   obligation's `secondary` list, never as the only support for a claim. Sources may be in Arabic, Hebrew or another
   official language; summaries are in English.
2. **Open every URL you cite** and confirm it loads and supports the claim. Prefer deep links to the article, section
   or regulation. If WebFetch refuses a page, download it with `curl -sS -L` (never turn off TLS verification) and read
   it; list those URLs in your report. Never cite a page you couldn't open.
3. **Current on 5 November 2026.** Before writing each field, look for 2024–2026 changes: amendments, executive or
   implementing regulations, new guidance with binding force, new children's, AI or cybercrime laws, grace periods
   ending, regulators renamed or merged. Something pending (a bill, a draft regulation, a consultation, an appeal)
   is described as pending, never as law.
4. **Dates come from official text, never memory.** Each `in_force_from` comes from the law's own commencement article,
   the gazette's publication date plus the period the law states, or the regulator's official announcement. If you had
   to derive a date (for example "90 days after publication"), say so in that law's `notes`. If you can't confirm a
   date, leave `in_force_from` out and say so in your report.
5. **All 13 obligations are required:** scope, lawful_bases, consent_age, children, cookies, marketing, breach_notice,
   registration_or_fees, dpo, transfers, dpia, automated_decisions_ai, penalties. Use `value` only for a clear number
   the law itself sets (a consent age, a breach deadline), and give it a `unit`: years, hours, days or business days.
   A unit needs a number, and a number needs a unit; the validator enforces both.
6. **Numbers exactly as the law states them:** fines in the local currency (and say if they're per violation, a
   maximum, or a share of turnover), thresholds, deadlines. Don't convert currencies.
7. **Enforcement status:** check for grace periods, suspended provisions, court challenges and the regulator's own
   statements on when it starts enforcing. Say what applies now.
8. **Laws to list:** the main data protection law, its executive or implementing regulations, the rules on electronic
   marketing (telecom regulator rules, spam rules), children's online rules, any binding AI law or regulation, and the
   cybercrime or sector law where it sets duties builders meet. Each with its official citation, official URL, status
   (`in-force`, `enacted` for signed but not yet in force, `draft` for bills and drafts) and `in_force_from`.
9. **Own words.** Don't copy beyond short legal terms.
10. Set `checked: {date: "2026-11-05", status: ai-checked}` and one history item:
    `{date: "2026-11-05", summary: "First entry, checked against official sources with AI assistance."}`. Leave out
    `watch`. Start each file with the two comment lines uk.yaml starts with.
11. Only write inside your own output folder (given in your task). Don't edit any repository.

## What went wrong in the last batch (avoid these)
The Americas reviewers found: start dates written from memory; claims resting only on law firms or news; court
challenges and injunctions missed; provisions cited after they'd been repealed or replaced; numbers without a unit;
and dates derived without saying so. Check each of these in your entries before you finish.

## Validate before you finish
Build this layout inside your output folder, then run the validator and fix every problem it reports:
    <out>/laws/schema.json        (a copy of /home/claude/bansat-mea/laws/schema.json)
    <out>/laws/full/<id>.yaml     (your entries)
    <out>/watch/sources.yaml      (jurisdictions: <id>: official_domains: [...], in the format of
                                   /home/claude/bansat-mea/watch/sources.yaml)
    node /home/claude/bansat-mea/scripts/validate-laws.ts --root <out>
If an entry lists `applies_with: [ae]` and `ae` isn't in your folder, the only acceptable error is the one saying
`ae` has no entry.

## Report back (your final message)
- The files you wrote, and the official domains for each jurisdiction.
- Every date you derived or couldn't confirm, every claim where sources disagreed, and everything pending or uncertain.
- URLs you could only check by direct download.
- The notable 2024–2026 changes you found.
Keep it short: the entries carry the facts.
