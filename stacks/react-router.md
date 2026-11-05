# React Router

> **Group:** Frontend and full-stack · **Covers:** React Router 8 (8.5) in framework mode, the successor to Remix 2, on React 19.2.7+, Vite 7+ and Node 22.22+; notes for 7.x, which still gets patch releases · **Checked:** 2026-11-05 against the official docs

What changes from Next.js: each route module's `loader` (GET) and `action` (POST, PUT, PATCH, DELETE) are the server
entry points; route `middleware`, always on since 8.0, wraps them; there are no Server Actions outside the unstable
RSC modes; sessions come from React Router's session storage, and the CSP nonce is passed in `entry.server.tsx`. React
Router 8 shipped on 17 June 2026 with few breaking changes: it adopted the v7 future flags, removed
`react-router-dom`, and became ESM-only.

## Access and the isolation test

- **Loaders and actions are public endpoints.** A loader answers document requests and the `.data` requests the client
  makes on navigation; an action answers any non-GET submission to its route. Both can be called by URL without your
  UI, like Server Actions. In each: get the user from the session, check the resource with `assertCan()` (7.2),
  validate `request.formData()` with the shared Zod schema (6.4), and return only what the page renders, because
  loader data is serialised into the HTML and `.data` responses.
- **Middleware authenticates; loaders and actions authorise.** Server middleware (`export const middleware`) runs
  parent to child on document and `.data` requests, so it's the place to read the session and put the user in
  `context` (`createContext`). It doesn't know which row is being touched, and on client navigation it runs only if a
  `.data` request goes to the server, so a route with no loader skips it.
- **Keep server code in `.server` modules.** Files named `*.server.ts` and anything in a `.server/` directory are kept
  out of the client bundle, and the build fails if they leak into it. Put the data-access layer and anything that
  reads secrets there; route modules themselves can't be `.server`.
- **Prerendered and SPA routes have no server checks.** `prerender` paths run their loaders at build time, so they
  hold no per-user data; with `ssr: false` there are no server loaders or actions at all, and enforcement moves to
  your API and RLS.
- **RLS** as in the reference: create the Supabase server client per request (Supabase's SSR guide has a React Router
  version); a Drizzle or Prisma connection needs data-layer scoping (ADR-002, 5.4).
