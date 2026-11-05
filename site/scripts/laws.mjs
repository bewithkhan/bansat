// The law tracker, generated from laws/*.yaml (blueprint Phase 5): an index with filters (SCR-01),
// a page per jurisdiction (SCR-02), the changes list and its Atom feed (SCR-03), and an About page
// (SCR-05). Run by scripts/sync-content.mjs; the output is not committed.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { parse } from 'yaml';

// Blueprint NFR-FRESH-01 and NFR-FRESH-02: days before an entry counts as stale.
export const FRESHNESS_DAYS = { full: 30, basic: 180 };

const SITE = 'https://bewithkhan.github.io';
const REPO_URL = 'https://github.com/bewithkhan/bansat';

const FIELDS = [
  ['scope', 'Who it covers'],
  ['lawful_bases', 'Lawful bases'],
  ['consent_age', 'Consent age for online services'],
  ['children', 'Children'],
  ['cookies', 'Cookies and similar technologies'],
  ['marketing', 'Electronic marketing'],
  ['breach_notice', 'Breach notification'],
  ['registration_or_fees', 'Registration and fees'],
  ['dpo', 'Data protection officer'],
  ['transfers', 'International transfers'],
  ['dpia', 'Impact assessments'],
  ['automated_decisions_ai', 'Automated decisions and AI'],
  ['penalties', 'Penalties'],
];

const LAW_STATUS = { 'in-force': 'In force', enacted: 'Enacted, not yet in force', draft: 'Draft, not law', none: 'No law' };
const REVIEW = { 'ai-checked': 'AI-checked', 'human-reviewed': 'Human-reviewed', 'lawyer-reviewed': 'Lawyer-reviewed' };

