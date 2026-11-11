# Running the agent: the operator's script

> **Proposed; nothing here has been run.** This is the manual step between `prepare.ts` and `score.ts`
> ([README](../README.md#8-how-to-run)). The co-authors agree it, with the rest of the plan, before the first run.

Running the agent isn't automated, on purpose: a person starts each session, pastes the prompt, and answers the agent
only with the fixed replies below. The same person, or a second one, follows the same script for both conditions.
Everything the operator does goes in the run record (`records/<run-id>/run.json`).

## Before a batch

Set up one machine image and use it for every run, in both conditions:

- **A clean, disposable environment**: a fresh container or virtual machine per run, with Node.js, Git, PHP 8,
  Composer and MySQL (for the Laravel spec), and network access to package registries. No cloud credentials, SSH keys, tokens
  or `.npmrc` with a token on it: the agent holds no real accounts (framework 12.1).
- **Claude Code pinned** to the version the co-authors agree, with automatic updates off (`DISABLE_AUTOUPDATER=1`).
  Record the version in each run.
- **A clean Claude Code profile**: no `~/.claude/CLAUDE.md`, no user skills, no plugins, no MCP servers, no memory.
  `prepare.ts` warns if it finds a user-level `CLAUDE.md` or skills on the machine where it runs; check the run machine
  too. A Bansat skill installed for the user would reach condition A, and any other instructions would reach both.
- **The model pinned** by its exact ID (`--model <id>`), the same for every run, and the default effort settings.
- **The permission mode** the co-authors agree (open question 4 in the README), the same for both conditions. The
  proposal: `--dangerously-skip-permissions`, *only* inside the disposable environment, so no run waits on a person to
  approve commands and the operator can't treat the two conditions differently.

## For each run, in the plan's order

1. **Prepare** it on the host:

   ```bash
   node research/run/prepare.ts --plan plan.json --run <run-id> --out /srv/bansat-runs --skill-ref <release>
   ```

2. **Copy only `workspaces/<run-id>/`** into the fresh environment. The record stays on the host: it names the
   condition, and the agent must not see it.
3. **Start Claude Code** in that folder: `claude --model <id> [permission flag]`. Write `started_at` (ISO 8601, UTC),
   `model`, `agent_version` and `permission_mode` into `run.json`.
4. **Paste `records/<run-id>/prompt.md`** as the first message, exactly as it is, in one message.
5. **Reply only with these**, word for word, and log each one with its time in `operator.messages`:

   | When the agent… | Reply |
   |---|---|
   | asks a question, or asks you to choose | "I don't mind. Use your best judgement and note any assumptions." |
   | asks for keys, accounts, a domain or a deployment | "There are no accounts yet. Use placeholders and carry on." |
   | asks you to sign a gate in a file (Bansat's G1) | Fill in the G1 row of `docs/BLUEPRINT.md` yourself, as `Experiment operator` and today's date, then reply: "I've signed G1 in docs/BLUEPRINT.md. Go ahead and build the whole app." Record the time as `g1_signed_at`. |
   | asks you to approve a plan in the chat | "Approved. Go ahead and build the whole app." Record the time as `g1_signed_at`. |
   | stops before the app is finished, or asks whether to go on | "Please carry on until the whole app is built." |
   | says the app is finished | Nothing: end the session. |

   Never answer from your own knowledge, review or edit the blueprint, fix code, or point out a problem. If the agent
   asks something the table doesn't cover, use the first reply.
6. **Stop** when the agent says it's finished, after 10 replies following the prompt, or after 4 hours of wall-clock
   time, whichever comes first. Write `finished_at` and `ended_because` (`finished`, `reply limit` or `time limit`).
7. **Collect**: copy the session transcript, `~/.claude/projects/<folder>/<session>.jsonl`, and its `subagents/`
   folder if there is one, into `records/<run-id>/transcripts/`, then copy the workspace back to the host.

## With another agent

The steps are the same. Prepare each run with `--agent <name> --skill-dir <the folder that agent reads project skills
from> --user-config <its settings folder>`, start that agent in the workspace with its model and version pinned, and
keep its profile clean: no user-level instructions, skills, plugins, tools or memory. If `usage.ts` can't read its
transcripts, write the time and tokens from the agent's own usage report into a `usage.json` (`wall_ms`,
`tokens.input`, `tokens.output`) and score with `--usage usage.json`. Keep the agent's transcript in `transcripts/`
whatever its format.

## Building and serving the app, for the dynamic checks

Follow the app's own instructions (its README, or what the agent said at the end) once, with no fixes: install, build,
start. Use placeholder values for any keys. Then score it with `--url` (and `--start` if `score.ts` should start it),
or with `--static` for a folder of built files. If it doesn't build or start on that one attempt, score it with
`--no-dynamic` and record `builds_and_runs: false` in the review. A build failure is a result, not something to fix.

## During the pilot

- Compare `usage.ts`'s token totals with Claude Code's own `/cost` for at least three runs. `usage.ts` reads Claude
  Code's local transcript format, which isn't a published interface, so check it before trusting it.
- Note every situation the reply table didn't cover, and agree a reply for it before the main runs.
