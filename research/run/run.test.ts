// Tests for the run scripts (research/run): the plan is reproducible and balanced; prepare builds the two conditions so
// they differ only by the skill, never inside this repository and never with the checks in reach; score writes its
// reports and applies a review; usage reads a transcript the way its header says. Nothing here runs an agent.
//   node research/run/run.test.ts
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { loadSpec } from '../checks/lib.ts';
import { makePlan } from './plan.ts';
import { prepare } from './prepare.ts';
import { type Review, markdown, score, totals } from './score.ts';
import { operatorUsage, summarise } from './usage.ts';

const RUN = dirname(fileURLToPath(import.meta.url));
const RESEARCH = join(RUN, '..');
const REPO = join(RESEARCH, '..');
const FIXTURES = join(RESEARCH, 'fixtures');
const temp = mkdtempSync(join(tmpdir(), 'bansat-run-'));
after(() => rmSync(temp, { recursive: true, force: true }));
const node = (script: string, args: string[]) => spawnSync(process.execPath, [join(RUN, script), ...args], { encoding: 'utf8' });
const git = (cwd: string, ...args: string[]) => spawnSync('git', args, { cwd, encoding: 'utf8' }).stdout.trim();

describe('plan', () => {
  const specs = ['s1', 's2', 's3'];
  test('the same seed gives the same order, and another seed a different one', () => {
    assert.deepEqual(makePlan(42, 3, specs), makePlan(42, 3, specs));
    assert.notDeepEqual(makePlan(42, 3, specs).runs.map((r) => r.spec + r.condition), makePlan(43, 3, specs).runs.map((r) => r.spec + r.condition));
  });
  test('every block holds each spec in both conditions exactly once, and run ids are unique and opaque', () => {
    const plan = makePlan(7, 4, specs);
    assert.equal(plan.runs.length, 3 * 2 * 4);
    for (let b = 1; b <= 4; b++) {
      const cells = plan.runs.filter((r) => r.block === b).map((r) => `${r.spec}:${r.condition}`).sort();
      assert.deepEqual(cells, specs.flatMap((s) => [`${s}:A`, `${s}:B`]).sort());
    }
    assert.equal(new Set(plan.runs.map((r) => r.run_id)).size, plan.runs.length);
    for (const r of plan.runs) assert.match(r.run_id, /^r[0-9a-f]{6}$/);
  });
  test('the command line writes the plan and refuses a missing seed', () => {
    const out = join(temp, 'plan.json');
    assert.equal(node('plan.ts', ['--seed', '1', '--reps', '2', '--out', out]).status, 0);
    assert.equal(JSON.parse(readFileSync(out, 'utf8')).runs.length, 6 * 2 * 2);
    assert.equal(node('plan.ts', ['--reps', '2']).status, 2);
  });
});

