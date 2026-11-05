// Validates the law registry (laws/) against laws/schema.json and the rules in the blueprint (5.4):
//   - every entry matches the schema, lives at laws/<tier>/<id>.yaml, and names only entries that exist;
//   - every law, regulator, source and watch URL is on an official domain for its jurisdiction
//     (watch/sources.yaml), unless it's listed under `secondary`;
//   - dates are real, not in the future, and history runs newest first; no {{placeholders}} are left.
//
//   node scripts/validate-laws.ts                 check this repo
//   node scripts/validate-laws.ts --root <dir>    check another copy (used by the tests)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse } from 'yaml';

const rootFlag = process.argv.indexOf('--root');
const ROOT = rootFlag > 0 && process.argv[rootFlag + 1] ? process.argv[rootFlag + 1] : join(dirname(fileURLToPath(import.meta.url)), '..');
const LAWS = join(ROOT, 'laws');
const TIERS = ['full', 'basic'] as const;
const problems: string[] = [];
const problem = (file: string, message: string): void => {
  problems.push(`${file}: ${message}`);
};

type Entry = {
  id: string;
  tier: string;
  applies_with?: string[];
  laws: { official_url: string; in_force_from?: string }[];
  regulators: { url: string }[];
  obligations?: Record<string, { source: string[]; secondary?: string[] }>;
  checked: { date: string };
  history: { date: string }[];
  watch?: { url: string }[];
};

const readYaml = (path: string): unknown => parse(readFileSync(path, 'utf8'), { uniqueKeys: true, prettyErrors: true });

// strictRequired is off because the tier rules (allOf) require properties defined at the top level.
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
addFormats(ajv);
const validate = ajv.compile(JSON.parse(readFileSync(join(LAWS, 'schema.json'), 'utf8')));

const sources = readYaml(join(ROOT, 'watch/sources.yaml')) as {
  jurisdictions?: Record<string, { official_domains?: string[] }>;
};
const domainsFor = (id: string): string[] => sources.jurisdictions?.[id]?.official_domains ?? [];

// Load every entry.
const entries = new Map<string, { file: string; entry: Entry }>();
for (const tier of TIERS) {
  const dir = join(LAWS, tier);
  if (!existsSync(dir)) continue;
  for (const name of readdirSync(dir).filter((f) => !f.startsWith('.')).sort()) {
    const file = `laws/${tier}/${name}`;
    if (!name.endsWith('.yaml')) {
      problem(file, 'registry files must end in .yaml');
      continue;
    }
    let data: unknown;
    try {
      data = readYaml(join(dir, name));
    } catch (error) {
      problem(file, `isn't valid YAML: ${(error as Error).message.split('\n')[0]}`);
      continue;
    }
    if (!validate(data)) {
      for (const e of validate.errors ?? []) problem(file, `${e.instancePath || '(top level)'} ${e.message ?? 'is invalid'}`);
      continue;
    }
    const entry = data as Entry;
    if (`${entry.id}.yaml` !== name) problem(file, `id "${entry.id}" doesn't match the file name`);
    if (entry.tier !== tier) problem(file, `tier "${entry.tier}" doesn't match its folder (${tier})`);
    if (entries.has(entry.id)) problem(file, `duplicate id "${entry.id}" (also ${entries.get(entry.id)?.file})`);
    entries.set(entry.id, { file, entry });
  }
}

const today = new Date().toISOString().slice(0, 10);
const realDate = (d: string): boolean => {
  const parsed = new Date(`${d}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === d;
};
const onDomain = (url: string, domains: string[]): boolean => {
  const host = new URL(url).hostname.toLowerCase();
  return domains.some((d) => host === d || host.endsWith(`.${d}`));
};

let sourceCount = 0;
for (const { file, entry } of entries.values()) {
  const raw = readFileSync(join(ROOT, file), 'utf8');
  if (raw.includes('{{')) problem(file, 'has a {{placeholder}} left in it');

  for (const id of entry.applies_with ?? []) {
    if (id === entry.id) problem(file, 'applies_with lists the entry itself');
    else if (!entries.has(id)) problem(file, `applies_with names "${id}", which has no entry`);
  }

  const own = domainsFor(entry.id);
  if (own.length === 0) problem(file, `watch/sources.yaml lists no official domains for "${entry.id}"`);
  const allowed = [...own, ...(entry.applies_with ?? []).flatMap(domainsFor)];
  const checkUrl = (url: string, where: string): void => {
    sourceCount++;
    if (!onDomain(url, allowed)) problem(file, `${where} ${url} isn't on an official domain for ${entry.id} (watch/sources.yaml); list it under secondary if it's only a lead`);
  };
  entry.laws.forEach((law, i) => checkUrl(law.official_url, `laws[${i}].official_url`));
  entry.regulators.forEach((r, i) => checkUrl(r.url, `regulators[${i}].url`));
  for (const [name, obligation] of Object.entries(entry.obligations ?? {})) {
    obligation.source.forEach((url, i) => checkUrl(url, `obligations.${name}.source[${i}]`));
  }
  (entry.watch ?? []).forEach((w, i) => checkUrl(w.url, `watch[${i}].url`));

  const dates: [string, string][] = [
    ['checked.date', entry.checked.date],
    ...entry.laws.flatMap((l, i): [string, string][] => (l.in_force_from ? [[`laws[${i}].in_force_from`, l.in_force_from]] : [])),
    ...entry.history.map((h, i): [string, string] => [`history[${i}].date`, h.date]),
  ];
  for (const [where, d] of dates) {
    if (!realDate(d)) problem(file, `${where} "${d}" isn't a real date`);
  }
  for (const [where, d] of dates.filter(([w]) => !w.startsWith('laws['))) {
    if (d > today) problem(file, `${where} ${d} is in the future`);
  }
  for (let i = 1; i < entry.history.length; i++) {
    if ((entry.history[i]?.date ?? '') > (entry.history[i - 1]?.date ?? '')) problem(file, 'history must run newest first');
  }
}

if (problems.length) {
  console.error(`validate-laws: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
const full = [...entries.values()].filter((e) => e.entry.tier === 'full').length;
console.log(`laws/ is valid: ${entries.size} entries (${full} full, ${entries.size - full} basic), ${sourceCount} URLs on official domains.`);
