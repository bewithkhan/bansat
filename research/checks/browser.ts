// Static checks for what the browser loads from other companies (framework 9.9 and 9.10). The dynamic check in
// dynamic.ts watches the real requests; these read the code, so they also catch pages the crawler never reaches.
import { type App, type CheckResult, type Evidence, type Match, code, evidenceOf, isEntryFile, result, search } from './lib.ts';

// ---------------------------------------------------------------------------------------------------------------
// Self-hosted fonts (launch trap 2; launch gate 13.D3; Day-0 T4; threat T-10)
//
// Fails on any URL that loads fonts from a font service or a CDN: Google Fonts, Adobe Fonts, Bunny Fonts (Laravel's
// starter kits use it), Font Awesome kits and font files on jsDelivr, unpkg or cdnjs. `next/font/google` and
// `@fontsource/*` download fonts at build time and serve them from the app's own domain, so they pass. A font host
// that appears only inside a Content-Security-Policy is allowed rather than loaded, so it is flagged for review.

const FONT_HOSTS = String.raw`fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|p\.typekit\.net|fonts\.bunny\.net|fonts\.cdnfonts\.com|fast\.fonts\.net|kit\.fontawesome\.com|use\.fontawesome\.com|ka-f\.fontawesome\.com|api\.fontshare\.com|cdn\.fontshare\.com|rsms\.me`;
const FONT_URL = new RegExp(String.raw`(?:https?:)?//(${FONT_HOSTS})\b[^\s"'<>)]*`, 'i');
const CDN_FONT_URL = /(?:https?:)?\/\/(cdn\.jsdelivr\.net|unpkg\.com|cdnjs\.cloudflare\.com)\/[^\s"'<>)]*(?:font|\.woff2?\b|\.ttf\b|\.otf\b)[^\s"'<>)]*/i;
const CSP_LINE = /font-src|style-src|content-security-policy|default-src/i;

export function checkFonts(app: App): CheckResult {
  const files = code(app);
  const hits = [...search(files, FONT_URL), ...search(files, CDN_FONT_URL)];
  const lineOf = (m: Match): string => m.file.code.split('\n')[m.line - 1] ?? '';
  const loads = hits.filter((m) => !CSP_LINE.test(lineOf(m)));
  const allows = hits.filter((m) => CSP_LINE.test(lineOf(m)));
  const notes: Evidence[] = [];
  const selfHosted = search(files, /['"](?:@next\/font\/google|next\/font\/(?:google|local))['"]|['"]@fontsource(?:-variable)?\/[\w-]+/);
  if (selfHosted.length) notes.push({ ...evidenceOf(selfHosted[0]), note: 'fonts bundled at build time and served by the app itself' });
  if (loads.length) {
    const distinct = new Set(loads.map((m) => `${m.file.path} ${m.match[1].toLowerCase()}`));
    return result('fail', `Fonts load from a third party in ${distinct.size} place${distinct.size === 1 ? '' : 's'}, so every visitor's IP address goes to that company before any consent (9.9).`, loads.map((m) => evidenceOf(m)), distinct.size);
  }
  if (allows.length) return result('needs-review', 'No font is loaded from a third party, but the Content-Security-Policy allows a font host. Check nothing uses it.', allows.map((m) => evidenceOf(m, 'allowed in a CSP')), allows.length);
  return result('pass', 'No font loads from a font service or CDN.', notes);
}

// ---------------------------------------------------------------------------------------------------------------
// Analytics, session replay and pixels only behind consent (launch traps 3 and 7; launch gate 13.D3 and 13.D5;
// Day-0 T5; threat T-10; casebook F-18)
//
// For each place a tracker is loaded, it asks whether a consent decision visibly guards it:
//   - passed to a consent-gated loader (the framework's loadWhenConsented, 9.7), or
//   - within the ten lines below a condition that mentions consent (`if (consent.analytics)`,
//     `{hasConsent && <GoogleAnalytics/>}`)                                  -> gated
//   - in a file that puts markup on every page (a root layout, an HTML document) with no consent condition
//                                                                            -> fail: it loads for everyone
//   - anywhere else with no consent condition: it may still be mounted behind consent by a parent component, so
//                                                                            -> needs review
// Privacy-first, cookieless tools (Plausible, Fathom, Umami, Vercel Analytics, Cloudflare Web Analytics) aren't
// failed: whether they need consent depends on the market and on what they store (9.10), so they need review when
// they aren't gated. Only the app's code is read; a tag manager's own configuration lives outside the repo.

export type Tracker = { name: string; kind: 'analytics' | 'replay' | 'advertising' | 'privacy-first'; re: RegExp };
export const TRACKERS: Tracker[] = [
  { name: 'Google Analytics or Tag Manager', kind: 'analytics', re: /googletagmanager\.com|google-analytics\.com|\bgtag\s*\(\s*['"]config|<GoogleAnalytics\b|<GoogleTagManager\b|['"](?:react-ga4|react-gtm-module|vue-gtag|nuxt-gtag|@analytics\/google-analytics)['"]/ },
  { name: 'Hotjar', kind: 'replay', re: /static\.hotjar\.com|['"]@hotjar\/browser['"]|['"]react-hotjar['"]|\bhj\s*\(\s*['"]|\bHotjar\.init\s*\(/ },
  { name: 'Microsoft Clarity', kind: 'replay', re: /clarity\.ms\/tag|['"]@microsoft\/clarity['"]|['"]react-microsoft-clarity['"]|\bClarity\.init\s*\(/ },
  { name: 'Meta Pixel', kind: 'advertising', re: /connect\.facebook\.net|\bfbq\s*\(\s*['"]init|['"]react-facebook-pixel['"]/ },
  { name: 'TikTok Pixel', kind: 'advertising', re: /analytics\.tiktok\.com|\bttq\.load\s*\(/ },
  { name: 'LinkedIn Insight', kind: 'advertising', re: /snap\.licdn\.com/ },
  { name: 'PostHog', kind: 'analytics', re: /['"]posthog-js(?:\/react)?['"]|\bposthog\.init\s*\(|[a-z]+\.i\.posthog\.com/ },
  { name: 'Mixpanel', kind: 'analytics', re: /['"]mixpanel-browser['"]|cdn\.mxpnl\.com|\bmixpanel\.init\s*\(/ },
  { name: 'Segment', kind: 'analytics', re: /cdn\.segment\.com|['"]@segment\/analytics-next['"]/ },
  { name: 'Amplitude', kind: 'analytics', re: /['"]@amplitude\/analytics-browser['"]|['"]amplitude-js['"]/ },
  { name: 'Heap', kind: 'analytics', re: /heapanalytics\.com|\bheap\.load\s*\(/ },
  { name: 'FullStory', kind: 'replay', re: /['"]@fullstory\/browser['"]|fullstory\.com\/s\/fs\.js/ },
  { name: 'LogRocket', kind: 'replay', re: /['"]logrocket['"]|\bLogRocket\.init\s*\(/ },
  { name: 'Sentry Session Replay', kind: 'replay', re: /\breplayIntegration\s*\(|\bnew\s+(?:Sentry\.)?Replay\s*\(/ },
  { name: 'Plausible', kind: 'privacy-first', re: /plausible\.io\/js|['"]next-plausible['"]/ },
  { name: 'Fathom', kind: 'privacy-first', re: /cdn\.usefathom\.com|['"]fathom-client['"]/ },
  { name: 'Umami', kind: 'privacy-first', re: /cloud\.umami\.is|umami\.is\/script\.js/ },
  { name: 'Vercel Analytics', kind: 'privacy-first', re: /['"]@vercel\/(?:analytics|speed-insights)(?:\/[\w-]+)?['"]/ },
  { name: 'Cloudflare Web Analytics', kind: 'privacy-first', re: /static\.cloudflareinsights\.com/ },
];

// A consent condition: a line with `if (`, `&&` or `?` that mentions consent, or a consent-gated loader call.
const GATE_LOADER = /\b(loadWhenConsented|whenConsented|onConsent(?:Given)?|withConsent)\s*\(/;
const GATE_CONDITION = /(\bif\s*\(|&&|\?)[^\n]*consent|consent[^\n]*(&&|\?)/i;

function gated(m: Match): boolean {
  const lines = m.file.code.split('\n');
  const window = lines.slice(Math.max(0, m.line - 11), m.line);
  return window.some((l) => GATE_LOADER.test(l) || GATE_CONDITION.test(l));
}

export function checkTracking(app: App): CheckResult {
  const files = code(app);
  const found: { tracker: Tracker; m: Match }[] = [];
  for (const tracker of TRACKERS) for (const m of search(files, tracker.re)) found.push({ tracker, m });
  // Imports alone don't load anything; the call or tag that does is what's judged. An import line is kept only if
  // the file has nothing else for that tracker.
  const isImport = (m: Match): boolean => /^\s*import\b|require\s*\(/.test(m.file.code.split('\n')[m.line - 1] ?? '');
  const uses = found.filter((f) => !isImport(f.m) || !found.some((o) => o.tracker === f.tracker && o.m.file === f.m.file && !isImport(o.m)));
  if (!uses.length) {
    const dep = [...app.deps].find((d) => TRACKERS.some((t) => t.re.test(`'${d}'`)));
    if (dep) return result('needs-review', `The tracker package ${dep} is a dependency, but no place that loads it was found.`, [{ note: `package.json dependency ${dep}` }], 1);
    return result('not-applicable', 'No analytics, session replay or advertising tag found in the code.');
  }
  const fails: Evidence[] = [];
  const reviews: Evidence[] = [];
  const ok: Evidence[] = [];
  for (const { tracker, m } of uses) {
    const label = `${tracker.name} (${tracker.kind})`;
    if (gated(m)) ok.push(evidenceOf(m, `${label}: behind a consent condition`));
    else if (tracker.kind === 'privacy-first') reviews.push(evidenceOf(m, `${label}: not behind consent; whether it needs consent depends on the market and what it stores (9.10)`));
    else if (isEntryFile(m.file.path)) fails.push(evidenceOf(m, `${label}: loaded on every page, with no consent condition in sight`));
    else reviews.push(evidenceOf(m, `${label}: no consent condition in this file; check how the component is mounted`));
  }
  if (fails.length) return result('fail', `${fails.length} tracker${fails.length === 1 ? ' loads' : 's load'} on every page with no consent check (9.7, 9.10).`, [...fails, ...reviews, ...ok], fails.length);
  if (reviews.length) return result('needs-review', `${reviews.length} tracker load${reviews.length === 1 ? '' : 's'} with no consent condition in the same file. The dynamic check shows whether they fire before consent.`, [...reviews, ...ok], reviews.length);
  return result('pass', `Every tracker (${new Set(uses.map((u) => u.tracker.name)).size}) loads behind a consent condition.`, ok);
}

// Used by the privacy-notice check: the trackers the app loads, by name.
export const trackersUsed = (app: App): Tracker[] => TRACKERS.filter((t) => search(code(app), t.re).length > 0 || [...app.deps].some((d) => t.re.test(`'${d}'`)));
