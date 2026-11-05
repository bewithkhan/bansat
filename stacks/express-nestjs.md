# Express and NestJS

> **Group:** Backend · **Covers:** Express 5 (5.3; 4.x is still supported) and NestJS 12 (12.3) on its Express or Fastify adapter, on Node 20.19+ · **Checked:** 2026-11-05 against the official docs

These are API servers, so what changes from Next.js is mostly what isn't built in. Every route handler and controller
method is a public endpoint, like a Server Action. Express gives you none of the controls by default: you choose the
session, CSRF, header and rate-limit packages. NestJS 12.1 added built-in CSRF protection and security headers, and
the official `@nestjs/authentication` and `@nestjs/authorization` packages arrived for Nest 12 in September 2026,
still at 0.x. Fonts and consent banners belong to the frontend's profile; this one covers what the API must do for
them.

## Access and the isolation test

- **Express**: authorise inside each handler, or in per-route middleware that loads the resource and calls
  `assertCan()` (7.2). A path-prefix gate such as `app.use('/admin', requireAdmin)` is not authorisation. Scope every
  query by the tenant taken from the session (5.4), never from the request body.
- **NestJS**: guards run after all middleware and before interceptors and pipes, and unlike middleware they know which
  handler is next. Register them globally (`APP_GUARD`) so a new route is protected by default.
- **`@nestjs/authorization`** (0.x, Nest 12 only) keeps rules in `@Policy()` classes, one method per ability that
  takes the user and allows only by returning `true`, checked with `@Can(Policy, 'ability')`. Its global guard denies
  any handler that declares no check, and logs those at startup. The docs say to put record checks in services after
  loading the record, filter lists in the query, import `AuthenticationModule` before `AuthorizationModule`, and
  never cache responses by URL on record-checked routes: a `CacheInterceptor` answers before the policy runs.
  `@Public()` and `@Can.Anyone()` are the escape hatches; review each one.
- **Middleware is no boundary on Fastify**: path-scoped Nest middleware (`MiddlewareConsumer.forRoutes()`) was
  bypassed through URL encoding (CVE-2025-69211, CVE-2026-2293), `HEAD` requests (CVE-2026-33011), a trailing slash
  (CVE-2026-54281) and absolute-form request targets (fixed in 12.0.2 and 11.2.4). Put access checks in guards and
  services.
- **RLS**: a server connection as the table owner bypasses RLS (ADR-002). Either query through the Supabase client
  with the user's token, or run each request's queries in a transaction that sets `role authenticated` and
  `request.jwt.claims`, as the 5.4 test does.
- **Isolation test** with Supertest, which the Nest docs use for E2E tests. Build the app through the same
  `configure(app)` function as `main.ts`, so that the CSRF check, headers and pipes are on in tests too:

```ts
// test/isolation.e2e-spec.ts: user A must not read or change org B's task (5.4)
import { expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule, configure } from '../src/app.module'; // configure(app): the setup main.ts runs
import { ORG_B_TASK, tokenFor } from './fixtures';
it('denies another tenant', async () => {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = await configure(moduleRef.createNestApplication()).init();
  const auth = { Authorization: `Bearer ${await tokenFor('user-a')}` };
  const denied = (r: request.Response) => expect([403, 404]).toContain(r.status);
  await request(app.getHttpServer()).get(`/tasks/${ORG_B_TASK}`).set(auth).expect(denied);
  await request(app.getHttpServer()).patch(`/tasks/${ORG_B_TASK}`).set(auth).send({ title: 'x' }).expect(denied);
  await app.close();
});
```

For plain Express, export the `app` and call `request(app)` the same way.

## Authentication

