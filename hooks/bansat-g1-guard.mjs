#!/usr/bin/env node
// Bansat (بنسټ) G1 guard: an optional Claude Code PreToolUse hook.
// https://github.com/bewithkhan/bansat · MIT licence (see LICENSE-CODE)
//
// Until a person approves the blueprint, Claude's file-editing tools may only touch
// docs/, spikes/, .claude/ and a few top-level notes. Everything else is refused.
// A person approves by filling in the G1 row (approver and a YYYY-MM-DD date) in the
// "Gate approvals" table of docs/BLUEPRINT.md. Claude is never allowed to sign it.
//
// Limits: this guards Claude's file-editing tools, not shell commands. It is a guard
// rail, not a sandbox. If its input can't be read, it makes no decision (fails open).

import fs from 'node:fs';
import path from 'node:path';

const ALLOWED_DIRS = ['docs/', 'spikes/', '.claude/'];
const ALLOWED_FILES = ['CLAUDE.md', 'AGENTS.md', 'README.md', '.gitignore'];
const BLUEPRINT = 'docs/BLUEPRINT.md';
const ALLOWED_LIST = `${ALLOWED_DIRS.join(', ')} and ${ALLOWED_FILES.join(', ')}`;

function deny(reason) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason: reason,
    },
  }));
  process.exit(0);
}

// The G1 row counts as signed when it names an approver and a real date.
function g1Signed(text) {
  if (!text) return false;
  const row = text.split(/\r?\n/).find((line) => /^\s*\|\s*G1\b/.test(line));
  if (!row) return false;
  const cells = row.split('|').slice(1, -1).map((c) => c.trim());
  const approver = cells[1] ?? '';
  const date = cells[2] ?? '';
  return approver.length > 0 && !approver.includes('{{') && /^\d{4}-\d{2}-\d{2}$/.test(date);
}

// What the blueprint would look like after an Edit (or a list of edits).
function applyEdits(text, toolInput) {
  const edits = Array.isArray(toolInput.edits) ? toolInput.edits : [toolInput];
  let out = text;
  for (const e of edits) {
    if (typeof e.old_string !== 'string' || typeof e.new_string !== 'string') continue;
    out = e.replace_all ? out.split(e.old_string).join(e.new_string) : out.replace(e.old_string, e.new_string);
  }
  return out;
}

let input;
try {
  input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}');
} catch {
  process.exit(0); // unreadable input: no decision
}

const toolInput = input.tool_input ?? {};
const target = toolInput.file_path ?? toolInput.notebook_path;
const projectDir = process.env.CLAUDE_PROJECT_DIR || input.cwd;
if (!target || !projectDir) process.exit(0);

const fold = (p) => (process.platform === 'win32' ? p.toLowerCase() : p);
const norm = (p) => path.resolve(p).replace(/\\/g, '/');
const root = norm(projectDir);
const file = norm(target);
if (!fold(file).startsWith(fold(root) + '/')) process.exit(0); // outside this project: not our business
const rel = file.slice(root.length + 1);

let blueprint = '';
try {
  blueprint = fs.readFileSync(path.join(projectDir, BLUEPRINT), 'utf8');
} catch {
  // no blueprint yet
}
const signed = g1Signed(blueprint);

// Only a person signs G1: refuse any edit that would sign it.
if (!signed && fold(rel) === fold(BLUEPRINT)) {
  const next = typeof toolInput.content === 'string' ? toolInput.content : applyEdits(blueprint, toolInput);
  if (g1Signed(next)) {
    deny('Bansat gate G1: only a person can approve the blueprint. Ask the user to fill in the G1 row (approver and date) in docs/BLUEPRINT.md themselves, then continue.');
  }
}

if (signed) process.exit(0);
if (ALLOWED_FILES.some((f) => fold(f) === fold(rel)) || ALLOWED_DIRS.some((d) => fold(rel).startsWith(d))) process.exit(0);

deny(blueprint
  ? `Bansat gate G1: production code is blocked until the blueprint is approved. Finish docs/BLUEPRINT.md, then ask the user to sign the G1 row in its Gate approvals table. Until then you can edit ${ALLOWED_LIST}.`
  : `Bansat gate G1: there is no docs/BLUEPRINT.md yet. Write the blueprint first (run /bansat), then ask the user to sign the G1 row. Until then you can edit ${ALLOWED_LIST}.`);
