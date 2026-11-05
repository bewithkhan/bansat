// Performance budgets for the built site (blueprint NFR-PERF-01), measured with Lighthouse's mobile profile
// (a mid-range phone on a throttled connection, simulated):
//   - LCP at most 2.5 s, CLS at most 0.1, and Total Blocking Time at most 200 ms on every page checked
//     (TBT is the lab stand-in for INP, which needs real users to measure);
//   - at most 50 KB of JavaScript on a country page.
// Run after `npm run build`:  npm run perf
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';
import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';

const PORT = 4329;
const ORIGIN = `http://127.0.0.1:${PORT}`;
const PAGES = [
  { path: '/bansat/', label: 'Home' },
  { path: '/bansat/framework/parts/09-privacy/', label: 'A long framework page' },
  { path: '/bansat/laws/', label: 'Law tracker index' },
  { path: '/bansat/laws/uk/', label: 'A country page', jsBudget: 50 * 1024 },
];
const BUDGET = { lcp: 2500, cls: 0.1, tbt: 200 };

// The preview server runs in its own process group, so it can be stopped with everything it starts.
const server = spawn('node_modules/.bin/astro', ['preview', '--host', '127.0.0.1', '--port', String(PORT), '--ignore-lock'], { stdio: 'ignore', detached: true });
const ready = async () => {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(`${ORIGIN}/bansat/`)).ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('the preview server did not start');
};

let chrome;
const failures = [];
try {
  await ready();
  chrome = await chromeLauncher.launch({ chromePath: chromium.executablePath(), chromeFlags: ['--headless=new', '--no-sandbox', '--disable-gpu'] });
  console.log('| Page | LCP | CLS | TBT | JavaScript |\n|---|---|---|---|---|');
  for (const page of PAGES) {
    const result = await lighthouse(`${ORIGIN}${page.path}`, { port: chrome.port, output: 'json', logLevel: 'error', onlyCategories: ['performance'] });
    const audits = result.lhr.audits;
    const lcp = audits['largest-contentful-paint'].numericValue;
    const cls = audits['cumulative-layout-shift'].numericValue;
    const tbt = audits['total-blocking-time'].numericValue;
    const scripts = (audits['network-requests'].details?.items ?? []).filter((r) => r.resourceType === 'Script');
    const js = scripts.reduce((sum, r) => sum + (r.transferSize ?? 0), 0);
    console.log(`| ${page.label} (${page.path}) | ${(lcp / 1000).toFixed(2)} s | ${cls.toFixed(3)} | ${Math.round(tbt)} ms | ${(js / 1024).toFixed(1)} KB |`);
    if (lcp > BUDGET.lcp) failures.push(`${page.path}: LCP ${(lcp / 1000).toFixed(2)} s is over 2.5 s`);
    if (cls > BUDGET.cls) failures.push(`${page.path}: CLS ${cls.toFixed(3)} is over 0.1`);
    if (tbt > BUDGET.tbt) failures.push(`${page.path}: Total Blocking Time ${Math.round(tbt)} ms is over 200 ms`);
    if (page.jsBudget && js > page.jsBudget) failures.push(`${page.path}: ${(js / 1024).toFixed(1)} KB of JavaScript is over ${page.jsBudget / 1024} KB`);
  }
} finally {
  await chrome?.kill();
  try {
    process.kill(-server.pid);
  } catch {}
}
if (failures.length) {
  console.error(`\nOver budget (NFR-PERF-01):\n- ${failures.join('\n- ')}`);
  process.exit(1);
}
console.log('\nEvery page is within the NFR-PERF-01 budgets.');
