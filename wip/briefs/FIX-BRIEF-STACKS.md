# Brief: apply an independent review to Bansat stack profiles

Builders and their AI agents will follow these profiles, so accuracy comes first. You're applying one reviewer's
findings to the profiles named in your task, in the git worktree /home/claude/bansat-stacks (branch phase-3-stacks).

## Read first
- The format and rules: /home/claude/bansat-stacks/stacks/README.md and
  /tmp/claude-0/-home-claude/481a3ee1-8cae-5706-8d27-31c282fbf964/scratchpad/phase3/BRIEF-STACKS.md
- The review: the file named in your task.

## How to work
1. For every finding (Blocker, Should fix, Nit), **verify it yourself against the stack's official docs, advisories
   or source before changing anything**. The reviewer can be wrong. If you can't confirm a finding, don't apply it;
   list it in your report.
2. Apply every Blocker and Should fix you confirm; apply a Nit when it's quick and clearly right. Fix code examples
   so they're correct for the version covered, and keep each to 15 lines at most.
3. Keep the format exactly: the title, the header line, the ten `##` sections in order, then Sources. Keep
   "**Checked:** 2026-11-05". Add any new source you rely on to Sources (official docs, advisories or the project's
   own repository only).
4. Own words; never paste documentation text or code.
5. From /home/claude/bansat-stacks run `node scripts/check-stacks.ts`; it must pass. Touch only your profiles; other
   agents are editing other profiles. Don't commit or push.

## Report back (your final message)
Per profile: each change (section, before in a few words, after, the source). Then every finding you skipped or only
partly applied, with the reason. Keep it short.
