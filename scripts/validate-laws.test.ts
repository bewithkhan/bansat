// Tests for scripts/validate-laws.ts: a valid entry passes, and each broken copy fails for the right reason.
//   node scripts/validate-laws.test.ts
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const VALIDATOR = join(ROOT, 'scripts/validate-laws.ts');
const base = parse(readFileSync(join(ROOT, 'laws/full/uk.yaml'), 'utf8'));

type Case = { name: string; expect: RegExp | null; change?: (entry: any) => void; file?: string; tier?: string; raw?: (text: string) => string };
const cases: Case[] = [
  { name: 'a valid full entry passes', expect: null },
  { name: 'a source off the official domains fails', expect: /isn't on an official domain/, change: (e) => { e.obligations.cookies.source.push('https://example.com/cookie-guide'); } },
  { name: 'a lead listed under secondary passes', expect: null, change: (e) => { e.obligations.cookies.secondary = ['https://example.com/cookie-guide']; } },
  { name: 'a full entry without obligations fails', expect: /must have required property 'obligations'/, change: (e) => { delete e.obligations; } },
  { name: 'an obligation with no source fails', expect: /source must NOT have fewer than 1 items/, change: (e) => { e.obligations.dpo.source = []; } },
  { name: 'human-reviewed without a reviewer fails', expect: /must have required property 'by'/, change: (e) => { e.checked.status = 'human-reviewed'; } },
  { name: 'an id that differs from the file name fails', expect: /doesn't match the file name/, change: (e) => { e.id = 'gb'; } },
  { name: 'a check date in the future fails', expect: /is in the future/, change: (e) => { e.checked.date = '2999-01-01'; } },
  { name: 'an impossible date fails', expect: /isn't a real date|must match format "date"/, change: (e) => { e.checked.date = '2026-02-30'; } },
  { name: 'a placeholder left in fails', expect: /placeholder/, change: (e) => { e.obligations.dpo.summary = 'Appoint a DPO when {{condition}}.'; } },
  { name: 'applies_with naming a missing entry fails', expect: /has no entry/, change: (e) => { e.applies_with = ['eu']; } },
  { name: 'a basic entry with obligations fails', expect: /must NOT be valid/, tier: 'basic', change: (e) => { e.tier = 'basic'; } },
  { name: 'an unknown field fails', expect: /must NOT have additional properties/, change: (e) => { e.summary = 'extra'; } },
  { name: 'a duplicate YAML key fails', expect: /isn't valid YAML/, raw: (t) => t.replace('tier: full\n', 'tier: full\ntier: full\n') },
];

let failed = 0;
for (const c of cases) {
  const dir = mkdtempSync(join(tmpdir(), 'bansat-laws-'));
  try {
    const tier = c.tier ?? 'full';
    mkdirSync(join(dir, 'laws', tier), { recursive: true });
    mkdirSync(join(dir, 'watch'), { recursive: true });
    cpSync(join(ROOT, 'laws/schema.json'), join(dir, 'laws/schema.json'));
    cpSync(join(ROOT, 'watch/sources.yaml'), join(dir, 'watch/sources.yaml'));
    const entry = structuredClone(base);
    c.change?.(entry);
    let text = stringify(entry);
    if (c.raw) text = c.raw(text);
    writeFileSync(join(dir, 'laws', tier, c.file ?? 'uk.yaml'), text);
    const run = spawnSync(process.execPath, [VALIDATOR, '--root', dir], { encoding: 'utf8' });
    const output = `${run.stdout}${run.stderr}`;
    const ok = c.expect === null ? run.status === 0 : run.status === 1 && c.expect.test(output);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}`);
    if (!ok) {
      failed++;
      console.log(output.split('\n').slice(0, 6).map((l) => `      ${l}`).join('\n'));
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
console.log(failed ? `\n${failed} of ${cases.length} tests failed` : `\nAll ${cases.length} tests passed`);
process.exit(failed ? 1 : 0);
