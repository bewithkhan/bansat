// Generates the site's pages from the repo: the framework modules, the stack profiles, the blueprint, the
// changelog and the tested-examples guide. Mermaid diagrams are drawn here as inline SVG, so the pages ship no
// diagram script and make no requests for one. Run by `npm run build`; the output is not committed.
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { MODULES } from '../../scripts/modules.ts';
import { writeTracker } from './laws.mjs';

const SITE = fileURLToPath(new URL('..', import.meta.url));
const REPO = join(SITE, '..');
const DOCS = join(SITE, 'src/content/docs');
const BASE = '/bansat/';
const REPO_URL = 'https://github.com/bewithkhan/bansat';
const MERMAID = join(SITE, 'node_modules/mermaid/dist/mermaid.min.js');

const read = (path) => readFileSync(join(REPO, path), 'utf8').replace(/\r\n?/g, '\n');

// Where each framework module goes, and its short sidebar label.
const METHOD_PAGES = {
  'appendix-e-methods.md': ['methods/index', 'Overview: every gate, every method'],
  'appendix-e1-scrum.md': ['methods/scrum', 'Scrum'],
  'appendix-e2-kanban.md': ['methods/kanban', 'Kanban'],
  'appendix-e3-stage-gates.md': ['methods/stage-gates', 'Stage gates'],
  'appendix-e4-shape-up.md': ['methods/shape-up', 'Shape Up'],
  'appendix-e5-solo.md': ['methods/solo', 'Solo loop'],
  'appendix-e6-scaled.md': ['methods/scaled', 'Scaled methods'],
};
const LABELS = {
  'cover.md': 'About the framework',
  'how-to-use.md': 'How to use it',
  '00-intake.md': '0 · Intake & risk',
  '01-prd.md': '1 · Product (PRD)',
  '02-nfr.md': '2 · Non-functional',
  '03-trd.md': '3 · Architecture (TRD)',
  '04-adrs.md': '4 · Decisions (ADRs)',
  '05-data.md': '5 · Data',
  '06-api.md': '6 · API',
  '07-security.md': '7 · Security',
  '08-ai.md': '8 · AI features',
  '09-privacy.md': '9 · Privacy & compliance',
  '10-experience.md': '10 · Experience & UI states',
  '11-delivery.md': '11 · Delivery',
  '12-agent-manual.md': '12 · Agent manual',
  '13-launch-gate.md': '13 · Launch gate',
  '14-retrofit.md': '14 · Existing & live projects',
  'appendix-a-templates.md': 'A · Templates',
  'appendix-b-references.md': 'B · References',
  'appendix-c-glossary.md': 'C · Glossary',
  'appendix-d-stacks.md': 'D · Stack profiles',
  'appendix-f-casebook.md': 'F · Breach casebook',
};

function slugFor(file) {
  if (METHOD_PAGES[file]) return METHOD_PAGES[file][0];
  if (file === 'appendix-f-casebook.md') return 'casebook';
  if (file === 'cover.md' || file === 'how-to-use.md') return `framework/${file.replace(/\.md$/, '')}`;
  if (file.startsWith('appendix-')) return `framework/appendices/${file.replace(/\.md$/, '')}`;
  return `framework/parts/${file.replace(/\.md$/, '')}`;
}
const urlFor = (slug) => `${BASE}${slug.replace(/(^|\/)index$/, '$1')}`.replace(/\/?$/, '/');

// Every in-document anchor (#p9, #appe1 …) and the page it now lives on.
const pages = MODULES.map((file, order) => {
  const text = read(`framework/${file}`);
  const anchor = /^<a id="([^"]+)"><\/a>/.exec(text)?.[1];
  return { file, order, text, anchor, slug: slugFor(file) };
});
const anchorUrls = new Map(pages.filter((p) => p.anchor).map((p) => [p.anchor, urlFor(p.slug)]));
anchorUrls.set('how', urlFor('framework/how-to-use'));