describe('prepare', () => {
  const out = join(temp, 'runs');
  const a = prepare({ spec: 's1-waitlist', condition: 'A', out, runId: 'raaaaaa', rep: 1 });
  const b = prepare({ spec: 's1-waitlist', condition: 'B', out, runId: 'rbbbbbb', rep: 1, skillRef: 'HEAD' });
  const files = (dir: string) => readdirSync(dir).filter((f) => f !== '.git');

  test('condition A is an empty git repository with one commit', () => {
    assert.deepEqual(files(a.workspace), []);
    assert.equal(git(a.workspace, 'rev-list', '--count', 'HEAD'), '1');
    assert.equal(a.skill, null);
  });
  test('condition B differs only by the skill, from the pinned commit, committed to the repository', () => {
    assert.deepEqual(files(b.workspace), ['.claude']);
    assert.ok(existsSync(join(b.workspace, '.claude/skills/bansat/SKILL.md')));
    assert.ok(existsSync(join(b.workspace, '.claude/skills/bansat/framework/09-privacy.md')));
    assert.equal(b.skill?.commit, git(REPO, 'rev-parse', 'HEAD'));
    assert.equal(git(b.workspace, 'status', '--porcelain'), '', 'the skill is committed');
  });
  test('another agent gets the skill where it reads skills, and a warning to check its profile by hand', () => {
    const c = prepare({ spec: join(FIXTURES, 'fixture-spec.md'), condition: 'B', out: join(temp, 'other-agent'), skillRef: 'HEAD', agent: 'other-agent', skillDir: '.agents/skills/bansat' });
    assert.ok(existsSync(join(c.workspace, '.agents/skills/bansat/SKILL.md')));
    assert.ok(!existsSync(join(c.workspace, '.claude')));
    assert.deepEqual(c.agent, { id: 'other-agent', skill_dir: '.agents/skills/bansat' });
    assert.ok(c.warnings.some((w) => /check by hand/.test(w)));
    assert.throws(() => prepare({ spec: join(FIXTURES, 'fixture-spec.md'), condition: 'B', out: join(temp, 'other-agent-2'), skillRef: 'HEAD', agent: 'other-agent' }), /--skill-dir/);
    assert.throws(() => prepare({ spec: join(FIXTURES, 'fixture-spec.md'), condition: 'B', out: join(temp, 'other-agent-3'), skillRef: 'HEAD', agent: 'other-agent', skillDir: '../outside' }), /inside the workspace/);
  });
  test('the installed skill never contains the experiment or the paper', () => {
    for (const dir of ['research', 'paper']) assert.ok(!existsSync(join(b.workspace, '.claude/skills/bansat', dir)), dir);
  });
  test('the record sits outside the workspace, with the prompt word for word and nothing scored', () => {
    const record = join(out, 'records', 'rbbbbbb');
    assert.ok(!record.startsWith(b.workspace));
    const prompt = readFileSync(join(record, 'prompt.md'), 'utf8');
    assert.equal(prompt, loadSpec(join(RESEARCH, 'specs/s1-waitlist.md')).prompt);
    assert.doesNotMatch(prompt, /^---|expected_tier|facts:/m);
    const run = JSON.parse(readFileSync(join(record, 'run.json'), 'utf8'));
    assert.equal(run.condition, 'B');
    assert.equal(run.spec.sha256, loadSpec(join(RESEARCH, 'specs/s1-waitlist.md')).sha256);
    assert.ok(existsSync(join(record, 'transcripts')));
  });
  test('refuses B without a release, a workspace inside this repository, and an existing run', () => {
    assert.throws(() => prepare({ spec: 's1-waitlist', condition: 'B', out }), /--skill-ref/);
    assert.throws(() => prepare({ spec: 's1-waitlist', condition: 'A', out: join(RESEARCH, 'tmp-runs') }), /outside the Bansat repository/);
    assert.throws(() => prepare({ spec: 's1-waitlist', condition: 'A', out, runId: 'raaaaaa' }), /already exists/);
  });
  test('the command line takes a run from a plan', () => {
    const plan = makePlan(5, 1, ['s2-saas']);
    writeFileSync(join(temp, 'p.json'), JSON.stringify(plan));
    const run = plan.runs.find((r) => r.condition === 'A')!;
    const r = node('prepare.ts', ['--plan', join(temp, 'p.json'), '--run', run.run_id, '--out', out]);
    assert.equal(r.status, 0, r.stderr);
    assert.equal(JSON.parse(readFileSync(join(out, 'records', run.run_id, 'run.json'), 'utf8')).spec.id, 's2-saas');
  });
});

describe('score', () => {
  test('counts needs review as applicable, and gives the range a review could move it in', () => {
    const t = totals([{ status: 'pass', findings: 0 }, { status: 'fail', findings: 3 }, { status: 'needs-review', findings: 1 }, { status: 'not-applicable', findings: 0 }]);
    assert.deepEqual([t.applicable, t.passRate, t.passRateUpper, t.defects], [3, 1 / 3, 2 / 3, 3]);
  });
  test('scores the good fixture through the command line, serving its build, and writes the reports', () => {
    const out = join(temp, 'score-good');
    const r = node('score.ts', ['--app', join(FIXTURES, 'good-app'), '--spec', join(FIXTURES, 'fixture-spec.md'), '--static', join(FIXTURES, 'good-app/dist'), '--out', out]);
    assert.equal(r.status, 0, r.stderr);
    const s = JSON.parse(readFileSync(join(out, 'score.json'), 'utf8'));
    assert.deepEqual([s.automated.pass, s.automated.applicable, s.automated.defects], [16, 16, 0]);
    assert.equal(s.blueprint.score, 1);
    assert.match(readFileSync(join(out, 'score.md'), 'utf8'), /16 of 16/);
    assert.ok(existsSync(join(out, 'review.json')));
  });
  test('applies a review: resolving needs review, correcting a verdict, and rating features', async () => {
    const reviews: Review = {
      reviewer: 'R1',
      checks: { 'rls-every-table': { status: 'pass', note: 'fixture: pretend the reviewer disagreed' }, 'no-third-party-before-consent': { status: 'fail', findings: 2, note: 'two hosts seen by hand' } },
      features: { F1: true, F2: false },
      builds_and_runs: false,
    };
    const s = await score({ app: join(FIXTURES, 'bad-app'), spec: join(FIXTURES, 'fixture-spec.md'), dynamic: false, reviews, run: { run_id: 'rtest01', condition: 'A', rep: 1 } });
    assert.equal(s.automated.needsReview, 2, 'without serving the app, both dynamic checks need review');
    assert.equal(s.reviewed!.corrections, 1, 'rls-every-table was a fail, so passing it is a correction');
    assert.equal(s.reviewed!.unresolved, 1, 'reject-all-honoured is still open');
    assert.equal(s.reviewed!.pass, 1);
    assert.deepEqual(s.features, { total: 2, built: 1, unrated: 0 });
    assert.equal(s.builds_and_runs, false);
    assert.match(markdown(s), /Reviewer corrections to automated verdicts \| \| 1/);
  });
  test('refuses to score without a way to serve the app, unless --no-dynamic', () => {
    assert.equal(node('score.ts', ['--app', join(FIXTURES, 'bad-app'), '--spec', 's1-waitlist', '--out', join(temp, 'x')]).status, 2);
    assert.equal(node('score.ts', ['--app', join(FIXTURES, 'bad-app'), '--spec', 's1-waitlist', '--out', join(temp, 'x'), '--no-dynamic']).status, 0);
  });
});

