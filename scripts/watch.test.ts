// Tests for Law Watch (scripts/watch-lib.ts and scripts/watch.ts). No network: the end-to-end runs answer from
// fixtures, replaying a known past change (the Data (Use and Access) Act 2025 amending the Data Protection Act 2018).
//   node scripts/watch.test.ts
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, stringify } from 'yaml';
import { changeText, compare, extract, failureText, loadSources, robotsAllows, robotsCrawlDelay, type Source, type WatchItem } from './watch-lib.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const WATCH = join(ROOT, 'scripts/watch.ts');

const FEED = 'https://www.legislation.gov.uk/changes/affected/ukpga/2018/12/data.feed';
const PAGE = 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/';
const SECRET_TEXT = 'This paragraph is page text and must never reach the state file.';

const atom = (entries: { title: string; link: string; updated: string }[]): string => `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Changes affecting the Data Protection Act 2018</title>
  <id>${FEED}</id>
  <updated>2025-06-20T00:00:00Z</updated>
  ${entries.map((e) => `<entry><title>${e.title}</title><id>${e.link}</id><link rel="alternate" href="${e.link}"/><updated>${e.updated}</updated></entry>`).join('\n  ')}
</feed>`;
const OLD_ENTRY = { title: 'Data Protection Act 2018 s. 3: words inserted by the Data Protection (Amendment) Regulations 2024', link: 'https://www.legislation.gov.uk/uksi/2024/1/regulation/2', updated: '2024-03-01T00:00:00Z' };
const NEW_ENTRY = { title: 'Data Protection Act 2018 s. 3: words substituted by the Data (Use and Access) Act 2025 c. 18, s. 70', link: 'https://www.legislation.gov.uk/ukpga/2025/18/section/70', updated: '2025-06-19T00:00:00Z' };

const html = (items: string[], paragraph = SECRET_TEXT): string => `<!doctype html><html><head><title>News</title><script>var t = Date.now();</script></head>
<body><nav><a href="/">Home</a></nav><main><div class="news-list"><p>${paragraph}</p>
${items.map((t, i) => `<article><a href="/about-the-ico/media-centre/news-and-blogs/2025/0${i + 1}/item-${i + 1}/">${t}</a></article>`).join('\n')}
<script>document.write(Math.random())</script></div></main></body></html>`;

const rss = `<?xml version="1.0"?><rss version="2.0"><channel><title>Regulator news</title>
<item><title>New guidance on cookies</title><link>https://www.cnil.fr/fr/cookies-2026</link><pubDate>Mon, 02 Nov 2026 09:00:00 GMT</pubDate></item>
<item><title>Sanction</title><guid>https://www.cnil.fr/fr/sanction-2026</guid></item></channel></rss>`;

const sparql = JSON.stringify({
  head: { vars: ['act', 'title', 'date'] },
  results: { bindings: [{ act: { type: 'uri', value: 'http://publications.europa.eu/resource/celex/32016R0679' }, title: { type: 'literal', value: 'GDPR consolidated' }, date: { type: 'literal', value: '2016-05-04' } }] },
});

let passed = 0;
const failures: string[] = [];
const test = (name: string, fn: () => void): void => {
  try {
    fn();
    passed++;
    console.log(`PASS  ${name}`);
  } catch (error) {
    failures.push(name);
    console.log(`FAIL  ${name}\n      ${error instanceof Error ? error.message.split('\n').join('\n      ') : error}`);
  }
};

const atomItem: WatchItem = { url: FEED, type: 'atom', language: 'en' };
const htmlItem: WatchItem = { url: PAGE, type: 'html', selector: '.news-list', language: 'en' };

test('an Atom feed gives each entry title, alternate link and date', () => {
  const { items } = extract(atomItem, atom([NEW_ENTRY, OLD_ENTRY]));
  assert.equal(items.length, 2);
  assert.deepEqual(items[0], { title: NEW_ENTRY.title, link: NEW_ENTRY.link, date: NEW_ENTRY.updated });
});

test('an RSS feed gives items, falling back to the guid for a link', () => {
  const { items } = extract({ url: 'https://www.cnil.fr/fr/rss.xml', type: 'rss', language: 'fr' }, rss);
  assert.equal(items.length, 2);
  assert.equal(items[0].date, 'Mon, 02 Nov 2026 09:00:00 GMT');
  assert.equal(items[1].link, 'https://www.cnil.fr/fr/sanction-2026');
});

