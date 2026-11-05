// Checks that the privacy test catches a leak: it runs the framework's test against the
// deliberately leaky fixture page and expects it to fail, naming the third-party host.
import { spawnSync } from 'node:child_process';

const LEAK = 'fonts.vendor.invalid';
const result = spawnSync(
  'npx',
  [
    'playwright',
    'test',
    'tests/privacy/no-third-party-before-consent.spec.ts',
    '--grep',
    'no third-party requests before consent',
    '--reporter=line',
  ],
  { env: { ...process.env, PAGES: '/leaky/' }, encoding: 'utf8', shell: process.platform === 'win32' },
);
const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;

if (result.status === 0) {
  console.error('FAIL  the privacy test passed on a page that loads a third-party font before consent');
  process.exit(1);
}
if (!output.includes(LEAK)) {
  console.error(`FAIL  the privacy test failed, but not because of the leak:\n${output}`);
  process.exit(1);
}
console.log(`PASS  the privacy test fails on the leaky page and names ${LEAK}`);
