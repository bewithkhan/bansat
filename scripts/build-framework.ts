// Builds reference/bansat-framework.md from the modules in framework/.
//
//   node scripts/build-framework.ts           write the combined file
//   node scripts/build-framework.ts --check   exit 1 if the combined file is out of date (used in CI)
//
// Edit the modules, never the combined file: CI fails if the two drift apart.
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { COMBINED_FILE, FRAMEWORK_DIR, MODULES } from './modules.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
// The header must make sense in a project's own docs/BLUEPRINT.md too, because people copy this file.
const HEADER =
  '<!-- Bansat framework, generated from framework/*.md by scripts/build-framework.ts ' +
  '(https://github.com/bewithkhan/bansat). If you copied this file to start a project blueprint, ' +
  'you can delete this line. -->\n';
const SEPARATOR = '\n\n---\n\n';

// Git on Windows may check files out with CRLF line endings; compare and build with LF only.
const toLf = (text: string): string => text.replace(/\r\n?/g, '\n');

function fail(message: string): never {
  console.error(`build-framework: ${message}`);
  process.exit(1);
}

function buildFramework(): string {
  const dir = join(ROOT, FRAMEWORK_DIR);
  const listed: readonly string[] = MODULES;
  const onDisk = readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'README.md');
  const missing = listed.filter((f) => !onDisk.includes(f));
  const unlisted = onDisk.filter((f) => !listed.includes(f));
  if (missing.length) fail(`listed in scripts/modules.ts but missing from ${FRAMEWORK_DIR}/: ${missing.join(', ')}`);
  if (unlisted.length) fail(`in ${FRAMEWORK_DIR}/ but not listed in scripts/modules.ts: ${unlisted.join(', ')}`);

  const parts = listed.map((file) => {
    const text = toLf(readFileSync(join(dir, file), 'utf8')).trim();
    if (!text) fail(`${FRAMEWORK_DIR}/${file} is empty`);
    // Parts and appendices start with "## "; sections of an appendix kept in their own module (E1, E2…) with "### ".
    if (file !== 'cover.md' && !/^<a id="[a-z0-9-]+"><\/a>\n#{2,3} /.test(text)) {
      fail(`${FRAMEWORK_DIR}/${file} must start with an <a id="..."></a> anchor line followed by a "## " or "### " heading`);
    }
    return text;
  });
  const combined = HEADER + parts.join(SEPARATOR) + '\n';
  checkAnchors(combined);
  return combined;
}

// Every in-document link such as [Part 9](#p9) must point at an anchor that exists.
function checkAnchors(markdown: string): void {
  const outsideCode = markdown.replace(/^```[\s\S]*?^```/gm, '');
  const ids = new Set([...outsideCode.matchAll(/<a id="([^"]+)"><\/a>/g)].map((m) => m[1]));
  const broken = [...outsideCode.matchAll(/\]\(#([^)]+)\)/g)].map((m) => m[1]).filter((id) => !ids.has(id));
  if (broken.length) fail(`links to missing anchors: ${[...new Set(broken)].map((id) => `#${id}`).join(', ')}`);
}

function main(): void {
  const combined = buildFramework();
  const outPath = join(ROOT, COMBINED_FILE);
  if (process.argv.includes('--check')) {
    const current = existsSync(outPath) ? toLf(readFileSync(outPath, 'utf8')) : '';
    if (current === combined) {
      console.log(`${COMBINED_FILE} is up to date (${MODULES.length} modules).`);
      return;
    }
    const a = current.split('\n');
    const b = combined.split('\n');
    let line = 0;
    while (line < a.length && line < b.length && a[line] === b[line]) line++;
    fail(
      `${COMBINED_FILE} is out of date (first difference at line ${line + 1}). ` +
        'Run "node scripts/build-framework.ts" and commit the result.',
    );
  }
  writeFileSync(outPath, combined);
  console.log(`Wrote ${COMBINED_FILE} from ${MODULES.length} modules.`);
}

main();
