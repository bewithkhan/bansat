// Scores one finished app with every check (research/README.md, "How to score"), and writes:
//   score.json    every check's status, findings and evidence; the totals; blueprint completeness; time and tokens
//   score.md      the same as a short report
//   review.json   a form for the blind reviewer, written once and never overwritten: every needs-review item, the spec's
//                 features to tick, and whether the app built and ran. Score again with --reviews to apply it.
//
//   node research/run/score.ts --app <dir> --spec <id|file> --out <dir>
//        [--static <dir> | --url <url> [--start "<command>"] | --no-dynamic] [--no-block]
//        [--reviews <review.json>] [--run <run.json>] [--transcript <session.jsonl> [--subagents <dir>]]
//
// --static serves a folder of built files; --url uses an app that's already running; --start runs the app's own start
// command first and waits for --url to answer. The run record (--run) supplies the G1 time, which splits time and
// tokens into before and after the blueprint was approved.
import { mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { type Completeness, scoreBlueprint } from '../checks/blueprint.ts';
import { runDynamic } from '../checks/dynamic.ts';
import { CHECKS, type Mapping, type Scored, runStatic } from '../checks/index.ts';
import { type CheckResult, type Spec, type Status, indexApp, loadSpec, result } from '../checks/lib.ts';
import { specFile } from './prepare.ts';
import { type Usage, summariseFiles } from './usage.ts';

const arg = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? process.argv[i + 1] : undefined;
};

// What a reviewer records. A check's review replaces its automated status (and says why); it may resolve a
// needs-review, or correct a wrong automated verdict, and both are counted so the checks' error rate is reported.
export type Review = {
  reviewer?: string;
  checks?: Record<string, { status: Exclude<Status, 'needs-review'>; findings?: number; note: string }>;
  features?: Record<string, boolean | null>;
  builds_and_runs?: boolean | null;
};
export type Totals = {
  applicable: number; // pass + fail + needs review
  pass: number;
  fail: number;
  needsReview: number;
  notApplicable: number;
  passRate: number | null; // pass / applicable, with every needs-review counted as not passed
  passRateUpper: number | null; // (pass + needs review) / applicable: the most it could be once reviewed
  defects: number; // findings behind every fail
};
export type ScoredCheck = { id: string; title: string; kind: 'static' | 'dynamic'; maps: Mapping; automated: CheckResult; reviewed?: { status: Status; findings: number; note: string; changed: boolean } };
export type Score = {
  app: string;
  spec: { id: string; sha256: string; expected_tier: Spec['expected_tier'] };
  run?: { run_id: string; condition: string; rep: number | null };
  scored_at: string;
  checks: ScoredCheck[];
  automated: Totals;
  reviewed?: Totals & { reviewer?: string; corrections: number; unresolved: number };
  features?: { total: number; built: number; unrated: number };
  builds_and_runs?: boolean | null;
  blueprint: Completeness;
  usage?: Usage;
  dynamic?: { base: string; pages: string[]; error?: string; homeHeaders?: Record<string, string> };
};

export function totals(statuses: { status: Status; findings: number }[]): Totals {
  const n = (s: Status): number => statuses.filter((r) => r.status === s).length;
  const applicable = n('pass') + n('fail') + n('needs-review');
  return {
    applicable,
    pass: n('pass'),
    fail: n('fail'),
    needsReview: n('needs-review'),
    notApplicable: n('not-applicable'),
    passRate: applicable ? n('pass') / applicable : null,
    passRateUpper: applicable ? (n('pass') + n('needs-review')) / applicable : null,
    defects: statuses.filter((r) => r.status === 'fail').reduce((sum, r) => sum + r.findings, 0),
  };
}