// Regions for the index filter. A new jurisdiction must be added here: a test fails on "Other".
const REGIONS = {
  Europe: ['eu', 'uk', 'de', 'fr', 'ie', 'nl', 'it', 'es', 'ch', 'no', 'tr', 'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'gr', 'hu', 'is', 'li', 'lt', 'lu', 'lv', 'mt', 'pl', 'pt', 'ro', 'se', 'si', 'sk', 'al', 'ba', 'by', 'ge', 'md', 'me', 'mk', 'rs', 'ua', 'am', 'az', 'ad', 'mc', 'sm', 'gg', 'je', 'im', 'gi', 'fo', 'xk'],
  Americas: ['ca', 'br', 'mx', 'ar', 'cl', 'co', 'pe', 'uy', 'py', 'ec', 'bo', 've', 'cr', 'pa', 'do', 'jm', 'tt', 'bb', 'bs', 'bm', 'ky', 'ni', 'hn', 'gt', 'sv', 'ag', 'lc', 'gd', 'kn', 'vc', 'dm', 'cw', 'aw'],
  'Middle East & Africa': ['ae', 'sa', 'qa', 'il', 'ng', 'za', 'ke', 'eg', 'bh', 'kw', 'om', 'jo', 'lb', 'ma', 'tn', 'dz', 'gh', 'ug', 'rw', 'tz', 'zm', 'zw', 'bw', 'mu', 'sn', 'ci', 'bj', 'tg', 'ml', 'ne', 'bf', 'cm', 'ga', 'cg', 'cv', 'ao', 'mg', 'mw', 'ls', 'sz', 'na', 'et', 'so', 'sc', 'gq', 'mr', 'td', 'ly', 'ir', 'iq', 'ps', 'sy', 'ye'],
  'Asia-Pacific': ['cn', 'hk', 'mo', 'tw', 'jp', 'kr', 'in', 'sg', 'id', 'vn', 'th', 'my', 'ph', 'au', 'nz', 'pk', 'bd', 'lk', 'np', 'bt', 'mv', 'kh', 'la', 'mm', 'bn', 'mn', 'kz', 'kg', 'uz', 'tj', 'tm', 'af', 'fj', 'pg', 'ws', 'to', 'vu', 'sb'],
};
export function regionOf(id) {
  const root = id.startsWith('us') ? 'us' : id.split('-')[0];
  if (root === 'us') return 'Americas';
  for (const [region, ids] of Object.entries(REGIONS)) if (ids.includes(root)) return region;
  return 'Other';
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
export const shortDate = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1].slice(0, 3)} ${iso.slice(0, 4)}`;
export const longDate = (iso) => `${Number(iso.slice(8, 10))} ${MONTHS[Number(iso.slice(5, 7)) - 1]} ${iso.slice(0, 4)}`;
const daysSince = (iso, now) => Math.floor((now - Date.parse(`${iso}T00:00:00Z`)) / 864e5);
const text = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const cell = (s) => text(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const linkText = (url) => {
  const u = new URL(url);
  const path = decodeURIComponent(u.pathname).replace(/\/$/, '');
  const shown = `${u.hostname.replace(/^www\./, '')}${path}`;
  return shown.length > 72 ? `${shown.slice(0, 69)}…` : shown;
};

// Sub-national entries are named with their country, so "Alabama" reads as "Alabama (US)".
const PARENT = { us: 'US', ca: 'Canada', ae: 'UAE' };
export function displayName(entry) {
  const [root, rest] = entry.id.split('-');
  return rest && PARENT[root] && entry.id !== 'us-federal' ? `${entry.name} (${PARENT[root]})` : entry.name;
}

export function loadLaws(repo) {
  const entries = [];
  for (const tier of ['full', 'basic']) {
    const dir = join(repo, 'laws', tier);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => f.endsWith('.yaml')).sort()) {
      const entry = parse(readFileSync(join(dir, file), 'utf8'));
      entries.push({ ...entry, display: displayName(entry), source: `laws/${tier}/${file}` });
    }
  }
  return entries.sort((a, b) => a.display.localeCompare(b.display, 'en'));
}

function freshness(entry, now) {
  const window = FRESHNESS_DAYS[entry.tier] ?? 30;
  const days = daysSince(entry.checked.date, now);
  return { window, days, stale: days > window };
}

const freshBadge = (entry, f) =>
  `<span class="bansat-fresh${f.stale ? ' is-stale' : ''}" data-checked="${entry.checked.date}" data-window="${f.window}">Checked ${longDate(entry.checked.date)}${f.stale ? ` · Stale: last checked ${f.days} days ago` : ''}</span>`;

function reportUrl(entry) {
  const body = [
    `Jurisdiction: ${entry.display} (\`${entry.source}\`)`,
    '',
    'What has changed, or what is wrong:',
    '',
    'Official source (legislation, a gazette, the regulator or a court):',
    '',
    "Please don't include personal details: the registry stores none.",
  ].join('\n');
  const query = new URLSearchParams({ title: `[${entry.id}] Possible change: ${entry.display}`, body });
  return `${REPO_URL}/issues/new?${query.toString()}`;
}

function countryPage(entry, byId, base, now) {
  const f = freshness(entry, now);
  const pageUrl = (id) => `${base}laws/${id}/`;
  const lines = [];
  lines.push(
    `<p class="bansat-status"><span class="bansat-badge">${entry.tier === 'full' ? 'Full entry' : 'Basic entry'}</span> <span class="bansat-badge">${REVIEW[entry.checked.status] ?? entry.checked.status}${entry.checked.by ? ` by ${text(entry.checked.by)}` : ''}</span> ${freshBadge(entry, f)}</p>`,
    '',
  );
  if (entry.tier === 'basic') {
    lines.push(':::caution[Basic entry]', 'Verify with the official source before relying on it.', ':::', '');
  }
  if (entry.checked.status === 'ai-checked') {
    lines.push(
      ':::note[How this was checked]',
      `Checked against the official sources below with AI assistance on ${longDate(entry.checked.date)}. Nobody has reviewed it as a lawyer, and it isn't legal advice. Check the sources before you rely on a fact.`,
      ':::',
      '',
    );
  }
  const withIds = (entry.applies_with ?? []).filter((id) => byId.has(id));
  if (withIds.length) {
    lines.push(`Read this together with ${withIds.map((id) => `[${byId.get(id).display}](${pageUrl(id)})`).join(' and ')}, which also applies.`, '');
  }

  lines.push('## Laws', '', '| Law | Citation | Status | In force from |', '|---|---|---|---|');
  for (const law of entry.laws) {
    lines.push(
      `| [${cell(law.name)}](${law.official_url}) | ${cell(law.citation)} | ${LAW_STATUS[law.status] ?? law.status} | ${law.in_force_from ? longDate(law.in_force_from) : '—'} |`,
    );
  }
  const notes = entry.laws.filter((l) => l.notes);
  if (notes.length) {
    lines.push('', ...notes.map((l) => `- **${text(l.name)}:** ${text(l.notes)}`));
  }

  if (entry.regulators?.length) {
    lines.push('', '## Regulators', '', ...entry.regulators.map((r) => `- [${text(r.name)}](${r.url})`));
  }

  if (entry.obligations) {
    lines.push('', '## What builders must do');
    for (const [key, label] of FIELDS) {
      const o = entry.obligations[key];
      if (!o) continue;
      lines.push('', `### ${label}`, '', text(o.summary), '', `Sources: ${o.source.map((u) => `[${linkText(u)}](${u})`).join(' · ')}`);
      if (o.secondary?.length) lines.push('', `Leads, not sources: ${o.secondary.map((u) => `[${linkText(u)}](${u})`).join(' · ')}`);
    }
  }

  lines.push('', '## History', '', '| Date | Change |', '|---|---|');
  for (const h of entry.history) lines.push(`| ${longDate(h.date)} | ${cell(h.summary)}${h.pr ? ` ([pull request](${h.pr}))` : ''} |`);

  lines.push(
    '',
    '## Report a change',
    '',
    `If a law, a date or a figure here has changed, [open an issue with the official source](${reportUrl(entry)}). The data lives in [\`${entry.source}\`](${REPO_URL}/blob/main/${entry.source}).`,
  );
  return lines.join('\n');
}

