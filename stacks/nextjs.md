# Next.js

> **Group:** Frontend and full-stack · **Covers:** Next.js 16 (16.4) with the App Router, on Node 20.9+; Next.js 15 gets security releases until 31 January 2027 · **Checked:** 2026-11-05 against the official docs

Next.js is the reference stack: Parts 3–7 already assume it (3.1, 3.5, 3.7, ADR-001, ADR-002, 7.4). This profile
collects the Next.js specifics in one place and points to those parts. Next.js 16 renamed `middleware.ts` to
`proxy.ts` (same feature, Node.js runtime only); "Proxy" below covers both.

## Access and the isolation test

- **Checks live in the Data Access Layer** (3.5, ADR-002): modules in `lib/server/` start with `import 'server-only'`,
  authenticate, call `assertCan()` (7.2) and return DTOs, not rows. Server Components, Server Actions and Route
  Handlers all go through it.
- **Every Server Action is a public POST endpoint** (ADR-001, T-03). Action IDs are encrypted and unused actions are
  dropped from the bundle, but IDs can be read from public client chunks (CVE-2026-64643, July 2026). In every action,
  re-derive the user and tenant from the session, fetch by ID and ownership together, validate with the shared Zod
  schema (6.4), and return only what the UI renders. Authenticate inside `use cache` functions too.
- **Pages and layouts protect nothing inside them.** A page's `auth()` check doesn't cover the actions defined on it;
  layouts don't re-render on client navigation and don't stop child segments from rendering.
- **Proxy is not a security boundary.** CVE-2025-29927 (March 2025, critical): a request with an
  `x-middleware-subrequest` header skipped middleware, so auth done only there was bypassed (fixed in 15.2.3, 14.2.25,
  13.5.9 and 12.3.5). Five more Proxy bypasses followed in May–July 2026 (prefetch `.rsc` URLs, parameter injection,
  Pages Router i18n, Turbopack with one locale; all fixed by 15.5.18 and 16.2.11), and each advisory's workaround was
  to authorise in the data path. Use Proxy for optimistic redirects only.
- **Shared output.** Never prerender per-user or per-tenant data. A plain `use cache` function can't read `cookies()`:
  pass the user ID in, keep the function unexported, and keep tokens and emails out of cache keys and tags, which are
  stored in plain text.
- **Isolation test.** 5.4's SQL test covers the RLS path. Prisma bypasses RLS (ADR-002), so also call each action as
  user A in Vitest:

```ts
// tests/integration/tasks.isolation.test.ts: user A must not change org B's task (5.4)
import { expect, it, vi } from 'vitest';
import { renameTask } from '@/app/(app)/w/[slug]/tasks/actions';
import { db } from '@/lib/server/db';
import { USER_A, ORG_B_TASK } from '../fixtures/seed';

vi.mock('server-only', () => ({})); // the real package throws outside a React Server build
vi.mock('@/lib/server/session', () => ({ requireUser: async () => USER_A }));

it('rejects a write to another organisation', async () => {
  await expect(renameTask({ taskId: ORG_B_TASK, title: 'x' })).rejects.toThrow('FORBIDDEN');
  expect((await db.task.findUnique({ where: { id: ORG_B_TASK } }))?.title).not.toBe('x');
});
```

## Authentication

- Next.js ships no auth. The reference uses Supabase Auth through `@supabase/ssr`: Supabase's SSR guide has the
  Next.js code, and 7.1 the rules (refresh in Proxy, `getClaims()` or `getUser()` on the server, never
  `getSession()`). The docs also list NextAuth.js, Better Auth, Clerk and WorkOS; their hand-rolled example uses
  `jose` or `iron-session` with an `httpOnly`, `secure`, `sameSite: 'lax'`, `path: '/'` cookie holding IDs only (7.5).
- Since 16, `cookies()`, `headers()`, `params` and `searchParams` are async only.
- There's no rate limiting or lockout: apply 6.6 to the sign-in, magic-link and reset actions, by account and by IP.

## Secrets

- 3.7 has the variables and the `NEXT_PUBLIC_` rule. Those values are inlined at `next build`, so an image promoted
  from staging to production keeps staging's values. Anything in `next.config`'s `env` key is always inlined, prefix
  or not. `serverRuntimeConfig` and `publicRuntimeConfig` are gone in 16.
- `import 'server-only'` fails the build if a module reaches client code, and the docs want only the DAL to read
  `process.env`. React's taint APIs (`experimental.taint`) add a further check.
- Closures captured by inline actions are encrypted with a per-build key. For several self-hosted instances, set
  `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` (base64 of 16, 24 or 32 bytes) as a secret, and still don't close over secrets.

## CSRF and XSS

- **Server Actions** are POST only, and `Origin` must match `Host` (or `X-Forwarded-Host`). Proxy and CDN hosts go in
  `experimental.serverActions.allowedOrigins`; never add `'null'` (CVE-2026-27978: requests from sandboxed iframes
  passed until 16.1.7). The body limit is 1 MB (`bodySizeLimit`).
