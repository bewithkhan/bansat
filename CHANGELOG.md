# Changelog

All notable changes to Bansat (بنسټ). Each release is a git tag, and the install command in the README is pinned to one, so the skill's instructions only change when you choose to update.

## v2.1.0 (2026-11-05)

Changes from the review in [issue #1](https://github.com/bewithkhan/bansat/issues/1). Thanks to @jcc2010.

- **Gates are described honestly.** The README and framework now say the gates are instructions Claude follows, not blocks.
- **New: an optional G1 hook.** `hooks/bansat-g1-guard.mjs` is a Claude Code PreToolUse hook that refuses Claude's code edits until a person signs the G1 row in `docs/BLUEPRINT.md`, and never lets Claude sign it. Its tests run with `node hooks/bansat-g1-guard.test.mjs`. Setup is in the README.
- **Only a person signs a gate.** The skill, the framework's Document control and the agent rules (12.1) say an AI agent never fills in the Gate approvals table.
- **Who checked the law.** The README, framework and skill now say the legal sections were checked against official sources with AI assistance, and that no lawyer has reviewed them yet.
- **Pinned releases.** The install command and the skill's fallback download point to a release tag instead of `main`.
- **Any stack.** The data-access rule now reads "enforce per-user and per-tenant access at the data layer, with RLS where the database supports it" in the skill, the gates, 5.4, 7.2, trap 5 in 9.26, the launch gate, the Day-0 triage and the agent rules. Authorisation is re-checked in every server entry point, not only in Server Actions.
- **Your process wins.** A project's own `CLAUDE.md`, `AGENTS.md` or planning stages take priority, and Bansat fills the gaps.

**Re-checking an existing blueprint:** update the Framework row in Document control to v2.1. If your database has no RLS (MySQL, MariaDB, SQLite), replace "RLS on every table" with the data-layer rule and keep the isolation tests.

## v2.0.0 (2026-11-05)

First public release: the framework (15 parts and 4 appendices), the Agent Skill, citation metadata and licences.
