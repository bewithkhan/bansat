// Check: security headers and an enforced Content-Security-Policy are configured (launch gate 13.C7; framework 7.4;
// threats T-04 and T-10).
//
// The bar is the part of 7.4 a hosting platform doesn't set for you: an enforced CSP (a header or a <meta> tag, not
// only Report-Only), X-Content-Type-Options and Referrer-Policy. HSTS and Permissions-Policy are reported but not
// required, because hosts often add HSTS themselves and the right Permissions-Policy depends on the app. It looks
// wherever apps set headers: framework config (next.config, svelte.config's kit.csp, astro.config), middleware and
// hooks, host files (vercel.json, netlify.toml, _headers, nginx, .htaccess), <meta http-equiv> tags, and libraries
// that set them (helmet, nuxt-security, spatie/laravel-csp, Django's settings).
//
// A header named in the code is taken as configured. The check can't prove the code runs; when score.ts serves the
// app with its own server, the response headers it records are the confirmation.
import { type App, type CheckResult, type Evidence, code, evidenceOf, hasDep, result, search } from './lib.ts';

type Found = { csp?: Evidence; cspReportOnly?: Evidence; nosniff?: Evidence; referrer?: Evidence; hsts?: Evidence; permissions?: Evidence };

export function findHeaders(app: App): Found {
  const files = code(app);
  const found: Found = {};
  const first = (re: RegExp, note?: string): Evidence | undefined => {
    const m = search(files, re)[0];
    return m ? evidenceOf(m, note) : undefined;
  };
  found.csp =
    first(/content-security-policy(?!-report-only)['"\s:=]/i) ??
    first(/\bkit\s*:\s*\{[\s\S]{0,400}?\bcsp\s*:/, 'SvelteKit kit.csp') ??
    first(/\bsecurity\s*:\s*\{[\s\S]{0,200}?\bcsp\s*:|\bexperimental\s*:\s*\{[\s\S]{0,200}?\bcsp\s*:/, "Astro's built-in CSP") ??
    first(/\bCONTENT_SECURITY_POLICY\s*=|\bCSP_DEFAULT_SRC\s*=|content_security_policy\s+do\b/, 'Django or Rails CSP setting');
  found.cspReportOnly = first(/content-security-policy-report-only/i);
  found.nosniff = first(/x-content-type-options/i) ?? first(/SECURE_CONTENT_TYPE_NOSNIFF\s*=\s*True/, 'Django setting');
  found.referrer = first(/referrer-policy['"\s:=]/i) ?? first(/SECURE_REFERRER_POLICY\s*=/, 'Django setting');
  found.hsts = first(/strict-transport-security/i) ?? first(/SECURE_HSTS_SECONDS\s*=\s*[1-9]/, 'Django setting');
  found.permissions = first(/permissions-policy/i);

  // Libraries that set the whole set by default, unless the code turns their CSP off.
  const helmet = search(files, /\bhelmet\s*\(/)[0];
  if (helmet && hasDep(app, 'helmet')) {
    const e = evidenceOf(helmet, 'helmet sets these headers by default');
    const cspOff = search(files, /contentSecurityPolicy\s*:\s*false/).length > 0;
    if (!cspOff) found.csp ??= e;
    found.nosniff ??= e;
    found.referrer ??= e;
    found.hsts ??= e;
  }
  if (hasDep(app, 'nuxt-security')) {
    const e: Evidence = { note: 'nuxt-security sets these headers by default' };
    found.csp ??= e;
    found.nosniff ??= e;
    found.referrer ??= e;
    found.hsts ??= e;
    found.permissions ??= e;
  }
  if (hasDep(app, 'spatie/laravel-csp')) found.csp ??= { note: 'spatie/laravel-csp is installed' };
  return found;
}

export function checkHeaders(app: App): CheckResult {
  const f = findHeaders(app);
  const evidence: Evidence[] = [];
  const add = (label: string, e?: Evidence): void => {
    if (e) evidence.push({ ...e, note: `${label}${e.note ? `: ${e.note}` : ''}` });
  };
  add('Content-Security-Policy', f.csp);
  add('Content-Security-Policy-Report-Only', f.cspReportOnly);
  add('X-Content-Type-Options', f.nosniff);
  add('Referrer-Policy', f.referrer);
  add('Strict-Transport-Security (not required)', f.hsts);
  add('Permissions-Policy (not required)', f.permissions);
  const missing = [!f.csp && (f.cspReportOnly ? 'an enforced CSP (only Report-Only is set)' : 'a Content-Security-Policy'), !f.nosniff && 'X-Content-Type-Options', !f.referrer && 'Referrer-Policy'].filter(Boolean) as string[];
  if (missing.length) {
    evidence.push(...missing.map((m) => ({ note: `missing: ${m}` })));
    return result('fail', `Missing ${missing.join(', ')} (7.4).`, evidence, missing.length);
  }
  return result('pass', 'An enforced CSP, X-Content-Type-Options and Referrer-Policy are configured.', evidence);
}
