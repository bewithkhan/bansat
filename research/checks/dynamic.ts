// The dynamic checks: serve the built app, load it in Chromium, and record every request to another company's server
// (framework 9.9, the "Google Fonts problem", and the Playwright test the framework ships in 9.9).
//
//   no-third-party-before-consent  Loads the home page, the pages the spec names and the pages the home page links to
//                                  (up to 8), each in a fresh browser profile, with no click at all. Any request to a
//                                  host that isn't the app, its backend (spec `dynamic.allow`) or a host a person must
//                                  judge (spec `dynamic.review`, plus payment, consent-banner and CAPTCHA providers)
//                                  fails, and so does a tracker cookie (_ga, _fbp, _hj…) set before consent.
//   reject-all-honoured            Finds the cookie banner on the home page, clicks its Reject button, reloads, and
//                                  fails on any third-party request or tracker cookie. A banner with Accept and no
//                                  Reject fails too (launch trap 12). No banner at all is "not applicable": an app
//                                  that loads nothing optional needs none.
//
// Third-party requests are recorded and then blocked by default (`block`), so scoring sends nothing to real vendors
// and gives the same answer offline. A chain of loads (a tag manager pulling in more tags) stops at its first link,
// but that first request is already recorded, so blocking can hide extra evidence and never a failure.
import { readFile, stat } from 'node:fs/promises';
import { type Server, createServer } from 'node:http';
import { type ChildProcess, spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { extname, join, resolve, sep } from 'node:path';
import type { Browser, BrowserContext } from 'playwright';
import { type CheckResult, type Evidence, result } from './lib.ts';

export type DynamicOptions = {
  url?: string; // an app that's already running, or the address `start` will serve on
  staticDir?: string; // or a folder of built files, served here
  start?: string; // a shell command that starts the app (needs url)
  allow?: string[];
  review?: string[];
  pages?: string[];
  maxPages?: number;
  settleMs?: number;
  block?: boolean;
};
export type PageReport = { path: string; status?: number; thirdParty: { host: string; class: 'third-party' | 'review'; urls: string[] }[]; trackerCookies: string[]; error?: string };
export type DynamicReport = { base: string; pages: PageReport[]; banner?: { found: string[]; clicked?: string; after?: PageReport }; homeHeaders?: Record<string, string>; error?: string };

// Hosts that are strictly necessary on some pages only (a payment form, a consent banner run by a vendor, a CAPTCHA
// on a form). 9.9 allows them where they're needed, so a person judges each one rather than the script.
export const DEFAULT_REVIEW = ['js.stripe.com', 'm.stripe.network', 'm.stripe.com', 'checkout.stripe.com', 'hooks.stripe.com', 'consent.cookiebot.com', 'consentcdn.cookiebot.com', 'cdn.cookielaw.org', 'geolocation.onetrust.com', 'app.usercentrics.eu', 'cdn.iubenda.com', 'app.termly.io', 'cdn-cookieyes.com', 'challenges.cloudflare.com', 'hcaptcha.com'];
const LOOPBACK = ['localhost', '127.0.0.1', '::1', '[::1]'];
// Cookies that analytics, replay and advertising tools set, even when they set them from the app's own domain.
const TRACKER_COOKIE = /^(_ga|_gid|_gat|_gcl_|_fbp|_fbc|_hj|_clck|_clsk|_uetsid|_uetvid|_ttp|_tt_|ajs_|mp_|amp_|_pk_|ph_|_hp2_|li_|__hstc|hubspotutk|_lr_)/;
const ASSET = /\.(pdf|png|jpe?g|gif|svg|webp|avif|ico|css|js|mjs|json|xml|txt|zip|woff2?|ttf|mp4|webm|mp3)$/i;

const onList = (host: string, list: string[]): boolean => list.some((h) => host === h || host.endsWith(`.${h}`));

function loadPlaywright(): typeof import('playwright') {
  try {
    return createRequire(import.meta.url)('playwright') as typeof import('playwright');
  } catch {
    throw new Error('Playwright is not installed here. Install it (npm i -g playwright@1.63.0, then npx playwright install chromium) or point NODE_PATH at a copy.');
  }
}

// A small static file server for built output, on a free local port. Paths can't escape the folder.
const TYPES: Record<string, string> = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain', '.xml': 'application/xml' };
export async function serveStatic(dir: string): Promise<{ url: string; close: () => Promise<void> }> {
  const root = resolve(dir);
  const server: Server = createServer((req, res) => {
    void (async () => {
      const { pathname } = new URL(req.url ?? '/', 'http://127.0.0.1');
      const file = resolve(root, `.${decodeURIComponent(pathname)}`);
      if (file !== root && !file.startsWith(root + sep)) return res.writeHead(403).end();
      for (const candidate of [file, join(file, 'index.html'), `${file}.html`]) {
        try {
          if (!(await stat(candidate)).isFile()) continue;
          return res.writeHead(200, { 'content-type': TYPES[extname(candidate)] ?? 'application/octet-stream' }).end(await readFile(candidate));
        } catch {
          // try the next candidate
        }
      }
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found');
    })().catch(() => res.writeHead(500).end());
  });
  await new Promise<void>((done) => server.listen(0, '127.0.0.1', done));
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 0;
  return { url: `http://127.0.0.1:${port}`, close: () => new Promise((done) => server.close(() => done())) };
}

// Starts the app with its own command and waits until it answers (up to two minutes).
async function startApp(command: string, url: string): Promise<ChildProcess> {
  const child = spawn(command, { shell: true, detached: process.platform !== 'win32', stdio: 'ignore' });
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`"${command}" exited with code ${child.exitCode} before the app answered`);
    try {
      await fetch(url, { signal: AbortSignal.timeout(2_000) });
      return child;
    } catch {
      await new Promise((r) => setTimeout(r, 1_000));
    }
  }
  stopApp(child);
  throw new Error(`the app didn't answer at ${url} within two minutes of "${command}"`);
}
function stopApp(child: ChildProcess): void {
  try {
    if (child.pid && process.platform !== 'win32') process.kill(-child.pid, 'SIGTERM');
    else child.kill('SIGTERM');
  } catch {
    // already gone
  }
}

