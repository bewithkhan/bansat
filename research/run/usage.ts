// Time and tokens for one run, from the Claude Code session transcript (research/README.md, metric M3), and the
// manipulation check: did the agent actually use the Bansat skill?
//
// Claude Code keeps each session as JSON Lines under ~/.claude/projects/<folder>/<session>.jsonl, with subagents in
// <session>/subagents/*.jsonl. That format is Claude Code's own and isn't a published interface, so this reads only a
// few fields and says what it assumed:
//   - an assistant entry has message.id, message.model, message.usage and a timestamp. One API response can span
//     several entries that repeat the same usage, so usage is counted once per message.id;
//   - a user entry whose content holds no tool_result block, and isn't marked isMeta, is a message from the operator;
//   - the skill counts as used if the agent called the Skill tool for "bansat", or read its SKILL.md.
// During the pilot, check its totals against Claude Code's own /cost for a few runs (OPERATOR.md).
//
//   node research/run/usage.ts --transcript <session.jsonl> [--subagents <dir>] [--split-at <ISO time>] [--out usage.json]
// --split-at divides the run into "before" and "after" a moment: the time G1 was signed, for condition B.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const arg = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? process.argv[i + 1] : undefined;
};

export type Tokens = { input: number; output: number; cache_creation: number; cache_read: number; total: number };
export type Usage = {
  files: number;
  models: string[];
  claude_code_versions: string[];
  operator_messages: number;
  assistant_messages: number;
  tokens: Tokens;
  phases?: { before: Tokens & { active_ms: number }; after: Tokens & { active_ms: number }; split_at: string };
  active_ms: number; // from each operator message to the agent's last entry before the next one: the agent's working time
  wall_ms: number; // from the first operator message to the last entry
  skill: { used: boolean; evidence: string[] };
};

type Entry = { type?: string; timestamp?: string; isMeta?: boolean; isSidechain?: boolean; version?: string; requestId?: string; uuid?: string; message?: { id?: string; model?: string; role?: string; content?: unknown; usage?: Record<string, number> } };

const zero = (): Tokens => ({ input: 0, output: 0, cache_creation: 0, cache_read: 0, total: 0 });
const add = (t: Tokens, u: Record<string, number> = {}): void => {
  t.input += u.input_tokens ?? 0;
  t.output += u.output_tokens ?? 0;
  t.cache_creation += u.cache_creation_input_tokens ?? 0;
  t.cache_read += u.cache_read_input_tokens ?? 0;
  t.total = t.input + t.output + t.cache_creation + t.cache_read;
};
const blocks = (content: unknown): { type?: string; name?: string; input?: Record<string, unknown> }[] => (Array.isArray(content) ? content : []);

const parse = (text: string): Entry[] =>
  text
    .split('\n')
    .filter((l) => l.trim())
    .flatMap((l) => {
      try {
        return [JSON.parse(l) as Entry];
      } catch {
        return []; // a partly written last line
      }
    });

// main: the session's own entries. subagents: each subagent transcript's entries (their time counts inside the main
// session's turns already, so only their tokens are added).
export function summarise(main: string, subagents: string[] = [], splitAt?: string): Usage {
  const entries = parse(main);
  const split = splitAt ? Date.parse(splitAt) : undefined;
  if (splitAt && Number.isNaN(split)) throw new Error(`--split-at ${splitAt} isn't a date and time`);
  const tokens = zero();
  const before = { ...zero(), active_ms: 0 };
  const after = { ...zero(), active_ms: 0 };
  const models = new Set<string>();
  const versions = new Set<string>();
  const evidence: string[] = [];
  const seen = new Set<string>();
  let assistant = 0;

  const count = (e: Entry): void => {
    const id = e.message?.id ?? e.requestId ?? e.uuid;
    if (!id || seen.has(id) || !e.message?.usage) return;
    seen.add(id);
    assistant++;
    add(tokens, e.message.usage);
    if (split !== undefined && e.timestamp) add(Date.parse(e.timestamp) < split ? before : after, e.message.usage);
    if (e.message.model) models.add(e.message.model);
  };

  // Turns: an operator message starts one; it lasts until the last entry before the next operator message.
  const times: { at: number; operator: boolean }[] = [];
  for (const e of entries) {
    if (e.version) versions.add(e.version);
    const at = e.timestamp ? Date.parse(e.timestamp) : NaN;
    if (e.type === 'assistant') {
      count(e);
      for (const b of blocks(e.message?.content)) {
        if (b.type !== 'tool_use') continue;
        const input = JSON.stringify(b.input ?? {});
        if (b.name === 'Skill' && /bansat/i.test(input)) evidence.push(`${e.timestamp ?? '?'}: Skill tool called with ${input.slice(0, 80)}`);
        else if (/\.claude\/skills\/bansat\/SKILL\.md/.test(input)) evidence.push(`${e.timestamp ?? '?'}: ${b.name} on the skill's SKILL.md`);
      }
    }
    const isOperator = e.type === 'user' && !e.isMeta && !e.isSidechain && !blocks(e.message?.content).some((b) => b.type === 'tool_result');
    if (!Number.isNaN(at) && (e.type === 'user' || e.type === 'assistant')) times.push({ at, operator: isOperator });
  }
  for (const text of subagents) for (const e of parse(text)) if (e.type === 'assistant') count(e);

  let active = 0;
  let start: number | undefined;
  let last: number | undefined;
  const close = (): void => {
    if (start === undefined || last === undefined) return;
    active += last - start;
    if (split !== undefined) {
      // A turn that spans the split is shared out at the split.
      before.active_ms += Math.max(0, Math.min(last, split) - start);
      after.active_ms += Math.max(0, last - Math.max(start, split));
    }
  };
  for (const t of times) {
    if (t.operator) {
      close();
      start = t.at;
      last = t.at;
    } else if (start !== undefined) last = t.at;
  }
  close();
  const firstOperator = times.find((t) => t.operator)?.at;
  const lastAt = times.length ? Math.max(...times.map((t) => t.at)) : undefined;
  return {
    files: 1 + subagents.length,
    models: [...models],
    claude_code_versions: [...versions],
    operator_messages: times.filter((t) => t.operator).length,
    assistant_messages: assistant,
    tokens,
    ...(split !== undefined ? { phases: { before, after, split_at: new Date(split).toISOString() } } : {}),
    active_ms: active,
    wall_ms: firstOperator !== undefined && lastAt !== undefined ? lastAt - firstOperator : 0,
    skill: { used: evidence.length > 0, evidence: evidence.slice(0, 5) },
  };
}

export function summariseFiles(transcript: string, subagentsDir?: string, splitAt?: string): Usage {
  const dir = subagentsDir ?? transcript.replace(/\.jsonl$/, '/subagents');
  const subs = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.jsonl')).map((f) => readFileSync(join(dir, f), 'utf8')) : [];
  return summarise(readFileSync(transcript, 'utf8'), subs, splitAt);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const transcript = arg('--transcript');
  if (!transcript) {
    console.error('usage: node research/run/usage.ts --transcript <session.jsonl> [--subagents <dir>] [--split-at <ISO time>] [--out usage.json]');
    process.exit(2);
  }
  const usage = summariseFiles(transcript, arg('--subagents'), arg('--split-at'));
  const json = `${JSON.stringify(usage, null, 2)}\n`;
  if (arg('--out')) writeFileSync(arg('--out')!, json);
  process.stdout.write(json);
}
