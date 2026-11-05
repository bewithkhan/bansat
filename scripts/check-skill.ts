// Checks SKILL.md:
// - its frontmatter follows the Agent Skills specification (https://agentskills.io/specification);
// - every repo file it names exists, and every framework module is reachable from it;
// - every pinned download link points at the release named in its metadata;
// - that release number matches CITATION.cff, the README install command, the CHANGELOG and the framework.
//
//   node scripts/check-skill.ts
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FRAMEWORK_DIR, MODULES } from './modules.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string): string => readFileSync(join(ROOT, file), 'utf8').replace(/\r\n?/g, '\n');
const problems: string[] = [];
const problem = (message: string): void => {
  problems.push(message);
};

// --- Frontmatter (the spec allows these top-level fields only) ---
const ALLOWED_FIELDS = ['name', 'description', 'license', 'allowed-tools', 'metadata', 'compatibility'];
const skill = read('SKILL.md');
const match = /^---\n([\s\S]*?)\n---\n/.exec(skill);
if (!match) {
  console.error('check-skill: SKILL.md has no YAML frontmatter');
  process.exit(1);
}
const frontmatter = match[1] ?? '';
const body = skill.slice(match[0].length);

// A deliberately small, strict parser for the shape SKILL.md uses: top-level "key: value" lines,
// and one level of "  key: value" lines under "metadata:". Anything a YAML parser could read
// differently (an unquoted ": " or " #", a leading indicator, a duplicate key, a metadata value
// that YAML would turn into a number or boolean) is reported rather than guessed at.
type Scalar = { text: string; quoted: boolean } | { error: string };
function scalar(raw: string): Scalar {
  const v = raw.trim();
  if (/^"(?:[^"\\]|\\.)*"$/.test(v)) return { text: v.slice(1, -1).replace(/\\(.)/g, '$1'), quoted: true };
  if (/^'(?:[^']|'')*'$/.test(v)) return { text: v.slice(1, -1).replace(/''/g, "'"), quoted: true };
  if (/^[[\]{},&*!|>'"%@`#]|^[-?] /.test(v) || v.includes(': ') || v.includes(' #') || v.endsWith(':')) {
    return { error: 'quote it: YAML would read this unquoted value differently' };
  }
  return { text: v, quoted: false };
}
const NOT_A_STRING = /^(?:true|false|yes|no|on|off|null|~|[-+]?(?:\d[\d_]*)?\.?\d+(?:e[-+]?\d+)?|0x[\da-f]+|0o[0-7]+)$/i;

const fields = new Map<string, string>();
const metadata = new Map<string, string>();
let parent = '';
for (const line of frontmatter.split('\n')) {
  if (!line.trim()) continue;
  const top = /^([A-Za-z][\w-]*):(?: (.*))?$/.exec(line);
  const nested = /^ {2}([A-Za-z][\w-]*):(?: (.*))?$/.exec(line);
  const [key, raw, target, where] = top
    ? [top[1] ?? '', top[2] ?? '', fields, 'frontmatter']
    : nested && parent === 'metadata'
      ? [nested[1] ?? '', nested[2] ?? '', metadata, 'metadata']
      : ['', '', null, ''];
  if (!target) {
    problem(`SKILL.md frontmatter: can't read the line "${line}"`);
    continue;
  }
  if (target.has(key)) problem(`SKILL.md ${where}: "${key}" appears more than once`);
  if (top) parent = raw.trim() ? '' : key;
  if (!raw.trim()) {
    if (!(top && key === 'metadata')) problem(`SKILL.md ${where}: "${key}" has no value`);
    target.set(key, '');
    continue;
  }
  const value = scalar(raw);
  if ('error' in value) {
    problem(`SKILL.md ${where}: "${key}": ${value.error}`);
    continue;
  }
  if (where === 'metadata' && !value.quoted && NOT_A_STRING.test(value.text)) {
    problem(`SKILL.md metadata: "${key}" must be a string (the spec says so), so quote "${value.text}"`);
  }
  target.set(key, value.text);
}
for (const key of fields.keys()) {
  if (!ALLOWED_FIELDS.includes(key)) problem(`SKILL.md frontmatter: "${key}" isn't a field the spec allows`);
}
const name = fields.get('name') ?? '';
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name) || name.length > 64) {
  problem(`SKILL.md name "${name}": 1-64 lowercase letters, digits and single hyphens`);
}
if (name !== 'bansat') problem(`SKILL.md name must be "bansat", the folder the README installs it into`);
const description = fields.get('description') ?? '';
if (description.length < 1 || description.length > 1024) {
  problem(`SKILL.md description must be 1-1024 characters (it's ${description.length})`);
}
const compatibility = fields.get('compatibility');
if (compatibility !== undefined && (compatibility.length < 1 || compatibility.length > 500)) {
  problem('SKILL.md compatibility must be 1-500 characters when present');
}
const bodyLines = body.split('\n').length;
if (bodyLines > 500) problem(`SKILL.md body is ${bodyLines} lines; the spec recommends under 500`);