let browser;
let diagramPage;
let diagramCount = 0;
async function renderDiagram(code, label) {
  if (!diagramPage) {
    browser = await chromium.launch();
    diagramPage = await browser.newPage();
    await diagramPage.setContent('<!doctype html><html><body></body></html>');
    await diagramPage.addScriptTag({ path: MERMAID });
    await diagramPage.evaluate(() =>
      window.mermaid.initialize({ startOnLoad: false, theme: 'neutral', securityLevel: 'strict', fontFamily: 'system-ui, sans-serif' }),
    );
  }
  const id = `bansat-diagram-${++diagramCount}`;
  const svg = await diagramPage.evaluate(async ([source, svgId]) => (await window.mermaid.render(svgId, source)).svg, [code, id]);
  // An HTML block in Markdown ends at the first blank line, so the SVG must have none.
  const oneBlock = svg.replace(/\n\s*\n/g, '\n');
  const text = label.replace(/"/g, '&quot;');
  return `<figure class="bansat-diagram" role="img" aria-label="Diagram: ${text}">\n${oneBlock}\n</figure>`;
}

const DELIMITER_ROW = /^\|(\s*:?-+:?\s*\|)+\s*$/;
const plainText = (markdown) =>
  markdown.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/[`*_]/g, '').trim();
const attr = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Starlight lets a wide table scroll sideways, and a scrolling region must be reachable by keyboard
// (WCAG 2.1.1; axe: scrollable-region-focusable). Each table goes inside a focusable, named region
// that does the scrolling. Plain HTML blocks around a Markdown table work in any CommonMark parser.
const tableOpen = (heading) =>
  `<div class="bansat-table" tabindex="0" role="region" aria-label="${attr(`Table: ${heading}`)}">`;

// Turn one Markdown source into a page: drop the anchor and title lines, shift headings so the
// body starts at h2, draw diagrams, wrap tables, and point links at their new pages.
async function transform(text, sourcePath) {
  const lines = text.split('\n');
  if (/^<a id="[^"]+"><\/a>$/.test(lines[0] ?? '')) lines.shift();
  const titleIndex = lines.findIndex((l) => /^#{1,6} /.test(l));
  const titleLine = lines[titleIndex] ?? '';
  const level = /^(#+)/.exec(titleLine)?.[1].length ?? 1;
  const tag = /`\[([^\]]+)\]`\s*$/.exec(titleLine)?.[1];
  const title = titleLine.replace(/^#+\s*/, '').replace(/\s*`\[[^\]]+\]`\s*$/, '').replace(/`/g, '').trim();
  const body = lines.slice(titleIndex + 1);

  const out = [];
  let fence = null;
  let inTable = false;
  let lastHeading = title;
  for (let i = 0; i < body.length; i++) {
    const line = body[i];
    if (!fence && inTable && !line.startsWith('|')) {
      out.push('', '</div>', '');
      inTable = false;
    }
    const open = /^(`{3,})(\w*)/.exec(line);
    if (!fence && open) {
      if (open[2] === 'mermaid') {
        const code = [];
        while (++i < body.length && !body[i].startsWith(open[1])) code.push(body[i]);
        out.push(await renderDiagram(code.join('\n'), lastHeading));
        continue;
      }
      fence = open[1];
      out.push(line);
      continue;
    }
    if (fence) {
      if (line.startsWith(fence) && line.trim() === fence) fence = null;
      out.push(line);
      continue;
    }
    let l = line;
    const heading = /^(#{1,6}) (.*)$/.exec(l);
    if (heading) {
      const newLevel = Math.max(2, heading[1].length - (level - 1));
      l = `${'#'.repeat(newLevel)} ${heading[2]}`;
      lastHeading = plainText(heading[2]);
    }
    if (!inTable && line.startsWith('|') && DELIMITER_ROW.test(body[i + 1] ?? '')) {
      // Name the table by a short lead-in line ("**Where each gate falls:**") if it has one, else by its heading.
      let k = i - 1;
      while (k >= 0 && !body[k].trim()) k--;
      const lead = k >= 0 ? body[k].trim() : '';
      const leadName = /^\*\*[^*]+\*\*:?$/.test(lead) || (/:$/.test(lead) && lead.length <= 80) ? plainText(lead).replace(/:$/, '') : '';
      out.push('', tableOpen(leadName || lastHeading), '');
      inTable = true;
    }
    // Checklists stay readable as text: a task-list checkbox on a static page is an unlabelled form field.
    l = l.replace(/^(\s*[-*] )\[ \] /, '$1☐ ').replace(/^(\s*[-*] )\[[xX]\] /, '$1☑ ');
    l = l.replace(/\]\(#([^)]+)\)/g, (m, id) => (anchorUrls.has(id) ? `](${anchorUrls.get(id)})` : m));
    l = l.replace(/\]\((?!https?:|mailto:|#|\/)([^)\s]+\.md)(#[^)]*)?\)/g, (m, rel, hash = '') => {
      const target = posix.normalize(posix.join(posix.dirname(sourcePath), rel));
      return `](${REPO_URL}/blob/main/${target}${hash})`;
    });
    out.push(l);
  }
  if (inTable) out.push('', '</div>');
  return { title, tag, body: out.join('\n').replace(/\n{3,}/g, '\n\n').trim() };
}

function aside(tag) {
  if (!tag) return '';
  if (tag === 'CORE') return ':::note[Core]\nEvery project completes this part.\n:::\n\n';
  if (tag.startsWith('IF:')) return `:::tip[When it applies]\nComplete this part when Part 0 says it applies: ${tag.slice(3).trim()}.\n:::\n\n`;
  return `:::note\n${tag}.\n:::\n\n`;
}

function writePage(slug, { title, description, label, order, editPath, body }) {
  const frontmatter = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `description: ${JSON.stringify(description)}`,
    'sidebar:',
    `  label: ${JSON.stringify(label ?? title)}`,
    `  order: ${order}`,
    `editUrl: ${JSON.stringify(`${REPO_URL}/edit/main/${editPath}`)}`,
    '---',
    '',
  ].join('\n');
  const path = join(DOCS, `${slug}.md`);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${frontmatter}${body}\n`);
}

