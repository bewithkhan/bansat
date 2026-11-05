# Brief: independently review law registry entries for Bansat (Middle East and Africa batch)

You're checking entries that someone else wrote. Assume nothing in them is right until an official source shows it.
People will build products on these facts, so a wrong consent age, deadline, threshold, fee, penalty or in-force date
is serious.

## Read first
- The writers' rules: /tmp/claude-0/-home-claude/481a3ee1-8cae-5706-8d27-31c282fbf964/scratchpad/phase2/BRIEF-MEA.md
- The format: /home/claude/bansat-mea/laws/schema.json and /home/claude/bansat-mea/laws/README.md
- The entries you're reviewing are in /home/claude/bansat-mea/laws/full/ (the ids are in your task), with their
  official domains in /home/claude/bansat-mea/watch/sources.yaml.

## For every entry, check
1. **Each claim against its cited sources.** Open every source (WebFetch, or `curl -sS -L` if WebFetch is refused).
   Does it load, is it official (gazette, legislation portal, regulator, government or court), and does it support the
   summary? Numbers and dates first: consent ages, breach deadlines, thresholds, fees, fine ceilings, in-force dates,
   grace periods.
2. **Currency on 5 November 2026.** Look for 2024–2026 changes the entry misses or gets wrong: amendments, executive or
   implementing regulations, new authorities, children's, AI or cybercrime laws, court rulings, enforcement start dates.
   Pending items must be described as pending.
3. **Dates.** Is every `in_force_from` backed by the law's commencement article, the gazette date plus the stated
   period, or the regulator's own announcement? Flag any date that looks remembered or derived without saying so.
4. **Scope between regimes.** For free zones and financial centres (DIFC, ADGM, the QFC): does the entry say plainly
   which regime applies to whom, and is `applies_with` right?
5. **Completeness.** Does an obligation leave out something a builder must know (registration or licensing, a DPO
   duty, localisation, transfer approvals, children's rules, marketing consent)?
6. **Own words and clarity.** Flag copied wording beyond short legal terms, and summaries that could mislead.

Don't edit any files. Don't re-check what you've confirmed; move on.

## Report back (your final message)
Findings grouped by entry, most serious first. Each one gives the field, what's wrong, the evidence (the official URL
and what it says, in your words) and the fix you'd make. Mark each **Blocker** (wrong fact or unsupported claim),
**Should fix** (missing or unclear) or **Nit**. Then list briefly what you checked and found correct.