// A fresh browser profile that records every third-party request and WebSocket while `armed` is true.
type Recorder = { report: PageReport; context: BrowserContext; note: (url: string) => void; armed: boolean; cookiesBefore: Set<string> };
async function openRecorder(browser: Browser, path: string, base: URL, opts: Required<Pick<DynamicOptions, 'allow' | 'review' | 'block'>>): Promise<Recorder> {
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const report: PageReport = { path, thirdParty: [], trackerCookies: [] };
  const classify = (raw: string): 'first' | 'review' | 'third-party' | undefined => {
    let u: URL;
    try {
      u = new URL(raw);
    } catch {
      return undefined;
    }
    if (!/^(https?|wss?):$/.test(u.protocol)) return undefined; // data:, blob:, chrome-extension:
    const host = u.hostname.toLowerCase();
    if (host === base.hostname || LOOPBACK.includes(host) || onList(host, opts.allow)) return 'first';
    return onList(host, opts.review) ? 'review' : 'third-party';
  };
  const rec: Recorder = { report, context, armed: true, cookiesBefore: new Set(), note: () => undefined };
  rec.note = (raw: string): void => {
    const c = classify(raw);
    if (!rec.armed || !c || c === 'first') return;
    const host = new URL(raw).hostname.toLowerCase();
    let entry = report.thirdParty.find((t) => t.host === host);
    if (!entry) report.thirdParty.push((entry = { host, class: c, urls: [] }));
    if (entry.urls.length < 3) entry.urls.push(raw.length > 200 ? `${raw.slice(0, 197)}...` : raw);
  };
  context.on('request', (r) => rec.note(r.url()));
  context.on('page', (p) => p.on('websocket', (ws) => rec.note(ws.url())));
  if (opts.block) {
    // The `request` event above has already recorded each request by the time it reaches this route.
    await context.route('**/*', (route) => {
      const c = classify(route.request().url());
      return c === 'third-party' || c === 'review' ? route.abort('blockedbyclient') : route.continue();
    });
    // WebSockets aren't routed with HTTP requests; refuse third-party ones too.
    await context.routeWebSocket(/.*/, (ws) => (classify(ws.url()) === 'first' ? ws.connectToServer() : ws.close()));
  }
  return rec;
}
// The tracker cookies in the profile right now.
const trackerCookies = async (r: Recorder): Promise<string[]> => (await r.context.cookies()).filter((c) => TRACKER_COOKIE.test(c.name)).map((c) => `${c.name} (${c.domain})`);
// Keeps the tracker cookies that appeared after recording was armed, then closes the profile.
async function closeRecorder(r: Recorder): Promise<void> {
  r.report.trackerCookies = r.armed ? (await trackerCookies(r)).filter((c) => !r.cookiesBefore.has(c)) : [];
  await r.context.close();
}

