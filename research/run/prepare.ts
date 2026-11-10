// Prepares one run of the experiment (research/README.md, "How to run"): an empty project folder for the agent, and a
// record of the run kept somewhere else.
//
//   <out>/workspaces/<run-id>/   where the agent works. A git repository with one commit. In condition B it holds the
//                                Bansat skill at .claude/skills/bansat/, installed the way the README tells a team to
//                                (a copy of a pinned release, committed to the repo). In condition A it's empty.
//   <out>/records/<run-id>/      prompt.md (the spec's brief, word for word: what the operator pastes), run.json (what
//                                was prepared, plus fields the operator fills in) and an empty transcripts/ folder.
//
// The record lives outside the workspace, so nothing the agent can see names the condition or the experiment. The
// skill is copied from a git ref with `git archive`, so it's exactly that release; research/ and paper/ are removed
// from the copy, so a later release can't hand the agent the checks it's scored by.
//
//   node research/run/prepare.ts --spec <id> --condition A|B --out <dir> [--run-id <id>] [--rep <n>] [--skill-ref <ref>]
//   node research/run/prepare.ts --plan plan.json --run <run-id> --out <dir> [--skill-ref <ref>]
// --skill-ref is required for condition B: the release tag the co-authors agreed (for example v2.4.0).
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSpec } from '../checks/lib.ts';
import type { Plan } from './plan.ts';

const RESEARCH = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPO = join(RESEARCH, '..');
const arg = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? process.argv[i + 1] : undefined;
};
// Folders never installed with the skill: the experiment itself and the paper about it.
export const EXCLUDED = ['research', 'paper'];

const git = (args: string[], cwd: string, input?: Buffer): { status: number | null; out: string; buf: Buffer } => {
  const r = spawnSync('git', args, { cwd, input, maxBuffer: 512 * 1024 * 1024 });
  return { status: r.status, out: `${r.stdout?.toString() ?? ''}${r.stderr?.toString() ?? ''}`.trim(), buf: r.stdout ?? Buffer.alloc(0) };
};
const must = (r: { status: number | null; out: string }, what: string): string => {
  if (r.status !== 0) throw new Error(`${what} failed: ${r.out}`);
  return r.out;
};
export const specFile = (id: string): string => (existsSync(id) ? resolve(id) : join(RESEARCH, 'specs', `${id}.md`));

// Copies the skill at `ref` into `dest`, minus EXCLUDED. Returns the commit it came from.
export function installSkill(ref: string, dest: string): string {
  const commit = must(git(['rev-parse', '--verify', `${ref}^{commit}`], REPO), `resolving ${ref}`);
  const archive = git(['archive', '--format=tar', commit], REPO);
  if (archive.status !== 0) throw new Error(`git archive ${ref} failed: ${archive.out}`);
  mkdirSync(dest, { recursive: true });
  const tar = spawnSync('tar', ['-x', '-C', dest], { input: archive.buf, maxBuffer: 64 * 1024 * 1024 });
  if (tar.status !== 0) throw new Error(`unpacking the skill failed: ${tar.stderr?.toString()}`);
  for (const dir of EXCLUDED) rmSync(join(dest, dir), { recursive: true, force: true });
  if (!existsSync(join(dest, 'SKILL.md'))) throw new Error(`${ref} has no SKILL.md at its root, so it isn't a Bansat release`);
  return commit;
}

// Things on this machine that could leak Bansat, or other instructions, into a run. Claude Code reads the user's own
// skills and CLAUDE.md in every project, so a run must start from a clean profile (README, "Threats to validity").
export function contamination(): string[] {
  const warnings: string[] = [];
  const configDirs = [process.env.CLAUDE_CONFIG_DIR, join(homedir(), '.claude')].filter(Boolean) as string[];
  for (const dir of configDirs) {
    if (existsSync(join(dir, 'CLAUDE.md'))) warnings.push(`${join(dir, 'CLAUDE.md')} exists: user-level instructions reach every run`);
    const skills = join(dir, 'skills');
    if (existsSync(skills) && readdirSync(skills).length) warnings.push(`${skills} holds skills (${readdirSync(skills).join(', ')}): they reach every run, in both conditions`);
  }
  return warnings;
}

export type RunRecord = {
  run_id: string;
  spec: { id: string; file: string; sha256: string };
  condition: 'A' | 'B';
  rep: number | null;
  skill: { ref: string; commit: string; excluded: string[] } | null;
  harness: { commit: string; uncommitted_changes: boolean };
  created_at: string;
  workspace: string;
  warnings: string[];
  // Filled in by the operator (research/run/OPERATOR.md).
  operator: { model: string | null; claude_code_version: string | null; permission_mode: string | null; started_at: string | null; g1_signed_at: string | null; finished_at: string | null; ended_because: string | null; messages: { at: string; text: string }[]; notes: string };
};

