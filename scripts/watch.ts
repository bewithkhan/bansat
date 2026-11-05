// Law Watch (blueprint FR-06): fetch every official feed and page the registry watches, compare each one with the
// last run, and open or update one "possible change" issue per jurisdiction. Sources that fail go in one
// "[watch] Source failing" issue (NFR-REL-01), so a failure is never silent.
//
// State is a small JSON file kept as a workflow artifact between runs, so the watch never commits to the repo.
// It holds a hash plus each item's title, link and date, never the page text (BR-05). A source seen for the first
// time sets a baseline and opens nothing.
//
//   node scripts/watch.ts --state <file> --write-state <file>   check every source, print what changed
//   node scripts/watch.ts ... --issues                          also open or update the issues (needs GH_TOKEN and
//                                                               GITHUB_REPOSITORY, as in the workflow)
//   node scripts/watch.ts ... --only uk,ie                      only these entries
//   node scripts/watch.ts ... --fixtures <dir>                  answer from <dir>/index.json instead of the network
//   node scripts/watch.ts ... --summary <file>                  append a Markdown summary (for $GITHUB_STEP_SUMMARY)
//   node scripts/watch.ts ... --root <dir>                      watch another copy of the registry (used by the tests)
import { execFileSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type Change,
  type Failure,
  type Source,
  type State,
  USER_AGENT,
  changeText,
  compare,
  emptyState,
  extract,
  failureText,
  loadSources,
  robotsAllows,
  robotsCrawlDelay,
} from './watch-lib.ts';

const arg = (flag: string): string | undefined => {
  const i = process.argv.indexOf(flag);
  return i > 0 ? process.argv[i + 1] : undefined;
};
const ROOT = arg('--root') ?? join(dirname(fileURLToPath(import.meta.url)), '..');
const statePath = arg('--state');
const writeStatePath = arg('--write-state');
const fixtures = arg('--fixtures');
const summaryPath = arg('--summary');
const only = arg('--only') ? new Set(arg('--only')!.split(',')) : undefined;
const openIssues = process.argv.includes('--issues');
const today = new Date().toISOString().slice(0, 10);
const runUrl = process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL ?? 'https://github.com'}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : undefined;

const MAX_BYTES = 5_000_000;
const ACCEPT: Record<string, string> = {
  rss: 'application/rss+xml, application/xml;q=0.9, */*;q=0.5',
  atom: 'application/atom+xml, application/xml;q=0.9, */*;q=0.5',
  html: 'text/html, application/xhtml+xml;q=0.9, */*;q=0.5',
  api: 'application/sparql-results+json, application/json;q=0.9, */*;q=0.5',
};

type Response = { ok: true; body: string } | { ok: false; error: string };

// In fixture mode, index.json maps each URL (and each host's robots.txt) to a file, or to {"status": 404}.
const fixtureIndex: Record<string, string | { status: number }> = fixtures ? JSON.parse(readFileSync(join(fixtures, 'index.json'), 'utf8')) : {};

