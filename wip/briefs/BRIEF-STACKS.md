# Brief: write stack profiles for Bansat (Phase 3)

Bansat (github.com/bewithkhan/bansat) is an open framework that makes AI coding agents plan security, privacy,
accessibility and UI states before they write code. Its reference stack is Next.js and Supabase (framework Parts 3–7).
A stack profile tells a builder, and the AI agent planning for them, what changes on another stack. People will ship
products from these, so accuracy comes first, then usefulness: concrete steps, not generic advice.

## Read first
- The format and rules: /home/claude/bansat-stacks/stacks/README.md. Follow them exactly: the header line, the ten
  sections in order, then Sources.
- What the profiles must line up with, in /home/claude/bansat-stacks/framework/:
  5.4 Row-Level Security and the isolation tests (05-data.md); 7.1 Authentication, 7.2 Authorisation, 7.4 Security
  controls baseline, 7.5 Logging (07-security.md); 9.8 Cookies and SDKs, 9.9 Third-party requests and the Playwright
  no-third-party test (09-privacy.md); 12.1 agent rules and 12.2 research first (12-agent-manual.md); Appendix D
  (appendix-d-stacks.md). Use the same terms, and point to these sections by number (for example "the 5.4 isolation
  test") instead of repeating them.

## How to write each profile
1. **Research before writing.** For each section, open the stack's current official documentation (and security guide,
   if it has one) and check its security advisories and GitHub issues for known traps. Note the version you read.
2. **Facts current on 5 November 2026.** Name the current major version and flag anything that changed in 2025–2026
   (renamed APIs, new defaults, deprecations, notable advisories).
3. **Defaults, then the gap.** In each section say what the stack does out of the box, what the builder must add, and
   the escape hatches that switch protection off (for example `|safe`, `v-html`, `dangerouslySetInnerHTML`,
   `{!! !!}`, `csrf_exempt`, `[IgnoreAntiforgeryToken]`).
4. **Concrete.** Name the setting, file, package or command. Short original code examples (15 lines at most) where
   they help; never paste documentation text or code.
5. **Isolation test.** In section 1, sketch how to prove user A can't read or change user B's data with this stack's
   test tools, in a few lines.
6. **Sources.** Every claim about the stack's behaviour links to its official docs (open each link and check it supports
   the claim). OWASP Cheat Sheets may be linked, never copied. No blogs, courses, Medium or Stack Overflow as sources;
   GitHub advisories and the project's own issues are fine for known traps.
7. **Length.** About 100–180 lines each. Every bullet earns its place.

## Output
Write each profile as `<out>/<id>.md` (the ids are in your task). Don't edit any repository, and don't commit.

## Report back (your final message)
- The files you wrote, and the version each one covers.
- Anything you couldn't confirm in the official docs, and any 2025–2026 change a builder must know.
Keep it short: the profiles carry the content.
