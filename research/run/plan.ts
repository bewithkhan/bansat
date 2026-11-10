// The run order for the experiment (research/README.md, "Design"): randomised complete blocks. Each block holds every
// spec in both conditions once, in shuffled order, and the blocks run one after another. So if the model or the service
// drifts over the weeks of running, both conditions meet the drift alike, and a run stopped early still leaves balanced
// blocks. The seed makes the order reproducible; agree it, and write it down, before the first run.
//
// Run IDs are random-looking and say nothing about the spec or condition, so a workspace's name can't tell the agent,
// or a reviewer, which condition it's in.
//
//   node research/run/plan.ts --seed <integer> --reps <n> [--specs s1-waitlist,s2-saas] [--out plan.json]
import { readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const RESEARCH = join(dirname(fileURLToPath(import.meta.url)), '..');
const arg = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? process.argv[i + 1] : undefined;
};

export type Run = { order: number; block: number; run_id: string; spec: string; condition: 'A' | 'B'; rep: number };
export type Plan = { seed: number; reps: number; specs: string[]; runs: Run[] };

// mulberry32: a small, well-known seeded generator, so the same seed gives the same order on any machine.
export function random(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function makePlan(seed: number, reps: number, specs: string[]): Plan {
  if (!Number.isInteger(seed)) throw new Error('--seed must be an integer');
  if (!Number.isInteger(reps) || reps < 1) throw new Error('--reps must be a whole number of at least 1');
  if (!specs.length) throw new Error('no specs');
  const rand = random(seed);
  const ids = new Set<string>();
  const newId = (): string => {
    for (;;) {
      const id = `r${Math.floor(rand() * 0x1000000).toString(16).padStart(6, '0')}`;
      if (ids.has(id)) continue;
      ids.add(id);
      return id;
    }
  };
  const runs: Run[] = [];
  for (let block = 1; block <= reps; block++) {
    const cells = specs.flatMap((spec) => (['A', 'B'] as const).map((condition) => ({ spec, condition })));
    // Fisher–Yates shuffle within the block.
    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }
    for (const c of cells) runs.push({ order: runs.length + 1, block, run_id: newId(), spec: c.spec, condition: c.condition, rep: block });
  }
  return { seed, reps, specs, runs };
}

const allSpecs = (): string[] =>
  readdirSync(join(RESEARCH, 'specs'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => f.replace(/\.md$/, ''))
    .sort();

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const seed = Number(arg('--seed'));
  const reps = Number(arg('--reps'));
  if (arg('--seed') === undefined || arg('--reps') === undefined) {
    console.error('usage: node research/run/plan.ts --seed <integer> --reps <n> [--specs id,id] [--out plan.json]');
    process.exit(2);
  }
  const plan = makePlan(seed, reps, arg('--specs')?.split(',') ?? allSpecs());
  const out = arg('--out');
  if (out) writeFileSync(out, `${JSON.stringify(plan, null, 2)}\n`);
  console.log(`${plan.runs.length} runs: ${plan.specs.length} specs × 2 conditions × ${reps} blocks, seed ${seed}${out ? `, written to ${out}` : ''}\n`);
  console.log('| Order | Block | Run | Spec | Condition |\n|---|---|---|---|---|');
  for (const r of plan.runs) console.log(`| ${r.order} | ${r.block} | ${r.run_id} | ${r.spec} | ${r.condition} |`);
}
