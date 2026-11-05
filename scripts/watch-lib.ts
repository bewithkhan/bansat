// The parts of Law Watch (blueprint FR-06) that don't touch the network or GitHub, so the tests can run them:
// reading the watch list from the registry, extracting items from feeds and pages, comparing with the last run,
// robots.txt rules, and writing the issue text.
//
// A snapshot keeps a hash plus each item's title, link and date, never the page text (BR-05).
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import * as cheerio from 'cheerio';
import { parse } from 'yaml';

export type WatchItem = { url: string; type: 'rss' | 'atom' | 'html' | 'api'; selector?: string; language: string };
export type Item = { title: string; link: string; date?: string };
export type Snapshot = { hash: string; items: Item[]; checked: string };
export type Failure = { since: string; error: string };
export type State = { version: 1; updated: string; sources: Record<string, Snapshot>; failures: Record<string, Failure> };
// One watched source, shared by every entry that lists the same URL and selector.
export type Source = { key: string; watch: WatchItem; entries: { id: string; name: string; file: string }[] };

export const USER_AGENT = 'Bansat-LawWatch/1.0 (+https://github.com/bewithkhan/bansat)';
export const MAX_ITEMS = 50;
export const emptyState = (): State => ({ version: 1, updated: '', sources: {}, failures: {} });

export const sourceKey = (w: WatchItem): string => (w.selector ? `${w.url} ${w.selector}` : w.url);
const clean = (text: string): string => text.replace(/\s+/g, ' ').trim();
const sha256 = (text: string): string => createHash('sha256').update(text).digest('hex');
const hashItems = (items: Item[]): string => sha256(items.map((i) => `${i.title}\u0000${i.link}\u0000${i.date ?? ''}`).join('\n'));

// Every watch item in the registry, grouped by source so each one is fetched once per run.
export function loadSources(root: string, only?: Set<string>): Source[] {
  const byKey = new Map<string, Source>();
  for (const tier of ['full', 'basic']) {
    const dir = join(root, 'laws', tier);
    if (!existsSync(dir)) continue;
    for (const name of readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort()) {
      const file = `laws/${tier}/${name}`;
      const entry = parse(readFileSync(join(dir, name), 'utf8')) as { id: string; name: string; watch?: WatchItem[] };
      if (only && !only.has(entry.id)) continue;
      for (const watch of entry.watch ?? []) {
        const key = sourceKey(watch);
        const source = byKey.get(key) ?? { key, watch, entries: [] };
        source.entries.push({ id: entry.id, name: entry.name, file });
        byKey.set(key, source);
      }
    }
  }
  return [...byKey.values()];
}

const absolute = (base: string, href: string): string => {
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
};

// Pull the items out of a response. Throws if the response isn't what the watch item says it is.
export function extract(watch: WatchItem, body: string): { hash: string; items: Item[] } {
  if (watch.type === 'rss' || watch.type === 'atom') {
    const $ = cheerio.load(body, { xml: true });
    if (watch.type === 'rss' && !$('rss, channel').length && !$('item').length) throw new Error("the response isn't an RSS feed");
    if (watch.type === 'atom' && !$('feed').length) throw new Error("the response isn't an Atom feed");
    const nodes = $(watch.type === 'rss' ? 'item' : 'entry').toArray().slice(0, MAX_ITEMS);
    const items = nodes.map((node): Item => {
      const el = $(node);
      const text = (tag: string): string => clean(el.children(tag).first().text());
      if (watch.type === 'rss') {
        return { title: text('title'), link: absolute(watch.url, text('link') || text('guid')), date: text('pubDate') || text('dc\\:date') || undefined };
      }
      const link = el.children('link[rel="alternate"]').attr('href') ?? el.children('link').first().attr('href') ?? text('id');
      return { title: text('title'), link: absolute(watch.url, link), date: text('updated') || text('published') || undefined };
    });
    return { hash: hashItems(items), items };
  }
  if (watch.type === 'html') {
    if (!watch.selector) throw new Error('an html watch item needs a selector');
    const $ = cheerio.load(body);
    const region = $(watch.selector);
    if (!region.length) throw new Error(`the selector "${watch.selector}" matched nothing`);
    region.find('script, style, noscript, template').remove();
    const items = region
      .find('a[href]')
      .toArray()
      .slice(0, MAX_ITEMS)
      .map((a): Item => {
        const link = absolute(watch.url, $(a).attr('href') ?? '');
        return { title: clean($(a).text()) || link, link };
      });
    // The hash covers the region's text, so an edit to a paragraph counts as well as a new link.
    return { hash: sha256(clean(region.text())), items };
  }
  // api: a JSON response. SPARQL results become items; any other JSON is hashed as a whole.
  let data: unknown;
  try {
    data = JSON.parse(body);
  } catch {
    throw new Error("the response isn't JSON");
  }
  const bindings = (data as { results?: { bindings?: Record<string, { value: string; type?: string }>[] } })?.results?.bindings;
  const items: Item[] = Array.isArray(bindings)
    ? bindings.slice(0, MAX_ITEMS).map((b) => {
        const values = Object.values(b);
        const uri = values.find((v) => v.type === 'uri')?.value ?? '';
        return { title: clean(values.filter((v) => v.type !== 'uri').map((v) => v.value).join(' · ')) || uri, link: uri };
      })
    : [];
  return { hash: sha256(canonical(data)), items };
}

