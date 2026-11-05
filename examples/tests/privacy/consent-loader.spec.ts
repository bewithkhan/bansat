// Positive control for the privacy test (9.9): it proves the browser's requests are being seen at
// all, and that the framework's consent loader (9.7) loads a vendor script only after consent.
import { test, expect, type Page } from '@playwright/test';

const VENDOR = 'analytics.vendor.invalid'; // .invalid never resolves, so nothing leaves the machine
const FIRST_PARTY = ['127.0.0.1', 'localhost'];

function recordThirdPartyRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.protocol.startsWith('http') && !FIRST_PARTY.includes(url.hostname)) urls.push(req.url());
  });
  return urls;
}

test('the consent loader loads the vendor only after "Accept all", and logs the choice', async ({ page }) => {
  const thirdParty = recordThirdPartyRequests(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  expect(thirdParty, 'nothing loads before a choice is made').toEqual([]);

  const vendorLoaded = page.waitForRequest((req) => new URL(req.url()).hostname === VENDOR);
  const choiceLogged = page.waitForRequest((req) => req.url().endsWith('/api/privacy/consent') && req.method() === 'POST');
  await page.getByRole('button', { name: 'Accept all' }).click();
  await Promise.all([vendorLoaded, choiceLogged]);
  expect(thirdParty.map((url) => new URL(url).hostname)).toEqual([VENDOR]);
});

test('"Reject all" logs the choice and nothing third-party loads, before or after', async ({ page }) => {
  const thirdParty = recordThirdPartyRequests(page);
  await page.goto('/', { waitUntil: 'networkidle' });
  const choiceLogged = page.waitForRequest((req) => req.url().endsWith('/api/privacy/consent') && req.method() === 'POST');
  await page.getByRole('button', { name: 'Reject all' }).click();
  await choiceLogged;
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  expect(thirdParty).toEqual([]);
});
