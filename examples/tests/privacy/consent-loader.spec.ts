// Positive control for the privacy test (9.9): it proves the browser's requests are being seen at
// all, and that the framework's consent loader (9.8) loads a vendor script only after consent.
import { test, expect } from '@playwright/test';

const VENDOR = 'analytics.vendor.invalid'; // .invalid never resolves, so nothing leaves the machine

test('the consent loader loads the vendor only after "Accept all", and logs the choice', async ({ page }) => {
  const vendorRequests: string[] = [];
  page.on('request', (req) => {
    if (new URL(req.url()).hostname === VENDOR) vendorRequests.push(req.url());
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  expect(vendorRequests, 'nothing loads before a choice is made').toEqual([]);

  const vendorLoaded = page.waitForRequest((req) => new URL(req.url()).hostname === VENDOR);
  const choiceLogged = page.waitForRequest((req) => req.url().endsWith('/api/privacy/consent') && req.method() === 'POST');
  await page.getByRole('button', { name: 'Accept all' }).click();
  await Promise.all([vendorLoaded, choiceLogged]);
  expect(vendorRequests).toHaveLength(1);
});

test('"Reject all" logs the choice and loads nothing', async ({ page }) => {
  const vendorRequests: string[] = [];
  page.on('request', (req) => {
    if (new URL(req.url()).hostname === VENDOR) vendorRequests.push(req.url());
  });

  await page.goto('/', { waitUntil: 'networkidle' });
  const choiceLogged = page.waitForRequest((req) => req.url().endsWith('/api/privacy/consent') && req.method() === 'POST');
  await page.getByRole('button', { name: 'Reject all' }).click();
  await choiceLogged;
  await page.waitForTimeout(500);
  expect(vendorRequests).toEqual([]);
});