- **Express** has no auth: its FAQ leaves the scheme to you. With `express-session`, replace the default `MemoryStore`
  (it leaks memory and isn't meant for production) with a database or Redis store. Its cookie defaults to `httpOnly:
  true` but `secure: false` with no `SameSite`: set `secure: true`, `sameSite: 'lax'` and a generic `name`. Call
  `req.session.regenerate()` at sign-in, as 7.1 requires a new session ID, and `req.session.destroy()` at sign-out.
  Rotate the secret by putting the new one first in the `secret` array.
- Express's security guide recommends blocking repeated failures by user name and IP, and by IP over a longer window,
  for example with `rate-limiter-flexible` (6.6).
- **NestJS 12**: `@nestjs/authentication` registers a global guard and ships server-side sessions (a `__Host-sid`
  cookie, `HttpOnly`, `Secure`, `SameSite=Lax`), scrypt password hashing at OWASP's parameters, email verification and
  reset links, TOTP with lockout after 5 failures, magic links bound to the browser that asked, OpenID Connect with
  PKCE, rotating refresh tokens and hashed API keys. Its docs cover TOTP but not passkeys.
- Its production checklist matters: register a database store for sessions and tokens, keep the throttler's counts in
  shared storage such as Redis, call `rotateSession()` on privilege changes and `revokeAll()` after a password change,
  never use `LogMailTransport` (it writes sign-in links to the log), and send `AuthenticationEvents` to `audit_logs`
  (7.5).
- Rate limiting in Nest is `@nestjs/throttler`, bound as a global guard; its default storage counts per process.

## Secrets

- There's no client bundle, but every secret sits in `process.env`. Express has no `.env` loader: use Node's
  `--env-file` locally and the host's secret store in production (7.4).
- `@nestjs/config` loads `.env` from the working directory; set `ignoreEnvFile: true` where the platform injects
  variables. In 12, `validationSchema` takes any Standard Schema such as Zod, so a missing secret stops start-up.
- Keep the Supabase secret key, database URL, session secret, JWT secret (32 bytes or more, from a secret manager) and
  TOTP encryption keys server-side and per environment (3.7).
- **What you return is what leaks.** An ORM entity carries password hashes, tokens and fields the caller shouldn't
  see; the Nest serialization docs say passwords must always be left out. Return DTOs. In Nest 12, bind
  `StandardSchemaSerializerInterceptor` globally and give every handler a response schema with
  `@SerializeOptions({ schema })`: Zod's `z.object()` drops undeclared fields, so it works as an allowlist, but
  handlers without a schema pass through untouched. `ClassSerializerInterceptor` with `@Exclude()` applies only to
  class instances. In Express, map rows to DTOs before `res.json()`.

## CSRF and XSS

- **Express** has no CSRF protection, and `csurf` is archived ("no longer maintained" on npm). Keep cookies
  `SameSite=Lax` and reject unsafe methods whose `Sec-Fetch-Site` or `Origin` shows another site, or use a
  double-submit token package such as `csrf-csrf`, which the Nest docs describe. APIs that take bearer tokens from
  mobile or server clients don't need CSRF protection.
- **NestJS 12.1+**: call `app.enableCsrfProtection()` straight after `NestFactory.create()`. It allows `GET`, `HEAD`
  and `OPTIONS`, rejects unsafe requests whose `Sec-Fetch-Site` isn't `same-origin` or `none`, falls back to comparing
  `Origin` with `Host`, ignores `X-Forwarded-Host`, and runs before middleware and guards. `trustedOrigins` and
  `exclude` are its escape hatches: exclude only signed webhooks (6.5) and identity-provider callbacks that arrive as
  cross-site form `POST`s (SAML, OAuth's `form_post`). It doesn't check WebSocket upgrades, so check `Origin` in
  gateways that use cookies.
- **CORS**: Express's `cors` middleware, which Nest's `enableCors()` also uses on Express (`@fastify/cors` on
  Fastify), reflects whatever `Origin` arrives with `origin: true`, and with a RegExp such as `/example\.com$/` any
  origin ending that way, `evil-example.com` included. With `credentials: true` and cookie sessions, such a site can
  read signed-in responses. List exact origins, allow credentials only for them, never reflect, and put the same list
  in Nest's `trustedOrigins`: its CSRF check doesn't trust CORS origins on its own.
- **Validation**: `ValidationPipe` with `whitelist` and `forbidNonWhitelisted`, or, new in 12,
  `StandardSchemaValidationPipe` with `@Body({ schema })` and a `.strict()` Zod schema (3.8, 6.4).
- **XSS**: send JSON with `res.json()` and `nosniff`. If you render HTML, the template engine's raw-output syntax
  switches escaping off: EJS `<%-`, Pug `!{}`, Handlebars triple braces. Validate redirect targets before
  `res.redirect()`, as Express's guide shows.
- **Headers**: Express's guide recommends `helmet`; Nest 12.1's `app.useSecurityHeaders()` sends Helmet 8's defaults
  without the package. Both default to `font-src 'self' https: data:`, `style-src 'self' https: 'unsafe-inline'`,
  `Referrer-Policy: no-referrer` and HSTS for one year: set the 7.4 values where they differ. Express sends
  `X-Powered-By` unless you `app.disable('x-powered-by')`; both helpers remove it.

## Fonts and assets

- An API serves no fonts. Where the server also serves HTML (an admin page, API docs, templated pages), self-host
  fonts and scripts with `express.static` and keep 7.4's `font-src 'self'`; the frontend's own profile covers the rest
  of 9.9.
- Express 5 ignores dotfiles by default, now including hidden directories in the path, so `/.well-known/security.txt`
  (7.6) returns 404. Mount that folder on its own, `app.use('/.well-known', express.static('public/.well-known'))`,
  rather than allowing dotfiles everywhere.

## Consent

- Consent banners and the script loader live in the frontend. The API's part is 9.7's CR-05 and CR-06: append consent
  decisions to `consent_records` (API-005) and check consent on the server before any marketing send or server-side
  tracking event.
- Server-side analytics or "conversion" calls are tracking under the same rules (9.8, 9.10): don't forward identifiers
  to a vendor without the matching consent.

## Logging

- Express's default error handler returns the stack trace unless `NODE_ENV=production`. Always set it, and add your
  own last error handler that returns 6.3 Problem Details with a `ref`. Express 5 passes rejected promises from
  `async` handlers to it automatically.
- `morgan`'s `combined` format logs IP address, full URL with query string, referrer and user agent. Use a custom
  format with method, route, status, duration and request ID; drop query strings, which can carry tokens, and keep IPs
  only as long as 5.6 allows (7.5).
- Nest: `new ConsoleLogger({ json: true })` writes JSON lines, and 12's structured params attach IDs without
  string-building. The built-in exception filter answers unknown errors with a plain 500 `Internal server error`; 12's
  `errorCode` option on `HttpException` carries the 6.3 codes.

## Testing

- Unit and E2E tests with Vitest (the default for new ESM projects in Nest 12) or Jest, plus Supertest. On Jest, the
  ESM-only Nest 12 packages need Node 24.9 or later.
- `Test.createTestingModule()` with `overrideProvider()` and `overrideGuard()` for unit tests; the authorization docs
  show how to test policies directly.
- Add the 7.2 permission-matrix test against the real guards, a request with `Sec-Fetch-Site: cross-site` that must
  get 403, and a check that error responses carry no stack trace.

## Deployment

- Put TLS in a reverse proxy such as nginx, as Express's guide recommends, and set `trust proxy` to exactly your proxy
  hops. `true` trusts the left-most `X-Forwarded-For`, which a client can forge unless the proxy overwrites it;
  `req.ip` (rate limits), `req.secure` (secure cookies) and `req.hostname` all depend on it.
- Nest's CSRF check reads `Host` and ignores `X-Forwarded-Host`: keep `Host` intact at the proxy, or list the public
  origin in `trustedOrigins`.
- Nest 12 runs on Node 20.19+ or 22.12+; its CLI's generators (`@nestjs/schematics`) need 22.22.3+ (22.x), 24.15+ or
  26+. Express 5 needs Node 18+.
- Never enable `@nestjs/devtools-integration` outside a developer's machine: it allowed remote code execution from any
  website the developer visited (CVE-2025-54782, fixed in 0.2.1).
- Patch the middleware too: `multer` and `body-parser` had repeated denial-of-service fixes in 2025 and 2026, and
  `path-to-regexp` had ReDoS fixes in March 2026 (7.6).
- Host in a UK or EU region (ADR-005); migrations and backups follow 11.4 and 5.7.

## Limits

- Express decides nothing for you, so each control is a package choice and a supply-chain risk (T-12).
- Express 5 changed defaults: `req.body` is `undefined` without a parser, `req.query` is a read-only getter with the
  simple parser, `express.urlencoded` defaults to `extended: false`, and route paths use the new `path-to-regexp`
  syntax.
- `@nestjs/authentication` and `@nestjs/authorization` are 0.x releases (first published 29 September 2026), so pin
  them and read each release's notes.
- Nest guards don't run for requests that `app.use()` middleware answers itself, and microservice handlers need
  `inheritAppConfig: true` for the global guards to apply.
- Both Express 4.x and Nest 11 still get releases (4.22.3 in September and 11.2.8 in October 2026), but we couldn't
  find an end date for Nest 11.

## Sources

- Express: [Security best practices](https://expressjs.com/en/advanced/best-practice-security) · [Error handling](https://expressjs.com/en/5x/guide/error-handling) · [Behind proxies](https://expressjs.com/en/5x/guide/behind-proxies) · [Migrating to 5](https://expressjs.com/en/guide/migrating-5) · [express-session](https://expressjs.com/en/resources/middleware/session) · [cors](https://expressjs.com/en/resources/middleware/cors) · [morgan](https://expressjs.com/en/resources/middleware/morgan) · [FAQ](https://expressjs.com/en/5x/starter/faq) · [Support](https://expressjs.com/en/support) · [Security updates](https://expressjs.com/en/advanced/security-updates)
- NestJS: [Authentication](https://docs.nestjs.com/security/authentication) · [Authorization](https://docs.nestjs.com/security/authorization) · [CSRF](https://docs.nestjs.com/security/csrf) · [CORS](https://docs.nestjs.com/security/cors) · [Serialization](https://docs.nestjs.com/application/serialization) · [Security headers](https://docs.nestjs.com/security/helmet) · [Rate limiting](https://docs.nestjs.com/security/rate-limiting) · [Guards](https://docs.nestjs.com/guards) · [Configuration](https://docs.nestjs.com/application/configuration) · [Validation](https://docs.nestjs.com/application/validation)
- [Logger](https://docs.nestjs.com/application/logger) · [Exception filters](https://docs.nestjs.com/exception-filters) · [Testing](https://docs.nestjs.com/fundamentals/testing) · [Migration guide (11 to 12)](https://docs.nestjs.com/migration-guide)
- Elsewhere: [npm: csurf](https://www.npmjs.com/package/csurf) · [EJS](https://ejs.co/) · [Pug interpolation](https://pugjs.org/language/interpolation.html) · [Handlebars expressions](https://handlebarsjs.com/guide/expressions.html) · [Node.js `--env-file`](https://nodejs.org/api/cli.html#--env-filefile) · [npm: express versions](https://www.npmjs.com/package/express?activeTab=versions)
- Advisories: [CVE-2025-69211](https://github.com/nestjs/nest/security/advisories/GHSA-8wpr-639p-ccrj) · [CVE-2026-2293](https://github.com/nestjs/nest/security/advisories/GHSA-r4wm-x892-vjmx) · [CVE-2026-33011](https://github.com/nestjs/nest/security/advisories/GHSA-wf42-42fg-fg84) · [CVE-2026-54281](https://github.com/nestjs/nest/security/advisories/GHSA-6v32-fjc9-9qf6) · [Absolute-form bypass](https://github.com/nestjs/nest/security/advisories/GHSA-9c5c-9qcx-q35q) · [CVE-2025-54782](https://github.com/nestjs/nest/security/advisories/GHSA-85cg-cmq5-qjm7) · [path-to-regexp ReDoS](https://github.com/pillarjs/path-to-regexp/security/advisories/GHSA-j3q9-mxjg-w52f) · [body-parser DoS](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828) · [multer DoS](https://github.com/expressjs/multer/security/advisories/GHSA-q7qp-rjg7-q26m)
