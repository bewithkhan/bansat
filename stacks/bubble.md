# Bubble

> **Group:** No-code and BaaS · **Covers:** Bubble web apps on Bubble's hosting as of November 2026 (the platform updates continuously; breaking changes arrive as engine versions under **Settings → Versions**) · **Checked:** 2026-11-05 against the official docs

## Access and the isolation test

- **Privacy rules are Bubble's RLS.** They're conditions on each data type, checked on the server before data goes to the browser (**Data → Privacy**) ([privacy rules](https://manual.bubble.io/help-guides/data/the-database/protecting-data-with-privacy-rules)). Anything that reaches the device is readable there, even if no element shows it, and client-side filtering protects nothing.
- **New data types start public.** Each type shows *Privacy rules applied* or *Publicly visible*. Unless you tick **Make new data types private by default with a privacy rule placeholder** (**Settings → General**), new types are visible to everyone ([general settings](https://manual.bubble.io/core-resources/application-settings/general)). Bubble suggests ticking it once the app is live; Bansat says tick it on day one (5.4, T-01).
- **How rules combine.**
  - Rules add up: a user gets the combined access of every rule they match. The generated *Everyone else* rule at the bottom decides what everyone else gets, so untick all of its boxes for private data.
  - The permissions are *Find this in searches*, *View attached files*, and, per field, *View*, *Constraint* and *Auto-bind*.
  - Rules can't grant search access through references more than one level deep, and slug fields can always be used as search constraints.
- **Read the labels literally.** *View all fields* doesn't stop a workflow changing a field, and *Find this in searches* doesn't stop a record being fetched some other way. Guard every workflow with a server-side **Only when** condition. A condition that runs in the browser, such as *Element X is visible*, isn't a security check ([page security](https://manual.bubble.io/help-guides/security/page-security)) (7.2).
- **Search privacy mode** (**Settings → General**) is *Off*, *Automatic* or *Strict*. Use *Strict* for any app with private data, so a field can be a search constraint only where you allow it: otherwise repeated searches can infer hidden values.
- **Escape hatches:**
  - an API workflow with **Ignore privacy rules when running the workflow**;
  - Data API calls made with a Bubble API token, which act as admin and ignore privacy rules ([Data API privacy rules](https://manual.bubble.io/help-guides/integrations/api/the-bubble-api/the-data-api/data-api-privacy-rules)).
  - Every use of either needs its own check (T-03).
- **Isolation test.** Development and Live have separate databases, so test in Development ([testing basics](https://manual.bubble.io/help-guides/maintaining-an-application/testing-an-application/the-basics)).
  - **By hand:** open **Data**, find user A and click **Run as**, then visit every page.
  - **Automated:** seed user B's records with a unique canary string, sign in as A on `version-test`, and fail if any response contains it. That catches data sent to the browser but never shown. Build every URL from the full `version-test` address: with a Playwright `baseURL`, a path that starts with `/` drops `/version-test` and lands on Live ([Playwright baseURL](https://playwright.dev/docs/api/class-testoptions)).

```ts
// tests/privacy/canary.spec.ts: DEV = https://<app>.bubbleapps.io/version-test (Development, never Live)
import { test, expect } from '@playwright/test';
const { DEV, B_CANARY, A_EMAIL, A_PASSWORD } = process.env as Record<string, string>; // canary only in B's things
const PAGES = (process.env.PAGES ?? 'dashboard,account').split(','); // every page name
test('nothing sent to user A contains user B data', async ({ page }) => {
  const checks: Promise<void>[] = [], leaks: string[] = [];
  page.on('response', (r) => { checks.push(r.text().then((b) => { if (b.includes(B_CANARY)) leaks.push(r.url()); }, () => {})); });
  await page.goto(`${DEV}/login`);
  await page.getByLabel('Email').fill(A_EMAIL);
  await page.getByLabel('Password').fill(A_PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  for (const p of ['', ...PAGES]) await page.goto(`${DEV}/${p}`, { waitUntil: 'networkidle' });
  await Promise.all(checks); // wait for every body before judging
  expect(leaks).toEqual([]);
});
```

- If the Data API is on, repeat the test as A, using a user token (see below), against `/version-test/api/1.1/obj/<type>` and B's thing IDs, and with no token. Every call must return none of B's data ([Data API requests](https://manual.bubble.io/help-guides/integrations/api/the-bubble-api/the-data-api/data-api-requests)).

## Authentication

- **Built in:** sign-up and log-in actions, passwords hashed and salted, email confirmation, password reset, magic links, temporary passwords and social logins through plugins ([user accounts](https://manual.bubble.io/help-guides/data/user-accounts)).
- **Sessions are long.** Signing up starts a 365-day session. With **Stay logged in** checked, a login lasts 365 days; unchecked, 24 hours. That's far beyond 7.1's short sessions, so leave **Stay logged in** unchecked for admin and C3 screens, and log users out on sensitive changes.
- **Password policy** is opt-in: tick **Define a password policy** in **Settings → General** and set the minimum length to 12 ([general settings](https://manual.bubble.io/core-resources/application-settings/general)). Bubble doesn't document a breached-password check; the security dashboard only flags weak policies.
- **2FA:** **Activate two-factor authentication** offers TOTP through an authenticator app, with a page that runs **Check 2FA token**. The settings page says it needs a "Production plan", a name missing from Bubble's current plan list ([pricing and plans](https://manual.bubble.io/account-and-marketplace/account-and-billing/pricing-plans)), so confirm your plan includes it. Require it for admins and C3 access (7.1, 9.13).
- **Sign-in throttling:** the manual doesn't document login rate limits or account lockout. Test what happens after repeated wrong passwords for one account, and add your own limit in the login workflow if nothing stops them (7.1).
- **Default credentials (F-10).** Password protection for Development and Live is optional, so until you tick **Limit access to this app with a username and password**, anyone with the URL can open `version-test` ([app security](https://manual.bubble.io/help-guides/security/app-security), [general settings](https://manual.bubble.io/core-resources/application-settings/general)). Turn it on, then replace Bubble's defaults for every new app, `username` and `password`, before you share a link.
- **API tokens:** a token from a **Log the user in** API workflow lasts up to 12 months (1 month with 2FA) and expires after 30 days unused ([user authentication](https://manual.bubble.io/help-guides/integrations/api/the-bubble-api/authentication/as-a-user)). Revoke tokens with **Log out other user's sessions**.

## Secrets

- **What ships to the browser** ([page security](https://manual.bubble.io/help-guides/security/page-security), [API Connector security](https://manual.bubble.io/help-guides/security/api-security/api-connector-security)):
  - option sets, app texts, every page name, element contents and on-page workflows;
  - the default values you give API call parameters when you initialise a call.
- **Never store a key** in option sets, on-page workflows, elements, expressions, app texts, custom states, URL parameters, field defaults, or the names of things (T-02).
- **API Connector:** tick **Private** on every key, header or URL parameter, using `[brackets]` to turn a URL part into a parameter. Private values stay on Bubble's server, which makes the call.
- **Bubble API tokens are admin keys.** They bypass privacy rules entirely ([Data API security](https://manual.bubble.io/help-guides/security/api-security/data-api-security)). Give one only to a server you control, one per integration, and rotate it (7.4).
- **Collaborators** can see Live data unless you restrict them, and copying Live data into Development exposes it too ([app security](https://manual.bubble.io/help-guides/security/app-security)). Give least privilege, and keep real data out of Development (3.2).

## CSRF and XSS

- **Bubble runs its own session cookies and endpoints**, and the manual describes no CSRF settings for you to change. What you control is the **Workflow API**:
  - API workflows are exposed as public endpoints automatically when created ([Workflow API security](https://manual.bubble.io/help-guides/security/api-security/workflow-api-security));
  - untick **Expose as a public API workflow** on every workflow that outsiders don't need;
  - never pair **None required** authentication with **Ignore privacy rules**.
- **XSS:** the **HTML** element renders raw HTML, and its *Insert dynamic data* button drops values straight into it ([HTML element](https://manual.bubble.io/core-resources/bubble-elements/element-properties/web-element-properties/visual-element-properties/html)). Never insert user-supplied text there (T-04). Treat plugins that render HTML the same way.
- **Framing:** **Allow to render the app in an frame/iframe (X-Frame-Options)** should stay on *DENY* ([general settings](https://manual.bubble.io/core-resources/application-settings/general)).
- **CSP:** the manual documents no way to set a Content-Security-Policy or other response headers on Bubble hosting, so 7.4's CSP can't be enforced. Scripts in the SEO settings' header and body fields go on every page ([SEO: app](https://manual.bubble.io/help-guides/maintaining-an-application/seo/seo-app)), so keep those fields free of third-party tags.

## Fonts and assets

- **Bubble's font library is Google Web Fonts, stored on a Google server** ([custom fonts](https://manual.bubble.io/help-guides/design/variables-and-styles/using-custom-fonts)): the 9.9 problem, launch trap 2. Upload your fonts (`.ttf` or `.otf`) under **Settings → General**, use only those, and run the 9.9 test to confirm nothing reaches `fonts.googleapis.com` or `fonts.gstatic.com`.
- **Legacy CSS-linked fonts** (added by entering a stylesheet URL, often on `fonts.googleapis.com`) keep working, and keep calling that host. Remove them and upload the files instead.
- **Plugins and HTML elements** that load scripts, maps or video from a CDN are third-party requests: consent-gate or click-to-load them (9.9 table).
- **Uploaded files** ([files](https://manual.bubble.io/help-guides/data/files)) (T-07):
  - an upload gets a live URL that anyone with the link can open as soon as it lands, before any workflow saves it;
  - to keep it private, tick **Make this file private** on the uploader, set **Attach this file to** a thing (the step that ties the file to that thing's privacy rules), and leave *View attached files* unticked for everyone who shouldn't see it;
  - files uploaded in the editor are never protected by privacy rules, so use the editor only for public files;
  - clearing a file field leaves the file online: run **Delete an uploaded file** first, then clear the field.
- **Allowed hosts:** your domain or `<app>.bubbleapps.io`, plus whatever Bubble-owned asset hosts your pages load. Read those from the Network panel and list each one in the processor register (3.6).

## Consent

- **Bubble's own cookies** (session ID, session signature, user identifier) are set on every visitor by default ([cookies](https://manual.bubble.io/help-guides/data/user-accounts/cookies-set-by-bubble)). They're strictly necessary once someone signs in.
- For anonymous visitors, tick **Do not set cookies on new visitors by default**. Then call **Opt-in to cookies** only after consent, and **Opt-out from cookies** on withdrawal. These cover Bubble's cookies only.
- **Plugins and embeds set their own cookies,** and Bubble can't control them. Plugin developers can read the opt-in state, but Bubble can't make them respect it. Load analytics, pixels and replay plugins only after consent, and check the Application tab in run mode for what each one sets (9.8). With the setting on, iframes in HTML and Video elements can't use cookies, so some embeds stop working for visitors who haven't opted in.
- **Don't paste tag snippets** into the header or body script fields: they run on every page before any choice is made (launch trap 7, F-18).

## Logging

- **Server logs** (**Logs → Server logs**) record workflow runs, conditions, HTTP requests and responses, and plugin output, separately for Development and Live, and you can search them by user email ([server logs](https://manual.bubble.io/help-guides/maintaining-an-application/testing-an-application/using-server-logs)).
  - Keep personal data out of API call bodies and workflow names, because they show up in logs (7.5).
  - Restrict log access to named collaborators.
- **Support access:** **Grant Bubble data access to troubleshoot your app** lets Bubble staff see data in both databases and in the logs ([general settings](https://manual.bubble.io/core-resources/application-settings/general)). Switch it on only for a ticket, then off.
- **Audit trail:** for 7.5's audit events, write an `audit_logs` data type from workflows, with IDs only and privacy rules that admit admins alone.

## Testing

- **The security dashboard** ([security tests](https://manual.bubble.io/help-guides/security/security-dashboard/security-tests), [plan features](https://manual.bubble.io/help-guides/security/security-dashboard/security-dashboard-plan-features)):
  - Basic checks on Starter and above (the plan table doesn't list Free) cover missing privacy rules, search privacy, constrainable fields, weak password policies, unprotected test environments, default credentials, public sensitive fields and unsafe API calls.
  - Advanced checks give details only on Growth plans and up: unprotected backend workflows, compromised API tokens, exposed Swagger, public uploaders, iframe embedding.
  - Tests can run on every deploy or on a schedule ([automated tests](https://manual.bubble.io/help-guides/security/security-dashboard/security-tests/automated-tests)).
- **What it misses:**
  - Bubble calls its findings potential vulnerabilities, and says it "cannot test for or identify every possible security concern".
  - The privacy rules checker needs sample data in each type to report anything ([privacy rules checker](https://manual.bubble.io/help-guides/security/security-dashboard/security-tests/privacy-rules-checker)).
  - Scheduled deployments go ahead with unresolved issues ([dashboard overview](https://manual.bubble.io/help-guides/security/security-dashboard/overview)).
  - Nothing checks one user against another, or what loads before consent.
- **Your tests:** use the debugger and **Run as** by hand. Run the section 1 Playwright tests and the 9.9 test in CI against `version-test`, with your own Development username and password supplied in the test setup.

## Deployment

- **Hosting:** Bubble runs on AWS, behind Cloudflare's CDN and DDoS protection. The shared environment is hosted in the US, and its location can't be changed ([hosting](https://manual.bubble.io/help-guides/optimizing-an-application/hosting-and-scaling/how-bubble-hosting-works)). For UK or EU hosting you need an Enterprise dedicated instance, where you choose the AWS region: London, Frankfurt or Ireland among them ([dedicated instance](https://manual.bubble.io/help-guides/bubble-for-enterprise/hosting-and-infrastructure/dedicated-instance)).
- **Transfers:** on shared hosting, record the US transfer under 9.17. Bubble's DPA includes the SCCs, and Bubble says it's covered by the EU-US and Swiss-US Data Privacy Frameworks ([GDPR](https://manual.bubble.io/help-guides/optimizing-an-application/compliance/gdpr)). For UK data, confirm the UK Extension or use the IDTA or UK Addendum.
- **Environments:** Development and Live are separate, each with its own database, and you deploy Development to Live ([version control](https://manual.bubble.io/help-guides/maintaining-an-application/version-control)). Keep synthetic data in Development (3.2).
- **Backups:** Bubble keeps continuous backups of both databases, so you can restore one data type to an earlier second; how far back depends on your plan ([backups](https://manual.bubble.io/help-guides/maintaining-an-application/database-maintenance/database-copy-and-backups)). A restore doesn't touch data types, fields or option sets. For 5.7, also export data on a schedule to storage you control ([exporting data](https://manual.bubble.io/help-guides/data/the-database/export-import-data/exporting-data)).
- **Agents:** the Bubble MCP server can create data types, fields and privacy rules, and read server logs ([Bubble MCP](https://manual.bubble.io/help-guides/ai/bubble-mcp)).
  - It can't deploy or merge branches, so its changes reach Live only when you deploy: review every privacy rule it writes first (12.1).
  - Its record tools read records in **both** Development and Live, for every data type an admin grants with `grant_agent_data_access`, and write records only in Development. Never grant it a type that holds personal data (12.1).

## Limits

- **No code to test or export.** Bubble builds with its own elements and workflows, so the usual unit tests don't apply; Playwright and the security dashboard are your tests.
  - Leaving Bubble means rebuilding in code. The MCP server can help, with your privacy rules as the spec ([exporting your app](https://manual.bubble.io/account-and-marketplace/application-and-data-ownership/exporting-your-bubble-app)).
- **No CSP:** the manual documents no header settings beyond X-Frame-Options, so every plugin's script runs in your pages unchecked (T-10). Vet plugins as processors (9.18).
- **Client-side truth:** page names, option sets and condition logic are visible to anyone, so never rely on obscurity (7.2).
- **Breaking changes** arrive as engine versions. Upgrade in Development, test, then deploy ([versions](https://manual.bubble.io/core-resources/application-settings/versions)).
- **Application rights** default to *Private app*. *Everyone can view* exposes the editor and its data ([app security](https://manual.bubble.io/help-guides/security/app-security)).

## Sources

- Bubble data access: [privacy rules](https://manual.bubble.io/help-guides/data/the-database/protecting-data-with-privacy-rules) · [general settings](https://manual.bubble.io/core-resources/application-settings/general) · [page security](https://manual.bubble.io/help-guides/security/page-security) · [files](https://manual.bubble.io/help-guides/data/files)
- Bubble APIs: [Data API security](https://manual.bubble.io/help-guides/security/api-security/data-api-security) · [Data API privacy rules](https://manual.bubble.io/help-guides/integrations/api/the-bubble-api/the-data-api/data-api-privacy-rules) · [Data API requests](https://manual.bubble.io/help-guides/integrations/api/the-bubble-api/the-data-api/data-api-requests) · [Workflow API security](https://manual.bubble.io/help-guides/security/api-security/workflow-api-security) · [authenticating as a user](https://manual.bubble.io/help-guides/integrations/api/the-bubble-api/authentication/as-a-user) · [API Connector security](https://manual.bubble.io/help-guides/security/api-security/api-connector-security)
- Bubble accounts and security: [user accounts](https://manual.bubble.io/help-guides/data/user-accounts) · [app security](https://manual.bubble.io/help-guides/security/app-security) · [cookies set by Bubble](https://manual.bubble.io/help-guides/data/user-accounts/cookies-set-by-bubble) · [HTML element](https://manual.bubble.io/core-resources/bubble-elements/element-properties/web-element-properties/visual-element-properties/html) · [SEO: app](https://manual.bubble.io/help-guides/maintaining-an-application/seo/seo-app) · [custom fonts](https://manual.bubble.io/help-guides/design/variables-and-styles/using-custom-fonts)
- Bubble testing: [security tests](https://manual.bubble.io/help-guides/security/security-dashboard/security-tests) · [plan features](https://manual.bubble.io/help-guides/security/security-dashboard/security-dashboard-plan-features) · [privacy rules checker](https://manual.bubble.io/help-guides/security/security-dashboard/security-tests/privacy-rules-checker) · [automated tests](https://manual.bubble.io/help-guides/security/security-dashboard/security-tests/automated-tests) · [dashboard overview](https://manual.bubble.io/help-guides/security/security-dashboard/overview) · [testing basics](https://manual.bubble.io/help-guides/maintaining-an-application/testing-an-application/the-basics) · [server logs](https://manual.bubble.io/help-guides/maintaining-an-application/testing-an-application/using-server-logs)
- Bubble operations: [hosting](https://manual.bubble.io/help-guides/optimizing-an-application/hosting-and-scaling/how-bubble-hosting-works) · [dedicated instance](https://manual.bubble.io/help-guides/bubble-for-enterprise/hosting-and-infrastructure/dedicated-instance) · [GDPR](https://manual.bubble.io/help-guides/optimizing-an-application/compliance/gdpr) · [version control](https://manual.bubble.io/help-guides/maintaining-an-application/version-control) · [backups](https://manual.bubble.io/help-guides/maintaining-an-application/database-maintenance/database-copy-and-backups) · [exporting data](https://manual.bubble.io/help-guides/data/the-database/export-import-data/exporting-data) · [Bubble MCP](https://manual.bubble.io/help-guides/ai/bubble-mcp) · [exporting your app](https://manual.bubble.io/account-and-marketplace/application-and-data-ownership/exporting-your-bubble-app) · [versions](https://manual.bubble.io/core-resources/application-settings/versions) · [pricing and plans](https://manual.bubble.io/account-and-marketplace/account-and-billing/pricing-plans)
- Others: [Playwright baseURL](https://playwright.dev/docs/api/class-testoptions)
- Casebook: F-10, F-18 (Appendix F)