const version = metadata.get('version') ?? '';
if (!/^\d+\.\d+\.\d+$/.test(version)) problem(`SKILL.md metadata.version "${version}" isn't X.Y.Z`);
const minor = version.split('.').slice(0, 2).join('.');
const tag = `v${version}`;

// --- Files named in SKILL.md exist, and every module is reachable ---
const pathPattern = /(?<![\w./-])((?:framework|reference|hooks|scripts|examples)\/[\w./-]*[\w-]\.(?:md|mjs|ts|tsx|sql|json|ya?ml))/g;
const named = new Set([...skill.matchAll(pathPattern)].map((m) => m[1] ?? ''));
for (const file of named) {
  if (!existsSync(join(ROOT, file))) problem(`SKILL.md names ${file}, which doesn't exist`);
}
for (const module of MODULES) {
  if (!named.has(`${FRAMEWORK_DIR}/${module}`)) {
    problem(`SKILL.md never names ${FRAMEWORK_DIR}/${module}, so the skill can't load it`);
  }
}

// --- Pinned links point at this release ---
for (const m of skill.matchAll(/https:\/\/raw\.githubusercontent\.com\/bewithkhan\/bansat\/([^/\s)`]+)\/([^\s)`,]*[\w-])/g)) {
  const [url, ref, file] = [m[0], m[1] ?? '', m[2] ?? ''];
  if (ref !== tag) problem(`SKILL.md links to ${url}: pin it to ${tag}`);
  if (!existsSync(join(ROOT, file))) problem(`SKILL.md links to ${file}, which doesn't exist`);
}

// --- One release number everywhere ---
const expectIn = (file: string, pattern: RegExp, expected: string, what: string): void => {
  const found = [...read(file).matchAll(pattern)].map((m) => m[1] ?? '');
  if (found.length === 0) problem(`${file}: no ${what} found`);
  for (const value of found) if (value !== expected) problem(`${file}: ${what} is ${value}, expected ${expected}`);
};
expectIn('CITATION.cff', /^version:\s*"?([\d.]+)"?\s*$/gm, version, 'version');
expectIn('README.md', /--branch (v[\d.]+)/g, tag, 'install tag');
expectIn('site/src/content/docs/index.mdx', /--branch (v[\d.]+)/g, tag, 'install tag');
expectIn('README.md', /badge\/framework-v([\d.]+)-/g, minor, 'framework badge');
const latest = /^## (v[\d.]+) /m.exec(read('CHANGELOG.md'))?.[1];
if (latest !== tag) problem(`CHANGELOG.md: the latest entry is ${latest ?? 'missing'}, expected ${tag}`);
expectIn(`${FRAMEWORK_DIR}/cover.md`, /Framework version \*\*([\d.]+)\*\*/g, minor, 'framework version');
expectIn(`${FRAMEWORK_DIR}/cover.md`, /\(Version ([\d.]+)\)/g, minor, 'citation version');
expectIn('SKILL.md', /\(Version ([\d.]+)\)/g, minor, 'citation version');
expectIn('SKILL.md', /Bansat \(بنسټ\) v([\d.]+) by Muhammad Tufail Khan/g, minor, 'attribution row');
expectIn(`${FRAMEWORK_DIR}/cover.md`, /Bansat \(بنسټ\) v([\d.]+) by Muhammad Tufail Khan/g, minor, 'Framework row');

if (problems.length) {
  console.error(`check-skill: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `SKILL.md is valid: ${named.size} files named and present, all ${MODULES.length} modules reachable, pinned to ${tag}.`,
);
