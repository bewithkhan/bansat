# SvelteKit

> **Group:** Frontend and full-stack · **Covers:** SvelteKit 3 (3.1.1; 3.0 shipped on 1 October 2026) on Svelte 5, Vite 8 and Node 22.17+; notes for 2.x · **Checked:** 2026-11-05 against the official docs

What changes from Next.js: the server entry points are `load` functions, form actions, `+server.ts` endpoints and
(experimental) remote functions; `hooks.server.ts` runs `handle` before them; the CSRF origin check is on by default,
and since 3.0 only `trustedOrigins: ['*']` switches it off; CSP is built in, with nonces or hashes; private variables
come from `$app/env/private`, and server-only imports fail the build. SvelteKit 3 moved all configuration into the
`sveltekit()` plugin in `vite.config.js` (`svelte.config.js` is no longer read) and replaced `$lib` with `#lib`.

## Access and the isolation test

- **Every entry point is public**: server `load` functions, form actions (`POST` to `?/name`), `+server.ts` handlers
  and remote functions (`query`, `form`, `command`, `prerender` in `*.remote.ts`). Re-check authorisation in each, as
  with Server Actions, through a data-access module in `src/lib/server/` that calls `assertCan()` (7.2).
- **`handle` authenticates; the entry point authorises.** Read the session cookie in `handle` and set
  `event.locals.user`, then check the resource where it's loaded or changed. A `+layout.server.ts` guard isn't enough:
  layout `load` doesn't rerun on client navigation between child routes, and runs alongside page `load` unless the
  page awaits `parent()`. The docs suggest `handle` for groups of routes and a guard in each `+page.server.ts` for the
  rest. Form actions don't run `load` first.
- **What a server `load` returns goes to the browser**: SvelteKit serialises it with devalue into the HTML or the
  `__data.json` response. Return DTOs, never whole rows or tokens.
- **`handle` runs while a page is prerendered at build time, never when the prerendered file or a static asset is
  served**, so a prerendered route (`export const prerender = true`) is public whatever your hooks say. Keep per-user
  data out of it.
- **Remote functions** (still experimental in 3.x, behind `experimental.remoteFunctions`) are HTTP endpoints. Give
  each one a Standard Schema validator (Zod or Valibot); `'unchecked'` switches validation off. In `handle`, a remote
  call's `event.url`, `route` and `params` describe the calling page and can be forged, so never authorise on them;
  3.0 blocks reading them inside a `query`. `query.batch` once mixed concurrent users' requests (CVE-2026-82258, fixed
  in 2.60.1).
- **RLS** as in the reference: create the Supabase server client in `handle` (Supabase's SSR guide has a SvelteKit
  version); a Drizzle connection (`npx sv add drizzle`) needs data-layer scoping (ADR-002, 5.4).
- **Isolation test** with Playwright against `vite build && vite preview` (the CSRF check only runs in production
  builds). Send your own origin, so that the request passes CSRF and the test exercises authorisation:

```ts
// tests/isolation.spec.ts: user A must not read or change org B's task (5.4)
import { expect, test } from '@playwright/test';
import { ORG_B_TASK, ORIGIN } from './fixtures';

test.use({ storageState: 'tests/.auth/user-a.json' }); // a saved sign-in as user A
test('another tenant is denied', async ({ request }) => {
  expect([403, 404]).toContain((await request.get(`/api/tasks/${ORG_B_TASK}`)).status());
  const write = await request.post(`/w/org-b/tasks/${ORG_B_TASK}?/update`, {
    form: { title: 'x' },
    headers: { origin: ORIGIN, accept: 'application/json' }, // JSON: the status follows fail() or error()
  });
  expect([403, 404]).toContain(write.status());
});
```

## Authentication

- No built-in auth. The docs suggest checking the session cookie in `handle` and storing the user in `locals`; `npx sv
  add better-auth` scaffolds Better Auth with Drizzle (email and password by default), and the Lucia guide covers
  hand-rolled sessions.
- `cookies.set` defaults to `httpOnly: true`, `secure: true` (except in development and on `http://localhost`),
  `sameSite: 'lax'` and, since 3.0, `path: '/'`. Cookie names must be ASCII.
- `handle` runs before an action but doesn't rerun before the `load` that follows, so an action that signs someone in
  or out must update `event.locals` itself.
- Remote `form` fields whose names start with an underscore (`_password`) aren't sent back to the browser when
  validation fails.
- There's no rate limiting: add 6.6's limits in `handle` or at the host. Behind a proxy, `adapter-node` reads the
  client IP from `ADDRESS_HEADER` with `XFF_DEPTH` counted from the right, which resists spoofing.

## Secrets

