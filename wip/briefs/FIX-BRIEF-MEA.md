# Brief: apply an independent review to Middle East and Africa entries in the Bansat law registry

People will build products on these facts, so accuracy comes first. You're applying one reviewer's findings to the
entries named in your task, in the git worktree /home/claude/bansat-mea (branch phase-2-mea).

## Read first
- The writers' rules: /tmp/claude-0/-home-claude/481a3ee1-8cae-5706-8d27-31c282fbf964/scratchpad/phase2/BRIEF-MEA.md
- The format: /home/claude/bansat-mea/laws/schema.json and laws/README.md. Every numeric `value` needs a `unit`
  (years, hours, days or business days), and a unit needs a number.
- Allowed domains: /home/claude/bansat-mea/watch/sources.yaml. Law firms, news, trackers and court-record mirrors are
  leads only: they go under `secondary`, never as the only support for a claim.

## How to work
1. For every finding (Blocker, Should fix, Nit), **verify it yourself against an official source before changing
   anything** (WebFetch, or a plain download with curl if WebFetch is refused). The reviewer can be wrong. Work from
   the official URLs the reviewer lists and the entries already cite.
2. Apply every Blocker and Should fix that an official source confirms; apply a Nit when it's quick and clearly right.
   A claim that only a secondary source supports doesn't go in as fact. Where the official text can't be opened, you
   may say so plainly in the entry ("reported by …; the official text couldn't be opened") with the lead under
   `secondary`, as the Nebraska entry does. If an existing claim has no official support you can open, take it out or
   reword it to what the official source does say, and list it in your report.
3. Pending items are described as pending. Derived dates say so in the law's `notes`.
4. Own words, never copying beyond short legal terms; 600 characters at most per summary or note (trim elsewhere in
   the same text if you must); exact numbers and dates.
5. You may add official domains to **your own entries' lines** in watch/sources.yaml. Other agents edit the same file
   for other entries, so: re-read the file immediately before editing, make one small Edit that changes only your
   entries' lines, then re-read to confirm your change landed and nothing else changed.
6. Keep `checked.status: ai-checked` and `checked.date: "2026-11-05"`. Change the summary of each edited file's single
   `history` item to: "First entry. Checked against official sources with AI assistance, then corrected after an
   independent AI-assisted review." Don't add a second item.
7. From /home/claude/bansat-mea run `node scripts/validate-laws.ts` and `node scripts/validate-laws.test.ts`; both
   must pass for your files (ignore errors only in files other agents own, and re-run later). Don't commit, push or
   open anything, and touch no file other than your entries and your lines in watch/sources.yaml.

## Report back (your final message)
Per file: each change (field, before in a few words, after, the official URL). Any domain you added and why it's
official. Then every finding you skipped or only partly applied, and every claim you removed for lack of an official
source, with the reason. Keep it factual and short.
