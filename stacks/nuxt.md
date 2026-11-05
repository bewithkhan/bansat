# Nuxt

> **Group:** Frontend and full-stack · **Covers:** Nuxt 4 (4.6) on Nitro 2, Vue 3 and Node 22.22.3+; Nuxt 3 reached end of life on 31 July 2026, and Nuxt 5 (Nitro 3) is scheduled for Q4 2026 · **Checked:** 2026-11-05 against the official docs

What changes from Next.js: server code is Nitro event handlers in `server/`, not Server Actions; route middleware is a
Vue navigation guard, never protection; Nuxt has no built-in CSRF check; headers and CSP come from the `nuxt-security`
module; fonts and third-party scripts have official modules (`@nuxt/fonts`, `@nuxt/scripts`).

## Access and the isolation test

- **Each file in `server/api/` is a public endpoint**, like a Route Handler. In every `defineEventHandler`, get the
  user from the session (`requireUserSession(event)` with `nuxt-auth-utils`), re-derive the tenant, call `assertCan()`
  (7.2), validate with `readValidatedBody(event, schema.parse)` or `getValidatedQuery` and the shared Zod schema
  (6.4), and return a DTO.
- **Route middleware isn't a boundary.** `app/middleware`, `definePageMeta({ middleware })` and the `appMiddleware`
  route rule run in the Vue app, on the server for the first render and again in the browser. The Nuxt docs say
  plainly that without server-side protection your data can still be accessed. 2026 showed it: route middleware didn't
  run for `.server.vue` pages fetched through `/__nuxt_island/page_*` (CVE-2026-47200), `appMiddleware` rules were
  skipped for mixed-case paths (CVE-2026-53721, CVE-2026-71315) and percent-encoded paths (CVE-2026-114131), and dot
  segments slipped past path checks in `server/middleware` (CVE-2026-119200, 4.6.0–4.6.2). Never authorise by matching
  a path.
- **Everything the server fetches for a page is in the HTML.** Data from `useFetch`, `useAsyncData` and `useState` is
  serialised into the `__NUXT_DATA__` payload, so return DTOs; `serialize: false` (4.6) keeps a result out of the
  payload.
- **Don't cache signed-in pages.** With `cache`, `swr` or `isr` route rules, Nuxt served one user's SSR payload to
  other users, signed in or not (CVE-2026-71316, fixed in 4.5.1). Use them for public pages only.
- **Server islands** take their props from the URL and skip route middleware: check the session inside the island, and
  keep personal data out of props, which end up in logs, CDN caches and `Referer` headers.
- **RLS** works as in the reference when queries go through the Supabase client with the user's session (Supabase's
  SSR guide has a Nuxt version); a direct Drizzle or Prisma connection needs data-layer scoping (ADR-002, 5.4).
- **Isolation test**, with `@nuxt/test-utils/e2e`, which builds and starts the app (`signIn` is your fixture that
  returns a session cookie for a seeded user):

```ts
// test/e2e/isolation.test.ts: user A must not read or change org B's task (5.4)
import { describe, expect, it } from 'vitest';
import { setup, url } from '@nuxt/test-utils/e2e';
import { ORG_B_TASK, signIn } from '../fixtures';

describe('tenant isolation', async () => {
  await setup({ server: true });
  it('denies another tenant', async () => {
    const headers = { cookie: await signIn('user-a'), 'content-type': 'application/json' };
    const task = url(`/api/tasks/${ORG_B_TASK}`); // url() adds the test server's host and port
    expect([403, 404]).toContain((await fetch(task, { headers })).status);
    const write = await fetch(task, { method: 'PATCH', headers, body: '{"title":"x"}' });
    expect([403, 404]).toContain(write.status);
  });
});
```

## Authentication

- Nuxt 4.6 has sealed-cookie sessions in `nuxt/server` (`useSession`, `getSession`, `updateSession`, `clearSession`):
  the cookie `nuxt-session` is `httpOnly`, `secure` and `sameSite: 'lax'` by default, sealed with a key derived from
  `NUXT_APP_SECRET`, and limited to 4 KB.
- The Nuxt docs' auth recipe uses `nuxt-auth-utils`: `setUserSession`, `requireUserSession`, `clearUserSession`,
  scrypt password hashing (`hashPassword`, `verifyPassword`, `passwordNeedsRehash`), OAuth providers and WebAuthn
  passkeys. The session's `user` data can be read by the browser through an API call, so put server-only values under
  `secure`.
- A sealed cookie lives in the browser, not in server storage, so 7.1's server-side sign-out needs a session ID or
  version you can revoke in the database, or Supabase Auth (the reference), which revokes on its side.
- Rate limits: `nuxt-security`'s limiter defaults to 150 requests per 5 minutes per IP, counted in an in-memory LRU
  cache per instance. Set the 6.6 limits on sign-in routes, set `ipHeader` behind a proxy, and use a shared storage
  driver when you run several instances.

## Secrets