describe('usage', () => {
  test('usage typed in by the operator, for an agent with no transcript reader', () => {
    const file = join(temp, 'usage.json');
    writeFileSync(file, JSON.stringify({ wall_ms: 3_600_000, tokens: { input: 1000, output: 500 }, models: ['model-y'], skill_used: true }));
    const u = operatorUsage(file);
    assert.deepEqual([u.source, u.tokens.total, u.wall_ms, u.active_ms, u.skill.used], ['operator', 1500, 3_600_000, 3_600_000, true]);
    writeFileSync(file, JSON.stringify({ tokens: { input: 1 } }));
    assert.throws(() => operatorUsage(file), /wall_ms/);
  });
  const t0 = Date.parse('2026-12-01T10:00:00Z');
  const at = (s: number) => new Date(t0 + s * 1000).toISOString();
  const line = (o: object) => JSON.stringify(o);
  const main = [
    line({ type: 'user', timestamp: at(0), version: '9.9.9', message: { role: 'user', content: 'Build the app' } }),
    line({ type: 'assistant', timestamp: at(1), message: { id: 'm1', model: 'model-x', usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100 }, content: [{ type: 'tool_use', name: 'Skill', input: { skill: 'bansat' } }] } }),
    // The same API response, split over a second entry with the same usage: counted once.
    line({ type: 'assistant', timestamp: at(2), message: { id: 'm1', model: 'model-x', usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100 }, content: [{ type: 'text', text: 'ok' }] } }),
    line({ type: 'user', timestamp: at(3), message: { role: 'user', content: [{ type: 'tool_result', content: 'done' }] } }),
    line({ type: 'assistant', timestamp: at(10), message: { id: 'm2', model: 'model-x', usage: { input_tokens: 1, output_tokens: 20 }, content: [] } }),
    line({ type: 'user', timestamp: at(60), message: { role: 'user', content: 'Approved' } }),
    line({ type: 'user', timestamp: at(61), isMeta: true, message: { role: 'user', content: 'a system note, not the operator' } }),
    line({ type: 'assistant', timestamp: at(70), message: { id: 'm3', model: 'model-x', usage: { output_tokens: 30 }, content: [] } }),
    '{"type":"assistant","timestamp":', // a line still being written
  ].join('\n');
  const sub = line({ type: 'assistant', timestamp: at(65), message: { id: 's1', usage: { output_tokens: 7 } } });

  test('counts each message once, adds subagents, and times the agent between operator messages', () => {
    const u = summarise(main, [sub]);
    assert.equal(u.tokens.output, 5 + 20 + 30 + 7);
    assert.equal(u.tokens.cache_read, 100);
    assert.equal(u.assistant_messages, 4);
    assert.equal(u.operator_messages, 2);
    assert.equal(u.active_ms, 20_000, 'from 0 s to 10 s, then from 60 s to 70 s');
    assert.equal(u.wall_ms, 70_000);
    assert.deepEqual(u.models, ['model-x']);
    assert.deepEqual(u.claude_code_versions, ['9.9.9']);
    assert.equal(u.skill.used, true);
  });
  test('splits tokens and time at G1', () => {
    const u = summarise(main, [sub], at(30));
    assert.equal(u.phases!.before.output, 25);
    assert.equal(u.phases!.after.output, 37);
    assert.equal(u.phases!.before.active_ms, 10_000);
    assert.equal(u.phases!.after.active_ms, 10_000);
  });
  test('reports the skill as unused when the agent never touched it', () => assert.equal(summarise(line({ type: 'user', timestamp: at(0), message: { content: 'hi' } })).skill.used, false));
});
