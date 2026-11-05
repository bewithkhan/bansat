// Tests for scripts/check-stacks.ts: a valid profile passes, and each broken copy fails for the right reason.
//   node scripts/check-stacks.test.ts
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CHECKER = join(dirname(fileURLToPath(import.meta.url)), 'check-stacks.ts');
const SECTIONS = ['Access and the isolation test', 'Authentication', 'Secrets', 'CSRF and XSS', 'Fonts and assets', 'Consent', 'Logging', 'Testing', 'Deployment', 'Limits'];

const README = '# Stack profiles\n\n| Group | Profiles |\n|---|---|\n| Backend | [Example](example.md) |\n';
const profile = (over: { header?: string; sections?: string[]; extra?: string; sources?: string } = {}): string =>
  [
    '# Example',
    '',
    over.header ?? '> **Group:** Backend · **Covers:** Example 3 · **Checked:** 2026-11-05 against the official docs',
    '',
    ...(over.sections ?? SECTIONS).flatMap((s) => [`## ${s}`, '', `- What ${s.toLowerCase()} needs on this stack.`, '']),
    over.extra ?? '',
    '## Sources',
    '',
    over.sources ?? '- [Docs](https://docs.example.org/security)\n- [Auth](https://docs.example.org/auth)\n- [Deploy](https://docs.example.org/deploy)',
    '',
  ].join('\n');

type Case = { name: string; expect: RegExp | null; readme?: string; files?: Record<string, string> };
const longCode = `\`\`\`php\n${Array.from({ length: 16 }, (_, i) => `$line${i} = ${i};`).join('\n')}\n\`\`\`\n`;
const cases: Case[] = [
  { name: 'a valid profile passes', expect: null },
  { name: 'a missing section fails', expect: /needs exactly these sections/, files: { 'example.md': profile({ sections: SECTIONS.filter((s) => s !== 'Consent') }) } },
  { name: 'sections out of order fail', expect: /needs exactly these sections/, files: { 'example.md': profile({ sections: [SECTIONS[1], SECTIONS[0], ...SECTIONS.slice(2)] }) } },
  { name: 'a group that differs from the README fails', expect: /lists it under "Backend"/, files: { 'example.md': profile({ header: '> **Group:** Mobile · **Covers:** Example 3 · **Checked:** 2026-11-05 against the official docs' }) } },
  { name: 'a check date in the future fails', expect: /is in the future/, files: { 'example.md': profile({ header: '> **Group:** Backend · **Covers:** Example 3 · **Checked:** 2999-01-01 against the official docs' }) } },
  { name: 'a missing header line fails', expect: /needs the header line/, files: { 'example.md': profile({ header: 'Checked recently.' }) } },
  { name: 'a code example over 15 lines fails', expect: /keep examples to 15 at most/, files: { 'example.md': profile({ extra: longCode }) } },
  { name: 'a blog as a source fails', expect: /links to medium\.com/, files: { 'example.md': profile({ sources: '- [Post](https://medium.com/x)\n- [Docs](https://docs.example.org/a)\n- [Auth](https://docs.example.org/b)' }) } },
  { name: 'too few sources fail', expect: /Sources has 1 links/, files: { 'example.md': profile({ sources: '- [Docs](https://docs.example.org/a)' }) } },
  { name: 'a profile the README doesn\'t list fails', expect: /isn't listed in stacks\/README\.md/, files: { 'example.md': profile(), 'other.md': profile() } },
  { name: 'a listed profile that doesn\'t exist fails', expect: /lists missing, but stacks\/missing\.md doesn't exist/, readme: `${README.trim()}\n| Mobile | [Missing](missing.md) |\n` },
];

let failed = 0;
for (const c of cases) {
  const dir = mkdtempSync(join(tmpdir(), 'bansat-stacks-'));
  try {
    mkdirSync(join(dir, 'stacks'));
    writeFileSync(join(dir, 'stacks/README.md'), c.readme ?? README);
    for (const [name, text] of Object.entries(c.files ?? { 'example.md': profile() })) writeFileSync(join(dir, 'stacks', name), text);
    const r = spawnSync(process.execPath, [CHECKER, '--root', dir], { encoding: 'utf8' });
    const out = `${r.stdout}${r.stderr}`;
    const ok = c.expect === null ? r.status === 0 : r.status !== 0 && c.expect.test(out);
    if (!ok) failed++;
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${c.name}${ok ? '' : `\n      ${out.trim().split('\n').join('\n      ')}`}`);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
console.log(failed ? `\n${failed} of ${cases.length} tests failed` : `\nAll ${cases.length} tests passed`);
process.exit(failed ? 1 : 0);