- SvelteKit 3: declare each variable in `src/env.ts` with `defineEnvVars`. Variables are private by default and import
  from `$app/env/private`, which browser code can't import (the build fails). `public: true` makes one available from
  `$app/env/public` and as `%sveltekit.env.NAME%` in `app.html`: this is the `NEXT_PUBLIC_` equivalent. `static: true`
  inlines a value at build time. A validator schema makes a bad value fail the start or the build.
- 2.x used `$env/static/private`, `$env/dynamic/private` and the `PUBLIC_` prefix; those modules are deprecated in
  3.0. Supabase's guide still uses the 2.x `PUBLIC_` names: declare them `public: true` in `src/env.ts`.
- Server-only modules: any file with a `server` segment in its name (`db.server.ts`, `server.ts`) and anything in a
  `server` directory outside `src/routes` and `static` (3.0 widened this from `src/lib/server`). Packages in
  `node_modules` aren't covered.

## CSRF and XSS

- **CSRF**: in production builds SvelteKit compares `Origin` with your origin on `POST`, `PUT`, `PATCH` and `DELETE`
  form submissions (form, `text/plain` or no `Content-Type`) and on every non-`GET` remote function call. 3.0 removed
  `checkOrigin`; allow partners such as a payment provider with `csrf.trustedOrigins` (full origins). The escape hatch
  is `trustedOrigins: ['*']`, which switches the form check off at build time. Remote functions stay same-origin
  whatever you list. Behind a proxy, set `paths.origin` (it replaces `adapter-node`'s `ORIGIN` variable and is read
  when you build) so the check knows your public origin.
- JSON `+server.ts` endpoints used with cookies: verify `Origin` yourself if your CORS policy is loose (7.4).
- **XSS**: Svelte escapes expressions; `{@html ...}` is the escape hatch, so pass it only sanitised HTML (6.4). Svelte
  fixed several SSR XSS bugs in 2026 (spread attributes, `<svelte:element>`, `<option>`, `contenteditable` bindings),
  all by 5.55.7.
- **Redirects**: since 3.0, `redirect()` to an external URL needs `{ external: true }` or a list of origins, and
  `javascript:` stays blocked unless you list it.
- **CSP**: set `csp` in the plugin options: `mode: 'auto'` uses nonces on dynamic pages and hashes on prerendered
  ones, `directives` holds the 7.4 policy, and `reportOnly` (with `report-uri` or `report-to`) comes first. SvelteKit
  stamps its own inline scripts and styles; use `%sveltekit.nonce%` for tags in `app.html`. Prerendered pages get the
  policy as a `<meta>` tag, which ignores `frame-ancestors`, `report-uri` and `sandbox`, so send those as headers at
  the host.
- Set the other 7.4 headers in `handle` with `response.headers.set`. `handle` doesn't run when prerendered pages are
  served, so configure those headers at the host too.

## Fonts and assets

- There's no font module. Install `@fontsource/*` or keep `woff2` files in `src/lib/assets` and reference them from
  your CSS; Vite bundles and hashes them, so `font-src 'self'` holds (9.9).
- SvelteKit doesn't preload fonts. Preload one critical file through `resolve(event, { preload })` in `handle`.
- Don't copy the environment-variables page's example, which puts the Google tag in `app.html`: everything in
  `app.html` loads before consent.

## Consent

- Load vendor scripts in the browser only, after consent: call 9.7's `loadWhenConsented()` from `onMount` or `$effect`
  in the root `+layout.svelte`, and keep the banner there. Guard browser-only code with `browser` from `$app/env`
  (`$app/environment` in 2.x).
- Nothing third-party goes in `src/app.html` or an unconditional `<svelte:head>`: both are in the server-rendered HTML
  before any choice.
- The performance guide points to Partytown for third-party scripts. A script in a web worker still contacts its
  vendor, so gate it the same way.

## Logging

- `handleError` (in `hooks.server.ts` and `hooks.client.ts`) receives every error in 3.0, including expected ones, and
  returns the `App.Error` the user sees. Unexpected errors default to `{ status: 500, message: 'Internal Error' }`;
  log the error with a `ref` and return the 6.3 shape. Validation errors arrive with `kind: 'validation'` and their
  `issues`; don't log submitted values.
- 3.0 applies source maps to stack traces by default: keep stack traces in your logs, never in the response.
- `src/instrumentation.server.ts` loads automatically, and `tracing: { server: true }` enables OpenTelemetry. Keep
  personal data out of span attributes (7.5).

## Testing

- `npx sv add vitest` sets up client- and server-aware unit and component tests; `npx sv add playwright` adds
  Playwright.