- **Isolation test** with Playwright against `react-router build` and `react-router-serve ./build/server/index.js`
  (the template's `start` script). Send your own origin so that the request passes the CSRF check and the test
  exercises the action's own check:

```ts
// tests/isolation.spec.ts: user A must not read or change org B's task (5.4)
import { expect, test } from '@playwright/test';
import { ORG_B_TASK, ORIGIN } from './fixtures';

test.use({ storageState: 'tests/.auth/user-a.json' }); // a saved sign-in as user A
test('another tenant is denied', async ({ request }) => {
  expect([403, 404]).toContain((await request.get(`/tasks/${ORG_B_TASK}`)).status());
  expect([403, 404]).toContain((await request.get(`/tasks/${ORG_B_TASK}.data`)).status());
  const write = await request.post(`/tasks/${ORG_B_TASK}`, {
    form: { intent: 'rename', title: 'x' },
    headers: { origin: ORIGIN },
  });
  expect([403, 404]).toContain(write.status());
});
```

## Authentication

- There's no auth built in. Supabase Auth works through `@supabase/ssr` (the reference); otherwise use the session
  storages: `createCookieSessionStorage` (everything in the cookie, size-limited), `createMemorySessionStorage`,
  `createFileSessionStorage` from `@react-router/node`, or `createSessionStorage` over your database.
- Create cookies with `httpOnly: true`, `secure: true`, `sameSite: 'lax'`, a `maxAge` and `secrets`. Rotate secrets by
  adding the new one at the front of the array. The docs describe signing, and the source shows it: the value is
  base64-encoded JSON with an HMAC-SHA256 signature, which proves integrity but doesn't hide the contents, so a cookie
  session holds an ID, never personal data.
- Always sign: `createFileSessionStorage` with an unsigned cookie allowed path traversal on the server
  (CVE-2025-61686, critical, fixed in `@react-router/node` 7.9.4).
- After any change, `commitSession()` and send its `Set-Cookie`. Start a new session at sign-in, and on sign-out
  `destroySession()` and revoke the session on the server (7.1).
- No rate limiting: add 6.6's limits in middleware or at the host.

## Secrets

- React Router uses Vite's rules: only `VITE_`-prefixed variables reach client code through `import.meta.env`, inlined
  at build time. That's the `NEXT_PUBLIC_` equivalent. Server code reads `process.env` at runtime.
- Anything a loader returns ends up in the browser, so never return secrets or whole rows.
- Read secrets only in `.server` modules; the docs point to `vite-env-only` for finer control.

## CSRF and XSS

- **CSRF**: since 7.12 (January 2026, CVE-2026-22030), framework mode rejects submissions to UI routes from other
  origins; 7.15.1 extended the check from POST to PUT, PATCH and DELETE (CVE-2026-53663). Since 7.18 it compares the
  request URL's host, not headers, so behind a proxy have the adapter set the public host (for
  `@react-router/express`, Express's `trust proxy`) or list it in `allowedActionOrigins`. Resource routes aren't
  covered: verify `Origin` there yourself (7.4). Escape hatch: `allowedActionOrigins: ['**']`.
- **XSS**: React escapes output; `dangerouslySetInnerHTML` takes only sanitised HTML (6.4). Don't build `meta()`
  `script:ld+json` tags from untrusted content (CVE-2025-59057). Never redirect to a URL built from user input: 2026
  fixes covered `javascript:` redirects (CVE-2026-22029) and open redirects through `//` and backslashes
  (CVE-2025-68470, CVE-2026-40181, CVE-2026-53669).
- **CSP**: reveal the entry with `react-router reveal entry.server`, make a nonce per request, and pass it to
  `<ServerRouter nonce>` (which hands it to `<Scripts>` and `<ScrollRestoration>`) and to `renderToPipeableStream`'s
  `nonce` option. Set the 7.4 policy in `responseHeaders` there, in report-only mode first.
- Other headers go in the same place, or in a route module's `headers` export.

```tsx
// app/entry.server.tsx (excerpt): one nonce per response, shared by the header and React Router's scripts
const nonce = crypto.randomUUID().replaceAll('-', '');
responseHeaders.set('Content-Security-Policy-Report-Only', cspFor(nonce)); // cspFor: your 7.4 policy
const { pipe } = renderToPipeableStream(
  <ServerRouter context={routerContext} url={request.url} nonce={nonce} />,
  { nonce, onShellReady() { /* stream the response, as in the default entry */ } },
);
```

## Fonts and assets

- The default template's `root.tsx` loads Inter from `fonts.googleapis.com` in its `links` export, so a new app leaks
  every visitor's IP to Google before consent (9.9). Delete those three entries and self-host: install `@fontsource/*`
  and import it in `root.tsx`, or serve `woff2` files from `public/`.
- Vite bundles npm packages and hashes the assets, so `font-src 'self'` and `script-src 'self'` hold.

## Consent

- Load vendors in the browser only, after consent: call 9.7's `loadWhenConsented()` from a `useEffect` in the root
  `Layout` or `App`. Nothing third-party goes in `root.tsx`'s `<head>`, `links` or `meta`, which are server-rendered.
- Client navigation keeps a loaded script running, so withdrawal means stopping the vendor, clearing its cookies and
  reloading (9.8, item 8).

## Logging

- Export `handleError` from `entry.server.tsx` to report server errors, and skip requests whose `request.signal` was
  aborted. Send the route and a `ref`, not the request (7.5).
- In production builds, server errors reach the browser sanitised: a generic message and no stack trace. Use
  `ErrorBoundary` and `isRouteErrorResponse` to show the 6.3 states.

## Testing

- Use `createRoutesStub` to test components that call `useLoaderData` or `useActionData` with Vitest, and Playwright
  for end-to-end tests.
- Run the isolation test, the 9.9 privacy test and axe against the production build (`npm run build`, then `npm
  start`), not `react-router dev`.
- Also check that a resource route refuses a foreign `Origin`, and that every `<script>` carries the response's nonce.

## Deployment

- The official templates cover Node with Docker, a custom Express server and Node with Postgres; Vercel, Cloudflare
  and Netlify maintain their own (Cloudflare projects use `@cloudflare/vite-plugin` since 8.0). On Vercel, functions
  run in `iad1` by default for new projects: set `lhr1` or `fra1` (ADR-005).
- Behind a proxy, configure the adapter so that request URLs carry your public host (CSRF, above), and pin the `Host`
  header: before 7.4.1, `@react-router/express` could be fooled by crafted `Host` and `X-Forwarded-Host` headers
  (CVE-2025-31137).
- To upgrade from 7.x, adopt each `future.v8_*` flag, swap `react-router-dom` imports for `react-router` and
  `react-router/dom`, and meet the new minimums (Node 22.22, React 19.2.7, Vite 7).

## Limits

- React Server Components support is unstable and had its own CSRF bypass (fixed in 7.18.2 and 8.3.0); Server Actions
  exist only there.
- The origin check covers UI routes only; resource routes and your own API need theirs.
- Cookie sessions are signed, not encrypted, and their `commitSession` throws once the cookie passes 4 KB.
- 2026 brought more than a dozen advisories, from XSS and open redirects to denial of service and constructor
  injection: the vendored turbo-stream allowed unauthenticated remote code execution in framework mode when the app
  already had a prototype-pollution bug (CVE-2026-42211, fixed in 7.14.2), and SSR hydration allowed constructor
  injection (CVE-2026-53666, fixed in 7.18.0). Patch quickly (7.6); on 7.x, be on 7.18.5 (27 October 2026). 7.x still
  gets releases, but we couldn't find a published end date.

## Sources

- React Router: [Security](https://reactrouter.com/how-to/security) · [Middleware](https://reactrouter.com/how-to/middleware) · [Sessions and cookies](https://reactrouter.com/explanation/sessions-and-cookies) · [.server modules](https://reactrouter.com/api/framework-conventions/server-modules) · [react-router.config.ts](https://reactrouter.com/api/framework-conventions/react-router.config.ts) · [Headers](https://reactrouter.com/how-to/headers)
- [Error reporting](https://reactrouter.com/how-to/error-reporting) · [Error boundaries and sanitisation](https://reactrouter.com/how-to/error-boundary) · [Testing](https://reactrouter.com/start/framework/testing) · [Deploying](https://reactrouter.com/start/framework/deploying) · [Upgrading from v7](https://reactrouter.com/upgrading/v7) · [Changelog](https://github.com/remix-run/react-router/blob/main/CHANGELOG.md)
- Docs source for the pages above, React Router 8.5: [remix-run/react-router `docs/`](https://github.com/remix-run/react-router/tree/main/docs) · [Default template `root.tsx`](https://github.com/remix-run/react-router-templates/blob/main/default/app/root.tsx)
- Source, React Router 8.5.1: [cookie encoding and signing (`cookies.ts`)](https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/server-runtime/cookies.ts) · [HMAC-SHA256 (`crypto.ts`)](https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/server-runtime/crypto.ts) · [4 KB limit (`cookieStorage.ts`)](https://github.com/remix-run/react-router/blob/main/packages/react-router/lib/server-runtime/sessions/cookieStorage.ts)
- Elsewhere: [Vite env variables](https://vite.dev/guide/env-and-mode) · [React `dangerouslySetInnerHTML`](https://react.dev/reference/react-dom/components/common) · [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) · [Vercel function regions](https://vercel.com/docs/functions/configuring-functions/region)
- Advisories: [CVE-2026-22030](https://github.com/remix-run/react-router/security/advisories/GHSA-h5cw-625j-3rxh) · [CVE-2026-53663](https://github.com/remix-run/react-router/security/advisories/GHSA-84g9-w2xq-vcv6) · [RSC CSRF bypass](https://github.com/remix-run/react-router/security/advisories/GHSA-qwww-vcr4-c8h2) · [CVE-2025-61686](https://github.com/remix-run/react-router/security/advisories/GHSA-9583-h5hc-x8cw) · [CVE-2025-31137](https://github.com/remix-run/react-router/security/advisories/GHSA-4q56-crqp-v477) · [CVE-2025-59057](https://github.com/remix-run/react-router/security/advisories/GHSA-3cgp-3xvw-98x8) · [CVE-2026-22029](https://github.com/remix-run/react-router/security/advisories/GHSA-2w69-qvjg-hvjx) · [CVE-2025-68470](https://github.com/remix-run/react-router/security/advisories/GHSA-9jcx-v3wj-wh4m) · [CVE-2026-40181](https://github.com/remix-run/react-router/security/advisories/GHSA-2j2x-hqr9-3h42) · [CVE-2026-53669](https://github.com/remix-run/react-router/security/advisories/GHSA-wrjc-x8rr-h8h6) · [CVE-2026-42211](https://github.com/remix-run/react-router/security/advisories/GHSA-49rj-9fvp-4h2h) · [CVE-2026-53666](https://github.com/remix-run/react-router/security/advisories/GHSA-337j-9hxr-rhxg)
