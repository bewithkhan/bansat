// tests/privacy/no-third-party-before-consent.spec.ts — fails CI if any page contacts a third party before consent
import { test, expect, type Page } from '@playwright/test';

const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS ?? 'localhost,127.0.0.1').split(','); // add your app domain + <project-ref>.supabase.co
const PAGES = (process.env.PAGES ?? '/,/pricing,/signup,/login').split(',');

function recordThirdPartyHosts(page: Page): Set<string> {
  const hosts = new Set<string>();
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (!url.protocol.startsWith('http')) return; // ignore data:, blob:
    const allowed = ALLOWED_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
    if (!allowed) hosts.add(url.hostname);
  });
  return hosts;
}

for (const path of PAGES) {
  test(`no third-party requests before consent: ${path}`, async ({ page }) => {
    const hosts = recordThirdPartyHosts(page);
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // catch late-loading tags
    expect([...hosts], 'third-party hosts contacted before consent').toEqual([]);
  });
}

test('nothing non-essential loads after "Reject all"', async ({ page }) => {
  const hosts = recordThirdPartyHosts(page); // record from the start, so a leak from the click itself counts
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject all' }).click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  expect([...hosts], 'third-party hosts contacted before or after rejecting').toEqual([]);
});