async function get(url: string, accept: string): Promise<Response & { status?: number }> {
  if (fixtures) {
    const hit = fixtureIndex[url];
    if (hit === undefined) return { ok: false, error: 'no fixture', status: 404 };
    if (typeof hit === 'object') return { ok: false, error: `HTTP ${hit.status}`, status: hit.status };
    return { ok: true, body: readFileSync(join(fixtures, hit), 'utf8') };
  }
  try {
    const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT, Accept: accept }, redirect: 'follow', signal: AbortSignal.timeout(30_000) });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}`, status: response.status };
    const length = Number(response.headers.get('content-length') ?? 0);
    if (length > MAX_BYTES) return { ok: false, error: `response too large (${length} bytes)` };
    const body = await response.text();
    if (body.length > MAX_BYTES) return { ok: false, error: `response too large (${body.length} characters)` };
    return { ok: true, body };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? (error.name === 'TimeoutError' ? 'timed out after 30 s' : error.message) : String(error) };
  }
}

// robots.txt, fetched once per host. A missing robots.txt (404) allows everything; an unreadable one blocks nothing
// either, but a 401 or 403 on robots.txt is read as "no robots allowed", as Google does.
const robotsCache = new Map<string, string | null>();
async function allowed(url: string): Promise<boolean> {
  const { origin } = new URL(url);
  if (!robotsCache.has(origin)) {
    const response = await get(`${origin}/robots.txt`, 'text/plain');
    robotsCache.set(origin, response.ok ? response.body : response.status === 401 || response.status === 403 ? 'User-agent: *\nDisallow: /' : null);
  }
  const robots = robotsCache.get(origin);
  return robots ? robotsAllows(robots, url) : true;
}

// At least a second between requests to a site, or its Crawl-delay if it asks for more (capped at a minute).
const gap = (url: string): number => {
  const robots = robotsCache.get(new URL(url).origin);
  const delay = robots ? robotsCrawlDelay(robots) : undefined;
  return Math.min(60_000, Math.max(1_000, (delay ?? 0) * 1_000));
};

const previous: State = statePath && existsSync(statePath) ? (JSON.parse(readFileSync(statePath, 'utf8')) as State) : emptyState();
const next: State = { version: 1, updated: today, sources: {}, failures: {} };
const sources = loadSources(ROOT, only);
const changes = new Map<string, { name: string; file: string; changes: Change[] }>();
const failing: { source: Source; failure: Failure }[] = [];
let baseline = 0;
let unchanged = 0;

const lastRequest = new Map<string, number>();
for (const source of sources) {
  const { url } = source.watch;
  const host = new URL(url).host;

  let error: string | undefined;
  if (!(await allowed(url))) {
    error = 'robots.txt asks robots not to fetch this page';
  } else {
    const wait = (lastRequest.get(host) ?? 0) + gap(url) - Date.now();
    if (wait > 0 && !fixtures) await new Promise((resolve) => setTimeout(resolve, wait));
    lastRequest.set(host, Date.now());
    const response = await get(url, ACCEPT[source.watch.type]);
    if (!response.ok) {
      error = response.error;
    } else {
      try {
        const found = extract(source.watch, response.body);
        const result = compare(previous.sources[source.key], found);
        next.sources[source.key] = { hash: found.hash, items: found.items, checked: today };
        if (result.kind === 'baseline') baseline++;
        if (result.kind === 'same') unchanged++;
        if (result.kind === 'changed') {
          for (const entry of source.entries) {
            const group = changes.get(entry.id) ?? { name: entry.name, file: entry.file, changes: [] };
            group.changes.push({ source, newItems: result.newItems });
            changes.set(entry.id, group);
          }
        }
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
      }
    }
  }
  if (error) {
    // Keep the last good snapshot, so the source is compared with it once it loads again.
    if (previous.sources[source.key]) next.sources[source.key] = previous.sources[source.key];
    const failure = { since: previous.failures[source.key]?.since ?? today, error };
    next.failures[source.key] = failure;
    failing.push({ source, failure });
  }
}

const report = [
  `Law Watch, ${today}: ${sources.length} sources checked. ${changes.size} ${changes.size === 1 ? 'jurisdiction has' : 'jurisdictions have'} a possible change; ${failing.length} ${failing.length === 1 ? 'source' : 'sources'} failed; ${unchanged} unchanged; ${baseline} new (baseline set).`,
];
for (const [id, group] of changes) report.push('', changeText(id, group.name, group.file, group.changes, today));
if (failing.length) report.push('', failureText(failing, today));
console.log(report.join('\n'));
if (summaryPath) appendFileSync(summaryPath, `${report.join('\n')}\n`);

if (writeStatePath) {
  mkdirSync(dirname(writeStatePath), { recursive: true });
  writeFileSync(writeStatePath, `${JSON.stringify(next, null, 2)}\n`);
}

if (openIssues) {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo || !process.env.GH_TOKEN) throw new Error('--issues needs GITHUB_REPOSITORY and GH_TOKEN');
  // REST through the gh CLI that GitHub's runners include; no third-party action (blueprint 3.10).
  const api = (path: string, method = 'GET', body?: object): unknown => {
    const args = ['api', '-X', method, '-H', 'Accept: application/vnd.github+json', path];
    if (body) args.push('--input', '-');
    const out = execFileSync('gh', args, { input: body ? JSON.stringify(body) : undefined, encoding: 'utf8' });
    return out ? JSON.parse(out) : undefined;
  };
  const ensureLabel = (name: string, color: string, description: string): void => {
    try {
      api(`repos/${repo}/labels/${encodeURIComponent(name)}`);
    } catch {
      api(`repos/${repo}/labels`, 'POST', { name, color, description });
    }
  };
  const openIssue = (labels: string[]): number | undefined => {
    const found = api(`repos/${repo}/issues?state=open&per_page=1&labels=${encodeURIComponent(labels.join(','))}`) as { number: number }[];
    return found[0]?.number;
  };

  ensureLabel('law-watch', '0b3d91', 'Law Watch: a possible change in an official source');
  for (const [id, group] of changes) {
    const label = `law:${id}`;
    ensureLabel(label, 'c5def5', `Law Watch issues for ${group.name}`);
    const body = changeText(id, group.name, group.file, group.changes, today, runUrl);
    const number = openIssue(['law-watch', label]);
    if (number) api(`repos/${repo}/issues/${number}/comments`, 'POST', { body });
    else api(`repos/${repo}/issues`, 'POST', { title: `[watch] Possible change: ${group.name} (${id})`, body, labels: ['law-watch', label] });
  }

  ensureLabel('law-watch-failing', 'd93f0b', 'Law Watch: sources that failed to load');
  const failingIssue = openIssue(['law-watch-failing']);
  if (failing.length) {
    const body = failureText(failing, today, runUrl);
    if (failingIssue) api(`repos/${repo}/issues/${failingIssue}`, 'PATCH', { body });
    else api(`repos/${repo}/issues`, 'POST', { title: '[watch] Source failing', body, labels: ['law-watch-failing'] });
  } else if (failingIssue) {
    api(`repos/${repo}/issues/${failingIssue}/comments`, 'POST', { body: `Every source loaded on ${today}.${runUrl ? ` Run: ${runUrl}` : ''}` });
    api(`repos/${repo}/issues/${failingIssue}`, 'PATCH', { state: 'closed', state_reason: 'completed' });
  }
}
