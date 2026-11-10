# Angular

> **Group:** Frontend and full-stack · **Covers:** Angular 22 (22.2) with `@angular/ssr`, on Node.js 22.22.3+, 24.15+ or 26 and TypeScript 6.0. Angular 21 and 20 are in LTS · **Checked:** 2026-11-05 against the official docs

Angular renders in the browser, on a Node server (SSR) or at build time, but it has no data layer of its own. Access
lives in the backend: Supabase in the reference stack, or your API's profile. Changed in 2025–2026: from v22 a new
major arrives every 12 months (v23 around June 2027), and v20's LTS ends on 28 November 2026
([releases](https://angular.dev/reference/releases)). A run of advisories hit SSR, hydration and `HttpClient`, so stay
on the latest patch (22.2.1 or later). New projects test with Vitest.

## Access and the isolation test

- **Enforce in the backend.** Use RLS (5.4) with `supabase-js`, or the 7.2 checks in your API. The Angular docs say
  never to rely on client-side guards as the sole access control
  ([guards](https://angular.dev/guide/routing/route-guards)): `CanActivateFn` and `CanMatchFn` are layer 3
  (convenience only).
- **SSR runs as the user.** By default the transfer cache skips requests that carry `Authorization` or `Cookie`
  headers or credentials ([SSR](https://angular.dev/guide/ssr)). Keep `includeRequestsWithAuthHeaders` and
  `includeRequestsWithCredentials` off, and never list auth headers in `includeHeaders`, which the docs warn can leak
  between requests. Until the June 2026 fix (21.2.15, 20.3.22), credentialed requests went into the page by default,
  and a CDN caching that HTML served one user's data to others
  ([GHSA-q6f4-qqrg-jv6x](https://github.com/advisories/GHSA-q6f4-qqrg-jv6x)). Send `Cache-Control: private, no-store`
  on signed-in SSR routes (route `headers` or `RESPONSE_INIT`), and keep them out of shared caches.
- **Never prerender personal data:** prerendered pages are built once for everyone, and Angular prerenders every route
  by default, so set signed-in routes to `RenderMode.Server` or `RenderMode.Client` (SSR page).
- **Isolation test:** run the backend's own test (the 5.4 SQL test) in CI, then check the app end to end as user A
  with Playwright, which `ng e2e` can add. Its `request` fixture sends the `storageState` cookies, which suits cookie
  sessions; with bearer tokens, pass the `Authorization` header yourself:

```ts
// e2e/isolation.spec.ts — staging or a local stack seeded with synthetic users A and B (5.5)
import { test, expect } from '@playwright/test';
test.use({ storageState: 'e2e/.auth/user-a.json' });              // signed in as user A by a setup project

test("user A can't open or change user B's task", async ({ page, request }) => {
  await page.goto(`/tasks/${process.env.TASK_OF_B}`);
  await expect(page.getByText("This task was deleted or you don't have access.")).toBeVisible(); // S11
  const res = await request.patch(`/api/tasks/${process.env.TASK_OF_B}`, { data: { title: 'x' } });
  expect([403, 404]).toContain(res.status());                       // the API refuses, whatever the UI shows
});
```

## Authentication

- Angular has no auth of its own. Use your provider's SDK (Supabase Auth in the reference stack) or your API's
  sessions, and follow 7.1.
- **Cookie sessions:** the server sets them `Secure`, `HttpOnly` and `SameSite=Lax` (7.1), so Angular code can't
  read them. If your SDK keeps the session where page scripts can reach it, the 7.4 CSP and Trusted Types carry the
  weight.
- **Interceptors:** attach tokens in a functional interceptor
  ([interceptors](https://angular.dev/guide/http/interceptors)) only after checking that the request's origin is your
  API. The 2025 XSRF-token leak through protocol-relative URLs
  ([GHSA-58c5-g7wp-6w37](https://github.com/advisories/GHSA-58c5-g7wp-6w37)) shows why. The same interceptor turns a
  401 into S8 (sign in again and keep the draft).

## Secrets

- Everything in `src/environments/` ships in the client bundle, where any visitor can read it
  ([environments](https://angular.dev/tools/cli/environments)). Only publishable keys go there.
- **SSR:** read secrets from `process.env` in `server.ts` and server-only providers. Responses that `HttpClient`
  caches during SSR are serialised into the page for hydration (SSR page), so a server-side fetch made with a secret
  key can put privileged data in the HTML.

## CSRF and XSS

- **XSS defaults:** Angular treats every bound value as untrusted, and sanitises HTML and URLs in bindings and
  interpolation. Resource URLs can't be sanitised. Templates are trusted code: never build one from user input, and
  ship with the AOT compiler, the CLI default ([security](https://angular.dev/best-practices/security)).
- **Escape hatches:** `bypassSecurityTrustHtml`, `bypassSecurityTrustScript`, `bypassSecurityTrustStyle`,
  `bypassSecurityTrustUrl` and `bypassSecurityTrustResourceUrl`, direct DOM writes through `ElementRef` or `document`,
  and the JIT compiler. Each needs a review, and an allowlist sanitiser on any user content it touches (T-04).
- **CSP (7.4):** give Angular the per-request nonce with the `ngCspNonce` attribute or the `CSP_NONCE` token. On a
  static host, `security.autoCsp` hashes the inline scripts into a `<meta>` policy instead. It covers scripts only and
  can't be used with SSR, so send `style-src` and `frame-ancestors` as headers (security page).
- **Trusted Types:** enforce `trusted-types angular angular#bundler; require-trusted-types-for 'script'`, and add
  `angular#unsafe-bypass` only if you call a `bypassSecurityTrust*` method (security page).
- **CSRF:** `HttpClient` copies the `XSRF-TOKEN` cookie into an `X-XSRF-TOKEN` header on mutating requests to relative
  and same-origin URLs only. That's the client half: the server must set the cookie and check the header (security
  page). A cross-origin API gets no header, so use 7.4's SameSite and `Origin` checks, or bearer tokens. The escape
  hatch is `withNoXsrfProtection()`.
- **SSR host checks:** Angular validates `Host` and `X-Forwarded-*` against `security.allowedHosts` in `angular.json`,
  or `NG_ALLOWED_HOSTS`. Unknown hosts get a 400, and proxy headers are dropped unless you set `trustProxyHeaders`.
  Never allow `*` (security page).

## Fonts and assets

- **Font inlining doesn't self-host.** `optimization.fonts.inline` inlines the Google Fonts and Adobe Fonts *CSS* at
  build time ([workspace config](https://angular.dev/reference/configs/workspace-config)), unchanged, so the font files
  still load from the vendor, and it adds `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, itself
  a request to Google before consent ([CLI source](https://github.com/angular/angular-cli/blob/v22.2.6/packages/angular/build/src/utils/index-file/inline-fonts.ts)).
- Self-host instead: put `woff2` files in `public/`, which the CLI copies as-is
  ([file structure](https://angular.dev/reference/configs/file-structure)), and declare `@font-face` in `styles.css`.
  Or install an `@fontsource/*` package and import it in `styles`. Keep `font-src 'self'`.
- `ng add @angular/material` adds the Roboto and Material Symbols fonts to `index.html`
  ([Material](https://material.angular.dev/guide/getting-started)). Check the `<link>` tags it writes, and replace any
  that point to Google Fonts with self-hosted files.
- Install scripts from npm and bundle them. No CDN `<script>` tags in `index.html`.

## Consent

- Load analytics, replay and pixels only through the 9.7 consent loader, wrapped in an Angular service. In SSR apps,
  run it only in the browser, inside `afterNextRender` or from a browser-only provider (SSR page), and never from
  `server.ts` or a prerendered `index.html`.
- With 7.4's nonce and `'strict-dynamic'`, scripts that your nonced loader inserts are trusted. If you enforce Trusted
  Types, give the loader its own named policy and add that name to the `trusted-types` directive.
- For Google tags, set Consent Mode to `denied` for every type before anything loads (9.7).

## Logging

- The default `ErrorHandler` prints errors to the console ([ErrorHandler](https://angular.dev/api/core/ErrorHandler)).
  Provide your own that reports a generic event with a reference ID and shows S3, with no request bodies, tokens or
  form values (7.5).
- Add a correlation ID to API calls in an interceptor, and strip query strings that carry tokens from anything you
  log, in the browser and in `server.ts`.

## Testing

- **Unit:** new CLI projects use Vitest with jsdom, and Karma is still supported
  ([testing](https://angular.dev/guide/testing)).
- **E2E:** `ng e2e` offers to add Playwright (`ng add playwright-ng-schematics`) and other runners
  ([E2E](https://angular.dev/tools/cli/end-to-end)). The 9.9 no-third-party test and the isolation test above run
  unchanged.
- Check CSP and Trusted Types in E2E: serve the same headers from `ng serve` through the `headers` option in
  `angular.json` (security page), and fail the run on any CSP violation.

## Deployment

- **Static hosting (CSR or prerendered):** set the 7.4 headers at the host or CDN. With `autoCsp`, the `<meta>` policy
  covers scripts only, and the browser enforces it and your header together. Send 7.4's policy as a header without
  `default-src` and `script-src`, which would block the hashed scripts, and list `img-src`, `font-src`, `connect-src`
  and every other directive you need, since nothing falls back to `default-src` (security page).
- **SSR on Node:** `server.ts` runs `AngularNodeAppEngine` from `@angular/ssr/node`. Set `allowedHosts`, trust proxy
  headers only behind a proxy that rewrites them, and set headers per route with `headers` in the server routes or in
  middleware. During SSR, `HttpClient` on the default fetch backend caps each response body at 1 MB; raise
  `maxResponseBodySize` only as far as you need (SSR page).
- **Versions:** take every patch. In 2025–2026, fixes covered SSR SSRF and host injection
  ([GHSA-x288-3778-4hhx](https://github.com/advisories/GHSA-x288-3778-4hhx), critical), XSS in SSR serialisation and
  i18n, transfer-cache leaks across requests
  ([GHSA-39pv-4j6c-2g6v](https://github.com/advisories/GHSA-39pv-4j6c-2g6v)) and hydration DOM clobbering
  ([GHSA-rgjc-h3x7-9mwg](https://github.com/advisories/GHSA-rgjc-h3x7-9mwg)). Run `npm audit` in CI (7.4).
- **Region:** the host's and the backend's regions decide where data lives (3.1).

## Limits

- Everything in the browser bundle, environment files included, is public.
- SSR widens the attack surface: many of the 2025–2026 advisories affected SSR alone. If you don't need it, use CSR
  or prerendering with `autoCsp`.
- Translations, and the formats you pass to date and number pipes, are inputs too. 2026 advisories covered XSS through
  i18n event-handler attributes ([GHSA-jj27-h5hq-8x99](https://github.com/advisories/GHSA-jj27-h5hq-8x99)) and denial
  of service through crafted `formatDate` ([GHSA-48r7-hpm6-gfxm](https://github.com/advisories/GHSA-48r7-hpm6-gfxm))
  and `digitsInfo` ([GHSA-p3vc-36g9-x9gr](https://github.com/advisories/GHSA-p3vc-36g9-x9gr)) arguments, so never pass
  user input as a format.
- The service worker had header-leak fixes in 2026
  ([GHSA-qxh6-94w6-9r5p](https://github.com/advisories/GHSA-qxh6-94w6-9r5p)). For offline use, follow D2.

## Sources

- Angular: [security](https://angular.dev/best-practices/security) · [SSR](https://angular.dev/guide/ssr) · [CLI font inlining source](https://github.com/angular/angular-cli/blob/v22.2.6/packages/angular/build/src/utils/index-file/inline-fonts.ts) · [route guards](https://angular.dev/guide/routing/route-guards) · [interceptors](https://angular.dev/guide/http/interceptors) · [environments](https://angular.dev/tools/cli/environments) · [workspace config](https://angular.dev/reference/configs/workspace-config) · [file structure](https://angular.dev/reference/configs/file-structure) · [ErrorHandler](https://angular.dev/api/core/ErrorHandler) · [testing](https://angular.dev/guide/testing) · [end-to-end](https://angular.dev/tools/cli/end-to-end) · [releases](https://angular.dev/reference/releases) · [version compatibility](https://angular.dev/reference/versions)
- Angular Material: [getting started](https://material.angular.dev/guide/getting-started)
- Advisories: [GHSA-58c5-g7wp-6w37](https://github.com/advisories/GHSA-58c5-g7wp-6w37) · [GHSA-x288-3778-4hhx](https://github.com/advisories/GHSA-x288-3778-4hhx) · [GHSA-39pv-4j6c-2g6v](https://github.com/advisories/GHSA-39pv-4j6c-2g6v) · [GHSA-rgjc-h3x7-9mwg](https://github.com/advisories/GHSA-rgjc-h3x7-9mwg) · [GHSA-48r7-hpm6-gfxm](https://github.com/advisories/GHSA-48r7-hpm6-gfxm) · [GHSA-p3vc-36g9-x9gr](https://github.com/advisories/GHSA-p3vc-36g9-x9gr) · [GHSA-jj27-h5hq-8x99](https://github.com/advisories/GHSA-jj27-h5hq-8x99) · [GHSA-q6f4-qqrg-jv6x](https://github.com/advisories/GHSA-q6f4-qqrg-jv6x) · [GHSA-qxh6-94w6-9r5p](https://github.com/advisories/GHSA-qxh6-94w6-9r5p)
