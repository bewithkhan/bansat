# Astro

> **Group:** Frontend and full-stack · **Covers:** Astro 7 (7.4) with an adapter for on-demand rendering, on Vite 8 and Node 22.23.4+; notes for 6.x · **Checked:** 2026-11-05 against the official docs

What changes from Next.js: Astro prerenders by default, and only routes with `export const prerender = false` (or
`output: 'server'`) run per request; Actions (`astro:actions`) are the Server Action equivalent; `src/middleware.ts`
runs at build time for prerendered pages; the CSP is hash-based, in a `<meta>` tag, not nonce-based; fonts and typed
secrets are built in. Astro 6 (March 2026) made the CSP and the Fonts API stable and changed how `import.meta.env`
works; Astro 7 (June 2026) moved to Vite 8 and a Rust compiler.

## Access and the isolation test

- **The entry points** are on-demand pages, endpoints (`src/pages/**/*.ts` exporting `GET`, `POST` and so on),
  Actions, served at `/_actions/<name>`, and server islands at `/_server-islands/<Name>`. The docs call Actions public
  endpoints that need the same authorisation checks as API endpoints.
- **Authorise in each handler.** In an action, read the user from `context.locals`, call `assertCan()` (7.2) and throw
  `ActionError({ code: 'FORBIDDEN' })`; the `input` Zod schema validates the body (6.4). The docs prefer per-action
  checks to gating all actions in middleware.
- **Middleware is no gate.** `onRequest` runs at build time for prerendered pages, so a prerendered page is a public
  file whatever middleware says. Path-matching checks in middleware were bypassed again and again: encoded paths
  (CVE-2025-64765), double encoding (CVE-2025-66202), a decode-depth and rewrite mismatch (CVE-2026-59731), a prefix
  check against `base` (CVE-2026-84376) and spoofed URL headers (CVE-2025-64525). Use middleware to load the session
  into `locals`, never to decide access by matching `context.url.pathname`. Since 6.0, `Astro.url.pathname` may be
  partly decoded and differ from the raw request path.
- **Caches skip middleware.** On Vercel with ISR, middleware runs only on a cache miss: don't cache signed-in routes,
  or set `middlewareMode: 'edge'` or `exclude` them.
- **Server islands** run as their own requests: check the session inside the island component. Their props travel
  encrypted in the URL with a key made per build, so set `ASTRO_KEY` (from `astro create-key`) in the build
  environment for rolling or multi-region deploys.
- **RLS** as in the reference: Supabase's SSR guide has an Astro version; a direct database connection needs
  data-layer scoping (ADR-002, 5.4).
- **Isolation test** with Playwright against the production build: `astro build`, then `node ./dist/server/entry.mjs`
  with the Node adapter in standalone mode. An action takes JSON by default:

```ts
// tests/isolation.spec.ts: user A must not read or change org B's task (5.4)
import { expect, test } from '@playwright/test';
import { ORG_B_TASK } from './fixtures';

test.use({ storageState: 'tests/.auth/user-a.json' }); // a saved sign-in as user A
test('another tenant is denied', async ({ request }) => {
  expect([403, 404]).toContain((await request.get(`/api/tasks/${ORG_B_TASK}`)).status());
  const write = await request.post('/_actions/tasks.rename', { data: { id: ORG_B_TASK, title: 'x' } });
  expect([403, 404]).toContain(write.status());
});
```

## Authentication

- Astro has no auth of its own. The docs cover Better Auth, Clerk, Lucia (as a guide) and Scalekit; the reference's
  Supabase Auth works through `@supabase/ssr`.
- Sessions (`Astro.session`, `context.session`) are stored on the server through a driver; the Node, Cloudflare and
  Netlify adapters set one up. The cookie, `astro-session`, defaults to `httpOnly`, `secure` and `sameSite: 'lax'`.
  Sessions work only on on-demand routes.
- Session drivers are configured at build time and any environment variables they use are inlined into the build. Put
  a driver that needs a secret, such as a Redis URL, in its own entrypoint file so it reads the secret at runtime.
- There's no rate limiting: add 6.6's limits in middleware or at the host.

## Secrets

- Declare variables in the `env.schema` of `astro.config.mjs` with `envField`. `context: 'server', access: 'secret'`
  values are read from `astro:env/server` at runtime and kept out of the bundle; `context: 'client', access: 'public'`
  values go into the client bundle, the `NEXT_PUBLIC_` equivalent. A client secret is impossible by design.
  `env.validateSecrets: true` checks secrets at start-up.