export async function score(o: {
  app: string;
  spec: string;
  dynamic?: { staticDir?: string; url?: string; start?: string; block?: boolean } | false;
  reviews?: Review;
  run?: { run_id: string; condition: string; rep: number | null; operator?: { g1_signed_at?: string | null } };
  transcript?: string;
  subagents?: string;
}): Promise<Score> {
  const spec = loadSpec(specFile(o.spec));
  const app = indexApp(resolve(o.app));
  const scored: Scored[] = runStatic(app, spec.facts);
  let dynamicInfo: Score['dynamic'];
  for (const c of CHECKS.filter((c) => c.kind === 'dynamic')) scored.push({ ...c, result: result('needs-review', 'Not run: the app was scored without serving it (--no-dynamic). Record whether it builds and runs.', [], 1) });
  if (o.dynamic) {
    const d = await runDynamic({ ...o.dynamic, allow: spec.dynamic.allow, review: spec.dynamic.review, pages: spec.dynamic.pages });
    for (const s of scored) {
      if (s.id === 'no-third-party-before-consent') s.result = d.beforeConsent;
      if (s.id === 'reject-all-honoured') s.result = d.rejectAll;
    }
    dynamicInfo = { base: d.report.base, pages: d.report.pages.map((p) => `${p.path} (${p.error ?? p.status})`), error: d.report.error, homeHeaders: d.report.homeHeaders };
  }

  const checks: ScoredCheck[] = scored.map((s) => {
    const r = o.reviews?.checks?.[s.id];
    const out: ScoredCheck = { id: s.id, title: s.title, kind: s.kind, maps: s.maps, automated: s.result };
    if (r) out.reviewed = { status: r.status, findings: r.status === 'fail' ? (r.findings ?? Math.max(1, s.result.findings)) : 0, note: r.note, changed: s.result.status !== 'needs-review' && s.result.status !== r.status };
    return out;
  });
  const automated = totals(checks.map((c) => c.automated));
  let reviewed: Score['reviewed'];
  if (o.reviews?.checks) {
    const final = checks.map((c) => c.reviewed ?? c.automated);
    reviewed = { ...totals(final), reviewer: o.reviews.reviewer, corrections: checks.filter((c) => c.reviewed?.changed).length, unresolved: final.filter((r) => r.status === 'needs-review').length };
  }
  const features = o.reviews?.features
    ? { total: spec.features.length, built: spec.features.filter((f) => o.reviews!.features![f.id] === true).length, unrated: spec.features.filter((f) => typeof o.reviews!.features![f.id] !== 'boolean').length }
    : undefined;
  const g1 = o.run?.operator?.g1_signed_at ?? undefined;
  return {
    app: resolve(o.app),
    spec: { id: spec.id, sha256: spec.sha256, expected_tier: spec.expected_tier },
    ...(o.run ? { run: { run_id: o.run.run_id, condition: o.run.condition, rep: o.run.rep } } : {}),
    scored_at: new Date().toISOString(),
    checks,
    automated,
    ...(reviewed ? { reviewed } : {}),
    ...(features ? { features } : {}),
    ...(o.reviews && 'builds_and_runs' in o.reviews ? { builds_and_runs: o.reviews.builds_and_runs } : {}),
    blueprint: scoreBlueprint(resolve(o.app), spec),
    ...(o.transcript ? { usage: summariseFiles(o.transcript, o.subagents, g1) } : {}),
    ...(dynamicInfo ? { dynamic: dynamicInfo } : {}),
  };
}

const pct = (x: number | null | undefined): string => (x === null || x === undefined ? 'n/a' : `${Math.round(x * 100)}%`);
const cell = (s: string): string => s.replace(/\|/g, '\\|').replace(/\n/g, ' ');
const minutes = (ms: number): string => `${Math.round(ms / 60_000)} min`;

