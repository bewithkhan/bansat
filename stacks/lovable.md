# Lovable

> **Group:** No-code and BaaS · **Covers:** Lovable as of November 2026: the TanStack Start template (the default for new projects since 13 May 2026, and for new Enterprise projects since 22 June) and older React + Vite projects, on the built-in backend (Lovable Cloud, built on Supabase) or a connected Supabase project · **Checked:** 2026-11-05 against the official docs

## Access and the isolation test

- **What runs where.** Lovable writes the app, hosts it and runs its backend. New projects use TanStack Start: pages render on the server, and backend code runs as server functions, API routes or Edge Functions ([TanStack Start](https://docs.lovable.dev/features/upgrade-to-tanstack-start), [best practices](https://docs.lovable.dev/tips-tricks/security-best-practices)). Older projects are React + Vite single-page apps. The built-in backend is Postgres, Auth, Storage and Edge Functions on Supabase's open-source foundation ([built-in backend](https://docs.lovable.dev/features/cloud)).
- **RLS is the access layer.** Browser code holds the backend URL and publishable key (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`), so anyone can call the database API directly, and only table grants and RLS decide what comes back (5.4). That's F-01 (CVE-2025-48757): 170 of 1,645 showcased Lovable apps let visitors read tables because policies were missing or wrong.
- **Lovable writes the policies.** It adds RLS when it builds features that store user data. Read every policy under **More → Database → Manage → Policies**. The view is read-only, so change policies by prompting or in the SQL editor ([data access](https://docs.lovable.dev/features/database-access)), and check each one against your role matrix (7.2).
- **Server code bypasses RLS.** Every Edge Function gets `SUPABASE_SERVICE_ROLE_KEY` in its environment ([secrets](https://docs.lovable.dev/features/secrets)), and service-role code skips RLS ([best practices](https://docs.lovable.dev/tips-tricks/security-best-practices)). Re-derive the user and tenant in every function and route, with `assertCan()` (7.2, T-03).
- **Isolation test, exported.** Sync the code to GitHub, GitLab or Bitbucket, or use **Download codebase** on paid plans ([Git sync](https://docs.lovable.dev/integrations/git-sync-overview)). Never test against the backend in the repo's `.env`: a clone "reads and writes the same backend as your published app". Locally (run `supabase init` first if the repo has no `supabase/config.toml`), `supabase db reset` applies `supabase/migrations/` and the seed (5.5); apply `drizzle/migrations/*.sql` in order with `psql postgresql://postgres:postgres@127.0.0.1:54322/postgres`, then run the 5.4 SQL test and this one ([Supabase CLI](https://supabase.com/docs/guides/local-development/cli/getting-started)):

```ts
// tests/rls/cross-user.test.ts: a local stack or a remixed copy, never the live backend
import { createClient } from '@supabase/supabase-js';
import { expect, test } from 'vitest';
const { TEST_URL, TEST_KEY, A_EMAIL, A_PASSWORD, B_ID } = process.env as Record<string, string>;

test('user A cannot read or write user B rows', async () => {
  const a = createClient(TEST_URL, TEST_KEY, { auth: { persistSession: false } });
  const { error: signIn } = await a.auth.signInWithPassword({ email: A_EMAIL, password: A_PASSWORD });
  expect(signIn).toBeNull();
  const read = await a.from('invoices').select('id').eq('user_id', B_ID); // repeat per table
  expect(read.data ?? []).toHaveLength(0);
  const write = await a.from('invoices').insert({ user_id: B_ID, total: 1 }); // fill required columns
  expect(write.error).not.toBeNull();
});
```

- **No local setup?** Remix the project. The copy gets its own database with the same tables and Edge Functions, no data and fresh keys ([built-in backend](https://docs.lovable.dev/features/cloud)). Confirm its Policies view matches the original, add two test users, and point the test at the copy.

## Authentication

- **Built in:** Supabase-based Auth with email and password by default, magic links or one-time codes, Google, Apple, Microsoft, OIDC, phone and "Sign in with Lovable". Anonymous users stay off until you enable them ([users and authentication](https://docs.lovable.dev/features/authentication)).
- **Passwords:** Lovable allows a 6-character minimum and recommends 8 or more; set 12 for 7.1. Turn on **Password HIBP check** under **More → Users → Settings → Email** ([email auth](https://docs.lovable.dev/features/email-auth)). The Quick scan flags leaked-password protection that's off.
- **Confirmation:** turn **Auto-confirm email** off before launch. Lovable warns that without it anyone can sign up with an address they don't own. Keep **Secure email change** and **Require re-authentication for password changes** on.
- **MFA:** Lovable's docs don't describe MFA or passkeys for your app's users. Where 7.1 requires MFA (owners, admins, anyone who sees C3 data), confirm it works on the built-in backend before you promise it. A connected Supabase project documents TOTP MFA and `aal2` policies (see the Supabase profile).
- **Server checks:** Lovable's guidance validates the session in server code with `supabase.auth.getUser()` ([best practices](https://docs.lovable.dev/tips-tricks/security-best-practices)). Keep that or `getClaims()`, never `getSession()`, before a sensitive action (7.1).
- **Test accounts:** users added with **Create new user** are confirmed automatically. Remove them before launch (7.1, F-10). For internal tools, use **Disable sign-up** and restrict who can visit the published app.
- **Limits:** **Rate limit for sending emails** caps auth emails per hour. Lovable doesn't document sign-in throttling, so test the per-account limits 7.1 asks for.

## Secrets

- **Secrets** (**More → Settings → Secrets**) are encrypted and write-only. They're injected into Edge Functions, never reach the browser and aren't copied when a project is remixed ([secrets](https://docs.lovable.dev/features/secrets)). That meets 7.4.
- **`.env` is public by design.** It holds the `VITE_` values, is committed on purpose (Lovable's builds read it), and every `VITE_` value ships in the bundle. Never put a secret there; Lovable rejects `VITE_` names in Secrets. Allow-list only those two values in the 7.4 gitleaks scan.
- **Don't paste keys into chat.** Lovable spots a pasted key and saves it as a secret, but by then the key is already in your chat message. Use the secure input Lovable opens instead.
- **The service role is everywhere.** Any Edge Function can read `SUPABASE_SERVICE_ROLE_KEY` (T-02), so keep its use to functions that check the caller, and keep secret values out of responses and logs.
- **Rotation:** ask Lovable to rotate the database password ([data access](https://docs.lovable.dev/features/database-access)), and use **Rotate** on `LOVABLE_API_KEY` if it leaks ([secrets](https://docs.lovable.dev/features/secrets)). Rotate any third-party key at its issuer (7.6).
- **Public remixing** lets anyone with the link copy the project and read its source code ([project access](https://docs.lovable.dev/features/project-visibility)). Leave it off.

## CSRF and XSS

- **XSS:** the generated UI is React, which escapes text by default. The escape hatch is `dangerouslySetInnerHTML` ([React](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)): search for it, and for Markdown or AI-output rendering, and require an allowlist sanitiser (T-04). The Deep scan looks for untrusted input that reaches a browser, but only by reading code ([security overview](https://docs.lovable.dev/features/security)).
- **Tokens in storage:** supabase-js keeps the session in local storage by default ([supabase-js](https://supabase.com/docs/reference/javascript/auth)), so any XSS can read it. That puts more weight on the CSP (7.1).
- **CSRF:** a bearer token isn't attached automatically by the browser. If a TanStack Start server function or API route relies on cookies, check `Origin` on every state-changing call and use SameSite cookies (7.4).
- **CSP and headers:** Lovable's docs don't say how to set response headers on Lovable hosting. The Trust center reports whether your live app sends HSTS, `nosniff`, frame restrictions, a CSP, Permissions-Policy and a referrer policy ([Trust center](https://docs.lovable.dev/features/trust-center)). Check there or with `curl -sI`. If you can't set the 7.4 CSP, host the exported code where you can.

## Fonts and assets

- Lovable applies any Google Font by name or link and "takes care of the implementation" ([custom fonts](https://docs.lovable.dev/tips-tricks/custom-fonts)). The docs don't say where the font loads from, so search `index.html`, the root route and the CSS for `fonts.googleapis.com`. Ask for `@fontsource/*` packages or font files added through Git sync instead (9.9, launch trap 2).
- Ask for npm packages instead of CDN `<script>` tags, icon-font CDNs or hotlinked images (9.9 table).
- Storage buckets are private by default, and **Block public storage buckets** is on for every plan ([storage](https://docs.lovable.dev/features/storage)). A private file's **Copy URL** is a signed URL that expires after an hour, which suits T-07.
- For the 9.9 test, set `ALLOWED_HOSTS` to your domain (or your `*.lovable.app` address) and the host in `VITE_SUPABASE_URL`.

## Consent

- **Lovable's visitor Analytics** sets no cookies, stores nothing in the browser and reports to your app's own domain ([analytics](https://docs.lovable.dev/features/analytics)), so it adds no third-party request. List it in the processor register (3.6) and privacy notice, or switch it off in **Project settings → General → Publishing**.
- **The Google Analytics connector** syncs your measurement ID into the browser code, which loads gtag.js from Google ([Google Analytics](https://docs.lovable.dev/integrations/google-analytics)). Nothing in that setup waits for consent: it's launch trap 7 and the F-18 pattern. Ask Lovable to load gtag only through the 9.7 consent loader, with Consent Mode denied by default, and to add the hosts to the CSP. Apply the same rule to every browser-side connector.
- **Server rendering:** in TanStack Start apps, keep tag scripts out of the server-rendered root document, and let the consent check run in the browser before anything is injected (9.7).
- The Supabase session entry `sb-<project-ref>-auth-token` in local storage is strictly necessary (9.8 register).

## Logging

- **What's kept:** **More → Settings → Logs** shows server logs (TanStack Start), Edge Function logs with request and response data, and auth, Postgres, storage and realtime logs. Relative ranges reach back 5 days ([logs](https://docs.lovable.dev/features/logs)). Build the 7.5 audit log (`audit_logs`, IDs only) into the app itself.
- **Keep personal data out.** Because Edge Function logs carry request and response data, never log bodies, emails, tokens or C3 fields (7.5).
- **The agent reads your logs.** **Read backend logs** and **Read analytics** default to **Always allow** ([agent permissions](https://docs.lovable.dev/features/cloud)), so anything logged enters the agent's context. On Free and Pro plans that context may be used for training unless you opt out (see Limits).
- **Enterprise:** workspace audit logs export to a SIEM, and Sensitive data scanning finds personal data in chat history, the database and storage ([privacy & security settings](https://docs.lovable.dev/features/privacy-and-security-settings)).
- An error tracker you add follows 3.1: EU data region, PII scrubbing, replay off.

## Testing

- **What Lovable writes:** Vitest, React Testing Library and jsdom tests in `src/test`, plus backend-logic tests in TanStack Start apps. It writes Edge Function tests only when asked ([testing](https://docs.lovable.dev/features/testing)). Browser testing signs in as the app user with your email, or as a named person with admin approval ([browser testing](https://docs.lovable.dev/features/browser-testing)), and it acts on the live database.
- **Lovable's scanners** ([security overview](https://docs.lovable.dev/features/security)):
  - The **Quick scan** runs on every publish. It reviews the database (tables without RLS, policies that let everyone through, leaked-password protection off), audits dependencies, and checks for an MCP server exposed without sign-in.
  - The **Deep scan** reads your code for access control, open endpoints, injection, leaked secrets, payments, auth and exposed data. It runs only when you start it.
  - Wiz (SCA and SAST) and Aikido (AI penetration tests) connect as paid extras.
- **What the scanners miss:**
  - Both scans are static. A policy that exists but lets one tenant read another's rows can pass; the F-01 researchers said this of the 2025 scan. The Trust center's record-level check confirms only that RLS is on ([Trust center](https://docs.lovable.dev/features/trust-center)).
  - Only critical dependency vulnerabilities become findings, and some of those are held back by EPSS score.
  - Auto-fix applies only Quick scan findings. **Block publishing with critical issues** is off by default (except on new Enterprise workspaces) and trusts the latest results even when they're out of date. In Lovable's words, passing it "does not prove that your app is secure" ([settings](https://docs.lovable.dev/features/privacy-and-security-settings)).
  - Nothing checks third-party requests before consent or personal data in logs.
- **In CI on the synced repo:** run the section 1 tests against a local stack and the 9.9 Playwright test against a preview build, and keep the scans as a backstop. Turn **Block publishing with critical issues** on.

## Deployment

- **Hosting:** publishing puts a snapshot live on `lovable.app` or a custom domain (paid plans), with HTTPS, served from locations worldwide ([hosting](https://docs.lovable.dev/features/hosting)). Anyone with the link can visit until you restrict website access.
- **Region for UK or EU data.** The backend runs in Americas, Europe (which means Europe, the Middle East and Africa) or Asia Pacific. The region is fixed when the backend is enabled and can't be moved ([built-in backend](https://docs.lovable.dev/features/cloud), [settings](https://docs.lovable.dev/features/privacy-and-security-settings)). To get a UK or EU region:
  - Before you enable it, set **Where project data is stored** to Europe (on Business or Enterprise, admins set **Default data hosting region**).
  - Set **Enable Cloud** to **Ask each time**, so you see the region before Lovable creates the backend.
  - Afterwards, confirm the **Database location** row names a UK or EU city ([database](https://docs.lovable.dev/features/database)).
  - Germany and other country regions are Enterprise-only, on request. AI requests stay in the EU only with Enterprise **EU inference**.
- **One database for everything.** Drafts, previews, a local clone and the published app share one database ([database](https://docs.lovable.dev/features/database)), which breaks 3.2. Use a separate project for staging, or your own Supabase project with branching.
- **Agent permissions on production:** set **Change data** to **Ask each time**. **Execute backward incompatible database migrations** is **Never allow** by default; keep it there (12.1, F-04).
- **Migrations:** Lovable records each change in `drizzle/migrations/` (older projects: `supabase/migrations/`), and it doesn't run migration files you add through Git ([Git sync](https://docs.lovable.dev/integrations/git-sync-overview)).
- **Backups** are daily, kept about 14 days, cover the database only (not Storage files), and restore to a backup, not a point in time ([backups](https://docs.lovable.dev/features/database-backups)). The export is a `pg_restore` archive that includes password hashes. It's saved in project storage, so removing the database deletes it: download it, encrypt it and keep it under another account as C3 data (5.7).
- **Lovable's MCP server** reaches every project and workspace you authorise. Its `query_database` runs SQL with your full database permissions, and `deploy_project` publishes ([MCP server](https://docs.lovable.dev/integrations/lovable-mcp-server)). Under 12.1, connect it only to a development workspace.

## Limits

- **Old public projects.** Before 6 November 2025, Free-plan projects were public by default ([project access](https://docs.lovable.dev/features/project-visibility)). In F-11, a backend change exposed public projects' chats and source code from February to April 2026. Check every project's access and keep **Public remixing** off.
- **Training on your content:** from 9 September 2026, prompts, code and files on Free and Pro plans may be used to train Lovable's models unless you opt out. End-user data in your database is excluded, and so are Business and Enterprise workspaces by default ([training data](https://docs.lovable.dev/features/business/data-opt-out)). Opt out, and keep prompts to synthetic data (12.1).
- **The rules file:** paste the 12.1 rules into Workspace or Project **Instructions** (formerly Knowledge; up to 10,000 characters for workspace instructions) ([instructions](https://docs.lovable.dev/features/knowledge)). The agent can still skip a rule; the tests above can't.
- **Lock-in:**
  - You can't import an existing repository; Git sync only exports.
  - Leaving the built-in backend is a manual export, restore and re-setup of auth, secrets and storage.
  - Postgres extensions come from a fixed list ([database](https://docs.lovable.dev/features/database)).
- **Credits:** when a workspace runs out of credits, apps that rely on the backend can pause until you top up ([hosting](https://docs.lovable.dev/features/hosting)).

## Sources

- Lovable: [security overview](https://docs.lovable.dev/features/security) · [security best practices](https://docs.lovable.dev/tips-tricks/security-best-practices) · [privacy & security settings](https://docs.lovable.dev/features/privacy-and-security-settings) · [Trust center](https://docs.lovable.dev/features/trust-center)
- Lovable backend: [built-in backend](https://docs.lovable.dev/features/cloud) · [database](https://docs.lovable.dev/features/database) · [data access and RLS](https://docs.lovable.dev/features/database-access) · [backups and export](https://docs.lovable.dev/features/database-backups) · [storage](https://docs.lovable.dev/features/storage) · [secrets](https://docs.lovable.dev/features/secrets) · [logs](https://docs.lovable.dev/features/logs)
- Lovable auth: [users and authentication](https://docs.lovable.dev/features/authentication) · [email auth](https://docs.lovable.dev/features/email-auth)
- Lovable code and hosting: [TanStack Start upgrade](https://docs.lovable.dev/features/upgrade-to-tanstack-start) · [Git sync](https://docs.lovable.dev/integrations/git-sync-overview) · [hosting](https://docs.lovable.dev/features/hosting) · [testing](https://docs.lovable.dev/features/testing) · [browser testing](https://docs.lovable.dev/features/browser-testing) · [MCP server](https://docs.lovable.dev/integrations/lovable-mcp-server)
- Lovable privacy: [project access](https://docs.lovable.dev/features/project-visibility) · [training data](https://docs.lovable.dev/features/business/data-opt-out) · [analytics](https://docs.lovable.dev/features/analytics) · [Google Analytics connector](https://docs.lovable.dev/integrations/google-analytics) · [custom fonts](https://docs.lovable.dev/tips-tricks/custom-fonts) · [instructions](https://docs.lovable.dev/features/knowledge)
- Others: [React: dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html) · [supabase-js auth](https://supabase.com/docs/reference/javascript/auth) · [Supabase CLI local development](https://supabase.com/docs/guides/local-development/cli/getting-started)
- Casebook: F-01, F-04, F-10, F-11, F-18 (Appendix F)
