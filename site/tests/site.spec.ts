// Checks the built site the way the framework asks every project to check its own (9.9, 10.6):
// no cookies and no third-party requests on any page, no broken internal links, no axe
// violations on key pages, and search that works with an honest empty result (S6).
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const FIRST_PARTY = ['127.0.0.1', 'localhost'];
const PAGES = [...readFileSync(join(DIST, 'sitemap-0.xml'), 'utf8').matchAll(/<loc>https:\/\/[^/]+(\/[^<]*)<\/loc>/g)].map(
  (m) => m[1] ?? '/',
);

function thirdPartyRequests(page: Page): string[] {
  const urls: string[] = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.protocol.startsWith('http') && !FIRST_PARTY.includes(url.hostname)) urls.push(req.url());
  });
  return urls;
}

test('the sitemap lists every page', () => {
  expect(PAGES.length).toBeGreaterThan(25);
});

for (const path of PAGES) {
  test(`no cookies, no third-party requests, no broken links: ${path}`, async ({ page, context }) => {
    const thirdParty = thirdPartyRequests(page);
    await page.goto(path, { waitUntil: 'networkidle' });
    expect(thirdParty, 'third-party requests').toEqual([]);
    expect(await context.cookies(), 'cookies').toEqual([]);

    const hrefs = await page.$$eval('a[href^="/bansat/"]', (links) => links.map((a) => a.getAttribute('href') ?? ''));
    const broken = [...new Set(hrefs)]
      .map((href) => href.split('#')[0] ?? '')
      .filter((href) => {
        const rel = decodeURIComponent(href.replace(/^\/bansat\/?/, ''));
        return !existsSync(join(DIST, rel, 'index.html')) && !existsSync(join(DIST, rel));
      });
    expect(broken, 'internal links to pages that do not exist').toEqual([]);
  });
}

for (const path of ['/bansat/', '/bansat/framework/parts/07-security/', '/bansat/methods/', '/bansat/methods/scrum/', '/bansat/project/blueprint/']) {
  test(`axe finds no WCAG 2.2 AA violations: ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const found = results.violations.map((v) => `${v.id} (${v.help}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
    expect(found).toEqual([]);
  });
}

test('search finds a method, and says so plainly when nothing matches (S6)', async ({ page }) => {
  await page.goto('/bansat/');
  await page.getByRole('button', { name: /search/i }).first().click();
  const box = page.getByRole('searchbox').or(page.getByPlaceholder(/search/i)).first();
  await box.fill('Kanban');
  await expect(page.locator('.pagefind-ui__result').first()).toBeVisible({ timeout: 10_000 });
  await box.fill('zzqxjvwk');
  // S6: say plainly that nothing matched, and point to the contents.
  await expect(page.getByText(/no results for zzqxjvwk.*full contents/i).first()).toBeVisible({ timeout: 10_000 });
});

test('an unknown page shows the not-found page with a way back (S11)', async ({ page }) => {
  const response = await page.goto('/bansat/no-such-page/');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('a[href="/bansat/"]').first()).toBeVisible();
});