- **Route Handlers** get no check: verify `Origin` on state-changing methods yourself (7.4).
- **XSS**: React escapes output. Use `dangerouslySetInnerHTML` only with sanitised HTML (6.4) or a `TrustedHTML`
  value, and never put untrusted data in `beforeInteractive` scripts (CVE-2026-44580).
- **CSP nonce** (7.4): generate it per request in `proxy.ts` and set it on the request's `Content-Security-Policy`
  header; Next.js reads it there and adds it to its own scripts and to `<Script nonce>`. Overwrite any inbound CSP
  header (CVE-2026-44581 reflected malformed ones into cached HTML). Nonces force dynamic rendering: no static pages,
  ISR, CDN caching or Partial Prerendering. Experimental `sri` gives hash-based CSP for static pages. `'unsafe-eval'`
  is for development only.
- Set the other 7.4 headers with `headers()` in `next.config`, plus `poweredByHeader: false`.

## Fonts and assets

- `next/font/google` downloads fonts at build time and serves them from your domain, so the browser sends nothing to
  Google (9.9); `next/font/local` serves your own files. The trap is a pasted `fonts.googleapis.com` `<link>` or CSS
  `@import`, which bypasses it.
- `next/image` fetches remote images on your server, only from `images.remotePatterns`; keep that to your own storage.
  The optimiser is server attack surface: in 2026 it had an SSRF (CVE-2026-94483, fixed in 16.3.8) and remote code
  execution through `sharp` on AVIF (fixed in 16.3.3) and SVG files (16.4.1, with `sharp` 0.35.5+). Since 16, local
  IPs are blocked unless `images.dangerouslyAllowLocalIP` is set.
- An `assetPrefix` CDN goes into the CSP and the register (3.6).

## Consent

- `next/script` has no consent gate: a rendered `<Script>` loads with the page, whether `beforeInteractive` (root
  layout only, in the server HTML), `afterInteractive` (default), `lazyOnload` or `worker` (experimental, not in the
  App Router). Render it only after the 9.7 consent check, as below, or call `loadWhenConsented()` from a client
  effect.
- A script loads once per document and survives client navigation, so withdrawal means stopping the vendor, clearing
  its cookies and reloading (9.8, item 8).
- `@next/third-parties` (experimental) offers `GoogleTagManager` (which loads `gtm.js` from `googletagmanager.com`)
  and `GoogleAnalytics`; neither checks consent. Mount them inside the gate, with Consent Mode defaulting to denied
  (9.7).
- The docs suggest `beforeInteractive` for cookie consent managers, but one served from its vendor's CDN is a
  third-party request before consent. Prefer 9.7's first-party module, or self-host the manager's script (3.6).
- Keep the gate on the client: reading the consent cookie with `cookies()` in a layout makes every route under it
  dynamic.

```tsx
'use client'; // components/privacy/consented-script.tsx: a vendor tag that renders only once its purpose is granted (9.7)
import Script from 'next/script';
import { useEffect, useState } from 'react';
import { readConsent, type ConsentPurpose, type ConsentState } from '@/lib/privacy/consent';

export function ConsentedScript({ purpose, src }: { purpose: ConsentPurpose; src: string }) {
  const [granted, setGranted] = useState(false);
  useEffect(() => {
    setGranted(Boolean(readConsent()?.[purpose]));
    const onChange = (e: Event) => setGranted(Boolean((e as CustomEvent<ConsentState>).detail[purpose]));
    window.addEventListener('consentchange', onChange);
    return () => window.removeEventListener('consentchange', onChange);
  }, [purpose]);
  return granted ? <Script src={src} strategy="afterInteractive" /> : null;
}
```

## Logging

- Next.js writes no production request log (the `logging` option is for development); the host keeps it (3.6).
- In `instrumentation.ts`, `onRequestError(err, request, context)` reports server errors: send `err.digest`,
  `context.routePath` and `context.routeType`, never `request.headers`, which carry cookies and tokens (7.5).
  `register()` sets up OpenTelemetry.
- In production, Server Component errors reach the browser as a generic message with `error.digest`; match it to the
  server log as you would the 6.3 `ref`.
- Browser monitoring goes in `instrumentation-client.ts`: replay off, PII scrubbing, an EU region and the ingest host
  in `connect-src` (9.9, 7.4).

## Testing

- Vitest (official guide) covers synchronous components, schemas, the DAL and actions; it can't render `async` Server
  Components, which the docs send to E2E tests. Mock `server-only` as above.
- Run Playwright, the 9.9 privacy test and axe against a production build (`npm run build`, then `npm run start`, as
  the docs recommend); the dev server adds HMR traffic and a looser CSP.
- Also check that state-changing Route Handlers refuse a foreign `Origin`, and that every `<script>` carries the
  response's nonce.

## Deployment

- **Vercel** (3.1): Functions run in `iad1` (Washington, D.C.) by default for new projects; set `regions` in
  `vercel.json` or in project settings to `lhr1` or `fra1` (ADR-005). Store secrets as the Secret type (7.4, case
  F-14).
- **Self-hosting**: `next start` or `output: 'standalone'` behind a reverse proxy that pins the `Host` header
  (CVE-2026-64649 turned attacker-chosen Host headers into SSRF through Server Actions on custom servers) and strips
  `x-middleware-subrequest`.