export function prepare(o: { spec: string; condition: 'A' | 'B'; out: string; runId?: string; rep?: number; skillRef?: string; force?: boolean }): RunRecord {
  if (o.condition !== 'A' && o.condition !== 'B') throw new Error('--condition must be A (without Bansat) or B (with Bansat)');
  if (o.condition === 'B' && !o.skillRef) throw new Error('condition B needs --skill-ref, the Bansat release to install (for example v2.4.0)');
  const out = resolve(o.out);
  // A workspace inside this repository could read research/checks. Refuse.
  const rel = relative(resolve(REPO), out);
  if (!rel.startsWith('..') && !rel.startsWith(sep) && rel !== out) throw new Error(`--out must be outside the Bansat repository (${REPO}), so the agent can't reach the checks`);
  const spec = loadSpec(specFile(o.spec));
  const runId = o.runId ?? `r${randomBytes(3).toString('hex')}`;
  const workspace = join(out, 'workspaces', runId);
  const records = join(out, 'records', runId);
  for (const dir of [workspace, records]) {
    if (existsSync(dir) && !o.force) throw new Error(`${dir} already exists (use --force to replace it)`);
    rmSync(dir, { recursive: true, force: true });
  }
  mkdirSync(workspace, { recursive: true });
  mkdirSync(join(records, 'transcripts'), { recursive: true });

  // A git repository with a neutral identity, so commits work the same way in both conditions.
  must(git(['init', '-q', '-b', 'main'], workspace), 'git init');
  must(git(['config', 'user.name', 'Builder'], workspace), 'git config');
  must(git(['config', 'user.email', 'builder@example.invalid'], workspace), 'git config');
  let skill: RunRecord['skill'] = null;
  if (o.condition === 'B') {
    const commit = installSkill(o.skillRef!, join(workspace, '.claude', 'skills', 'bansat'));
    skill = { ref: o.skillRef!, commit, excluded: EXCLUDED };
    must(git(['add', '-A'], workspace), 'git add');
  }
  must(git(['-c', 'commit.gpgsign=false', 'commit', '-q', '--allow-empty', '-m', 'Initial commit'], workspace), 'git commit');

  const head = git(['rev-parse', 'HEAD'], REPO);
  const dirty = git(['status', '--porcelain', '--', 'research'], REPO);
  const record: RunRecord = {
    run_id: runId,
    spec: { id: spec.id, file: relative(REPO, spec.file), sha256: spec.sha256 },
    condition: o.condition,
    rep: o.rep ?? null,
    skill,
    harness: { commit: head.status === 0 ? head.out : 'unknown', uncommitted_changes: dirty.status === 0 ? dirty.out.length > 0 : true },
    created_at: new Date().toISOString(),
    workspace,
    warnings: contamination(),
    operator: { model: null, claude_code_version: null, permission_mode: null, started_at: null, g1_signed_at: null, finished_at: null, ended_because: null, messages: [], notes: '' },
  };
  writeFileSync(join(records, 'prompt.md'), spec.prompt);
  writeFileSync(join(records, 'run.json'), `${JSON.stringify(record, null, 2)}\n`);
  return record;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    let spec = arg('--spec');
    let condition = arg('--condition') as 'A' | 'B' | undefined;
    let runId = arg('--run-id');
    let rep = arg('--rep') ? Number(arg('--rep')) : undefined;
    if (arg('--plan')) {
      const plan = JSON.parse(readFileSync(arg('--plan')!, 'utf8')) as Plan;
      const run = plan.runs.find((r) => r.run_id === arg('--run'));
      if (!run) throw new Error(`no run ${arg('--run')} in ${arg('--plan')}`);
      ({ spec, condition, run_id: runId, rep } = run);
    }
    const out = arg('--out');
    if (!spec || !condition || !out) throw new Error('usage: node research/run/prepare.ts --spec <id> --condition A|B --out <dir> [--skill-ref <ref>], or --plan <file> --run <id> --out <dir>');
    const r = prepare({ spec, condition, out, runId, rep, skillRef: arg('--skill-ref'), force: process.argv.includes('--force') });
    console.log(`Prepared ${r.run_id}: ${r.spec.id}, condition ${r.condition}${r.skill ? `, Bansat ${r.skill.ref} (${r.skill.commit.slice(0, 12)})` : ''}`);
    console.log(`  workspace  ${r.workspace}`);
    console.log(`  record     ${join(resolve(out), 'records', r.run_id)}`);
    for (const w of r.warnings) console.log(`  WARNING    ${w}`);
    console.log('Next: run the agent in the workspace by hand (research/run/OPERATOR.md), then score it with research/run/score.ts.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