- Top-level `runtimeConfig` keys are server-only; `runtimeConfig.public` is added to every page payload, so it's
  Nuxt's `NEXT_PUBLIC_`. Unlike `NEXT_PUBLIC_`, values are read at runtime from `NUXT_*` and `NUXT_PUBLIC_*`
  variables, for keys declared in `nuxt.config`. The docs warn against rendering runtime config or passing it to
  `useState`.
- `.env` is read by the CLI in development, build and generate, never by the built server: set variables on the host
  (3.7). Values are cast by `destr`, so quote numeric-looking secrets.
- Set `NUXT_APP_SECRET` (32+ random bytes) per environment and keep it stable across instances; builds never generate
  one. Current `nuxt-auth-utils` derives its key from it; older versions, and the Nuxt recipe, read
  `NUXT_SESSION_PASSWORD`.
- Importing `nuxt/server` from a component, plugin or `shared/` fails the build, so server helpers can't leak into the
  client bundle.

## CSRF and XSS

- **CSRF**: neither Nuxt nor h3 checks the origin of state-changing requests, unlike Server Actions. Enable
  `nuxt-security`'s `csrf: true` (it wraps `nuxt-csurf`, off by default, and gives you `useCsrfFetch`), or reject
  unsafe methods whose `Origin` isn't yours in a server middleware. Keep session cookies `SameSite=Lax`. Escape hatch:
  `csurf: false` in a route rule.
- **XSS**: Vue escapes text and attribute bindings. The escape hatches are `v-html`, `innerHTML` in render functions,
  user-controlled `:href` or `:src` (block `javascript:` URLs), user-controlled styles, and compiling templates at
  runtime (`vue.runtimeCompiler`), which turned server-island props into remote code execution (CVE-2026-71320). Use
  `useHeadSafe` for user input in the head. `navigateTo` and `<NuxtLink>` had `javascript:` URL fixes through 2026,
  the last in 4.6.0 (CVE-2026-114130).
- **CSP**: `nuxt-security` sets nonces with `'strict-dynamic'` for server-rendered pages, and SHA hashes in a `<meta>`
  tag for generated pages. Its defaults are looser than 7.4 (`font-src 'self' https: data:`, and `https:` in
  `style-src`), so set the directives to the 7.4 policy and start with `contentSecurityPolicyReportOnly: true`.
- The module also sets the 7.4 headers (check the values: `Referrer-Policy: no-referrer`, HSTS for 180 days), hides
  `X-Powered-By`, and limits request size (2 MB, 8 MB for uploads). Its `xssValidator` rejects requests that look like
  XSS, which is no substitute for escaping output.

## Fonts and assets

- `@nuxt/fonts` finds every `font-family` in your CSS, looks in `public/` and then in providers (Google, Bunny,
  Fontshare, Fontsource and others), downloads the files at build time and serves them from your own origin. The
  browser never contacts the provider (9.9); only your build machine does.
- Because it resolves fonts automatically, a family name can quietly pull a remote font into the build. Disable the
  providers you don't use (`fonts.providers: { google: false }`) or set `provider: 'local'` per family, and cache
  `node_modules/.cache/nuxt/fonts` in CI.
- Install libraries from npm; never add CDN `<link>` or `<script>` tags in `app.head`.

## Consent

- Load vendor scripts only in the browser and only after consent: from a `.client` plugin or `onMounted`, through
  9.7's `loadWhenConsented()`, or with `@nuxt/scripts`.
- `@nuxt/scripts` 1.x: pass `useScriptTriggerConsent()` as the script's trigger and it won't load until consent is
  accepted. Per-vendor `consent` objects map to the vendor's API, such as Consent Mode v2 for Google. Revoking doesn't
  unload a loaded script, so reload (9.8, item 8). The Partytown path ignores triggers: don't use it for anything
  consent-gated.
- **First-party mode**, on by default for registry scripts that support it, bundles a vendor's SDK at build time
  (`/_scripts/assets/`) and proxies its beacons through your server (`/_scripts/p/`), masking the visitor's IP. It
  keeps analytics IDs and fields, and the Nuxt Scripts docs say proxying doesn't settle the consent question. It does
  hide the vendor from host-based checks, so the 9.9 test and the CSP no longer see it: keep the consent gate and the
  register entries (3.6, 9.8).

## Logging

- Nitro logs to stdout. Nuxt can't attach a server-side handler to Nitro errors; use Nitro's `error` hook in a Nitro
  plugin to report them. In production, error responses never include the `cause`, but `createError` messages reach
  the user, so keep them generic and log details with a `ref` (6.3).
- Don't log `event` headers or bodies (7.5). `nuxt-security` strips `console` calls from the client build by default
  (`removeLoggers`).

## Testing

- `@nuxt/test-utils` with Vitest: a `nuxt` environment for components and composables (`mountSuspended`,
  `mockNuxtImport`, `registerEndpoint`), and Node-environment E2E tests with `setup`, `$fetch`, `fetch` and
  `createPage`. Its Playwright runner is `@nuxt/test-utils/playwright`.
- Run the 9.9 test against `nuxt build` and `nuxt preview`. With first-party mode on, also assert that no
  `/_scripts/p/` request happens before consent, because the vendor's host never appears.