function writePage(docs, slug, frontmatter, body) {
  const fm = ['---', ...Object.entries(frontmatter).map(([k, v]) => `${k}: ${typeof v === 'object' ? JSON.stringify(v) : JSON.stringify(v)}`), '---', ''].join('\n');
  const path = join(docs, `${slug}.${frontmatter.__mdx ? 'mdx' : 'md'}`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${fm.replace(/^__mdx: .*\n/m, '')}${body}\n`);
}

function atomFeed(changes, base, now) {
  const updated = changes[0]?.date ?? new Date(now).toISOString().slice(0, 10);
  const xml = (s) => text(s).replace(/"/g, '&quot;');
  const entries = changes.slice(0, 100).map((c, i) => {
    const url = `${SITE}${base}laws/${c.id}/`;
    return [
      '  <entry>',
      `    <id>tag:bewithkhan.github.io,2026:bansat/laws/${c.id}/${c.date}/${i}</id>`,
      `    <title>${xml(`${c.name}: ${c.summary}`)}</title>`,
      `    <link href="${url}"/>`,
      `    <updated>${c.date}T00:00:00Z</updated>`,
      `    <summary>${xml(c.summary)}</summary>`,
      '  </entry>',
    ].join('\n');
  });
  return [
    '<?xml version="1.0" encoding="utf-8"?>',
    '<feed xmlns="http://www.w3.org/2005/Atom">',
    '  <title>Bansat law tracker: changes</title>',
    `  <id>${SITE}${base}laws/changes/</id>`,
    `  <link rel="self" href="${SITE}${base}laws/changes.xml"/>`,
    `  <link href="${SITE}${base}laws/changes/"/>`,
    `  <updated>${updated}T00:00:00Z</updated>`,
    '  <author><name>Muhammad Tufail Khan</name></author>',
    ...entries,
    '</feed>',
    '',
  ].join('\n');
}

// Writes every tracker page. `transform` turns a repo Markdown file into page Markdown (from sync-content).
export async function writeTracker({ repo, docs, site, base, transform, now = Date.now() }) {
  const entries = loadLaws(repo);
  const byId = new Map(entries.map((e) => [e.id, e]));

  // SCR-02: one page per jurisdiction, kept out of the sidebar (the index lists them).
  for (const entry of entries) {
    writePage(
      docs,
      `laws/${entry.id}`,
      {
        title: entry.display,
        description: `${entry.display}: the data protection rules a builder must meet, with official sources. Checked ${longDate(entry.checked.date)}.`,
        sidebar: { hidden: true },
        editUrl: `${REPO_URL}/edit/main/${entry.source}`,
      },
      countryPage(entry, byId, base, now),
    );
  }

  // SCR-01: the index. The table and filters are a component; the rows come from this data file.
  const rows = entries.map((e) => {
    const f = freshness(e, now);
    return {
      id: e.id,
      name: e.display,
      tier: e.tier,
      region: regionOf(e.id),
      review: e.checked.status,
      reviewLabel: REVIEW[e.checked.status] ?? e.checked.status,
      checked: e.checked.date,
      checkedLabel: shortDate(e.checked.date),
      window: f.window,
      staleAtBuild: f.stale,
      href: `${base}laws/${e.id}/`,
    };
  });
  const dataPath = join(site, 'src/data/laws.json');
  mkdirSync(dirname(dataPath), { recursive: true });
  writeFileSync(dataPath, `${JSON.stringify(rows, null, 2)}\n`);
  writePage(
    docs,
    'laws/index',
    {
      __mdx: true,
      title: 'Law tracker',
      description: `The data protection rules a builder must meet in ${entries.length} jurisdictions, each fact linked to its official source.`,
      sidebar: { label: 'All jurisdictions', order: 0 },
      editUrl: false,
    },
    [
      "import LawIndex from '../../../components/LawIndex.astro';",
      "import entries from '../../../data/laws.json';",
      '',
      `The rules a builder must meet in each jurisdiction: who the law covers, consent, cookies, marketing, breach notice, registration, transfers, AI and penalties. Every fact links to an official source, and every entry says when it was last checked and how. It isn't legal advice: see [About the tracker](${base}laws/about/).`,
      '',
      '<LawIndex entries={entries} />',
    ].join('\n'),
  );

  // SCR-03: changes, newest first, with an Atom feed.
  const changes = entries
    .flatMap((e) => e.history.map((h) => ({ id: e.id, name: e.display, date: h.date, summary: h.summary, pr: h.pr })))
    .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name, 'en'));
  writePage(
    docs,
    'laws/changes',
    {
      title: 'Changes',
      description: 'Every change to the law registry, newest first, with an Atom feed.',
      sidebar: { order: 1 },
      editUrl: false,
    },
    [
      `Every change to the registry, newest first. Follow it with the [Atom feed](${base}laws/changes.xml), or watch the repository on GitHub.`,
      '',
      '| Date | Jurisdiction | Change |',
      '|---|---|---|',
      ...changes.map((c) => `| ${longDate(c.date)} | [${cell(c.name)}](${base}laws/${c.id}/) | ${cell(c.summary)}${c.pr ? ` ([pull request](${c.pr}))` : ''} |`),
    ].join('\n'),
  );
  const feedPath = join(site, 'public/laws/changes.xml');
  mkdirSync(dirname(feedPath), { recursive: true });
  writeFileSync(feedPath, atomFeed(changes, base, now));

  // SCR-05: About, from the registry's README plus the site's privacy and accessibility statements.
  const readme = join(repo, 'laws/README.md');
  if (existsSync(readme)) {
    const { body } = await transform(readFileSync(readme, 'utf8'), 'laws/README.md');
    writePage(
      docs,
      'laws/about',
      { title: 'About the tracker', description: 'How the law registry is built and checked, and what it is not.', sidebar: { order: 2 }, editUrl: `${REPO_URL}/edit/main/laws/README.md` },
      [
        body,
        '',
        '## Review levels',
        '',
        '- **AI-checked:** checked against the official sources with AI assistance. Every entry starts here.',
        '- **Human-reviewed:** a named person has checked it against the sources; the entry shows who.',
        '- **Lawyer-reviewed:** in the format, but unused: no lawyer reviews the registry.',
        '',
        `An entry counts as stale ${FRESHNESS_DAYS.full} days after its last check (${FRESHNESS_DAYS.basic} days for a basic entry), and its page says so.`,
        '',
        '## Privacy',
        '',
        "This site sets no cookies, runs no analytics and loads nothing from anyone else's servers. CI checks every page for both on every change. GitHub Pages hosts it, and GitHub may log visits as its own privacy statement describes.",
        '',
        '## Accessibility',
        '',
        "The site aims for WCAG 2.2 AA, and CI runs axe on key pages on every change. If something doesn't work for you, [open an issue](https://github.com/bewithkhan/bansat/issues).",
      ].join('\n'),
    );
  }
  return { count: entries.length, changes: changes.length };
}
