# Bolt

> **Group:** No-code and BaaS · **Covers:** Bolt (bolt.new, by StackBlitz) as of November 2026: Bolt Agent (the v1 agent retired on 3 August 2026), Bolt Cloud hosting and Bolt Database, or a connected Supabase project · **Checked:** 2026-11-05 against the official docs

## Access and the isolation test

- **What runs where.** Bolt builds JavaScript apps in your browser on StackBlitz's WebContainers, with Node.js as the only backend language; mobile apps go through Expo ([intro](https://support.bolt.new/get-started/intro-bolt), [supported technologies](https://support.bolt.new/reference/supported-technologies)). Bolt Cloud hosts the site on `bolt.host` and adds Bolt Database, auth, file storage and server functions ([Bolt Cloud](https://support.bolt.new/bolt-cloud)).
- **Bolt Database is Supabase underneath.** Its Security tab uses the checks behind Supabase's Security Advisor, auth emails go through Supabase's email service, and you can claim the database into your own Supabase account ([database security](https://support.bolt.new/bolt-cloud/database/security), [auth settings](https://support.bolt.new/bolt-cloud/database/authentication)). So RLS is the access layer (5.4): Bolt's own docs say anyone who visits your site can send requests to the database directly.
- **Defaults, then the gap:**
  - Bolt turns RLS on for the tables it creates. Tables you add yourself need it too.
  - If your site has no sign-in, Bolt "might write policies that allow any visitor to view, add, change, and delete" data, which the Security tab flags as `RLS Policy Always True` ([database security](https://support.bolt.new/bolt-cloud/database/security)). That's F-02 (Moltbook) and F-03: a public key in the browser plus open tables.
  - Private data needs sign-in first, then policies keyed to the user.
  - From 30 October 2026, new Bolt Database tables are private until your app is given explicit permissions. Existing tables keep their old access, so review them ([release notes](https://support.bolt.new/release-notes)).
- **Server functions** run on Bolt's servers and hold your secrets ([server functions](https://support.bolt.new/bolt-cloud/database/server-functions)). Re-check the caller and tenant in each one (7.2, T-03).
- **Isolation test.** Duplicate the project. The copy gets the database structure but not the data ([duplicate a project](https://support.bolt.new/managing-projects/projects-files)), so it's your test environment. In the copy, add two test users. Sign in as B and create rows, so there's something to leak. Then run this against the copy's URL and publishable key (from its `.env`):

```ts
// tests/isolation.test.ts: against a duplicated project (schema, no real data), never the live one
import { createClient } from '@supabase/supabase-js';
import { expect, test } from 'vitest';
const env = process.env as Record<string, string>;
const client = () => createClient(env.DUP_URL, env.DUP_KEY, { auth: { persistSession: false } });
const PRIVATE_TABLES = ['orders', 'messages']; // every table that holds personal data

test.each(PRIVATE_TABLES)('%s: anonymous and user A see none of B', async (table) => {
  expect((await client().from(table).select('id')).data ?? []).toHaveLength(0);
  const a = client();
  expect((await a.auth.signInWithPassword({ email: env.A_EMAIL, password: env.A_PASSWORD })).error).toBeNull();
  expect((await a.from(table).select('id').eq('user_id', env.B_ID)).data ?? []).toHaveLength(0);
  expect((await a.from(table).insert({ user_id: env.B_ID })).error).not.toBeNull(); // fill required columns
});
```

- After claiming the database into Supabase, you can also run the 5.4 SQL test on a local stack (see the Supabase profile).

## Authentication

- **Built in** ([auth settings](https://support.bolt.new/bolt-cloud/database/authentication)):
  - email and password, plus Google sign-in;
  - **Allow new users to sign up** is on by default, and **Allow Anonymous Sign-ins** is off;
  - email confirmation, confirmation from the old address before an email change, and re-authentication before a password change are all settings to turn on.
- **Leaked passwords:** **Prevent Leaked Passwords** (Have I Been Pwned) is on by default for databases Bolt has created since late June 2026. Turn it on for older ones. It checks only passwords set or changed after it's on. Claiming into a Free Supabase plan turns it off; it needs Supabase Pro.
- **Site URL:** it defaults to `localhost:3000`, which breaks reset and confirmation links in a live app. Set it to your domain, and keep the **URI allow list** to your own URLs: a broad wildcard lets auth flows redirect to places you don't control.
- **Auth email limits:** the built-in email service sends 2 auth emails per hour for the whole project. Custom SMTP (30 an hour, more in Supabase) requires claiming the database first.
- **Gaps:** Bolt's docs don't cover MFA, passkeys or the minimum password length. If 7.1 needs them, claim the database or start on Supabase, where they're documented (see the Supabase profile). Server code checks the user with `getUser()` or `getClaims()`, never `getSession()` (7.1).
- **Test users:** delete the accounts you added under **User management** before launch (7.1, F-10).

## Secrets

- **Secrets** (database icon → **Secrets**) are only for server functions ([secrets](https://support.bolt.new/bolt-cloud/database/secrets)):
  - Bolt reads the value only when a function needs it, and never writes it into project files, browser code or the published site;
  - nobody can see a value after it's saved;
  - only owners, co-owners and team admins can manage secrets.
- **`.env` is project code.** Bolt hides it from viewers, but editors and co-owners can read it. Any value your browser code reads ends up on the published site. Bolt fills in and locks the database URL and public key itself. Keep `.env` to public values, and check whether it reaches your GitHub repository before you push.
- **`SUPABASE_` secrets** are reserved for Bolt's own database connection. Treat any service-role value as T-02: server functions only.
- **Hygiene:** Bolt's docs say to change keys regularly and remove unused ones (7.4). Never paste a key into the chat or code: chats may be used for training (see Limits).

## CSRF and XSS

- **XSS depends on the framework Bolt chose**: check `package.json` and read that framework's profile in this folder. In React the escape hatch is `dangerouslySetInnerHTML` ([React](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html)). Any Markdown or AI output needs an allowlist sanitiser (T-04).
- The security audit looks for "text your app displays as part of a page, since someone could use this text to run their own code", and at "which other websites can talk to your app" ([security check](https://support.bolt.new/building/security)). It's an AI review, not a test.
- **Tokens:** supabase-js stores the session in local storage by default ([supabase-js](https://supabase.com/docs/reference/javascript/auth)), so XSS can read it. That puts more weight on the CSP (7.1).
- **CSRF:** bearer-token calls aren't sent automatically. A server function or route that trusts cookies must check `Origin` and use SameSite cookies (7.4).
- **CSP and headers:** Bolt's docs don't describe setting response headers on Bolt hosting. Check what yours sends with `curl -sI`. If you need the 7.4 CSP, publish the frontend to Netlify, which reads a `_headers` file or `netlify.toml` ([Netlify headers](https://docs.netlify.com/manage/routing/headers/), [Bolt and Netlify](https://support.bolt.new/integrations/netlify)).

## Fonts and assets

- Bolt's docs say nothing about how fonts load. Search `index.html` and the CSS for `fonts.googleapis.com`, and ask Bolt for `@fontsource/*` packages or local `woff2` files (9.9, launch trap 2).
- Ask for npm dependencies bundled at build time, not CDN `<script>` tags (9.9 table), and check each new package under T-12.
- **Storage:** public buckets are readable by anyone with the link. Bolt aims to create private buckets with RLS policies for user uploads, but tells you to confirm each bucket's visibility yourself ([file storage](https://support.bolt.new/bolt-cloud/database/file-storage)). Serve user files through signed URLs (T-07, launch trap 14).
- For the 9.9 test, set `ALLOWED_HOSTS` to your domain or `*.bolt.host`, plus the database host from `.env`.

## Consent

- **Hosting analytics** on paid plans reports visitors, page views, top pages and sources, and counts bots too ([hosting analytics](https://support.bolt.new/bolt-cloud/hosting/analytics)). Record Bolt as its processor (3.6).
- **Third-party analytics:** Bolt's docs suggest pasting Google Analytics or Matomo code into Code view, or prompting Bolt to add it. Pasted as-is, that's launch trap 7 and the F-18 pattern. Ask Bolt to load each tag through the 9.7 consent loader, with Consent Mode denied by default, and to update the CSP. Withdrawal must stop the tag (9.8).
- Video, maps and chat widgets need a click-to-load facade (S17), not an embed in the page.
- The Supabase session entry in local storage is strictly necessary (9.8 register).

## Logging

- **Short retention:** database logs (server functions, auth, Postgres, storage, PostgREST, cron and more) show only the past hour, and so do server-function logs ([logs](https://support.bolt.new/bolt-cloud/database/logs), [server functions](https://support.bolt.new/bolt-cloud/database/server-functions)). Keep the 7.5 audit events in your own `audit_logs` table, IDs only.
- **Keep personal data out of logs.** Server-function logs carry request and response data, so log IDs, never bodies, emails or tokens (7.5).
- **URLs are logged.** PostgREST logs record API requests, and on Supabase the API gateway logs full URLs with query strings ([Supabase log fields](https://supabase.com/docs/guides/observability/log-field-reference)). Filter on IDs, not on email addresses.
- An error tracker you add follows 3.1: EU data region, PII scrubbing, replay off.

## Testing

- **Bolt's checks:**
  - The **project security audit** (**Publish → Run security audit**, paid plans, no tokens used, up to 30 a day) reviews code and database, fixes most problems itself, and lists what you must do ([security check](https://support.bolt.new/building/security)).
  - The **database security check** (all plans) runs the Supabase Security Advisor checks, with an **Ask Bolt to fix** button.
- **What they miss:**
  - Both are static. The database check flags open policies, even intended ones, but can't know whether a policy matches your tenancy model.
  - The audit changes code and the database on its own: review what it did. Rolling back the code doesn't roll back the database ([version history](https://support.bolt.new/managing-projects/rollback-backup)).
  - Neither runs unless you start it.
  - Neither checks third-party requests before consent, or personal data in logs.
- **Unit tests:** run them (for example `npx vitest run`) in Bolt's terminal, in Code view in a Chromium browser ([code view](https://support.bolt.new/building/code-view)).
- **In CI:** sync to GitHub ([GitHub](https://support.bolt.new/integrations/git)) and run the section 1 test against the duplicate. Run the 9.9 Playwright test against the published site or a local build. Re-run the audit and the database check after every schema change.

## Deployment

- **Hosting:** `bolt.host` addresses are free and custom domains need a paid plan ([publish](https://support.bolt.new/bolt-cloud/hosting/publish)).
  - On the Free plan every published site is public. Paid plans can publish privately, to your team and invited people, but a site on a custom domain can only be public.
  - Projects published before 14 August 2025 may still be on Netlify ([Bolt and Netlify](https://support.bolt.new/integrations/netlify)).
- **Region for UK or EU data.** Bolt's help centre doesn't say where Bolt Database or Bolt hosting keeps data. For UK or EU data, create a Supabase project in a specific UK or EU region yourself (for example London, `eu-west-2`) and connect it on a Pro or Teams plan, at the start of the project ([Supabase in Bolt](https://support.bolt.new/integrations/supabase)). Connecting Supabase later replaces the Bolt database and can lose data; claiming moves the existing database into your Supabase organisation, where you can see its region.
- **Environments (3.2):** a project has one database. Use a duplicate as staging, and make schema changes there first. Restoring an earlier version restores code only, never the database.
- **Backups:** Bolt's docs describe code history, downloads and code backups ([project settings](https://support.bolt.new/settings/project-settings)), not database backups. For 5.7, claim the database into Supabase (daily backups on paid Supabase plans) or export tables to CSV or JSON on a schedule ([tables](https://support.bolt.new/bolt-cloud/database/tables)), encrypted, under another account.
- **Deleting a project** also deletes its Bolt database, unpublishes the site and disconnects domains ([release notes](https://support.bolt.new/release-notes)).
- **Agent safety (12.1):** the agent and the **Query** tab work directly on the project's database, and **Query** runs any SQL, including deletes ([tables](https://support.bolt.new/bolt-cloud/database/tables)). Once real data exists, build in the duplicate and keep editor roles few (F-04).

## Limits

- **Old link sharing.** Bolt no longer offers "anyone with the link" sharing, but projects that had it keep it until you turn it off ([sharing](https://support.bolt.new/collaboration/sharing)). Check old projects, since a viewer sees the code.
- **Training on your content:** the **Model training** setting is on by default, except for accounts based in the EU, UK or Switzerland. It covers projects and chats from 7 October 2026 ([account settings](https://support.bolt.new/settings/account-settings)). Turn it off, and keep prompts to synthetic data (12.1).
- **The rules file:** put the 12.1 rules in project knowledge or an `agents.md` file, which Bolt reads automatically; the main rules must sit in `agents.md` itself ([context](https://support.bolt.new/prompting/manage-context)). The agent can still skip them.
- **MCP connectors** pick up new tools when the provider updates its server. Review them and switch off what you don't need, because tool output can carry injected instructions (T-14, F-07) ([MCP](https://support.bolt.new/integrations/mcp)).
- **Platform limits:**
  - Backends must be JavaScript.
  - Bolt can't show or manage individual stored files.
  - Databases in unpublished projects pause after about six days of low use ([database](https://support.bolt.new/bolt-cloud/database)).
- **Assurance:** Bolt is SOC 2 Type II, and its sales team supplies the report ([intro](https://support.bolt.new/get-started/intro-bolt)). The help centre doesn't mention a DPA, so ask for one as well (9.18).

## Sources

- Bolt platform: [intro](https://support.bolt.new/get-started/intro-bolt) · [supported technologies](https://support.bolt.new/reference/supported-technologies) · [Bolt Cloud](https://support.bolt.new/bolt-cloud) · [release notes](https://support.bolt.new/release-notes)
- Bolt Database: [overview](https://support.bolt.new/bolt-cloud/database) · [security settings](https://support.bolt.new/bolt-cloud/database/security) · [auth settings](https://support.bolt.new/bolt-cloud/database/authentication) · [secrets](https://support.bolt.new/bolt-cloud/database/secrets) · [server functions](https://support.bolt.new/bolt-cloud/database/server-functions) · [file storage](https://support.bolt.new/bolt-cloud/database/file-storage) · [tables](https://support.bolt.new/bolt-cloud/database/tables) · [logs](https://support.bolt.new/bolt-cloud/database/logs)
- Bolt security and projects: [security check](https://support.bolt.new/building/security) · [projects and duplication](https://support.bolt.new/managing-projects/projects-files) · [version history](https://support.bolt.new/managing-projects/rollback-backup) · [project settings](https://support.bolt.new/settings/project-settings) · [sharing](https://support.bolt.new/collaboration/sharing) · [code view](https://support.bolt.new/building/code-view)
- Bolt hosting and integrations: [publish](https://support.bolt.new/bolt-cloud/hosting/publish) · [hosting analytics](https://support.bolt.new/bolt-cloud/hosting/analytics) · [Netlify](https://support.bolt.new/integrations/netlify) · [Supabase](https://support.bolt.new/integrations/supabase) · [GitHub](https://support.bolt.new/integrations/git) · [MCP](https://support.bolt.new/integrations/mcp) · [account settings](https://support.bolt.new/settings/account-settings) · [context and agents.md](https://support.bolt.new/prompting/manage-context)
- Others: [React: dangerouslySetInnerHTML](https://react.dev/reference/react-dom/components/common#dangerously-setting-the-inner-html) · [supabase-js auth](https://supabase.com/docs/reference/javascript/auth) · [Supabase log fields](https://supabase.com/docs/guides/observability/log-field-reference) · [Netlify custom headers](https://docs.netlify.com/manage/routing/headers/)
- Casebook: F-02, F-03, F-04, F-07, F-10, F-18 (Appendix F)