- Check that state-changing routes refuse a foreign `Origin`, and that the CSP nonce is on every script.

## Deployment

- Nitro presets: `node-server` (`node .output/server/index.mjs`), `vercel`, `netlify`, `cloudflare`, or static files
  with `nuxt generate`. Vercel runs functions in `iad1` by default for new projects: set the region to `lhr1` or
  `fra1` (ADR-005).
- Set headers with `nuxt-security` or `routeRules` `headers`. A site from `nuxt generate` can't send headers, so its
  CSP is a `<meta>` tag without `frame-ancestors`; set the rest at the host.
- Keep the dev server off shared networks: unauthenticated Nuxt DevTools RPC allowed command execution on the
  developer's machine (CVE-2026-71319, fixed in `@nuxt/devtools` 3.3.1).
- Move off Nuxt 3, which gets no security fixes since 31 July 2026. Nuxt 4 stays supported for at least six months
  after Nuxt 5 ships.

## Limits

- No CSRF check, no Server-Action-style RPC, and route middleware isn't protection: every rule lives in the handler.
- Path matching between vue-router, Nitro and route rules has diverged repeatedly (the 2026 bypasses above), so patch
  quickly (7.6).
- Sealed-cookie sessions are limited to 4 KB and can't be revoked server-side on their own.
- The `nuxt-security` rate limiter counts per instance unless you give it shared storage.
- Nuxt 5 moves to Nitro 3; code written against `nuxt/server` runs on both.

## Sources

- Nuxt: [Runtime config](https://nuxt.com/docs/4.x/guide/going-further/runtime-config) · [Server imports and sessions](https://nuxt.com/docs/4.x/guide/going-further/server-imports) · [Sessions and authentication](https://nuxt.com/docs/4.x/guide/recipes/sessions-and-authentication) · [Middleware](https://nuxt.com/docs/4.x/directory-structure/app/middleware) · [server/](https://nuxt.com/docs/4.x/directory-structure/server) · [State management](https://nuxt.com/docs/4.x/getting-started/state-management) · [useFetch](https://nuxt.com/docs/4.x/api/composables/use-fetch)
- [Server components](https://nuxt.com/docs/4.x/guide/concepts/server-components) · [useHeadSafe](https://nuxt.com/docs/4.x/api/composables/use-head-safe) · [.env](https://nuxt.com/docs/4.x/directory-structure/env) · [Error handling](https://nuxt.com/docs/4.x/getting-started/error-handling) · [Testing](https://nuxt.com/docs/4.x/getting-started/testing) · [Deployment](https://nuxt.com/docs/4.x/getting-started/deployment) · [Roadmap and support](https://nuxt.com/docs/4.x/community/roadmap)
- Modules: [Nuxt Fonts](https://nuxt.com/modules/fonts) · [How Nuxt Fonts works](https://nuxt.com/modules/fonts/advanced) · [Nuxt Fonts configuration](https://nuxt.com/modules/fonts/configuration) · [Nuxt Scripts consent](https://scripts.nuxt.com/docs/guides/consent) · [Nuxt Scripts first-party mode](https://scripts.nuxt.com/docs/guides/first-party) · [nuxt-auth-utils](https://github.com/atinux/nuxt-auth-utils)
- nuxt-security: [Configuration and defaults](https://nuxt-security.vercel.app/getting-started/configuration) · [CSP](https://nuxt-security.vercel.app/headers/csp) · [CSRF](https://nuxt-security.vercel.app/middleware/csrf) · [Rate limiter](https://nuxt-security.vercel.app/middleware/rate-limiter)
- Elsewhere: [Vue security guide](https://vuejs.org/guide/best-practices/security.html) · [MDN: frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy/frame-ancestors) · [Supabase SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) · [Vercel function regions](https://vercel.com/docs/functions/configuring-functions/region)
- Advisories: [CVE-2026-47200](https://github.com/nuxt/nuxt/security/advisories/GHSA-hg3f-28rg-4jxj) · [CVE-2026-53721](https://github.com/nuxt/nuxt/security/advisories/GHSA-mm7m-92g8-7m47) · [CVE-2026-71315](https://github.com/nuxt/nuxt/security/advisories/GHSA-hxvh-4h3w-prp9) · [CVE-2026-114131](https://github.com/nuxt/nuxt/security/advisories/GHSA-6gq8-jgmh-3ffp) · [CVE-2026-119200](https://github.com/nuxt/nuxt/security/advisories/GHSA-9v7c-q64q-vv33) · [CVE-2026-71316](https://github.com/nuxt/nuxt/security/advisories/GHSA-wm8w-6qjm-cv43) · [CVE-2026-71320](https://github.com/nuxt/nuxt/security/advisories/GHSA-9473-5f9j-94wq) · [CVE-2026-114130](https://github.com/nuxt/nuxt/security/advisories/GHSA-jjm6-p2m9-9w4x) · [CVE-2026-71319](https://github.com/nuxt/nuxt/security/advisories/GHSA-279x-mwfv-vcqv)
