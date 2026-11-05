# Brief: independently review Bansat stack profiles

You're checking profiles someone else wrote. Assume nothing in them is right until the stack's own documentation, its
security advisories or its source shows it. Builders and their AI agents will follow these, so a wrong default, a
wrong version, a made-up advisory or a code example that doesn't work is serious.

## Read first
- The format and rules the writer followed: /home/claude/bansat-stacks/stacks/README.md and
  /tmp/claude-0/-home-claude/481a3ee1-8cae-5706-8d27-31c282fbf964/scratchpad/phase3/BRIEF-STACKS.md
- The profiles are in /home/claude/bansat-stacks/stacks/ (the ids are in your task).
- The framework sections they point to: /home/claude/bansat-stacks/framework/ (5.4, 7.1, 7.2, 7.4, 7.5, 9.8, 9.9, 12.1,
  Appendix D).

## For every profile, check
1. **Advisories and versions first.** Open every CVE or GHSA the profile cites (the GitHub Advisory Database, the
   project's security advisories, or nvd.nist.gov) and confirm its id, the affected and fixed versions, and what it does.
   Confirm each version number and release or end-of-support date against the project's own releases or docs. Flag any
   advisory or version you can't find.
2. **Each claim about behaviour against its source.** Open the cited docs and confirm defaults, settings, package names,
   commands and APIs. Flag anything the source doesn't say, or says differently.
3. **Code examples.** Each must be correct for the version covered: APIs that exist, names spelled right, nothing that
   would turn a protection off or leak data. Flag any that wouldn't run or would mislead.
4. **Fit with the framework.** Section references (5.4, 9.9…) point to the right place, and no advice contradicts the
   framework.
5. **Gaps.** A trap builders on this stack commonly fall into that's missing, especially around access control,
   secrets reaching the client, and third-party requests before consent.
6. **Own words.** Flag text or code copied from documentation or OWASP beyond short terms.

Don't edit any files. Don't re-check what you've confirmed; move on.

## Report back (your final message)
Findings grouped by profile, most serious first. Each one gives the section, what's wrong, the evidence (URL and what it
says, in your words) and the fix. Mark each **Blocker** (wrong fact, made-up or wrong advisory, broken example),
**Should fix** (missing or unclear) or **Nit**. Then list briefly what you checked and found correct.
