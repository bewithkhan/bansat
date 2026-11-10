// Checks the built site the way the framework asks every project to check its own (9.9, 10.6):
// no cookies and no third-party requests on any page, no broken internal links, no axe
// violations on key pages, and search that works with an honest empty result (S6).
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

const DIST = fileURLToPath(new URL('../dist', import.meta.url));
const FIRST_PARTY = ['127.0.0.1', 'localhost'];
const LAWS = fileURLToPath(new URL('../../laws', import.meta.url));
const lawFiles = (tier: string): string[] =>
  existsSync(join(LAWS, tier)) ? readdirSync(join(LAWS, tier)).filter((f) => f.endsWith('.yaml')) : [];
const ENTRY_COUNT = lawFiles('full').length + lawFiles('basic').length;
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

for (const path of ['/bansat/', '/bansat/casebook/', '/bansat/framework/parts/07-security/', '/bansat/methods/', '/bansat/methods/scrum/', '/bansat/stacks/', '/bansat/stacks/supabase/', '/bansat/project/blueprint/', '/bansat/laws/', '/bansat/laws/uk/']) {
  test(`axe finds no WCAG 2.2 AA violations: ${path}`, async ({ page }) => {
    await page.goto(path);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    const found = results.violations.map((v) => `${v.id} (${v.help}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
    expect(found).toEqual([]);
  });
}

const STACKS = fileURLToPath(new URL('../../stacks', import.meta.url));
const stackIds = existsSync(STACKS) ? readdirSync(STACKS).filter((f) => f.endsWith('.md') && f !== 'README.md').map((f) => f.replace(/\.md$/, '')) : [];

test('every stack profile has a page, linked from the stack index (SCR-04)', async ({ page }) => {
  expect(stackIds.length).toBeGreaterThan(0);
  await page.goto('/bansat/stacks/');
  for (const id of stackIds) {
    expect(existsSync(join(DIST, 'stacks', id, 'index.html')), `stacks/${id} has no page`).toBe(true);
    await expect(page.locator(`main a[href="/bansat/stacks/${id}/"]`).first(), `the index doesn't link to ${id}`).toBeVisible();
  }
});

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

test.describe('law tracker', () => {
  test.skip(ENTRY_COUNT === 0, 'the registry has no entries yet');

  test('the index lists every jurisdiction, and the filters narrow it (SCR-01)', async ({ page }) => {
    await page.goto('/bansat/laws/');
    await expect(page.locator('[data-law-row]')).toHaveCount(ENTRY_COUNT);
    await expect(page.locator('[data-law-count]')).toHaveText(`${ENTRY_COUNT} jurisdictions`);
    await page.selectOption('#law-region', 'Europe');
    const shown = page.locator('[data-law-row]:not([hidden])');
    await expect(shown.first()).toBeVisible();
    expect(await shown.count()).toBeLessThan(ENTRY_COUNT);
    expect(await shown.evaluateAll((rows) => rows.every((r) => (r as HTMLElement).dataset.region === 'Europe'))).toBe(true);
  });

  test('every jurisdiction has a region for the filter', () => {
    const rows = JSON.parse(readFileSync(fileURLToPath(new URL('../src/data/laws.json', import.meta.url)), 'utf8')) as { id: string; region: string }[];
    expect(rows.filter((r) => r.region === 'Other').map((r) => r.id)).toEqual([]);
  });

  test('a filter that matches nothing says so and offers to clear it (S1)', async ({ page }) => {
    await page.goto('/bansat/laws/');
    await page.fill('#law-q', 'zzqxjvwk');
    await expect(page.getByText('No jurisdictions match these filters.')).toBeVisible();
    await page.locator('[data-law-clear]').click();
    await expect(page.locator('[data-law-row]:not([hidden])')).toHaveCount(ENTRY_COUNT);
  });

  test('a country page shows its laws, official sources and a way to report a change (SCR-02)', async ({ page }) => {
    await page.goto('/bansat/laws/uk/');
    await expect(page.getByRole('heading', { level: 1, name: 'United Kingdom' })).toBeVisible();
    await expect(page.locator('a[href^="https://www.legislation.gov.uk/"]').first()).toBeVisible();
    await expect(page.getByRole('link', { name: /open an issue with the official source/i })).toHaveAttribute(
      'href',
      /^https:\/\/github\.com\/bewithkhan\/bansat\/issues\/new\?title=/,
    );
  });

  test('an entry past its freshness window shows a stale badge (S15)', async ({ page }) => {
    await page.goto('/bansat/laws/uk/');
    const badge = page.locator('.bansat-fresh').first();
    const daysAgo = new Date(Date.now() - 45 * 864e5).toISOString().slice(0, 10);
    await badge.evaluate((el, d) => el.setAttribute('data-checked', d), daysAgo);
    await page.evaluate(() => (window as unknown as { bansatMarkFresh: () => void }).bansatMarkFresh());
    await expect(badge).toHaveText(/Stale: last checked 45 days ago/);
    await expect(badge).toHaveClass(/is-stale/);
  });

  test('basic entries carry the verify-before-relying banner (BR-04)', async ({ page }) => {
    const basic = lawFiles('basic');
    test.skip(basic.length === 0, 'no basic entries yet');
    await page.goto(`/bansat/laws/${basic[0]?.replace(/\.yaml$/, '')}/`);
    await expect(page.getByText('Verify with the official source before relying on it.')).toBeVisible();
  });

  test('an unknown jurisdiction shows the not-found page (S11)', async ({ page }) => {
    const response = await page.goto('/bansat/laws/xx-unknown/');
    expect(response?.status()).toBe(404);
  });

  test('the changes feed is Atom, with an entry per change (SCR-03)', async ({ request }) => {
    const response = await request.get('/bansat/laws/changes.xml');
    expect(response.ok()).toBe(true);
    const xml = await response.text();
    expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
    // The feed keeps the 100 newest changes; every jurisdiction has at least one.
    expect((xml.match(/<entry>/g) ?? []).length).toBeGreaterThanOrEqual(Math.min(ENTRY_COUNT, 100));
  });
});