for (const dir of ['framework', 'methods', 'project', 'laws', 'stacks']) rmSync(join(DOCS, dir), { recursive: true, force: true });

try {
  for (const page of pages) {
    const { title, tag, body } = await transform(page.text, `framework/${page.file}`);
    writePage(page.slug, {
      title,
      description: `${title}. Part of the Bansat framework.`,
      label: METHOD_PAGES[page.file]?.[1] ?? LABELS[page.file] ?? title,
      order: page.order,
      editPath: `framework/${page.file}`,
      body: aside(tag) + body,
    });
  }
  const project = [
    ['project/blueprint', 'docs/BLUEPRINT.md', 'Bansat v3 blueprint', 1],
    ['project/changelog', 'CHANGELOG.md', 'Changelog', 2],
    ['project/tested-examples', 'examples/README.md', 'Tested examples', 3],
  ];
  for (const [slug, source, label, order] of project) {
    if (!existsSync(join(REPO, source))) continue;
    const { title, body } = await transform(read(source), source);
    writePage(slug, { title, description: `${title}. From the Bansat repository.`, label, order, editPath: source, body });
  }
  // SCR-04: the stack profiles, an index page from stacks/README.md and one page per profile, in the README's order.
  const stacks = [];
  if (existsSync(join(REPO, 'stacks/README.md'))) {
    const index = read('stacks/README.md');
    const ids = [...index.matchAll(/\]\(([a-z0-9-]+)\.md\)/g)].map((m) => m[1]).filter((id) => existsSync(join(REPO, `stacks/${id}.md`)));
    const known = new Set(ids);
    // Links between profiles stay on the site; links to other repo files go to GitHub, as elsewhere.
    const local = (body) =>
      body.replace(/\]\(https:\/\/github\.com\/bewithkhan\/bansat\/blob\/main\/stacks\/([a-z0-9-]+)\.md(#[^)]*)?\)/g, (m, id, hash = '') =>
        known.has(id) ? `](${BASE}stacks/${id}/${hash})` : m,
      );
    const { title, body } = await transform(index, 'stacks/README.md');
    writePage('stacks/index', { title, description: 'What changes from the reference stack on 24 frameworks and platforms.', label: 'Overview', order: 0, editPath: 'stacks/README.md', body: local(body) });
    for (const [n, id] of ids.entries()) {
      const source = `stacks/${id}.md`;
      const page = await transform(read(source), source);
      writePage(`stacks/${id}`, { title: page.title, description: `${page.title}: what changes from Bansat's reference stack, from access control to the platform's limits.`, label: page.title, order: n + 1, editPath: source, body: local(page.body) });
      stacks.push(id);
    }
  }
  const tracker = await writeTracker({ repo: REPO, docs: DOCS, site: SITE, base: BASE, transform });
  console.log(`Generated ${pages.length + project.length} pages and ${diagramCount} diagrams, ${stacks.length} stack profiles, and the law tracker: ${tracker.count} jurisdictions, ${tracker.changes} changes.`);
} finally {
  await browser?.close();
}
