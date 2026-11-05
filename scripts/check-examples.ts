// Keeps examples/ identical to the code samples printed in the framework, so the code that CI
// tests is exactly the code people copy.
//
//   node scripts/check-examples.ts           exit 1 if any example differs from its sample (used in CI)
//   node scripts/check-examples.ts --write   copy each sample from the framework into examples/
//
// The framework is the source: edit the sample in framework/*.md, then run --write.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { FRAMEWORK_DIR } from './modules.ts';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const toLf = (text: string): string => text.replace(/\r\n?/g, '\n');

type Sample = { example: string; module: string; firstLine: string };

// Each sample is found by the first line of its code block.
const SAMPLES: Sample[] = [
  { example: 'prisma/schema.prisma', module: '05-data.md', firstLine: '// prisma/schema.prisma' },
  { example: 'prisma.config.ts', module: '05-data.md', firstLine: '// prisma.config.ts' },
  { example: 'supabase/policies/001_rls.sql', module: '05-data.md', firstLine: '-- supabase/policies/001_rls.sql' },
  { example: 'tests/rls/tenant_isolation.sql', module: '05-data.md', firstLine: '-- tests/rls/tenant_isolation.sql' },
  { example: 'lib/privacy/consent.ts', module: '09-privacy.md', firstLine: '// lib/privacy/consent.ts' },
  {
    example: 'tests/privacy/no-third-party-before-consent.spec.ts',
    module: '09-privacy.md',
    firstLine: '// tests/privacy/no-third-party-before-consent.spec.ts',
  },
  { example: 'lib/ui/view-state.tsx', module: '10-experience.md', firstLine: '// lib/ui/view-state.tsx' },
  { example: 'tests/rls/tables_without_rls.sql', module: '14-retrofit.md', firstLine: 'select c.relname as table_without_rls' },
];

function codeBlocks(markdown: string): string[] {
  return [...markdown.matchAll(/^```[\w-]*\n([\s\S]*?)^```$/gm)].map((m) => m[1] ?? '');
}

const write = process.argv.includes('--write');
const problems: string[] = [];
for (const sample of SAMPLES) {
  const markdown = toLf(readFileSync(join(ROOT, FRAMEWORK_DIR, sample.module), 'utf8'));
  const found = codeBlocks(markdown).filter((block) => block.startsWith(sample.firstLine));
  if (found.length !== 1) {
    problems.push(`${FRAMEWORK_DIR}/${sample.module}: expected one code block starting "${sample.firstLine}", found ${found.length}`);
    continue;
  }
  const text = found[0] ?? '';
  const target = join(ROOT, 'examples', sample.example);
  if (write) {
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, text);
    continue;
  }
  if (!existsSync(target)) problems.push(`examples/${sample.example} is missing`);
  else if (toLf(readFileSync(target, 'utf8')) !== text) {
    problems.push(`examples/${sample.example} differs from its sample in ${FRAMEWORK_DIR}/${sample.module}`);
  }
}

if (problems.length) {
  console.error(`check-examples: ${problems.length} problem(s)\n- ${problems.join('\n- ')}`);
  if (!write) console.error('Edit the sample in the framework, then run "node scripts/check-examples.ts --write".');
  process.exit(1);
}
console.log(write ? `Wrote ${SAMPLES.length} examples from the framework.` : `All ${SAMPLES.length} examples match the framework.`);
