// Shared pieces for the experiment's checks (research/README.md): the result types, an index of an app's files, the
// spec loader and small search helpers. Every check reads the app through this index, so they all skip the same
// things: dependencies, build output, tests, documentation and the installed Bansat skill (.claude/), which quotes
// many of the patterns the checks look for. Only the app's own code is judged, never its plans or docs, so a
// blueprint can't earn a pass on its own.
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, extname, join, relative, sep } from 'node:path';
import { parse } from 'yaml';

export type Status = 'pass' | 'fail' | 'not-applicable' | 'needs-review';
// Where a result comes from: a file and line, the matching text, and a note in plain words.
export type Evidence = { file?: string; line?: number; text?: string; note?: string };
// One check's verdict on one app. `findings` counts the separate defects behind a fail (each table without RLS,
// each leaked key, each third-party host), and the items to look at behind a needs-review; it's 0 otherwise.
export type CheckResult = { status: Status; summary: string; evidence: Evidence[]; findings: number };

export type AgeGate = 'none' | 'age-check' | 'parental';
// What a spec says the app does. Checks use these facts to decide whether they apply, so an app isn't marked down
// for leaving out something its brief never asked for.
export type Facts = {
  personal_data: boolean;
  accounts: boolean;
  age_gate: AgeGate;
  marketing_email: boolean;
  analytics: boolean;
  ai: boolean;
  payments: boolean;
  special_category: boolean;
  multi_tenant: boolean;
  uploads: boolean;
};
export type Spec = {
  id: string;
  title: string;
  size: string;
  stack: string;
  profiles: string[];
  expected_tier: 'low' | 'medium' | 'high';
  facts: Facts;
  // Hosts the browser may contact before consent (the app's own backend, 9.9), and hosts a person must judge
  // (strictly necessary on some pages only, such as a payment provider). Suffix match: "supabase.co" covers
  // "abc.supabase.co".
  dynamic: { allow: string[]; review: string[]; pages: string[] };
  features: { id: string; text: string }[];
  prompt: string;
  file: string;
  sha256: string;
};

const FACT_KEYS: (keyof Facts)[] = ['personal_data', 'accounts', 'age_gate', 'marketing_email', 'analytics', 'ai', 'payments', 'special_category', 'multi_tenant', 'uploads'];

// A spec is Markdown with YAML front matter. The front matter is for scoring and is never shown to the agent; the
// body is the prompt, word for word.
export function loadSpec(file: string): Spec {
  const raw = readFileSync(file, 'utf8').replace(/\r\n/g, '\n');
  const m = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/.exec(raw);
  if (!m) throw new Error(`${file}: no front matter`);
  const meta = parse(m[1]) as Omit<Spec, 'prompt' | 'file' | 'sha256'>;
  for (const key of ['id', 'title', 'size', 'stack', 'expected_tier', 'facts'] as const) if (meta[key] === undefined) throw new Error(`${file}: front matter needs ${key}`);
  for (const key of FACT_KEYS) if (meta.facts[key] === undefined) throw new Error(`${file}: facts needs ${key}`);
  if (!['none', 'age-check', 'parental'].includes(meta.facts.age_gate)) throw new Error(`${file}: facts.age_gate must be none, age-check or parental`);
  return {
    ...meta,
    profiles: meta.profiles ?? [],
    dynamic: { allow: meta.dynamic?.allow ?? [], review: meta.dynamic?.review ?? [], pages: meta.dynamic?.pages ?? [] },
    features: meta.features ?? [],
    prompt: `${m[2].trim()}\n`,
    file,
    sha256: createHash('sha256').update(raw).digest('hex'),
  };
}

// ---------------------------------------------------------------------------------------------------------------
// The file index

export type Kind = 'code' | 'config' | 'env' | 'sql' | 'prisma' | 'doc';
export type SourceFile = {
  path: string; // relative to the app root, always with forward slashes
  kind: Kind;
  text: string;
  // The text with comments blanked out (same length and line breaks, so offsets and line numbers still match).
  code: string;
};

const CODE_EXT = new Set(['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.mts', '.cts', '.vue', '.svelte', '.astro', '.html', '.htm', '.css', '.scss', '.sass', '.less', '.php', '.erb', '.ejs', '.hbs', '.handlebars', '.njk', '.liquid', '.mjml', '.twig', '.py', '.rb']);
const CONFIG_EXT = new Set(['.json', '.toml', '.yaml', '.yml', '.conf']);
const CONFIG_NAMES = new Set(['_headers', '_redirects', 'Caddyfile', '.htaccess', 'nginx.conf']);
const DOC_EXT = new Set(['.md', '.mdx', '.markdown']);
// Folders never read: dependencies, version control, the installed skill, caches.
const SKIP_DIRS = new Set(['node_modules', '.git', '.claude', '.cursor', '.turbo', '.vercel', '.netlify', '.cache', 'coverage', '.idea', '.vscode', '__pycache__', '.venv', 'venv']);
// Build output: kept apart, for the checks that look at what ships to the browser.
const BUILD_DIRS = new Set(['.next', '.svelte-kit', '.astro', '.nuxt', '.output', 'dist', 'build', 'out']);
// Folders skipped only at the top of the app: documentation, PHP dependencies and Laravel's runtime files and cache.
const SKIP_TOP = new Set(['docs', 'vendor', 'storage']);
const SKIP_PATHS = new Set(['bootstrap/cache']);
// Tests and their fixtures are skipped: a privacy test may name the very hosts it forbids.
const TEST_DIRS = new Set(['test', 'tests', '__tests__', '__mocks__', 'e2e', 'cypress', 'playwright', 'fixtures', 'spec']);
const TEST_FILE = /\.(test|spec)\.[a-z]+$|^(playwright|vitest|jest|cypress)\.config\./i;
const MAX_BYTES = 1_000_000;