- Run the isolation test, the 9.9 privacy test and axe against `vite build` then `vite preview`: CSRF checks are off
  in development, and the dev server's traffic and CSP differ from production.
- Also check that a form `POST` with a foreign `Origin` gets 403, and that dynamic pages send a
  `Content-Security-Policy` header while prerendered ones carry the `<meta>`.

## Deployment

- **Adapters**: `adapter-node` (`node build`, with `PROTOCOL_HEADER`, `HOST_HEADER`, `ADDRESS_HEADER`, `XFF_DEPTH` and
  `BODY_SIZE_LIMIT`), `adapter-vercel`, `adapter-netlify`, `adapter-cloudflare` and `adapter-static`.
- `adapter-vercel`'s `regions` defaults to `["iad1"]` (Washington, D.C.): set `['lhr1']` or `['fra1']` for UK or EU
  data (ADR-005). Use its ISR only on routes that every visitor sees identically.
- Keep adapters current: 2026 fixed a `BODY_SIZE_LIMIT` bypass in `adapter-node` (CVE-2026-40073) and an SSRF through
  prerendering (CVE-2025-67647).
- To upgrade, run `npx sv migrate sveltekit-3` from the latest 2.x, then move `csp`, `csrf` and the adapter into
  `vite.config.js`.

## Limits

- Remote functions are experimental, and 2026 brought several denial-of-service fixes in their form decoding.
- `handle` doesn't run when prerendered pages are served, and CSRF checks don't run in development.
- No built-in auth or rate limiting.
- 2.x still gets patches (2.70.4 shipped on 5 November 2026), but we couldn't find a published end date.

## Sources

- SvelteKit: [Auth](https://svelte.dev/docs/kit/auth) · [Hooks](https://svelte.dev/docs/kit/hooks) · [Loading data](https://svelte.dev/docs/kit/load) · [Form actions](https://svelte.dev/docs/kit/form-actions) · [Remote functions](https://svelte.dev/docs/kit/remote-functions) · [Server-only modules](https://svelte.dev/docs/kit/server-only-modules) · [Environment variables](https://svelte.dev/docs/kit/environment-variables)
- [Configuration (csp, csrf)](https://svelte.dev/docs/kit/@sveltejs-kit-vite) · [Cookies API](https://svelte.dev/docs/kit/@sveltejs-kit) · [Errors](https://svelte.dev/docs/kit/errors) · [Observability](https://svelte.dev/docs/kit/observability) · [Performance](https://svelte.dev/docs/kit/performance) · [Migrating to v3](https://svelte.dev/docs/kit/migrating-to-sveltekit-3)
- [Node servers](https://svelte.dev/docs/kit/adapter-node) · [Vercel](https://svelte.dev/docs/kit/adapter-vercel) · [Building your app](https://svelte.dev/docs/kit/building-your-app) · [Svelte `{@html}`](https://svelte.dev/docs/svelte/@html) · [CLI: better-auth](https://svelte.dev/docs/cli/better-auth) · [CLI: vitest](https://svelte.dev/docs/cli/vitest) · [CLI: playwright](https://svelte.dev/docs/cli/playwright)
- Source, SvelteKit 3.1.1: [cookie defaults (`cookie.js`)](https://github.com/sveltejs/kit/blob/main/packages/kit/src/runtime/server/cookie.js) · [CSRF and remote-function checks (`csrf.js`)](https://github.com/sveltejs/kit/blob/main/packages/kit/src/runtime/server/csrf.js) · [`trustedOrigins: ['*']` at build (`exports/vite/index.js`)](https://github.com/sveltejs/kit/blob/main/packages/kit/src/exports/vite/index.js)
- Elsewhere: [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) · [npm: @sveltejs/kit versions](https://www.npmjs.com/package/@sveltejs/kit?activeTab=versions)
- Advisories: [CVE-2026-82258](https://github.com/sveltejs/kit/security/advisories/GHSA-hgv7-v322-mmgr) · [CVE-2026-40073](https://github.com/sveltejs/kit/security/advisories/GHSA-2crg-3p73-43xp) · [CVE-2025-67647](https://github.com/sveltejs/kit/security/advisories/GHSA-j62c-4x62-9r35) · [Svelte spread-attribute XSS](https://github.com/sveltejs/svelte/security/advisories/GHSA-pr6f-5x2q-rwfp) · [Svelte `<svelte:element>`](https://github.com/sveltejs/svelte/security/advisories/GHSA-m56q-vw4c-c2cp) · [Svelte `<option>`](https://github.com/sveltejs/svelte/security/advisories/GHSA-h7h7-mm68-gmrc) · [Svelte contenteditable](https://github.com/sveltejs/svelte/security/advisories/GHSA-phwv-c562-gvmh)