test('a page keeps only the links inside the selector, made absolute, and ignores scripts', () => {
  const one = extract(htmlItem, html(['Fine for a retailer']));
  const two = extract(htmlItem, html(['Fine for a retailer']));
  assert.deepEqual(one.items, [{ title: 'Fine for a retailer', link: 'https://ico.org.uk/about-the-ico/media-centre/news-and-blogs/2025/01/item-1/' }]);
  assert.equal(one.hash, two.hash, 'scripts that change on every load must not change the hash');
});

test('an edited paragraph changes a page hash even with no new link', () => {
  const before = extract(htmlItem, html(['Fine for a retailer']));
  const after = extract(htmlItem, html(['Fine for a retailer'], 'The guidance was updated.'));
  assert.notEqual(before.hash, after.hash);
  assert.equal(compare({ ...before, checked: '2026-11-02' }, after).kind, 'changed');
});

test('a selector that matches nothing fails loudly', () => {
  assert.throws(() => extract({ ...htmlItem, selector: '.renamed-list' }, html([])), /matched nothing/);
});

test("a response that isn't the feed type it should be fails", () => {
  assert.throws(() => extract(atomItem, '<html><body>Access denied</body></html>'), /isn't an Atom feed/);
  assert.throws(() => extract({ url: 'https://op.europa.eu/sparql', type: 'api', language: 'en' }, '<html></html>'), /isn't JSON/);
});

test('SPARQL results become items with their URI as the link', () => {
  const { items } = extract({ url: 'https://publications.europa.eu/webapi/rdf/sparql', type: 'api', language: 'en' }, sparql);
  assert.deepEqual(items, [{ title: 'GDPR consolidated · 2016-05-04', link: 'http://publications.europa.eu/resource/celex/32016R0679' }]);
});

test('a first sighting sets a baseline; the same content is unchanged; a new entry is reported', () => {
  const before = extract(atomItem, atom([OLD_ENTRY]));
  const after = extract(atomItem, atom([NEW_ENTRY, OLD_ENTRY]));
  assert.equal(compare(undefined, before).kind, 'baseline');
  assert.equal(compare({ ...before, checked: '2026-11-02' }, before).kind, 'same');
  const result = compare({ ...before, checked: '2026-11-02' }, after);
  assert.equal(result.kind, 'changed');
  assert.deepEqual(result.newItems.map((i) => i.link), [NEW_ENTRY.link]);
});

test('robots.txt rules are respected: our own group first, longest match wins, Allow wins a tie', () => {
  const robots = 'User-agent: *\nDisallow: /\n\nUser-agent: Bansat-LawWatch\nDisallow: /private/\nAllow: /private/news$\n';
  assert.equal(robotsAllows(robots, 'https://example.gov/news'), true);
  assert.equal(robotsAllows(robots, 'https://example.gov/private/page'), false);
  assert.equal(robotsAllows(robots, 'https://example.gov/private/news'), true);
  assert.equal(robotsAllows('User-agent: *\nDisallow: /search\n', 'https://example.gov/search?q=1'), false);
  assert.equal(robotsAllows('User-agent: *\nDisallow:\n', 'https://example.gov/anything'), true);
  assert.equal(robotsAllows('User-agent: *\nDisallow: /*.pdf$\n', 'https://example.gov/a/b.pdf'), false);
});

test("a site's Crawl-delay is read for our group, or for * when no group names us", () => {
  // legislation.gov.uk's robots.txt asks every robot for a 5-second delay.
  assert.equal(robotsCrawlDelay('User-agent: *\nCrawl-delay: 5\nSitemap: http://www.legislation.gov.uk/sitemap-static.xml\n'), 5);
  assert.equal(robotsCrawlDelay('User-agent: *\nCrawl-delay: 5\n\nUser-agent: Bansat-LawWatch\nCrawl-delay: 2\n'), 2);
  assert.equal(robotsCrawlDelay('User-agent: *\nDisallow: /private\n'), undefined);
});

const source: Source = { key: FEED, watch: atomItem, entries: [{ id: 'uk', name: 'United Kingdom', file: 'laws/full/uk.yaml' }] };

test('the issue text names the jurisdiction, lists the new item and says what happens next', () => {
  const text = changeText('uk', 'United Kingdom', 'laws/full/uk.yaml', [{ source, newItems: [NEW_ENTRY] }], '2026-11-09', 'https://github.com/o/r/actions/runs/1');
  assert.match(text, /\*\*United Kingdom\*\* \(`uk`\) on 2026-11-09/);
  assert.match(text, new RegExp(NEW_ENTRY.link.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(text, /labels this issue `no-change`/);
  assert.match(text, /Run: https:\/\/github.com\/o\/r\/actions\/runs\/1/);
});

test('the failing-sources text lists each source with its entry and since when', () => {
  const text = failureText([{ source, failure: { since: '2026-11-02', error: 'HTTP 403' } }], '2026-11-09');
  assert.match(text, /\| `uk` \| https:\/\/www.legislation.gov.uk\/changes\/affected\/ukpga\/2018\/12\/data.feed \| HTTP 403 \| 2026-11-02 \|/);
});

// End to end, through the CLI, against a copy of the registry with watch items added to the UK entry.
const dir = mkdtempSync(join(tmpdir(), 'bansat-watch-'));
try {
  mkdirSync(join(dir, 'laws/full'), { recursive: true });
  mkdirSync(join(dir, 'watch'), { recursive: true });
  cpSync(join(ROOT, 'laws/schema.json'), join(dir, 'laws/schema.json'));
  cpSync(join(ROOT, 'watch/sources.yaml'), join(dir, 'watch/sources.yaml'));
  const uk = parse(readFileSync(join(ROOT, 'laws/full/uk.yaml'), 'utf8'));
  uk.watch = [atomItem, htmlItem];
  writeFileSync(join(dir, 'laws/full/uk.yaml'), stringify(uk));
  const ie = parse(readFileSync(join(ROOT, 'laws/full/ie.yaml'), 'utf8'));
  ie.watch = [{ url: 'https://www.dataprotection.ie/en/news-media/latest-news', type: 'html', selector: '.view-content', language: 'en' }];
  writeFileSync(join(dir, 'laws/full/ie.yaml'), stringify(ie));

  const fixtures = (name: string, files: Record<string, string>, index: Record<string, string | { status: number }>): string => {
    const f = join(dir, `fixtures-${name}`);
    mkdirSync(f, { recursive: true });
    for (const [file, body] of Object.entries(files)) writeFileSync(join(f, file), body);
    writeFileSync(join(f, 'index.json'), JSON.stringify(index));
    return f;
  };
  const run = (fixtureDir: string, state: string): { out: string; status: number | null } => {
    const r = spawnSync(process.execPath, [WATCH, '--root', dir, '--fixtures', fixtureDir, '--state', state, '--write-state', state], { encoding: 'utf8' });
    return { out: `${r.stdout}${r.stderr}`, status: r.status };
  };
  const statePath = join(dir, 'state/watch-state.json');
  const ieUrl = 'https://www.dataprotection.ie/en/news-media/latest-news';
  const ieHtml = '<html><body><div class="view-content"><a href="/en/news-media/press-releases/one">One</a></div></body></html>';
  const before = fixtures('before', { 'feed.xml': atom([OLD_ENTRY]), 'page.html': html(['Fine for a retailer']), 'ie.html': ieHtml }, { [FEED]: 'feed.xml', [PAGE]: 'page.html', [ieUrl]: 'ie.html' });
  const after = fixtures('after', { 'feed.xml': atom([NEW_ENTRY, OLD_ENTRY]), 'page.html': html(['Fine for a retailer']), 'ie.html': ieHtml }, { [FEED]: 'feed.xml', [PAGE]: 'page.html', [ieUrl]: 'ie.html' });
  const broken = fixtures('broken', { 'feed.xml': atom([NEW_ENTRY, OLD_ENTRY]), 'page.html': html(['Fine for a retailer']) }, { [FEED]: 'feed.xml', [PAGE]: 'page.html', [ieUrl]: { status: 403 } });
  const blocked = fixtures('blocked', { 'feed.xml': atom([NEW_ENTRY, OLD_ENTRY]), 'page.html': html(['Fine for a retailer']), 'ie.html': ieHtml, 'robots.txt': 'User-agent: *\nDisallow: /en/news-media/\n' }, { [FEED]: 'feed.xml', [PAGE]: 'page.html', [ieUrl]: 'ie.html', 'https://www.dataprotection.ie/robots.txt': 'robots.txt' });

  test('the first run sets a baseline and reports no change', () => {
    const { out, status } = run(before, statePath);
    assert.equal(status, 0, out);
    assert.match(out, /3 sources checked\. 0 jurisdictions have a possible change; 0 sources failed; 0 unchanged; 3 new \(baseline set\)/);
  });

  test('the state file holds hashes, titles and links, never page text (BR-05)', () => {
    const state = readFileSync(statePath, 'utf8');
    assert.ok(!state.includes(SECRET_TEXT), 'page text leaked into the state file');
    assert.ok(state.includes('Fine for a retailer'));
    assert.equal(JSON.parse(state).version, 1);
  });

  test('dry run of a known past change: the Data (Use and Access) Act 2025 shows up for the UK only', () => {
    const { out, status } = run(after, statePath);
    assert.equal(status, 0, out);
    assert.match(out, /1 jurisdiction has a possible change; 0 sources failed; 2 unchanged/);
    assert.match(out, /\*\*United Kingdom\*\* \(`uk`\)/);
    assert.match(out, /Data \(Use and Access\) Act 2025 c\. 18, s\. 70\]\(https:\/\/www\.legislation\.gov\.uk\/ukpga\/2025\/18\/section\/70\)/);
    assert.doesNotMatch(out, /Ireland/);
  });

  test('a failing source is reported, and its last good snapshot is kept', () => {
    const { out, status } = run(broken, statePath);
    assert.equal(status, 0, out);
    assert.match(out, /1 source failed/);
    assert.match(out, /\| `ie` \| https:\/\/www\.dataprotection\.ie\/en\/news-media\/latest-news \| HTTP 403 \|/);
    const state = JSON.parse(readFileSync(statePath, 'utf8'));
    assert.ok(state.sources[`${ieUrl} .view-content`], 'the last good snapshot was dropped');
  });

  test('a page robots.txt disallows is not fetched, and is reported', () => {
    const { out } = run(blocked, statePath);
    assert.match(out, /robots\.txt asks robots not to fetch this page/);
  });

  test('with --issues, a change opens one labelled issue per jurisdiction, and failures go in one issue', () => {
    // A stand-in for the gh CLI that logs each call and answers like an empty repo.
    const bin = join(dir, 'bin');
    mkdirSync(bin, { recursive: true });
    const log = join(dir, 'gh-calls.jsonl');
    writeFileSync(join(bin, 'gh'), `#!${process.execPath}
const fs = require('node:fs');
const args = process.argv.slice(2);
const input = args.includes('--input') ? fs.readFileSync(0, 'utf8') : '';
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify({ args, input: input ? JSON.parse(input) : null }) + '\\n');
const path = args.find((a) => a.startsWith('repos/'));
const method = args[args.indexOf('-X') + 1];
if (method === 'GET' && /\\/labels\\//.test(path)) process.exit(1);
process.stdout.write(method === 'GET' ? '[]' : '{}');
`, { mode: 0o755 });
    const fresh = join(dir, 'state-issues/watch-state.json');
    run(before, fresh);
    const r = spawnSync(process.execPath, [WATCH, '--root', dir, '--fixtures', broken, '--state', fresh, '--issues'], {
      encoding: 'utf8',
      env: { ...process.env, PATH: `${bin}:${process.env.PATH}`, GITHUB_REPOSITORY: 'o/r', GH_TOKEN: 'test', GITHUB_RUN_ID: '42', GITHUB_SERVER_URL: 'https://github.com' },
    });
    assert.equal(r.status, 0, `${r.stdout}${r.stderr}`);
    const calls = readFileSync(log, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    const created = calls.filter((c) => c.args.includes('POST') && c.args.includes('repos/o/r/issues'));
    assert.deepEqual(created.map((c) => c.input.title), ['[watch] Possible change: United Kingdom (uk)', '[watch] Source failing']);
    assert.deepEqual(created[0].input.labels, ['law-watch', 'law:uk']);
    assert.match(created[0].input.body, /Run: https:\/\/github\.com\/o\/r\/actions\/runs\/42/);
    assert.deepEqual(created[1].input.labels, ['law-watch-failing']);
    const labels = calls.filter((c) => c.args.includes('POST') && c.args.includes('repos/o/r/labels')).map((c) => c.input.name);
    assert.deepEqual(labels, ['law-watch', 'law:uk', 'law-watch-failing']);
  });

  test('a source watched by two entries is fetched once and reported to both', () => {
    writeFileSync(join(dir, 'laws/full/ie.yaml'), stringify({ ...parse(readFileSync(join(dir, 'laws/full/ie.yaml'), 'utf8')), watch: [atomItem] }));
    const shared = loadSources(dir).filter((s) => s.key === FEED);
    assert.equal(shared.length, 1);
    assert.deepEqual(shared[0].entries.map((e) => e.id), ['ie', 'uk']);
    // A new watcher of a known source starts from its snapshot, so it sees nothing new.
    const { out } = run(after, statePath);
    assert.match(out, /2 sources checked\. 0 jurisdictions have a possible change/);
  });
} finally {
  rmSync(dir, { recursive: true, force: true });
}

console.log(failures.length ? `\n${failures.length} of ${passed + failures.length} tests failed` : `\nAll ${passed} tests passed`);
process.exit(failures.length ? 1 : 0);