- Since Astro 6, `import.meta.env` values are always inlined at build time, server-only ones too. A secret read that
  way is baked into your server build output: use `astro:env/server` or `process.env` instead. `PUBLIC_` is the prefix
  for client-visible `import.meta.env` values.
- `astro.config.mjs` can't read `.env` through `import.meta.env`; use Vite's `loadEnv` there.

## CSRF and XSS

- **CSRF**: `security.checkOrigin` (on by default) rejects cross-origin `POST`, `PUT`, `PATCH` and `DELETE` requests
  to on-demand routes when the body is a form, `text/plain` or has no type. It reads `Sec-Fetch-Site` and falls back
  to `Origin`. Escape hatch: `checkOrigin: false`. JSON actions rely on CORS preflight; verify `Origin` yourself if
  your CORS is loose (7.4).
- If you compose the request pipeline with `astro/hono` in `src/fetch.ts` (advanced routing, the default in 7.0),
  mount `middleware()` before `actions()` and `pages()`: otherwise the origin check never ran (CVE-2026-73423, fixed
  in 7.0.6).
- `security.allowedDomains` lists the hosts whose `X-Forwarded-Host` Astro trusts; without it the header is ignored.
  `[{}]` trusts every host. Bodies are capped at 1 MB for actions (`security.actionBodySizeLimit`) and server islands.
- **XSS**: Astro escapes expressions. `set:html` doesn't, so pass it only sanitised HTML (6.4); `set:text` escapes.
  `is:inline` scripts are left as written. 2026 brought XSS fixes in `define:vars` (CVE-2026-41067), spread
  attributes, slot names and view transitions, the last in 7.3.2: patch quickly (7.6).
- **CSP**: `security.csp` hashes Astro's own scripts and styles and writes the policy, plus your `directives`, into a
  `<meta http-equiv>` tag on each page. It doesn't run in `astro dev` (test with `build` and `preview`), external
  scripts need hashes you supply, `<ClientRouter />` and Shiki aren't supported, and `'unsafe-inline'` in a directive
  turns its hashes off. Browsers ignore `frame-ancestors` in a `<meta>` policy: send it as a header, or let the Node
  or Vercel adapter's `staticHeaders: true` send the whole policy as a header.
- Set the other 7.4 headers in middleware for on-demand routes and at the host for prerendered ones.

## Fonts and assets

- The Fonts API (stable since 6.0): declare families under `fonts` in the config, with providers such as
  `fontProviders.local()`, Fontsource or Google, and add `<Font cssVariable="…" />` from `astro:assets` to the head.
  Astro downloads and caches the files and serves them from your site, so `font-src 'self'` holds (9.9).
- `<script>` tags are processed and bundled by default, npm imports included. A `src` pointing at a CDN, or
  `is:inline`, skips that: keep third-party code out of both.
- Remote images go through your server's `/_image` endpoint, limited to `image.domains` and `image.remotePatterns`.
  That endpoint had SSRF bugs (CVE-2025-55303, CVE-2025-59837) and remote code execution when optimising AVIF files
  (fixed in 7.2.8 with Sharp 0.35.4): keep the patterns narrow and patch.

## Consent

- Astro sends no JavaScript unless you add it. Put the 9.7 consent banner and `loadWhenConsented()` in a processed
  `<script>` in the base layout; it runs on prerendered and on-demand pages alike.
- Never paste a vendor snippet as an `is:inline` script into a layout: it runs before any choice.
- `@astrojs/partytown` moves third-party scripts into a web worker, but they still contact the vendor, so gate them
  the same way. `@astrojs/vercel`'s `webAnalytics` option, when enabled, injects Vercel's analytics script into every
  page: that's analytics under 9.8 and 9.10.

## Logging

- Astro 7 made the logger stable: `logger: logHandlers.json({ level: 'info' })` writes JSON lines to stdout, or plug
  in your own handler. Log the route and a `ref`, not request headers or bodies (7.5).
- Show a generic `500.astro` page and return 6.3 Problem Details from endpoints and `ActionError`s.

## Testing

- Vitest with `getViteConfig()` from `astro/config`; render components with the Container API
  (`experimental_AstroContainer`), which since 6.0 can't run in Vitest's client environments. The docs have Playwright
  start the site through `webServer`.
- Run the isolation test, the 9.9 privacy test and axe against the production build (`npm run preview` for a static
  site, the built server for an on-demand one): the CSP doesn't exist in `astro dev`.
- Also check that a cross-origin form `POST` gets 403 and that each page's CSP matches 7.4.

## Deployment

