// Blueprint completeness (a metric for condition B, research/README.md): how much of the blueprint the framework asks
// for, at the spec's risk tier, the agent actually wrote in docs/BLUEPRINT.md. It isn't a pass-or-fail check, and it
// never feeds into the checks' score, so writing documents can't earn an app a pass.
//
// The rubric is version 0, for the co-authors to agree. It works at the level of the framework's Parts, because a
// blueprint written with the skill numbers its own subsections (Bansat's own docs/BLUEPRINT.md is an example) and
// matching every framework subsection by number would mark good blueprints down. Each item is:
//   - a Part, present as a "Part N" heading with at least 150 characters of text that isn't a {{placeholder}}; or
//   - a key element the tier needs, found by its words anywhere in the document.
// Which items apply follows the framework's depth table (how-to-use.md): Low needs Parts 0, 1, 3, 9, 10, 11 and 13;
// Medium needs every [CORE] Part (0–7 and 9–13) plus Part 8 when the app uses AI; High adds a DPIA. Part 14 is for
// existing projects, so it's never required here.
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { Facts, Spec } from './lib.ts';

export type Item = { id: string; label: string; ok: boolean; note?: string };
export type Completeness = {
  file: string;
  found: boolean;
  expectedTier: Spec['expected_tier'];
  statedTier?: string;
  tierMatches?: boolean;
  items: Item[];
  required: number;
  satisfied: number;
  score: number; // satisfied / required, 0 to 1
  placeholders: number; // {{…}} left anywhere in the document
  g1Signed: boolean; // the G1 row carries a name and a date
};

const PART_NAMES = ['Intake and risk', 'Product requirements', 'Non-functional requirements', 'Architecture', 'Decisions (ADRs)', 'Data', 'API', 'Security', 'AI', 'Privacy and compliance', 'Experience and UI states', 'Delivery', 'Agent rules', 'Launch gate'];
const MIN_CHARS = 150;

// The text of each "Part N" section, up to the next Part heading.
export function parts(doc: string): Map<number, string> {
  const out = new Map<number, string>();
  const heads = [...doc.matchAll(/^#{1,3}\s*Part\s+(\d{1,2})\b[^\n]*$/gim)].filter((m) => Number(m[1]) <= 14);
  heads.forEach((m, i) => {
    const end = heads[i + 1]?.index ?? doc.length;
    out.set(Number(m[1]), doc.slice(m.index! + m[0].length, end));
  });
  return out;
}

const substance = (text: string): number => text.replace(/\{\{[^}]*\}\}/g, '').replace(/[\s|\-#*`>:]/g, '').length;

export function scoreBlueprint(appDir: string, spec: Pick<Spec, 'expected_tier' | 'facts'>, file = 'docs/BLUEPRINT.md'): Completeness {
  const path = join(appDir, file);
  const base = { file, expectedTier: spec.expected_tier, items: [], required: 0, satisfied: 0, score: 0, placeholders: 0, g1Signed: false };
  if (!existsSync(path)) return { ...base, found: false };
  const doc = readFileSync(path, 'utf8');
  const byPart = parts(doc);
  const tier = spec.expected_tier;
  const f: Facts = spec.facts;

  const wanted = tier === 'low' ? [0, 1, 3, 9, 10, 11, 13] : [0, 1, 2, 3, 4, 5, 6, 7, ...(f.ai ? [8] : []), 9, 10, 11, 12, 13];
  const items: Item[] = wanted.map((n) => {
    const text = byPart.get(n);
    const chars = text === undefined ? 0 : substance(text);
    return { id: `part-${n}`, label: `Part ${n}: ${PART_NAMES[n]}`, ok: chars >= MIN_CHARS || (text !== undefined && /\bN\/A\b[^\n]{10,}/.test(text)), note: text === undefined ? 'no "Part ' + n + '" heading' : `${chars} characters of content` };
  });
  const has = (re: RegExp): boolean => re.test(doc);
  const key = (id: string, label: string, ok: boolean): void => void items.push({ id, label, ok });
  key('risk-tier', 'Risk tier stated', has(/risk tier|\btier\b[^\n]{0,40}\b(low|medium|high)\b/i));
  key('gate-table', 'Gate approvals table with a G1 row', has(/^\|\s*G1\b/m));
  key('credit', 'Bansat credit row in Document control (CC BY 4.0)', has(/Bansat[^\n]*CC BY 4\.0/));
  key('launch-traps', 'Launch-trap audit (9.26)', has(/launch[- ]trap|9\.26/i));
  key('ui-states', 'UI states and the state matrix (10.7)', has(/state matrix|UI states|10\.7/i));
  if (tier !== 'low') {
    key('processors', 'Processor register (3.6)', has(/processors? register|third[- ]party services|sub-?processors?|\| *(vendor|processor) *\|/i));
    key('ropa', 'Record of processing (9.3)', has(/RoPA|record of processing/i));
    key('lawful-basis', 'Lawful bases (9.4)', has(/lawful bas[ie]s/i));
    key('rls', 'Access at the data layer, with an isolation test (5.4)', has(/row[- ]level security|\bRLS\b|isolation test|tenant scope|global scope/i));
  }
  if (f.age_gate !== 'none') key('age', 'Age position (9.12)', has(/age (position|check|gate|assurance|verification)|parental consent/i));
  if (f.marketing_email) key('marketing', 'Marketing email rules (9.11)', has(/unsubscribe|List-Unsubscribe|soft opt-in/i));
  if (f.ai) key('ai-register', 'AI feature register (8.1)', has(/AI feature register|AI-0?1\b/i));
  if (f.special_category) key('special', 'Special category data (9.13)', has(/special[- ]category/i));
  if (tier === 'high') key('dpia', 'DPIA (9.21)', has(/\bDPIA\b|impact assessment/i));

  const g1 = /^\|\s*G1[^|\n]*\|\s*([^|\n]*?)\s*\|\s*([^|\n]*?)\s*\|/m.exec(doc);
  const statedTier = /risk tier[^\n]{0,80}?\b(low|medium|high)\b/i.exec(doc)?.[1]?.toLowerCase() ?? /\btier\s*[:|]?\s*\**\s*(low|medium|high)\b/i.exec(doc)?.[1]?.toLowerCase();
  const satisfied = items.filter((i) => i.ok).length;
  return {
    ...base,
    found: true,
    statedTier,
    tierMatches: statedTier === undefined ? undefined : statedTier === tier,
    items,
    required: items.length,
    satisfied,
    score: items.length ? satisfied / items.length : 0,
    placeholders: (doc.match(/\{\{/g) ?? []).length,
    g1Signed: Boolean(g1 && g1[1] && g1[2] && /\d{4}-\d{2}-\d{2}|\d{1,2} \w+ \d{4}/.test(g1[2])),
  };
}