export type App = {
  root: string;
  files: SourceFile[]; // the app's own source, config, env files, SQL, Prisma schemas and non-doc Markdown
  bundle: SourceFile[]; // JavaScript, HTML and CSS in build output folders
  deps: Set<string>; // npm dependencies (not devDependencies) from every package.json, and composer `require`
  devDeps: Set<string>;
  dirs: Set<string>; // every folder read, relative, so checks can ask "is there a supabase/ folder?"
  gitignore: RegExp[];
};

function kindOf(path: string): Kind | undefined {
  const name = basename(path);
  const ext = extname(name).toLowerCase();
  if (name.startsWith('.env')) return 'env';
  if (CONFIG_NAMES.has(name)) return 'config';
  if (ext === '.sql') return 'sql';
  if (ext === '.prisma') return 'prisma';
  if (CODE_EXT.has(ext)) return 'code';
  if (CONFIG_EXT.has(ext)) return name === 'package-lock.json' || name === 'composer.lock' ? undefined : 'config';
  if (DOC_EXT.has(ext)) return 'doc';
  return undefined;
}

// Blanks out a match but keeps its line breaks, so line numbers stay right.
const blank = (s: string): string => s.replace(/[^\n]/g, ' ');

// Blanks every match of `re` after its first capture group (the character that led into it).
const blankAfterLead = (text: string, re: RegExp): string => text.replace(re, (m: string, lead: string) => lead + blank(m.slice(lead.length)));

