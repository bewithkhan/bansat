# The Bansat law registry

One YAML file per jurisdiction, with its data protection and privacy rules for people building software: who the law covers, lawful bases, the consent age, children, cookies, marketing, breach notice, registration and fees, DPOs, transfers, DPIAs, automated decisions and AI, and penalties. Each fact is summarised in our own words and links to the official source it comes from.

**Not legal advice.** Every entry says when it was last checked and how (`checked`). An entry marked `ai-checked` was checked against official sources with AI assistance; nobody has reviewed it as a lawyer. Check the linked sources before you rely on a fact, and get qualified advice for high-risk processing.

## Layout

```text
laws/
  schema.json        the format of an entry (JSON Schema)
  full/<id>.yaml     full entries: every obligation, each with official sources
  basic/<id>.yaml    basic entries: the laws and the regulator, for other countries with a data protection law
watch/sources.yaml   the official domains each entry may cite
watch/README.md      how Law Watch keeps the entries current
```

The `id` is the ISO 3166-1 alpha-2 code (`de`, `ng`), with `uk` for the United Kingdom, a region code (`eu`), or a sub-national code (`us-ca`, `ae-difc`). An entry that is read together with another one names it in `applies_with`: Germany lists `eu`, and a US state lists `us-federal`.

## Rules for every entry

- **Official sources only** (blueprint BR-02): legislation and official gazettes, the regulator's own site, government sites and courts. Each source must be on a domain listed for that jurisdiction in `watch/sources.yaml`, or for an entry it applies with. Trackers, law firms and news are leads at most: list them under `secondary`, never as the only support for a claim.
- **Our own words.** Summarise; don't copy. Keep each summary short (600 characters at most), and say plainly when something is pending, such as a bill or an appeal.
- **Numbers say what they count.** Where an obligation has a number, such as the consent age (16) or a breach deadline (72), `value` holds it and `unit` says what it counts: `years`, `hours`, `days` or `business days`. CI rejects a number without a unit.
- **Dated and labelled.** `checked.date` is when the entry was last checked against its sources. `checked.status` is `ai-checked`, or `human-reviewed` with the reviewer's GitHub username in `checked.by`. Add a `history` item, newest first, for every change to the entry's facts. A change to `watch` alone doesn't need one.
- **Watched.** `watch` lists the official feeds and pages that Law Watch checks every week for this entry, each on one of its official domains ([watch/README.md](../watch/README.md)).

CI checks all of this on every pull request (`node scripts/validate-laws.ts`), and `node scripts/validate-laws.test.ts` proves each rule catches a bad entry.

## Suggesting a change

Open an issue or a pull request with the official source for the change. Please don't include personal details: the registry stores none.
