# Appwrite

> **Group:** No-code and BaaS · **Covers:** Appwrite Cloud and self-hosted Appwrite 2.x (2.7.1, a security release of 4 November 2026; 1.9.10 got the October Brotli fix, but the November runtime fix is in 2.7.1 only), with the TablesDB API (tables, rows and columns since August 2025), Auth, Storage, Functions and Sites · **Checked:** 2026-11-05 against the official docs

## Access and the isolation test

- **Permissions are Appwrite's RLS.** Every database, table, row, bucket and file carries permissions: `read`, `create`, `update`, `delete`, or `write` for the last three. Each is granted to a role ([permissions](https://appwrite.io/docs/advanced/security/permissions)):
  - `Role.any()` and `Role.guests()`;
  - `Role.users()`, optionally only `verified` or `unverified` users;
  - `Role.user(id)`, `Role.team(id, role)`, `Role.member(id)` and `Role.label(id)`.
- **Defaults.** Access is granted, never denied, so a table with no permissions is closed.
  - Resources created in the Console or with a Server SDK start with no permissions.
  - A row created with a Client SDK and no explicit permissions gives its creator read, update and delete.
  - A Server SDK using an API key ignores permissions entirely ([auth security](https://appwrite.io/docs/products/auth/security)), so re-derive the user in every Function before acting for them (7.2, T-03).
- **Table level or row level: either one is enough.** A table-level grant applies to every row, and row-level permissions count only when **Row security** is on in the table's settings ([TablesDB permissions](https://appwrite.io/docs/products/databases/tablesdb/permissions)). Buckets and files work the same way, with **File security** in place of **Row security** ([storage permissions](https://appwrite.io/docs/products/storage/permissions)). For per-user data, the 5.4 equivalent is:
  - at table level, grant only `create` to `Role.users()`;
  - turn **Row security** on;
  - put `read`, `update` and `delete` for `Role.user(id)` on each row.
- **Traps:**
  - `Role.users()` includes anonymous sessions ([permissions](https://appwrite.io/docs/advanced/security/permissions)), so use `Role.users('verified')` or named users and teams.
  - A table-level `read` for `Role.users()` hands every row to every signed-in user, whatever the row permissions say (T-01).
  - Channels readable by `Role.any()` push Realtime updates to signed-out visitors until you turn on **Auth → Policies → Realtime → Deny guests** (October 2026) ([changelog](https://appwrite.io/changelog/entry/2026-10-29)).
- **Native PostgreSQL and MySQL** are plain database endpoints reached with credentials, and any host holding the credentials can connect over the internet until you set an IP allowlist ([network security](https://appwrite.io/docs/products/databases/postgresql/network-security)). Keep credentials on servers, set the allowlist, and apply 5.4's RLS or data-layer scoping yourself (7.4). F-09's database needed no credentials at all; here one leaked password gets you to the same place.
- **Permissions as code.** `appwrite.config.json` holds each table's `$permissions` and `rowSecurity` ([CLI tables](https://appwrite.io/docs/tooling/command-line/tables)). `appwrite push tables` applies them, with one config file per environment (`--config-file appwrite.config.prod.json`) ([CLI](https://appwrite.io/docs/tooling/command-line/commands)). Review permission changes in pull requests, like migrations.
  - The docs' sample table grants `create`, `read`, `update` and `delete` to `"any"` with `rowSecurity: false`, a fully public table and the F-03 pattern. Never let an agent copy it.
- **Isolation test.** Run it against a development project, using the documented server-side session pattern ([SSR login](https://appwrite.io/docs/products/auth/server-side-rendering)):

```ts
// tests/isolation.test.ts: run against a development project, never production
import { Client, Account, TablesDB, ID, Permission, Role } from 'node-appwrite';
import { expect, test } from 'vitest';
const env = process.env as Record<string, string>;
const base = () => new Client().setEndpoint(env.ENDPOINT).setProject(env.PROJECT_ID);
async function as(email: string) { // the key needs only the sessions.write scope
  const s = await new Account(base().setKey(env.SESSIONS_KEY)).createEmailPasswordSession({ email, password: env.PASSWORD });
  const c = base(); c.setSession(s.secret); return new TablesDB(c);
}
test('user A cannot read or change a row only user B may read', async () => {
  const [a, b] = [await as(env.A_EMAIL), await as(env.B_EMAIL)], where = { databaseId: env.DB_ID, tableId: 'orders' };
  const row = await b.createRow({ ...where, rowId: ID.unique(), data: { total: 1 }, permissions: [Permission.read(Role.user(env.B_ID))] });
  await expect(a.getRow({ ...where, rowId: row.$id })).rejects.toThrow(); // not listRows: it returns 25 rows a page
  await expect(a.updateRow({ ...where, rowId: row.$id, data: { total: 2 } })).rejects.toThrow();
});
```

- **Add cases** for an anonymous session, a member of another team, and every bucket (5.4).

## Authentication

- **Methods:** email and password hashed with Argon2, OAuth2, magic URLs, email OTP, phone (SMS), anonymous sessions, JWTs, custom tokens and passkeys ([auth security](https://appwrite.io/docs/products/auth/security), [passkeys](https://appwrite.io/docs/products/auth/passkeys), [anonymous login](https://appwrite.io/docs/products/auth/anonymous)). Passkeys work on Cloud and on self-hosted 2.5 and later (13 October 2026, [2.5](https://appwrite.io/changelog/entry/2026-10-13)), and a passkey session also satisfies MFA.
- **Password policies** live in **Auth → Policies → Passwords**:
  - set a minimum length of 12;
  - turn on history (up to 20 passwords), the 10,000-common-passwords dictionary, and the check against personal data.
- **Breached passwords:** on Appwrite Cloud, detection is on by default but only records `passwordPwned`. Turn on **Reject breached passwords** and **Block sign-in with a breached password** (7.1). Self-hosted 2.3 and later needs `_APP_PWNED_PASSWORDS_DSN` before it does anything ([changelog](https://appwrite.io/changelog/entry/2026-09-29)).
- **MFA:** TOTP, email or phone, with recovery codes you can generate only once ([MFA](https://appwrite.io/docs/products/auth/mfa)). Require it for admins and C3 access (7.1, 9.13).
- **Sessions:** the default limit is 10 per user, up to 100. Session alerts email users about new sign-ins, and you can sign everyone out at once ([auth security](https://appwrite.io/docs/products/auth/security)). Remove mock phone numbers before launch (F-10).
- **Where the session lives.**
  - The Web SDK uses a secure cookie, but falls back to local storage when the browser blocks it as third-party, and local storage "can't protect your users' sessions" from XSS. Serve the API from a custom domain under your app's domain ([custom domains](https://appwrite.io/docs/products/network/custom-domains)).
  - With SSR, put `session.secret` in an `httpOnly`, `secure`, `SameSite` cookie named `a_session_<PROJECT_ID>`, and create a fresh client for every request ([SSR login](https://appwrite.io/docs/products/auth/server-side-rendering)).
- **Rate limits apply only to Client SDKs.** Traffic with an API key isn't limited ([rate limits](https://appwrite.io/docs/advanced/security/rate-limits)), so an SSR login route must throttle per account and per IP itself (7.1). On Cloud, Firewall rules can rate-limit auth paths ([Firewall](https://appwrite.io/docs/products/firewall)), and email policies block disposable addresses ([abuse protection](https://appwrite.io/docs/advanced/security/abuse-protection)).

## Secrets

- **API keys** are secrets for Server SDKs and the CLI. Scopes limit them, not permissions, so grant the fewest scopes, and keep them out of client apps ([API keys](https://appwrite.io/docs/partners/project/api-keys)). For a one-off task, use an ephemeral key: it lasts at most 3,600 seconds, which suits 12.1's short-lived credentials. Creating long-lived keys through the Project API has been deprecated since 17 August 2026, so create them in the Console.
- **Functions** get an ephemeral key, usable only inside the function, whose scopes you set ([functions](https://appwrite.io/docs/products/functions/functions)).
- **Sites** get `APPWRITE_SITE_API_KEY` at build time. At runtime the ephemeral key arrives in the `x-appwrite-key` header of every SSR request ([Sites variables](https://appwrite.io/docs/products/sites/environment-variables)), so never log request headers or forward them to the browser.
- **Variables:** tick **Secret** on a site variable, and no team member can read its value afterwards. A framework's public prefix (`NEXT_PUBLIC_`, `VITE_`, `PUBLIC_`) still ships the value to the browser (T-02).
- **Native database credentials** go on servers only. Rotate the primary password from the credentials dialog ([connections](https://appwrite.io/docs/products/databases/postgresql/connections)).

## CSRF and XSS

- **XSS** lives in your frontend, so follow your framework's profile. With Appwrite, XSS can also mean session theft whenever the local-storage fallback is in use, which is another reason for the custom domain.
- **CSRF:** Appwrite's SSR example sets the session cookie with `sameSite: 'strict'`. Still check `Origin` on every state-changing route (7.4).
- **CORS:** a **Web platform** pins the hostname allowed to call your project's API ([platforms](https://appwrite.io/docs/partners/project/platforms)). Register only your real hostnames, never a wildcard you don't control.
- **CSP:** the Sites docs I read don't describe custom response headers, so set the 7.4 CSP in your framework, with your Appwrite endpoint in `connect-src`, and check it with `curl -sI`.
- **Uploads (T-07):** buckets can cap file size, limit extensions, compress and encrypt files under 20 MB (AES-128-GCM) ([buckets](https://appwrite.io/docs/products/storage/buckets), [encryption](https://appwrite.io/docs/advanced/security/encryption)).
  - Virus scanning is a bucket option (`antivirus`) that skips files over 20 MB ([Storage API](https://appwrite.io/docs/references/cloud/server-nodejs/storage)). Self-hosted, it's off until you add ClamAV and set `_APP_STORAGE_ANTIVIRUS=enabled` ([environment variables](https://appwrite.io/docs/advanced/self-hosting/configuration/environment-variables)).
  - Since 21 October 2026, buckets on Cloud can strip location and device metadata from images. It's off by default, so turn it on for user uploads; the changelog said self-hosted would get it in the next release ([changelog](https://appwrite.io/changelog/entry/2026-10-21)).

## Fonts and assets

- **Self-host fonts and scripts** in the site's bundle (9.9). Appwrite serves your Sites and Storage files from your own project endpoints.
- **User files** go in buckets with **File security** on and per-user file permissions, never `Role.any()` read at bucket level ([storage permissions](https://appwrite.io/docs/products/storage/permissions)). Public assets go in a separate bucket (launch trap 14).
- **For the 9.9 test,** set `ALLOWED_HOSTS` to your domain and your Appwrite endpoint (`<region>.cloud.appwrite.io`, or your custom API domain).

## Consent

- **The session cookie** `a_session_<PROJECT_ID>`, and the local-storage fallback, are strictly necessary (the 9.8 register).
- **Appwrite Analytics** is described as setting no cookies, fingerprints or stored IP addresses ([Analytics](https://appwrite.io/products/analytics)). In the EU and Nigeria it still needs consent unless it truly stores and reads nothing on the device (9.10). Check that in the browser before you decide.
- **Messaging** (email, SMS, push): marketing sends need consent evidence and the suppression list (9.11).

## Logging

- **Audit logs:** the Activity tab shows events for tables, rows and users ([audit logs](https://appwrite.io/docs/advanced/security/audit-logs)). Keep your own 7.5 `audit_logs` table for app events, IDs only.
- **Function execution logs** can be switched off, and Appwrite suggests doing so in production to protect privacy ([functions](https://appwrite.io/docs/products/functions/functions)). Otherwise log IDs, never bodies or tokens (7.5).
- **Site logs** record request and response details, including parameters and headers, plus SSR console output, and you can turn them off ([Sites logs](https://appwrite.io/docs/products/sites/logs)). Keep personal data out of URLs.
- **Self-hosted error monitoring** follows 3.1: EU data region, PII scrubbing.

## Testing

- **No security scanner.** Appwrite's docs describe no advisor that reviews permissions, so the section 1 test is the check.
- **Separate environments (3.2):** give each environment its own project, apply the same `appwrite.config.json` to each, and seed synthetic users (5.5). For a local stack, self-host Appwrite with Docker Compose ([installation](https://appwrite.io/docs/advanced/self-hosting/installation)).
  - On Cloud, a project can also have **project environments** such as `staging`, each with its own resources and users. You pick one with `setEnvironment` in the SDKs, or `environment_id` in the MCP server; leaving it out acts on the project itself ([SDKs](https://appwrite.io/docs/sdks#environments), [MCP](https://appwrite.io/docs/tooling/ai/mcp-servers)). So any connection that can reach the staging environment can also reach production.
- **The CLI's guard rails:** `appwrite push` asks before destructive changes, `--force` answers yes to all of them ([CLI](https://appwrite.io/docs/tooling/command-line/commands)), and removing a column from the config can delete it on the next push ([CLI tables](https://appwrite.io/docs/tooling/command-line/tables)). Agent rule (12.1): never run `--force` against production, and review config diffs that drop columns like destructive migrations.
- **In CI:**
  - run `appwrite push` against the test project, then the Vitest isolation test, then the 9.9 Playwright test against a preview deployment;
  - fail the build if `appwrite.config.json` gives `"any"` or `"users"` more than you intended on any table or bucket, or has `rowSecurity: false` on a table that holds personal data.

## Deployment

- **Regions:** Frankfurt (`fra`), New York, San Francisco, Sydney, Singapore and Toronto are available; London and Amsterdam are "coming soon" ([regions](https://appwrite.io/docs/products/network/regions)). Data stays in the project's region, native databases take that region, and the endpoint is regional (`https://fra.cloud.appwrite.io/v1`). For EU data, create the project in Frankfurt. For UK-only residency, self-host or wait for London, and record the choice under 9.17.
- **Transport:** Appwrite Cloud serves HTTPS only, redirecting HTTP with a 301, and sends HSTS ([HTTPS](https://appwrite.io/docs/advanced/security/https)).
- **DPA:** download and sign it under **Organization → Settings** ([GDPR](https://appwrite.io/docs/advanced/security/gdpr)).
- **Backups** ([backups](https://appwrite.io/docs/advanced/security/backups)):
  - Pro plans and up have backup policies, manual backups and restore;
  - Appwrite's own disaster-recovery backups are point-in-time for 7 days on some databases, and every 4 hours, kept 7 days, on others;
  - for 5.7, also keep exports under another account.
- **The 1 November 2026 incident** happened on Appwrite Cloud in Frankfurt, the region recommended above ([incident report](https://appwrite.io/blog/post/incident-report-sites-functions-runtime-vulnerability)). A runtime flaw exposed a credential that could read the environment variables of Functions and Sites on Frankfurt compute, which also serves some sites from other regions. Appwrite notified the owners of 1,022 projects. If you were notified, rotate every secret variable at its issuer, then redeploy each function and site.
- **Self-hosting means you own patching (7.6).** Recent security releases:
  - 2.7.1 carries the root-cause fix for that runtime flaw, and the incident report points self-hosters only to it ([changelog](https://appwrite.io/changelog/entry/2026-11-04), [incident report](https://appwrite.io/blog/post/incident-report-sites-functions-runtime-vulnerability)). No 1.9 release has followed 1.9.10 of 24 October ([Docker Hub tags](https://hub.docker.com/r/appwrite/appwrite/tags)), so plan the move from 1.9 to 2.7.1;
  - 2.6.2 and 1.9.10 patch Brotli (CVE-2026-111497), and functions and sites also need updated runtime images ([changelog](https://appwrite.io/changelog/entry/2026-10-24-1)). End-of-life runtimes (Node.js 16, 18–21, 23 and 25; Bun 1.0–1.3) won't get the fix, even on Cloud: switch each function and site to Node.js 22, 24 or 26 or Bun 1.4, and redeploy.
- **Agents (12.1):** the MCP server signs in with OAuth and reaches the organisations and projects your account can ([MCP](https://appwrite.io/docs/tooling/ai/mcp-servers)). Since October 2026, writes go through a separate tool marked destructive, which needs `confirm_write: true` and a reason ([changelog](https://appwrite.io/changelog/entry/2026-10-27)). Connect with an account that sees only development projects, and keep approvals on.

## Limits

- **The 2025 rename:** collections became tables, documents rows, and attributes columns; document security is now row security ([TablesDB changelog](https://appwrite.io/changelog/entry/2025-08-26-2)). Old tutorials and agents use the old terms, and the old API still works, so check which one your code calls.
- **Granted, never denied.** There's no deny rule: a single broad grant at table or bucket level beats every careful row permission.
- **You can't grant what you don't hold.** A user can share a resource only with permissions they have. Cross-team sharing needs a Function using a Server SDK, and that Function must make the authorisation check itself ([permissions](https://appwrite.io/docs/advanced/security/permissions)).
- **API-key traffic** skips both permissions and rate limits, so every server route carries the weight of 7.1 and 7.2.
- **Self-hosted security features** such as breached-password detection need extra configuration before they work.

## Sources

- Access: [permissions](https://appwrite.io/docs/advanced/security/permissions) · [TablesDB permissions](https://appwrite.io/docs/products/databases/tablesdb/permissions) · [storage permissions](https://appwrite.io/docs/products/storage/permissions) · [PostgreSQL network security](https://appwrite.io/docs/products/databases/postgresql/network-security) · [PostgreSQL connections](https://appwrite.io/docs/products/databases/postgresql/connections) · [CLI commands](https://appwrite.io/docs/tooling/command-line/commands) · [CLI tables](https://appwrite.io/docs/tooling/command-line/tables)
- Auth: [auth security](https://appwrite.io/docs/products/auth/security) · [passkeys](https://appwrite.io/docs/products/auth/passkeys) · [anonymous login](https://appwrite.io/docs/products/auth/anonymous) · [MFA](https://appwrite.io/docs/products/auth/mfa) · [SSR login](https://appwrite.io/docs/products/auth/server-side-rendering) · [custom domains](https://appwrite.io/docs/products/network/custom-domains) · [rate limits](https://appwrite.io/docs/advanced/security/rate-limits) · [abuse protection](https://appwrite.io/docs/advanced/security/abuse-protection) · [Firewall](https://appwrite.io/docs/products/firewall)
- Keys and hosting: [API keys](https://appwrite.io/docs/partners/project/api-keys) · [SDKs and project environments](https://appwrite.io/docs/sdks#environments) · [Storage API](https://appwrite.io/docs/references/cloud/server-nodejs/storage) · [self-hosting environment variables](https://appwrite.io/docs/advanced/self-hosting/configuration/environment-variables) · [functions](https://appwrite.io/docs/products/functions/functions) · [Sites variables](https://appwrite.io/docs/products/sites/environment-variables) · [Sites logs](https://appwrite.io/docs/products/sites/logs) · [platforms](https://appwrite.io/docs/partners/project/platforms) · [buckets](https://appwrite.io/docs/products/storage/buckets) · [encryption](https://appwrite.io/docs/advanced/security/encryption)
- Operations: [regions](https://appwrite.io/docs/products/network/regions) · [HTTPS](https://appwrite.io/docs/advanced/security/https) · [GDPR and DPA](https://appwrite.io/docs/advanced/security/gdpr) · [backups](https://appwrite.io/docs/advanced/security/backups) · [audit logs](https://appwrite.io/docs/advanced/security/audit-logs) · [MCP server](https://appwrite.io/docs/tooling/ai/mcp-servers) · [self-hosting installation](https://appwrite.io/docs/advanced/self-hosting/installation) · [Analytics](https://appwrite.io/products/analytics)
- Security notices: [incident report, 1 November 2026](https://appwrite.io/blog/post/incident-report-sites-functions-runtime-vulnerability) · [Docker Hub tags](https://hub.docker.com/r/appwrite/appwrite/tags)
- Changelog: [TablesDB terminology](https://appwrite.io/changelog/entry/2025-08-26-2) · [2.5 with passkeys](https://appwrite.io/changelog/entry/2026-10-13) · [breached passwords](https://appwrite.io/changelog/entry/2026-09-29) · [image metadata](https://appwrite.io/changelog/entry/2026-10-21) · [Brotli fix](https://appwrite.io/changelog/entry/2026-10-24-1) · [MCP reads and writes](https://appwrite.io/changelog/entry/2026-10-27) · [Realtime deny guests](https://appwrite.io/changelog/entry/2026-10-29) · [2.7.1](https://appwrite.io/changelog/entry/2026-11-04)
- Casebook: F-03, F-09, F-10 (Appendix F)