- Adapters: `@astrojs/node` (standalone or middleware mode), `@astrojs/vercel`, `@astrojs/netlify` and
  `@astrojs/cloudflare`. On Vercel, functions run in `iad1` by default for new projects: set the region to `lhr1` or
  `fra1` in project settings or `vercel.json` (ADR-005).
- Keep adapters current: 2026 fixes included a Node adapter crash from a malformed `Host` port (CVE-2026-102984), path
  overrides on Vercel (CVE-2026-33768) and Netlify image allowlists broader than configured (CVE-2026-54300).
- A fully static build has no server: set headers at the host, and remember that a `<meta>` CSP can't carry
  `frame-ancestors`.
- Upgrading to 7: Vite 8, a Rust compiler that is stricter about invalid HTML, `src/fetch.ts` reserved for advanced
  routing (rename an existing file or set `fetchFile`), and `@astrojs/db` removed.

## Limits

- Prerendering is the default: anything per-user needs `prerender = false`, and middleware gives prerendered pages no
  protection.
- The CSP is hash-based, in `<meta>` unless an adapter sends headers; there are no nonces.
- Sessions work only on on-demand routes, and their driver settings are inlined at build unless you use a driver
  entrypoint.
- Astro 6's last release was 6.4.8 (17 June 2026), and the September 2026 AVIF fix shipped only in 7.2.8: we found no
  published support window for 6.x, so treat it as unsupported.

## Sources

- Astro: [Actions](https://docs.astro.build/en/guides/actions/) · [Middleware](https://docs.astro.build/en/guides/middleware/) · [On-demand rendering](https://docs.astro.build/en/guides/on-demand-rendering/) · [Server islands](https://docs.astro.build/en/guides/server-islands/) · [Sessions](https://docs.astro.build/en/guides/sessions/) · [Authentication](https://docs.astro.build/en/guides/authentication/) · [Environment variables](https://docs.astro.build/en/guides/environment-variables/)
- [Configuration: security, csp, session, env](https://docs.astro.build/en/reference/configuration-reference/) · [Directives (set:html, is:inline)](https://docs.astro.build/en/reference/directives-reference/) · [Scripts](https://docs.astro.build/en/guides/client-side-scripts/) · [Fonts](https://docs.astro.build/en/guides/fonts/) · [Partytown](https://docs.astro.build/en/guides/integrations-guide/partytown/) · [Testing](https://docs.astro.build/en/guides/testing/)
- [Node adapter](https://docs.astro.build/en/guides/integrations-guide/node/) · [Vercel adapter](https://docs.astro.build/en/guides/integrations-guide/vercel/) · [Upgrade to v7](https://docs.astro.build/en/guides/upgrade-to/v7/) · [Upgrade to v6](https://docs.astro.build/en/guides/upgrade-to/v6/) · [Older docs (unmaintained)](https://docs.astro.build/en/upgrade-astro/)
- Elsewhere: [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) · [Vercel function regions](https://vercel.com/docs/functions/configuring-functions/region) · [MDN: frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors) · [npm: astro versions](https://www.npmjs.com/package/astro?activeTab=versions)
- Advisories: [CVE-2025-64765](https://github.com/withastro/astro/security/advisories/GHSA-ggxq-hp9w-j794) · [CVE-2025-66202](https://github.com/withastro/astro/security/advisories/GHSA-whqg-ppgf-wp8c) · [CVE-2026-59731](https://github.com/withastro/astro/security/advisories/GHSA-vj59-8hwv-xxmv) · [CVE-2026-84376](https://github.com/withastro/astro/security/advisories/GHSA-376h-93r7-7g6f) · [CVE-2025-64525](https://github.com/withastro/astro/security/advisories/GHSA-hr2q-hp5q-x767) · [CVE-2026-73423](https://github.com/withastro/astro/security/advisories/GHSA-8mv7-9c27-98vc) · [CVE-2026-41067](https://github.com/withastro/astro/security/advisories/GHSA-j687-52p2-xcff) · [AVIF RCE](https://github.com/withastro/astro/security/advisories/GHSA-26w7-cxv4-gfx2) · [CVE-2025-55303](https://github.com/withastro/astro/security/advisories/GHSA-xf8x-j4p2-f749) · [CVE-2025-59837](https://github.com/withastro/astro/security/advisories/GHSA-qcpr-679q-rhm2) · [CVE-2026-102984](https://github.com/withastro/astro/security/advisories/GHSA-qh8j-hqjv-7m4x) · [CVE-2026-33768](https://github.com/withastro/astro/security/advisories/GHSA-mr6q-rp88-fx84) · [CVE-2026-54300](https://github.com/withastro/astro/security/advisories/GHSA-529g-xq4f-cw38)
