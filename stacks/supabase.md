# Supabase

> **Group:** No-code and BaaS · **Covers:** the Supabase platform as of November 2026 (hosted projects on Postgres 15 and 17), supabase-js 2.x, `@supabase/ssr` 0.12 and the Supabase CLI (v3.0.0 reached npm on 2 November 2026; v2 stays on the `v2.stable` tag) · **Checked:** 2026-11-05 against the official docs

## Access and the isolation test

- **5.4 is written for Supabase**: RLS on every table, policies `to authenticated` with `(select auth.uid())`, helpers in a `private` schema. This section collects the platform settings around it.
- **Two layers, both needed:**
  - **Grants** decide whether `anon`, `authenticated` or `service_role` can reach a table, view or function through the Data API at all.
  - **RLS** decides which rows they get.
  - A missing grant returns error `42501`, and a policy that matches nothing returns no rows ([securing your API](https://supabase.com/docs/guides/api/securing-your-api)).
- **RLS defaults.** Tables made in the Dashboard get RLS on; tables made in the SQL editor, by migrations or by other tools don't. Put `enable row level security` and the policies in the same migration as the table. The advisor's error `0013_rls_disabled_in_public` means anyone with your project URL can read, edit and delete that table ([advisors](https://supabase.com/docs/guides/observability/advisors)). That's F-01, F-02 and F-03. Tables you replicate to Realtime need RLS and policies too ([production checklist](https://supabase.com/docs/guides/security/production-checklist)).
- **Grant defaults (changed in 2026).** On older projects, new tables in `public` were granted to `anon`, `authenticated` and `service_role` automatically ([changelog](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)):
  - from 28 April 2026, **Automatically expose new tables** could be unticked at project creation;
  - from 30 May 2026, unticked became the default for new projects;
  - from 30 October 2026, the new behaviour applies to every existing project, but existing tables keep their grants.
  - Run the guide's `pg_default_acl` query to see what your project grants. When an agent hits a `42501`, the fix it reaches for is a `grant`: check that the same migration enables RLS and adds policies (12.1).
- **What RLS doesn't cover:**
  - **Functions:** RLS doesn't apply, and every new function is executable by `PUBLIC`. Revoke, then grant `execute` per role, and review every `security definer` function. Lints `0028` and `0029` flag those that `anon` or `authenticated` can run.
  - **Views:** they bypass RLS by default. Create them `with (security_invoker = true)` on Postgres 15 and later ([RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security)).
  - **Metadata:** never use `user_metadata` (`raw_user_meta_data`) in a policy, since users can edit it (lint `0015`). `app_metadata` is safe but stale until the JWT refreshes.
- **The Data API's surface.** In **Integrations → Data API**, turn **Enable Data API** off if no client uses it. Otherwise expose only the schemas you need, a dedicated `api` schema helps, and add a pre-request function for checks RLS can't express ([securing your API](https://supabase.com/docs/guides/api/securing-your-api)). Since 18 May 2026 `pg_graphql` isn't enabled by default ([changelog](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically)). Lints `0026` and `0027` flag tables still exposed through GraphQL.
- **Isolation test.** Write the 5.4 test as pgTAP files in `supabase/tests/`, and run them with `supabase test db` against the local stack, never production. Each file runs in its own transaction and is rolled back ([`supabase test db`](https://supabase.com/docs/reference/cli/supabase-test-db), [RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security)):

```sql
-- supabase/tests/tasks_isolation_test.sql: needs the 5.5 seed (two orgs, one member each)
begin;
select plan(2);
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000a","role":"authenticated"}';
select is(
  (select count(*) from public.tasks where organization_id = '00000000-0000-0000-0000-0000000000b0'),
  0::bigint, 'user A sees no org B tasks');
select throws_ok(
  $$insert into public.tasks (organization_id, title, creator_id)
    values ('00000000-0000-0000-0000-0000000000b0', 'x', '00000000-0000-0000-0000-00000000000a')$$,
  '42501', null, 'user A cannot write into org B');
select * from finish();
rollback;
```

- **Add a file per table**, as `anon` too, and assert what your grants should give: `42501` where `anon` has no grant, zero rows where it does. On a live project, run the 14.2 query that lists tables without RLS (Day-0 triage T2).

## Authentication

- **Sessions:** a JWT access token (1 hour by default) plus single-use refresh tokens with reuse detection. Supabase discourages access tokens longer than an hour. On Pro plans and up you can time-box sessions, set an inactivity timeout, or allow one session per user ([sessions](https://supabase.com/docs/guides/auth/sessions)). These settings are checked at the next refresh, so a session can outlive them by up to one access-token lifetime.
- **Passwords** are hashed with bcrypt. Set the minimum length to 12 (Supabase calls anything under 8 not recommended). Leaked-password protection (Have I Been Pwned) needs Pro or above ([password security](https://supabase.com/docs/guides/auth/password-security)).
- **MFA:** TOTP and phone. Enrolling users doesn't secure anything by itself: enforce `aal2` in a restrictive RLS policy (`as restrictive ... (select auth.jwt()->>'aal') = 'aal2'`) and in your server code ([MFA](https://supabase.com/docs/guides/auth/auth-mfa)). The docs don't cover passkeys, so use TOTP where 7.1 or 9.13 requires a second factor.
- **Rate limits** are set in **Authentication → Rate Limits** ([rate limits](https://supabase.com/docs/guides/auth/rate-limits)):
  - sign-ups, magic links, OTPs and recovery: 30 per 5 minutes per IP;
  - token requests, which include password sign-ins and refreshes: 150 per 5 minutes per IP;
  - OTPs, sign-up confirmations and password resets: one per user per 60 seconds;
  - the built-in email provider: 2 emails an hour.
  - Add CAPTCHA to sign-up, sign-in and reset ([going into production](https://supabase.com/docs/guides/deployment/going-into-prod)). None of the documented limits throttles password guesses per account (7.1), so add that yourself.
- **Verifying tokens:** move to asymmetric JWT signing keys, and verify with `supabase.auth.getClaims()` ([signing keys](https://supabase.com/docs/guides/auth/signing-keys)). Never trust `getSession()` on the server (7.1).
- **Anonymous sign-ins** use the same `authenticated` role as real accounts, so any `to authenticated` policy admits them too (lint `0012`). Where that matters, add `(select (auth.jwt()->>'is_anonymous')::boolean) is false` to the policy.
- **Before launch** ([production checklist](https://supabase.com/docs/guides/security/production-checklist)):
  - turn email confirmations on, and set the OTP and link expiry to 3600 seconds or less;
  - remove test phone numbers (F-10);
  - send auth email through your own SMTP;
  - enforce MFA for your organisation's members (Pro and up), and add a second owner.

## Secrets

- **Which key goes where** ([API keys](https://supabase.com/docs/guides/getting-started/api-keys)):
  - **Publishable keys** (`sb_publishable_...`) go in anything you ship. They map to `anon`, or to `authenticated` once a user signs in.
  - **Secret keys** (`sb_secret_...`) map to `service_role`, which has `BYPASSRLS`, so they belong on servers only.
  - The legacy `anon` and `service_role` JWT keys are being deprecated by the end of 2026. They keep working until you disable them in **Settings → API Keys**.
- **Secret-key behaviour:** a secret key returns 401 when it's used from a browser, but works from any other tool, so rotate it the moment it leaks. Use one secret key per backend component, and never log one: at most 6 characters after the prefix, or a SHA-256 hash. A secret-key client sending a user's JWT runs under that user's RLS, not as `service_role` ([RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security)).
- **Edge Functions:**
  - The `verify_jwt` check doesn't authenticate a caller that sends only an API key, so authorise in code with `@supabase/server` ([API keys](https://supabase.com/docs/guides/getting-started/api-keys)).
  - Secrets live in `supabase/functions/.env` locally (git-ignored) and `supabase secrets set` in production ([function secrets](https://supabase.com/docs/guides/functions/secrets)).
- **Secrets inside the database** go in Vault ([Vault](https://supabase.com/docs/guides/database/vault)). They never go in a table the Data API exposes; tokens are C3 data (5.1, F-02).

## CSRF and XSS

- **Supabase is the backend.** CSRF and XSS live in your frontend, so use the framework's profile. Supabase notes that a publishable key protects against neither ([API keys](https://supabase.com/docs/guides/getting-started/api-keys)).
- **Session storage:** supabase-js keeps the session in local storage by default ([supabase-js](https://supabase.com/docs/reference/javascript/auth)), and `@supabase/ssr` keeps it in cookies ([SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client)) that browser code can read (7.1). Either way, XSS can take the session, so the strict CSP in 7.4 carries the weight.
- **CSP hosts** for Supabase are `https://<ref>.supabase.co` in `connect-src`, `wss://<ref>.supabase.co` if you use Realtime, and the same host in `img-src` for public Storage URLs (7.4).
- **Uploads:** set a file-size limit and allowed MIME types on each bucket ([buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)). Never render an uploaded HTML or SVG file inline on your own origin (T-07).

## Fonts and assets

- **Fonts and scripts belong in your app's bundle** (9.9). Supabase only serves what you put in Storage, from your own project host, which 9.9 counts as your backend.
- **Storage policies** ([Storage access control](https://supabase.com/docs/guides/storage/security/access-control), [buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)):
  - Buckets are private by default, and nothing can be uploaded until a policy on `storage.objects` allows it.
  - Scope each policy to a bucket and folder, for example `(storage.foldername(name))[1] = (select auth.uid())::text`.
  - A public bucket skips access control for reads, so anyone with a URL gets the file. Lint `0025` flags public buckets whose broad `SELECT` policy also lets clients list everything.
- **User files** go in private buckets, served through `createSignedUrl` with short expiries (launch trap 14, Day-0 triage T3). Keep public buckets for public assets only.

## Consent

- **The session entry** (`sb-<ref>-auth-token`, in local storage or cookies) is strictly necessary (the 9.8 register).
- **Consent evidence** (9.7) goes in `consent_records`, with RLS on and no client policies, written only by server code (5.4).
- **Analytics stored in Supabase** are still analytics: events you record yourself follow 9.10. They need consent in the EU and Nigeria, and IDs, not emails.

## Logging

- **What the logs keep:** Logs covers the API gateway, Postgres, Auth, Storage, PostgREST, Edge Functions, Realtime and the pooler ([logs](https://supabase.com/docs/guides/observability/logs)). How long they're kept depends on your plan; log drains export them.
- **The gateway records more than you might think:** the full URL and query string (`request.search`), client IP headers (`cf-connecting-ip`, `x-real-ip`) and the referer ([log fields](https://supabase.com/docs/guides/observability/log-field-reference)). A Data API filter such as `?email=eq.…` puts an email address in your logs: filter by ID (7.5), and count IP addresses as personal data in 5.6.
- **Extra Postgres statement logging**, if you turn it on, records SQL text. Keep it brief, and never on while C3 data flows.
- **Edge Function** `console` output lands in `function_logs`, so log IDs and outcomes, never bodies or tokens.
- **Your audit trail:** write 7.5's events to `audit_logs` (5.3), not to the platform logs.

## Testing

- **Locally:** `supabase start` runs the stack in Docker containers and prints local publishable and secret keys. Where there's no container engine, as in an agent sandbox or a CI runner, an experimental native runtime runs each service as a process ([CLI getting started](https://supabase.com/docs/guides/local-development/cli/getting-started)). `supabase db reset` re-applies migrations and `supabase/seed.sql`, and `supabase test db` runs `pg_prove` over `supabase/tests/` ([testing](https://supabase.com/docs/guides/local-development/testing/overview)).
- **Advisors** run in Studio, through MCP (`get_advisors`), with `supabase db advisors`, or through the Management API ([advisors](https://supabase.com/docs/guides/observability/advisors)).
  - Security lints to fix first: `0013` RLS disabled, `0007` a policy on a table with RLS off, `0008` RLS on with no policy, `0015` `user_metadata` in a policy, `0024` `USING (true)`, `0010` `security definer` views, `0011` mutable `search_path`, `0023` sensitive columns exposed, `0025` listable public buckets.
  - Performance lints: `0003` `auth_rls_initplan` (wrap `auth.uid()` in `select`), `0006` multiple permissive policies, `0001` unindexed foreign keys.
- **What advisors miss:** they're deterministic checks against known patterns, and some findings are intentional. A policy that exists, is restrictive in form and still lets org A read org B passes every lint. Only an isolation test catches that, and it's the "ineffective RLS" that UpGuard's scan found (F-03).
- **In CI:** run `supabase start`, `supabase test db`, then `supabase db advisors` against the local stack, and the 9.9 Playwright test against a preview build.

## Deployment

- **Region:** each project has one primary region, which also decides where its data is stored ([regions](https://supabase.com/docs/guides/platform/regions)). The general "Europe" option can land in London or Zurich, which aren't EU states, so choose a specific region for residency: London `eu-west-2`, Ireland `eu-west-1`, Frankfurt `eu-central-1`, Paris `eu-west-3` or Stockholm `eu-north-1`. Record it in 3.6 and 9.17.
- **Network:** turn on SSL enforcement, and Network Restrictions, which limit which IPs can connect to Postgres and its pooler ([network restrictions](https://supabase.com/docs/guides/platform/network-restrictions)). The Data API stays reachable and relies on grants and RLS (7.4).
- **Backups** ([backups](https://supabase.com/docs/guides/platform/backups)):
  - daily backups are kept 7 days on Pro, 14 on Team and 30 on Enterprise; PITR is an add-on with a 2-minute worst-case recovery point;
  - backups exclude Storage objects and custom roles' passwords, and deleting the project deletes its backups;
  - keep the 5.7 `supabase db dump` and bucket copies under another account.
- **Migrations:** ship them from CI with `supabase db push` ([CLI](https://supabase.com/docs/reference/cli/supabase-db-push)), or the GitHub integration's **Deploy to production**; on Pro, branching gives preview databases ([going into production](https://supabase.com/docs/guides/deployment/going-into-prod)).
- **Destructive commands (12.1, F-04):** `supabase db reset --linked` drops every user-created object in the remote database ([CLI](https://supabase.com/docs/reference/cli/supabase-db-reset)). Never let an agent run it, or `db push`, against production.
- **The MCP server:** use `https://mcp.supabase.com/mcp?project_ref=<ref>&read_only=true&features=database,docs` ([MCP](https://supabase.com/docs/guides/ai-tools/mcp)).
  - `read_only=true` runs SQL as a read-only Postgres user, and `project_ref` limits the server to one project and turns off account-level tools.
  - Keep manual approval on. The destructive-SQL confirmation "is not a security guarantee".
  - Supabase's own docs show prompt injection through a support ticket (F-07 class, T-14). Connect to production only when a task needs production evidence, never give the server to customers, and enter function secrets in the Dashboard, never in chat.

## Limits

- **Shared responsibility:** in F-03, Supabase's position was that projects are "secure by default" and customers control how they're configured. The platform won't stop a table being published without RLS: the advisor tells you, and the tests in this profile are what decide.
- **Legacy keys** go away by the end of 2026. The legacy JWT secret ties `anon` and `service_role` together, so rotating one rotates both; migrate to publishable and secret keys plus asymmetric signing keys first ([signing keys](https://supabase.com/docs/guides/auth/signing-keys)).
- **Free plan:** projects can pause after 7 days of low activity, and their backups can't be downloaded ([going into production](https://supabase.com/docs/guides/deployment/going-into-prod)).
- **Realtime:** a public Realtime connection lasts at most 24 hours unless it's upgraded to a signed-in user ([API keys](https://supabase.com/docs/guides/getting-started/api-keys)).
- **Slow policies tempt people to switch RLS off.** Index every column a policy filters on, and wrap `auth.uid()` in `select` ([RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security)); never fix speed by removing RLS (12.1).
- **CLI 3.0** is days old. The commands here come from the current CLI reference, so read the release notes before an agent upgrades your CI ([npm](https://www.npmjs.com/package/supabase)).

## Sources

- Data access: [RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security) · [securing your API](https://supabase.com/docs/guides/api/securing-your-api) · [changelog: tables not exposed automatically](https://supabase.com/changelog/45329-breaking-change-tables-not-exposed-to-data-and-graphql-api-automatically) · [advisors](https://supabase.com/docs/guides/observability/advisors)
- Keys and secrets: [API keys](https://supabase.com/docs/guides/getting-started/api-keys) · [signing keys](https://supabase.com/docs/guides/auth/signing-keys) · [function secrets](https://supabase.com/docs/guides/functions/secrets) · [Vault](https://supabase.com/docs/guides/database/vault)
- Auth: [sessions](https://supabase.com/docs/guides/auth/sessions) · [password security](https://supabase.com/docs/guides/auth/password-security) · [MFA](https://supabase.com/docs/guides/auth/auth-mfa) · [rate limits](https://supabase.com/docs/guides/auth/rate-limits) · [SSR client](https://supabase.com/docs/guides/auth/server-side/creating-a-client) · [supabase-js auth](https://supabase.com/docs/reference/javascript/auth)
- Storage: [access control](https://supabase.com/docs/guides/storage/security/access-control) · [buckets](https://supabase.com/docs/guides/storage/buckets/fundamentals)
- Operations: [logs](https://supabase.com/docs/guides/observability/logs) · [log fields](https://supabase.com/docs/guides/observability/log-field-reference) · [regions](https://supabase.com/docs/guides/platform/regions) · [network restrictions](https://supabase.com/docs/guides/platform/network-restrictions) · [backups](https://supabase.com/docs/guides/platform/backups) · [going into production](https://supabase.com/docs/guides/deployment/going-into-prod) · [production security checklist](https://supabase.com/docs/guides/security/production-checklist)
- Tooling: [CLI getting started](https://supabase.com/docs/guides/local-development/cli/getting-started) · [supabase test db](https://supabase.com/docs/reference/cli/supabase-test-db) · [supabase db reset](https://supabase.com/docs/reference/cli/supabase-db-reset) · [supabase db push](https://supabase.com/docs/reference/cli/supabase-db-push) · [testing overview](https://supabase.com/docs/guides/local-development/testing/overview) · [MCP server](https://supabase.com/docs/guides/ai-tools/mcp) · [supabase on npm](https://www.npmjs.com/package/supabase)
- Casebook: F-01, F-02, F-03, F-04, F-07, F-10 (Appendix F)