export function markdown(s: Score): string {
  const lines = [
    `# Score: ${s.run ? `run ${s.run.run_id}` : basename(s.app)} (${s.spec.id})`,
    '',
    `Scored ${s.scored_at} by research/run/score.ts.${s.run ? ` Condition ${s.run.condition}${s.run.rep ? `, repetition ${s.run.rep}` : ''}.` : ''}`,
    '',
    '| | Automated | After review |',
    '|---|---|---|',
    `| Checks passed of applicable | ${s.automated.pass} of ${s.automated.applicable} (${pct(s.automated.passRate)}; up to ${pct(s.automated.passRateUpper)} once reviewed) | ${s.reviewed ? `${s.reviewed.pass} of ${s.reviewed.applicable} (${pct(s.reviewed.passRate)})` : 'not reviewed'} |`,
    `| Failed · needs review · not applicable | ${s.automated.fail} · ${s.automated.needsReview} · ${s.automated.notApplicable} | ${s.reviewed ? `${s.reviewed.fail} · ${s.reviewed.needsReview} · ${s.reviewed.notApplicable}` : ''} |`,
    `| Defects (findings behind the fails) | ${s.automated.defects} | ${s.reviewed ? s.reviewed.defects : ''} |`,
    ...(s.reviewed ? [`| Reviewer corrections to automated verdicts | | ${s.reviewed.corrections} |`] : []),
    ...(s.features ? [`| Features built (reviewer) | | ${s.features.built} of ${s.features.total}${s.features.unrated ? ` (${s.features.unrated} not rated)` : ''} |`] : []),
    ...(s.builds_and_runs !== undefined ? [`| Builds and runs (reviewer) | | ${s.builds_and_runs === null ? 'not rated' : s.builds_and_runs ? 'yes' : 'no'} |`] : []),
    '',
    '## Checks',
    '',
    '| Check | Kind | Status | Findings | Summary | Launch traps · gate |',
    '|---|---|---|---|---|---|',
    ...s.checks.map((c) => {
      const r = c.reviewed ?? c.automated;
      const status = c.reviewed ? `${c.reviewed.status} (reviewed; automated: ${c.automated.status})` : c.automated.status;
      const maps = [c.maps.traps.length ? `traps ${c.maps.traps.join(', ')}` : '', ...c.maps.gate.map((g) => g.split(' ')[0])].filter(Boolean).join(' · ');
      return `| ${c.id} | ${c.kind} | ${r.status === 'fail' ? `**${status}**` : status} | ${r.findings} | ${cell(c.reviewed?.note ?? c.automated.summary)} | ${maps} |`;
    }),
    '',
    '## Evidence for every check that did not pass',
    '',
  ];
  for (const c of s.checks.filter((c) => (c.reviewed ?? c.automated).status !== 'pass' && (c.reviewed ?? c.automated).status !== 'not-applicable')) {
    lines.push(`### ${c.id}`, '', c.automated.summary, '');
    for (const e of c.automated.evidence.slice(0, 12)) lines.push(`- ${[e.file ? `\`${e.file}${e.line ? `:${e.line}` : ''}\`` : '', e.note ?? '', e.text ? `\`${e.text.replace(/`/g, "'")}\`` : ''].filter(Boolean).join(' · ')}`);
    if (c.automated.evidence.length > 12) lines.push(`- … and ${c.automated.evidence.length - 12} more in score.json`);
    lines.push('');
  }
  const b = s.blueprint;
  lines.push('## Blueprint completeness', '');
  if (!b.found) lines.push(`No ${b.file}.`, '');
  else {
    lines.push(
      `${b.satisfied} of ${b.required} rubric items (${pct(b.score)}) for a ${b.expectedTier}-tier project. Stated tier: ${b.statedTier ?? 'not found'}${b.tierMatches === false ? ' (differs from the spec)' : ''}. Placeholders left: ${b.placeholders}. G1 signed: ${b.g1Signed ? 'yes' : 'no'}.`,
      '',
    );
    const missing = b.items.filter((i) => !i.ok);
    if (missing.length) lines.push(`Missing: ${missing.map((i) => i.label).join('; ')}.`, '');
  }
  if (s.usage) {
    const u = s.usage;
    lines.push('## Time and tokens', '', `Active ${minutes(u.active_ms)}, wall clock ${minutes(u.wall_ms)}; ${u.operator_messages} operator messages; ${u.tokens.total.toLocaleString('en-GB')} tokens (${u.tokens.output.toLocaleString('en-GB')} output). Models: ${u.models.join(', ') || 'unknown'}. Skill used: ${u.skill.used ? 'yes' : 'no'}.`, '');
    if (u.phases) lines.push(`Before G1 (${u.phases.split_at}): ${minutes(u.phases.before.active_ms)}, ${u.phases.before.total.toLocaleString('en-GB')} tokens. After: ${minutes(u.phases.after.active_ms)}, ${u.phases.after.total.toLocaleString('en-GB')} tokens.`, '');
  }
  if (s.dynamic) lines.push('## Dynamic run', '', `Served at ${s.dynamic.base || 'nothing'}; pages: ${s.dynamic.pages.join(', ') || 'none'}${s.dynamic.error ? `; error: ${s.dynamic.error}` : ''}.`, '');
  return `${lines.join('\n').trimEnd()}\n`;
}

// The reviewer's form: every needs-review item (with the evidence to judge it), and the spec's features.
export function reviewForm(s: Score, spec: Spec): Review & { instructions: string; items: Record<string, { summary: string; evidence: string[] }> } {
  const open = s.checks.filter((c) => c.automated.status === 'needs-review');
  return {
    instructions:
      'Judge each item from the app alone, without knowing its condition (README, "How to score"). For each check, set status to pass, fail or not-applicable with a one-line note, and findings for a fail. You may also correct an automated verdict you are sure is wrong: add it under checks with a note. Tick each feature true or false, and say whether the app built and ran.',
    reviewer: '',
    items: Object.fromEntries(open.map((c) => [c.id, { summary: c.automated.summary, evidence: c.automated.evidence.slice(0, 8).map((e) => [e.file && `${e.file}${e.line ? `:${e.line}` : ''}`, e.note, e.text].filter(Boolean).join(' · ')) }])),
    checks: {},
    features: Object.fromEntries(spec.features.map((f) => [f.id, null])),
    builds_and_runs: null,
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const app = arg('--app');
  const specId = arg('--spec');
  const out = arg('--out');
  if (!app || !specId || !out) {
    console.error('usage: node research/run/score.ts --app <dir> --spec <id|file> --out <dir> [--static <dir> | --url <url> [--start "<cmd>"] | --no-dynamic] [--no-block] [--reviews <file>] [--run <run.json>] [--transcript <file>]');
    process.exit(2);
  }
  const noDynamic = process.argv.includes('--no-dynamic');
  if (!noDynamic && !arg('--static') && !arg('--url')) {
    console.error('Give --static <dir> or --url <url> to serve the app for the dynamic checks, or --no-dynamic to skip them.');
    process.exit(2);
  }
  try {
    const run = arg('--run') ? JSON.parse(readFileSync(arg('--run')!, 'utf8')) : undefined;
    const reviews = arg('--reviews') ? (JSON.parse(readFileSync(arg('--reviews')!, 'utf8')) as Review) : undefined;
    const s = await score({
      app,
      spec: specId,
      dynamic: noDynamic ? false : { staticDir: arg('--static'), url: arg('--url'), start: arg('--start'), block: !process.argv.includes('--no-block') },
      reviews,
      run,
      transcript: arg('--transcript'),
      subagents: arg('--subagents'),
    });
    mkdirSync(out, { recursive: true });
    writeFileSync(join(out, 'score.json'), `${JSON.stringify(s, null, 2)}\n`);
    writeFileSync(join(out, 'score.md'), markdown(s));
    const form = join(out, 'review.json');
    if (!existsSync(form)) writeFileSync(form, `${JSON.stringify(reviewForm(s, loadSpec(specFile(specId))), null, 2)}\n`);
    const t = s.reviewed ?? s.automated;
    console.log(`${s.spec.id}: ${t.pass} of ${t.applicable} applicable checks passed, ${t.fail} failed (${t.defects} defects), ${t.needsReview} need review. Written to ${out}.`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