// Loads one page with no interaction and returns what it contacted, plus its same-origin links.
async function visit(browser: Browser, base: URL, path: string, opts: Required<Pick<DynamicOptions, 'allow' | 'review' | 'block' | 'settleMs'>>): Promise<{ report: PageReport; links: string[]; headers?: Record<string, string> }> {
  const rec = await openRecorder(browser, path, base, opts);
  let links: string[] = [];
  let headers: Record<string, string> | undefined;
  try {
    const page = await rec.context.newPage();
    const response = await page.goto(new URL(path, base).toString(), { waitUntil: 'load', timeout: 30_000 });
    rec.report.status = response?.status();
    headers = response?.headers();
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(opts.settleMs); // catch late-loading tags, as the framework's own test does
    links = await page.$$eval('a[href]', (as) => as.map((a) => (a as HTMLAnchorElement).href));
  } catch (error) {
    rec.report.error = error instanceof Error ? error.message.split('\n')[0] : String(error);
  }
  await closeRecorder(rec);
  return { report: rec.report, links, headers };
}

// The words of a banner's first-layer choices. "Reject" covers the usual ways of saying no: "Reject all", "Decline",
// "Only necessary cookies", "Use essential cookies only", and the CNIL's "Continue without accepting".
const REJECT = /^(reject|decline|refuse|deny|disagree)(\s+all)?(\s+(cookies|non-essential( cookies)?|optional( cookies)?|tracking))?(\s+and\s+close)?$|^(use\s+|accept\s+|allow\s+)?(only\s+)?(strictly\s+)?(necessary|essential)(\s+cookies)?(\s+only)?$|^continue without (accepting|agreeing)$|^no,? thanks$/i;
const ACCEPT = /^(accept|allow|agree|i agree|i accept|yes,? i agree|accept and (continue|close)|allow and continue)(\s+all)?(\s+cookies)?$/i;
const ACKNOWLEDGE = /^(ok|okay|got it|i understand|understood|continue|close|dismiss)$/i;

// Finds the banner's buttons on the home page, clicks Reject if there is one, reloads and records. Only what happens
// from the click on is counted: anything before it is the before-consent check's finding, not this one's.
async function rejectFlow(browser: Browser, base: URL, opts: Required<Pick<DynamicOptions, 'allow' | 'review' | 'block' | 'settleMs'>>): Promise<DynamicReport['banner']> {
  const rec = await openRecorder(browser, '/ (after Reject)', base, opts);
  rec.armed = false;
  const banner: NonNullable<DynamicReport['banner']> = { found: [] };
  try {
    const page = await rec.context.newPage();
    await page.goto(base.toString(), { waitUntil: 'load', timeout: 30_000 });
    await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
    await page.waitForTimeout(500);
    // A banner button: a visible control whose words are a consent choice, inside a block (below <body>, at most four
    // levels up, under 1,500 characters) that talks about cookies or consent. So "Accept invitation" elsewhere on
    // the page, or a footer's "Cookie settings" link, doesn't make the page look like it has a banner.
    const candidates = await page.evaluate(() => {
      const CHOICE = /accept|allow|agree|reject|decline|refuse|deny|necessary|essential|^ok(ay)?$|got it|understand|continue|close|dismiss|manage|settings|preferences|customi[sz]e|choices|no,? thanks/i;
      const label = (el: Element): string => ((el as HTMLElement).innerText || (el as HTMLInputElement).value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ');
      const inBanner = (el: Element): boolean => {
        let n: Element | null = el.parentElement;
        for (let i = 0; i < 4 && n && n !== document.body && n !== document.documentElement; i++, n = n.parentElement) {
          const text = n.textContent ?? '';
          if (text.length < 1500 && /cookie|consent|tracking|analytics|your privacy|privacy choices/i.test(text)) return true;
        }
        return false;
      };
      return [...document.querySelectorAll('button, [role="button"], a, input[type="button"], input[type="submit"]')]
        .map((el, i) => {
          el.setAttribute('data-bansat-candidate', String(i));
          const box = (el as HTMLElement).getBoundingClientRect();
          return { i, label: label(el), banner: inBanner(el), visible: box.width > 0 && box.height > 0 };
        })
        .filter((c) => c.banner && c.visible && c.label && c.label.length <= 60 && CHOICE.test(c.label));
    });
    banner.found = candidates.map((c) => c.label);
    const reject = candidates.find((c) => REJECT.test(c.label));
    if (reject) {
      banner.clicked = reject.label;
      rec.cookiesBefore = new Set(await trackerCookies(rec));
      rec.armed = true;
      await page.click(`[data-bansat-candidate="${reject.i}"]`, { timeout: 5_000 });
      await page.waitForTimeout(500);
      await page.reload({ waitUntil: 'load', timeout: 30_000 });
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined);
      await page.waitForTimeout(opts.settleMs);
    }
  } catch (error) {
    rec.report.error = error instanceof Error ? error.message.split('\n')[0] : String(error);
  }
  await closeRecorder(rec);
  banner.after = rec.report;
  return banner;
}