- With several instances, share the encryption key and a cache handler. New builds usually get new action IDs, so
  deploy in a rolling fashion and treat "Failed to find Server Action" as a retry.
- Keep Next.js's `Cache-Control: private, no-cache, no-store` on dynamic pages, and make any CDN respect it.
- `output: 'export'` has no Proxy, Server Actions, cookies, headers or image optimiser: set headers at the static host
  (a `<meta>` CSP can't carry `frame-ancestors`).
- **Patch fast** (7.6): critical remote code execution hit React Server Components (CVE-2025-55182, December 2025) and
  the image optimiser (September and October 2026). Stay on the latest 16.x, or 15.5.x while it's supported; 14.x is
  unsupported.

## Limits

- The client dispatches Server Actions one at a time; parallel work belongs in one action, a Server Component or a
  Route Handler.
- A nonce-based CSP makes the whole app dynamic and rules out Partial Prerendering.
- Proxy runs only on Node.js; the `edge` runtime needs the deprecated `middleware.ts`.
- Taint, SRI and `@next/third-parties` are experimental.

## Sources

- Next.js: [Data security](https://nextjs.org/docs/app/guides/data-security) · [Server Actions](https://nextjs.org/docs/app/guides/server-actions) · [Authentication](https://nextjs.org/docs/app/guides/authentication) · [Auth with Cache Components](https://nextjs.org/docs/app/guides/authentication-with-cache-components) · [proxy.js](https://nextjs.org/docs/app/api-reference/file-conventions/proxy) · [Upgrading to 16](https://nextjs.org/docs/app/guides/upgrading/version-16)
- [Environment variables](https://nextjs.org/docs/app/guides/environment-variables) · [`env`](https://nextjs.org/docs/app/api-reference/config/next-config-js/env) · [`serverActions`](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions) · [CSP](https://nextjs.org/docs/app/guides/content-security-policy) · [`headers`](https://nextjs.org/docs/app/api-reference/config/next-config-js/headers) · [`poweredByHeader`](https://nextjs.org/docs/app/api-reference/config/next-config-js/poweredByHeader)
- [Font](https://nextjs.org/docs/app/api-reference/components/font) · [Image](https://nextjs.org/docs/app/api-reference/components/image) · [Script](https://nextjs.org/docs/app/api-reference/components/script) · [Third-party libraries](https://nextjs.org/docs/app/guides/third-party-libraries) · [instrumentation.js](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation) · [error.js](https://nextjs.org/docs/app/api-reference/file-conventions/error) · [`logging`](https://nextjs.org/docs/app/api-reference/config/next-config-js/logging)
- [Vitest](https://nextjs.org/docs/app/guides/testing/vitest) · [Playwright](https://nextjs.org/docs/app/guides/testing/playwright) · [Self-hosting](https://nextjs.org/docs/app/guides/self-hosting) · [Static exports](https://nextjs.org/docs/app/guides/static-exports) · [Support policy](https://nextjs.org/support-policy)
- Elsewhere: [React `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common) · [MDN: frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors) · [`server-only` source](https://cdn.jsdelivr.net/npm/server-only/index.js) · [Vercel function regions](https://vercel.com/docs/functions/configuring-functions/region) · [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- Proxy bypasses: [CVE-2025-29927](https://github.com/vercel/next.js/security/advisories/GHSA-f82v-jwr5-mffw) · [CVE-2026-44575](https://github.com/vercel/next.js/security/advisories/GHSA-267c-6grr-h53f) · [CVE-2026-45109](https://github.com/vercel/next.js/security/advisories/GHSA-26hh-7cqf-hhc6) · [CVE-2026-44573](https://github.com/vercel/next.js/security/advisories/GHSA-36qx-fr4f-26g5) · [CVE-2026-44574](https://github.com/vercel/next.js/security/advisories/GHSA-492v-c6pp-mqqv) · [CVE-2026-64642](https://github.com/vercel/next.js/security/advisories/GHSA-6gpp-xcg3-4w24)
- Other advisories: [CVE-2026-64643](https://github.com/vercel/next.js/security/advisories/GHSA-955p-x3mx-jcvp) · [CVE-2026-27978](https://github.com/vercel/next.js/security/advisories/GHSA-mq59-m269-xvcx) · [CVE-2026-44580](https://github.com/vercel/next.js/security/advisories/GHSA-gx5p-jg67-6x7h) · [CVE-2026-44581](https://github.com/vercel/next.js/security/advisories/GHSA-ffhc-5mcf-pf4q) · [CVE-2026-64649](https://github.com/vercel/next.js/security/advisories/GHSA-89xv-2m56-2m9x) · [CVE-2026-94483](https://github.com/vercel/next.js/security/advisories/GHSA-cjq9-62q9-8jv4) · [AVIF RCE](https://github.com/vercel/next.js/security/advisories/GHSA-2xp9-vwfh-vxw4) · [SVG RCE](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw) · [CVE-2025-55182](https://github.com/facebook/react/security/advisories/GHSA-fv66-9v8q-g76r)
