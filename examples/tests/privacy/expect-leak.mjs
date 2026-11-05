// Checks that the privacy test catches a leak: it runs the framework's test against the
// deliberately leaky fixture page and expects it to fail, naming the third-party host.
// Playwright's CLI is run with this Node, without a shell, so the arguments reach it intact on
// every platform.
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const LEAK = 'fonts.vendor.invalid';
const PLAYWRIGHT_CLI = fileURLToPath(new URL('../../node_modules/@playwright/test/cli.js', import.meta.url));

const result = spawnSync(
  process.execPath,
  [
    PLAYWRIGHT_CLI,
    'test',
    'tests/privacy/no-third-party-before-consent.spec.ts',
    '--grep',
    'no third-party requests before consent',
    '--reporter=line',
  ],
  {
    cwd: fileURLToPath(new URL('../..', import.meta.url)),
    env: { ...process.env, PAGES: '/leaky/' },
    encoding: 'utf8',
  },
);
const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;

if (result.status === 0) {
  console.error('FAIL  the privacy test passed on a page that loads a third-party font before consent');
  process.exit(1);
}
const ran = /(\d+) failed/.exec(output)?.[1];
if (!output.includes(LEAK) || ran !== '1') {
  console.error(`FAIL  expected exactly one failing test, caused by ${LEAK}:\n${output}`);
  process.exit(1);
}
console.log(`PASS  the privacy test fails on the leaky page and names ${LEAK}`);