// Comment stripping is deliberately simple: block comments, HTML and Blade comments, and `//` or `#` comments, each
// only where it starts a line or follows whitespace or punctuation. So `https://` (a colon before the slashes) and
// `accept="image/*"` (a letter before the slash) are left alone. A `//` inside a string after a space can still be
// blanked by mistake; the evidence always shows the line, so a reviewer sees it.
export function stripComments(text: string, path: string): string {
  const name = basename(path);
  const ext = extname(name).toLowerCase();
  if (name.startsWith('.env')) return text.replace(/^[ \t]*#[^\n]*/gm, blank);
  if (ext === '.json') return text;
  if (['.toml', '.yaml', '.yml', '.conf'].includes(ext) || CONFIG_NAMES.has(name)) return blankAfterLead(text, /(^|\s)#[^\n]*/g);
  let out = text.replace(/<!--[\s\S]*?-->/g, blank).replace(/\{\{--[\s\S]*?--\}\}/g, blank);
  out = blankAfterLead(out, /(^|[\s;{}(),>])\/\*[\s\S]*?\*\//g);
  out = blankAfterLead(out, /(^|[\s;{}(),])\/\/[^\n]*/g);
  if (['.py', '.rb', '.php'].includes(ext)) out = blankAfterLead(out, /(^|\s)#(?![[{])[^\n]*/g);
  return out;
}

function globToRegExp(pattern: string): RegExp {
  const p = pattern.replace(/^\//, '').replace(/\/$/, '');
  const re = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '\u0000').replace(/\*/g, '[^/]*').replace(/\?/g, '[^/]').replace(/\u0000/g, '.*');
  return new RegExp(pattern.includes('/') && !pattern.startsWith('**') ? `^${re}(/.*)?$` : `(^|/)${re}(/.*)?$`);
}

// Reads every file the checks may look at, once.
export function indexApp(root: string): App {
  if (!existsSync(root) || !statSync(root).isDirectory()) throw new Error(`no app folder at ${root}`);
  const app: App = { root, files: [], bundle: [], deps: new Set(), devDeps: new Set(), dirs: new Set(), gitignore: [] };
  const walk = (dir: string, inBuild: boolean, depth: number): void => {
    for (const name of readdirSync(dir).sort()) {
      const full = join(dir, name);
      const rel = relative(root, full).split(sep).join('/');
      let stat;
      try {
        stat = statSync(full);
      } catch {
        continue; // a broken symlink
      }
      if (stat.isDirectory()) {
        if (SKIP_DIRS.has(name) || TEST_DIRS.has(name) || SKIP_PATHS.has(rel) || (depth === 0 && SKIP_TOP.has(name))) continue;
        app.dirs.add(rel);
        walk(full, inBuild || BUILD_DIRS.has(name), depth + 1);
        continue;
      }
      if (stat.size > MAX_BYTES || TEST_FILE.test(name)) continue;
      const kind = kindOf(name);
      if (!kind) continue;
      // Top-level Markdown (README, CLAUDE.md, AGENTS.md) is about the app, not part of it.
      if (kind === 'doc' && depth === 0) continue;
      const text = readFileSync(full, 'utf8');
      const file: SourceFile = { path: rel, kind, text, code: kind === 'sql' || kind === 'doc' ? text : stripComments(text, name) };
      if (inBuild) {
        if (['.js', '.mjs', '.cjs', '.html', '.css'].includes(extname(name))) app.bundle.push(file);
      } else app.files.push(file);
    }
  };
  walk(root, false, 0);
  for (const f of app.files) {
    if (basename(f.path) === 'package.json') {
      try {
        const pkg = JSON.parse(f.text) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
        for (const d of Object.keys(pkg.dependencies ?? {})) app.deps.add(d);
        for (const d of Object.keys(pkg.devDependencies ?? {})) app.devDeps.add(d);
      } catch {
        // an unreadable package.json adds nothing
      }
    }
    if (basename(f.path) === 'composer.json') {
      try {
        const composer = JSON.parse(f.text) as { require?: Record<string, string>; 'require-dev'?: Record<string, string> };
        for (const d of Object.keys(composer.require ?? {})) app.deps.add(d);
        for (const d of Object.keys(composer['require-dev'] ?? {})) app.devDeps.add(d);
      } catch {
        // as above
      }
    }
  }
  const ignore = join(root, '.gitignore');
  if (existsSync(ignore)) {
    app.gitignore = readFileSync(ignore, 'utf8')
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && !l.startsWith('!'))
      .map(globToRegExp);
  }
  return app;
}

export const isIgnored = (app: App, path: string): boolean => app.gitignore.some((re) => re.test(path));

// ---------------------------------------------------------------------------------------------------------------
// Searching

export type Match = { file: SourceFile; index: number; line: number; match: RegExpExecArray };

export const lineAt = (text: string, index: number): number => text.slice(0, index).split('\n').length;
export const lineText = (text: string, line: number): string => {
  const t = (text.split('\n')[line - 1] ?? '').trim();
  return t.length > 160 ? `${t.slice(0, 157)}...` : t;
};

// Every match of `re` in the comment-free text of the given files.
export function search(files: SourceFile[], re: RegExp): Match[] {
  const flags = re.flags.includes('g') ? re.flags : `${re.flags}g`;
  const out: Match[] = [];
  for (const file of files) {
    const g = new RegExp(re.source, flags);
    for (let m = g.exec(file.code); m; m = g.exec(file.code)) {
      out.push({ file, index: m.index, line: lineAt(file.code, m.index), match: m });
      if (m[0] === '') g.lastIndex++;
    }
  }
  return out;
}

export const evidenceOf = (m: Match, note?: string): Evidence => ({ file: m.file.path, line: m.line, text: lineText(m.file.text, m.line), ...(note ? { note } : {}) });

export const code = (app: App): SourceFile[] => app.files.filter((f) => f.kind === 'code' || f.kind === 'config');
export const uiFiles = (app: App): SourceFile[] => app.files.filter((f) => f.kind === 'code' && /\.(jsx|tsx|vue|svelte|astro|html?|php|erb|ejs|hbs|njk|liquid|twig|mdx)$/i.test(f.path));
export const hasDep = (app: App, ...names: (string | RegExp)[]): boolean =>
  [...app.deps].some((d) => names.some((n) => (typeof n === 'string' ? d === n : n.test(d))));

// Files that put markup in every page: root layouts, documents and plain HTML pages. A tracker loaded in one of these
// without any consent condition runs on every page.
export function isEntryFile(path: string): boolean {
  return (
    /(^|\/)(app|src\/app)\/layout\.(t|j)sx?$/.test(path) ||
    /(^|\/)pages\/_(app|document)\.(t|j)sx?$/.test(path) ||
    /(^|\/)src\/app\.html$/.test(path) ||
    /(^|\/)src\/routes\/\+layout\.svelte$/.test(path) ||
    /(^|\/)app\.vue$/.test(path) ||
    /(^|\/)nuxt\.config\.(t|j)s$/.test(path) ||
    /(^|\/)src\/layouts\/[^/]+\.astro$/.test(path) ||
    /(^|\/)resources\/views\/(layouts|components\/layouts)\/[^/]+\.blade\.php$/.test(path) ||
    /\.html?$/.test(path)
  );
}

// A result with no findings.
export const result = (status: Status, summary: string, evidence: Evidence[] = [], findings = 0): CheckResult => ({ status, summary, evidence, findings });
