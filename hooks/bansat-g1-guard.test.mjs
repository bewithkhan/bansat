// Tests for the Bansat G1 guard hook. No dependencies: run with `node hooks/bansat-g1-guard.test.mjs`.
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOOK = path.join(path.dirname(fileURLToPath(import.meta.url)), 'bansat-g1-guard.mjs');

const TABLE = (g1) => `# Blueprint\n\n**Gate approvals**\n\n| Gate | Approver | Date | Notes |\n|---|---|---|---|\n${g1}\n| G2 Data-ready | | | |\n`;
const UNSIGNED = TABLE('| G1 Blueprint approved | | | |');
const SIGNED = TABLE('| G1 Blueprint approved | Muhammad Tufail Khan | 2026-11-05 | |');
const PLACEHOLDER = TABLE('| G1 Blueprint approved | {{NAME}} | 2026-11-05 | |');

function project(blueprint) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bansat-g1-'));
  if (blueprint !== null) {
    fs.mkdirSync(path.join(dir, 'docs'));
    fs.writeFileSync(path.join(dir, 'docs', 'BLUEPRINT.md'), blueprint);
  }
  return dir;
}

function run(dir, toolName, toolInput, raw) {
  const payload = raw ?? JSON.stringify({ hook_event_name: 'PreToolUse', cwd: dir, tool_name: toolName, tool_input: toolInput });
  const r = spawnSync(process.execPath, [HOOK], { input: payload, env: { ...process.env, CLAUDE_PROJECT_DIR: dir }, encoding: 'utf8' });
  if (r.status !== 0) return { decision: `exit ${r.status}`, reason: r.stderr };
  if (!r.stdout.trim()) return { decision: 'allow' };
  const out = JSON.parse(r.stdout).hookSpecificOutput;
  return { decision: out.permissionDecision, reason: out.permissionDecisionReason };
}

const cases = [
  ['no blueprint: code is refused', null, 'Write', (d) => ({ file_path: path.join(d, 'src/app.ts'), content: 'x' }), 'deny', /no docs\/BLUEPRINT\.md yet/],
  ['no blueprint: writing the blueprint is allowed', null, 'Write', (d) => ({ file_path: path.join(d, 'docs/BLUEPRINT.md'), content: UNSIGNED }), 'allow'],
  ['unsigned: Write to code is refused', UNSIGNED, 'Write', (d) => ({ file_path: path.join(d, 'src/app.ts'), content: 'x' }), 'deny', /blocked until the blueprint is approved/],
  ['unsigned: Edit to code is refused', UNSIGNED, 'Edit', (d) => ({ file_path: path.join(d, 'app/models/User.php'), old_string: 'a', new_string: 'b' }), 'deny'],
  ['unsigned: NotebookEdit is refused', UNSIGNED, 'NotebookEdit', (d) => ({ notebook_path: path.join(d, 'analysis.ipynb'), new_source: 'x' }), 'deny'],
  ['unsigned: spikes/ is allowed', UNSIGNED, 'Write', (d) => ({ file_path: path.join(d, 'spikes/try.ts'), content: 'x' }), 'allow'],
  ['unsigned: CLAUDE.md is allowed', UNSIGNED, 'Edit', (d) => ({ file_path: path.join(d, 'CLAUDE.md'), old_string: 'a', new_string: 'b' }), 'allow'],
  ['unsigned: editing the blueprint is allowed', UNSIGNED, 'Edit', (d) => ({ file_path: path.join(d, 'docs/BLUEPRINT.md'), old_string: '# Blueprint', new_string: '# Blueprint v2' }), 'allow'],
  ['unsigned: files outside the project are ignored', UNSIGNED, 'Write', () => ({ file_path: path.join(os.tmpdir(), 'elsewhere.ts'), content: 'x' }), 'allow'],
  ['Claude signing G1 with Edit is refused', UNSIGNED, 'Edit', (d) => ({ file_path: path.join(d, 'docs/BLUEPRINT.md'), old_string: '| G1 Blueprint approved | | | |', new_string: '| G1 Blueprint approved | Claude | 2026-11-05 | |' }), 'deny', /only a person can approve/],
  ['Claude signing G1 with Write is refused', UNSIGNED, 'Write', (d) => ({ file_path: path.join(d, 'docs/BLUEPRINT.md'), content: SIGNED }), 'deny', /only a person can approve/],
  ['Claude signing G1 with MultiEdit is refused', UNSIGNED, 'MultiEdit', (d) => ({ file_path: path.join(d, 'docs/BLUEPRINT.md'), edits: [{ old_string: '| G1 Blueprint approved | | | |', new_string: '| G1 Blueprint approved | Me | 2026-11-05 | |' }] }), 'deny'],
  ['a {{placeholder}} approver does not count', PLACEHOLDER, 'Write', (d) => ({ file_path: path.join(d, 'src/app.ts'), content: 'x' }), 'deny'],
  ['signed: code is allowed', SIGNED, 'Write', (d) => ({ file_path: path.join(d, 'src/app.ts'), content: 'x' }), 'allow'],
  ['signed: blueprint edits are allowed', SIGNED, 'Edit', (d) => ({ file_path: path.join(d, 'docs/BLUEPRINT.md'), old_string: '# Blueprint', new_string: '# Blueprint v2' }), 'allow'],
];

let failed = 0;
for (const [name, blueprint, tool, input, expected, reasonRe] of cases) {
  const dir = project(blueprint);
  const got = run(dir, tool, input(dir));
  const ok = got.decision === expected && (!reasonRe || reasonRe.test(got.reason ?? ''));
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (got ${got.decision}: ${got.reason ?? ''})`}`);
  fs.rmSync(dir, { recursive: true, force: true });
}
const garbled = run(project(UNSIGNED), 'Write', null, 'not json');
const okGarbled = garbled.decision === 'allow';
if (!okGarbled) failed++;
console.log(`${okGarbled ? 'PASS' : 'FAIL'}  unreadable input makes no decision`);

console.log(failed ? `\n${failed} test(s) failed` : `\nAll ${cases.length + 1} tests passed`);
process.exit(failed ? 1 : 0);
