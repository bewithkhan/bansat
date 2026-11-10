// Checks the stack profiles in stacks/ (blueprint 3.8, FR-09):
//   - stacks/README.md lists every profile, and every profile it lists exists;
//   - each profile has its title, the header line (group, versions covered, check date), the ten sections in
//     order and a Sources section with official links;
//   - its group matches the README's table, its check date is real and not in the future;
//   - no code example runs past 15 lines, and no source is a blog, forum or video site.
//
//   node scripts/check-stacks.ts                 check this repo
//   node scripts/check-stacks.ts --root <dir>    check another copy (used by the tests)
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootFlag = process.argv.indexOf('--root');
const ROOT = rootFlag > 0 && process.argv[rootFlag + 1] ? process.argv[rootFlag + 1] : join(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = join(ROOT, 'stacks');
const problems: string[] = [];
const problem = (file: string, message: string): void => {
  problems.push(`${file}: ${message}`);
};

export const SECTIONS = [
  'Access and the isolation test',
  'Authentication',
  'Secrets',
  'CSRF and XSS',
  'Fonts and assets',
  'Consent',
  'Logging',
  'Testing',
  'Deployment',
  'Limits',
  'Sources',
];
const GROUPS = ['Backend', 'Frontend and full-stack', 'Mobile', 'No-code and BaaS'];
// Not sources: they can be leads, but a profile's claims link to the stack's own documentation.
const NOT_SOURCES = ['medium.com', 'dev.to', 'stackoverflow.com', 'stackexchange.com', 'reddit.com', 'youtube.com', 'youtu.be', 'hashnode.dev', 'substack.com', 'freecodecamp.org', 'geeksforgeeks.org', 'w3schools.com', 'udemy.com'];

const readme = existsSync(join(DIR, 'README.md')) ? readFileSync(join(DIR, 'README.md'), 'utf8') : '';
if (!readme) problem('stacks/README.md', 'is missing');

// The README's table: "| Group | [Name](id.md), ... |"
const listed = new Map<string, string>();
for (const row of readme.split('\n').filter((l) => l.startsWith('| ') && !l.startsWith('| Group') && !l.startsWith('|---'))) {
  const [group, cell] = row.split('|').slice(1, 3).map((c) => c.trim());
  if (!GROUPS.includes(group)) problem('stacks/README.md', `"${group}" isn't one of the groups (${GROUPS.join(', ')})`);
  for (const m of cell.matchAll(/\]\(([a-z0-9-]+)\.md\)/g)) {
    if (listed.has(m[1])) problem('stacks/README.md', `lists ${m[1]} twice`);
    listed.set(m[1], group);
  }
}

const files = existsSync(DIR) ? readdirSync(DIR).filter((f) => f.endsWith('.md') && f !== 'README.md').sort() : [];
for (const file of files) if (!listed.has(file.replace(/\.md$/, ''))) problem(`stacks/${file}`, "isn't listed in stacks/README.md");

const today = new Date().toISOString().slice(0, 10);
let checked = 0;
for (const [id, group] of listed) {
  const file = `stacks/${id}.md`;
  if (!existsSync(join(ROOT, file))) {
    problem('stacks/README.md', `lists ${id}, but ${file} doesn't exist`);
    continue;
  }
  checked++;
  const text = readFileSync(join(ROOT, file), 'utf8').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  if (!/^# \S/.test(lines[0] ?? '')) problem(file, 'must start with its title ("# Laravel")');
  const header = lines.find((l) => l.startsWith('> **Group:**')) ?? '';
  const parts = /^> \*\*Group:\*\* (.+?) · \*\*Covers:\*\* (.+?) · \*\*Checked:\*\* (\d{4}-\d{2}-\d{2}) against the official docs$/.exec(header);
  if (!parts) {
    problem(file, 'needs the header line "> **Group:** … · **Covers:** … · **Checked:** YYYY-MM-DD against the official docs"');
  } else {
    if (parts[1] !== group) problem(file, `says its group is "${parts[1]}", but stacks/README.md lists it under "${group}"`);
    const date = parts[3];
    const real = !Number.isNaN(Date.parse(`${date}T00:00:00Z`)) && new Date(`${date}T00:00:00Z`).toISOString().startsWith(date);
    if (!real) problem(file, `${date} isn't a real date`);
    else if (date > today) problem(file, `the check date ${date} is in the future`);
  }

  // The sections, in order, outside code blocks.
  const headings: string[] = [];
  let fence = '';
  let codeStart = 0;
  lines.forEach((line, i) => {
    const open = /^(`{3,}|~{3,})/.exec(line);
    if (open && !fence) {
      fence = open[1];
      codeStart = i;
      return;
    }
    if (fence && line.trim() === fence) {
      if (i - codeStart - 1 > 15) problem(file, `the code example at line ${codeStart + 1} is ${i - codeStart - 1} lines; keep examples to 15 at most`);
      fence = '';
      return;
    }
    if (!fence && line.startsWith('## ')) headings.push(line.slice(3).trim());
  });
  if (fence) problem(file, 'has a code block that never closes');
  if (headings.join('|') !== SECTIONS.join('|')) {
    problem(file, `needs exactly these sections, in order: ${SECTIONS.join(', ')}. It has: ${headings.join(', ') || 'none'}`);
  }

  const sources = text.split(/^## Sources\s*$/m)[1] ?? '';
  const links = [...sources.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
  if (links.length < 3) problem(file, `Sources has ${links.length} links; link the official docs behind the profile (3 at least)`);
  for (const url of [...text.matchAll(/\]\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1])) {
    const host = new URL(url).hostname.replace(/^www\./, '');
    if (NOT_SOURCES.some((d) => host === d || host.endsWith(`.${d}`))) problem(file, `links to ${host}; use the stack's own documentation instead`);
  }
  // Template syntax in code is fine (Blade's {{ }}, Django's {{ csp_nonce }}); a {{placeholder}} in prose isn't.
  const prose = text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
  if (/\{\{[^}]+\}\}/.test(prose)) problem(file, 'has a {{placeholder}} left in it');
}

if (problems.length) {
  console.error(`check-stacks: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(`stacks/ is valid: all ${checked} profiles are listed, present and in the right shape.`);