const canonical = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value as object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((value as Record<string, unknown>)[k])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
};

export type Comparison = { kind: 'baseline' | 'same' | 'changed'; newItems: Item[] };

// A source seen for the first time sets a baseline and opens nothing.
export function compare(previous: Snapshot | undefined, next: { hash: string; items: Item[] }): Comparison {
  if (!previous) return { kind: 'baseline', newItems: [] };
  if (previous.hash === next.hash) return { kind: 'same', newItems: [] };
  const seen = new Set(previous.items.map((i) => i.link || i.title));
  return { kind: 'changed', newItems: next.items.filter((i) => !seen.has(i.link || i.title)) };
}

// robots.txt: the rules for our user agent, or for * if no group names us. Longest match wins; Allow wins a tie.
type RobotsGroup = { agents: string[]; rules: { allow: boolean; path: string }[]; crawlDelay?: number };
function robotsGroups(robots: string, agent: string): RobotsGroup[] {
  const groups: RobotsGroup[] = [];
  let current: RobotsGroup | undefined;
  let lastWasAgent = false;
  for (const raw of robots.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim();
    const match = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!match) continue;
    const field = match[1].toLowerCase();
    const value = match[2].trim();
    if (field === 'user-agent') {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }
    lastWasAgent = false;
    if (!current) continue;
    if ((field === 'allow' || field === 'disallow') && value) current.rules.push({ allow: field === 'allow', path: value });
    if (field === 'crawl-delay' && Number.isFinite(Number(value))) current.crawlDelay = Number(value);
  }
  const ours = groups.filter((g) => g.agents.some((a) => a !== '*' && agent.startsWith(a)));
  return ours.length ? ours : groups.filter((g) => g.agents.includes('*'));
}

// The Crawl-delay a site asks of us, in seconds, if any.
export function robotsCrawlDelay(robots: string, agent = 'bansat-lawwatch'): number | undefined {
  const delays = robotsGroups(robots, agent).map((g) => g.crawlDelay).filter((d): d is number => d !== undefined);
  return delays.length ? Math.max(...delays) : undefined;
}

export function robotsAllows(robots: string, url: string, agent = 'bansat-lawwatch'): boolean {
  const rules = robotsGroups(robots, agent).flatMap((g) => g.rules);
  const { pathname, search } = new URL(url);
  const target = pathname + search;
  let best: { allow: boolean; length: number } | undefined;
  for (const rule of rules) {
    const pattern = new RegExp(`^${rule.path.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\\\$$/, '$')}`);
    if (!pattern.test(target)) continue;
    if (!best || rule.path.length > best.length || (rule.path.length === best.length && rule.allow)) {
      best = { allow: rule.allow, length: rule.path.length };
    }
  }
  return best ? best.allow : true;
}

export type Change = { source: Source; newItems: Item[] };

const itemLine = (item: Item): string => {
  const title = item.title.replace(/[[\]]/g, '').slice(0, 200);
  return `- [${title}](${item.link})${item.date ? ` · ${item.date}` : ''}`;
};

// The text of a "possible change" issue (or of a comment on one already open) for one jurisdiction.
export function changeText(id: string, name: string, file: string, changes: Change[], date: string, runUrl?: string): string {
  const lines = [`Law Watch found a possible change in the official sources for **${name}** (\`${id}\`) on ${date}.`, ''];
  for (const { source, newItems } of changes) {
    lines.push(`**${source.watch.url}** (${source.watch.type}${source.watch.selector ? `, \`${source.watch.selector}\`` : ''}, ${source.watch.language})`);
    if (newItems.length) lines.push(...newItems.slice(0, 20).map(itemLine));
    if (newItems.length > 20) lines.push(`- …and ${newItems.length - 20} more`);
    if (!newItems.length) lines.push('- The watched content changed, with no new links. Compare the page with the entry.');
    lines.push('');
  }
  lines.push(
    `The verify task checks these against \`${file}\`. If a field needs to change, it prepares a pull request with official sources; if not, it comments with what it checked and labels this issue \`no-change\`. A person reviews every change.`,
  );
  if (runUrl) lines.push('', `Run: ${runUrl}`);
  return lines.join('\n');
}

export function failureText(failures: { source: Source; failure: Failure }[], date: string, runUrl?: string): string {
  const lines = [`Law Watch couldn't check these sources on ${date}. Each one is checked by hand until it loads again (A-05).`, '', '| Entry | Source | Problem | Failing since |', '|---|---|---|---|'];
  for (const { source, failure } of failures) {
    const ids = source.entries.map((e) => `\`${e.id}\``).join(', ');
    lines.push(`| ${ids} | ${source.watch.url} | ${failure.error.replace(/\|/g, '\\|').slice(0, 200)} | ${failure.since} |`);
  }
  if (runUrl) lines.push('', `Run: ${runUrl}`);
  return lines.join('\n');
}