const describe = (p: PageReport): Evidence[] => [
  ...p.thirdParty.map((t) => ({ note: `${p.path}: ${t.class === 'review' ? 'contacted (needs review)' : 'contacted'} ${t.host}`, text: t.urls[0] })),
  ...p.trackerCookies.map((c) => ({ note: `${p.path}: tracker cookie set: ${c}` })),
];

export async function runDynamic(options: DynamicOptions): Promise<{ beforeConsent: CheckResult; rejectAll: CheckResult; report: DynamicReport }> {
  const opts = { allow: options.allow ?? [], review: [...DEFAULT_REVIEW, ...(options.review ?? [])], block: options.block ?? true, settleMs: options.settleMs ?? 1_500 };
  let server: { url: string; close: () => Promise<void> } | undefined;
  let child: ChildProcess | undefined;
  let browser: Browser | undefined;
  const report: DynamicReport = { base: '', pages: [] };
  try {
    if (options.staticDir) server = await serveStatic(options.staticDir);
    if (options.start) {
      if (!options.url) throw new Error('--start needs --url, the address the app will serve on');
      child = await startApp(options.start, options.url);
    }
    const baseText = server?.url ?? options.url;
    if (!baseText) throw new Error('give the dynamic check a --url, a --static folder, or --start with --url');
    const base = new URL(baseText.endsWith('/') ? baseText : `${baseText}/`);
    report.base = base.toString();
    browser = await loadPlaywright().chromium.launch();

    const queue = ['/', ...(options.pages ?? [])];
    const seen = new Set<string>();
    const max = options.maxPages ?? 8;
    while (queue.length && report.pages.length < max) {
      const path = queue.shift()!;
      if (seen.has(path)) continue;
      seen.add(path);
      const { report: page, links, headers } = await visit(browser, base, path, opts);
      if (path === '/') report.homeHeaders = headers;
      report.pages.push(page);
      for (const href of links) {
        try {
          const u = new URL(href);
          if (u.origin !== base.origin || ASSET.test(u.pathname) || /^\/api\//.test(u.pathname)) continue;
          if (!seen.has(u.pathname) && !queue.includes(u.pathname)) queue.push(u.pathname);
        } catch {
          // not a URL
        }
      }
    }
    report.banner = await rejectFlow(browser, base, opts);
  } catch (error) {
    report.error = error instanceof Error ? error.message : String(error);
  } finally {
    await browser?.close().catch(() => undefined);
    if (child) stopApp(child);
    await server?.close();
  }
  return { ...judge(report), report };
}

// Turns what was recorded into the two check results.
export function judge(report: DynamicReport): { beforeConsent: CheckResult; rejectAll: CheckResult } {
  const loaded = report.pages.filter((p) => !p.error && (p.status ?? 0) < 400);
  if (report.error || !loaded.length) {
    const why = report.error ?? report.pages.map((p) => `${p.path}: ${p.error ?? `HTTP ${p.status}`}`).join('; ');
    const r = result('needs-review', `The app couldn't be loaded, so nothing was recorded (${why}). Record whether it builds and runs.`, [], 1);
    return { beforeConsent: r, rejectAll: r };
  }
  const evidence = report.pages.flatMap(describe);
  const thirdHosts = new Set(report.pages.flatMap((p) => p.thirdParty.filter((t) => t.class === 'third-party').map((t) => t.host)));
  const reviewHosts = new Set(report.pages.flatMap((p) => p.thirdParty.filter((t) => t.class === 'review').map((t) => t.host)));
  const cookies = new Set(report.pages.flatMap((p) => p.trackerCookies));
  const visited: Evidence = { note: `pages loaded: ${loaded.map((p) => p.path).join(', ')}${report.pages.length > loaded.length ? `; failed: ${report.pages.filter((p) => !loaded.includes(p)).map((p) => p.path).join(', ')}` : ''}` };
  let beforeConsent: CheckResult;
  if (thirdHosts.size || cookies.size) beforeConsent = result('fail', `Before any consent, the browser contacted ${thirdHosts.size} third-party host${thirdHosts.size === 1 ? '' : 's'}${cookies.size ? ` and got ${cookies.size} tracker cookie${cookies.size === 1 ? '' : 's'}` : ''} (9.9).`, [visited, ...evidence], thirdHosts.size + cookies.size);
  else if (reviewHosts.size) beforeConsent = result('needs-review', `Before consent, the browser contacted only hosts that may be strictly necessary on some pages: ${[...reviewHosts].join(', ')}.`, [visited, ...evidence], reviewHosts.size);
  else beforeConsent = result('pass', `No third-party request or tracker cookie before consent, on ${loaded.length} page${loaded.length === 1 ? '' : 's'}.`, [visited]);

  const banner = report.banner;
  let rejectAll: CheckResult;
  // A banner is a block that offers a choice: Accept, Reject or OK. A "Cookie settings" link alone (in a footer, say)
  // isn't one.
  const choices = banner?.found.filter((l) => REJECT.test(l) || ACCEPT.test(l) || ACKNOWLEDGE.test(l)) ?? [];
  if (!banner || banner.after?.error) rejectAll = result('needs-review', `The banner test couldn't run${banner?.after?.error ? ` (${banner.after.error})` : ''}.`, [], 1);
  else if (!choices.length) rejectAll = result('not-applicable', `No cookie or consent banner on the home page${banner.found.length ? ` (only ${banner.found.join(', ')})` : ''}. That is right only if nothing optional loads, which the before-consent check tests.`, []);
  else if (!banner.clicked) {
    const accept = banner.found.some((l) => ACCEPT.test(l));
    const ack = banner.found.some((l) => ACKNOWLEDGE.test(l));
    if (accept) rejectAll = result('fail', `The cookie banner offers Accept but no Reject (launch trap 12). Buttons found: ${banner.found.join(', ')}.`, [], 1);
    else rejectAll = result('needs-review', `The banner has no Reject button that this check recognises. Buttons found: ${banner.found.join(', ') || 'none'}${ack ? '; it may be a notice with no choice' : ''}.`, [], 1);
  } else {
    const after = banner.after!;
    const third = after.thirdParty.filter((t) => t.class === 'third-party');
    const ev = describe(after);
    if (third.length || after.trackerCookies.length) rejectAll = result('fail', `After "${banner.clicked}" and a reload, the browser still contacted ${third.length} third-party host${third.length === 1 ? '' : 's'}${after.trackerCookies.length ? ` and got ${after.trackerCookies.length} new tracker cookie${after.trackerCookies.length === 1 ? '' : 's'}` : ''}.`, ev, third.length + after.trackerCookies.length);
    else if (after.thirdParty.length) rejectAll = result('needs-review', `After "${banner.clicked}", the browser contacted only hosts that may be strictly necessary.`, ev, after.thirdParty.length);
    else rejectAll = result('pass', `"${banner.clicked}" is honoured: nothing third-party loaded after it, even on reload.`, [{ note: `buttons found: ${banner.found.join(', ')}` }]);
  }
  return { beforeConsent, rejectAll };
}
