# Webflow

> **Group:** No-code and BaaS · **Covers:** Webflow-hosted sites as of November 2026: forms, CMS, custom code, the Data API v2 and Webflow Cloud apps (Next.js, Astro, Vite or static, on Cloudflare Workers); native User Accounts ended on 29 January 2026 · **Checked:** 2026-11-05 against the official docs

## Access and the isolation test

- **There are no app users on Webflow itself any more.** Webflow ended Logic on 27 June 2025 and User Accounts on 29 January 2026, and pointed members' areas to partners such as Outseta and Memberstack ([Webflow update](https://webflow.com/updates/deprecating-logic-and-user-accounts)). Per-user data now lives in three places:
  - a membership vendor, whose own access rules and tests apply; list it as a processor (3.6, 9.18);
  - a Webflow Cloud app, where your server code enforces access over SQLite (D1), a key-value store or object storage ([storing data](https://developers.webflow.com/webflow-cloud/storing-data/overview)), as in 5.4's note on databases without RLS;
  - Webflow's own stores of personal data: form submissions, and ecommerce orders if you sell.
- **Who can read form submissions.** Anyone holding a token with the right scope can list, read, change or delete them through the Data API ([form submissions](https://developers.webflow.com/data/reference/forms/form-submissions/list-submissions)). So can collaborators who can open the site's Dashboard, where submissions are reviewed ([forms update](https://webflow.com/updates/form-level-settings-spam-inbox-for-form-submissions)). So:
  - mint tokens with the narrowest scopes, one per use ([site token](https://developers.webflow.com/data/reference/authentication/site-token), [scopes](https://developers.webflow.com/data/reference/scopes));
  - keep tokens on a server;
  - give people the lowest Workspace role that works; Webflow has role-based access with custom roles ([security](https://webflow.com/security)).
- **Isolation test, published site.** Nothing in a published page, or in the scripts it loads from your own site, may call the Data API or carry a token:

```ts
// tests/privacy/no-webflow-token.spec.ts: run against the staging (webflow.io) and live sites
import { test, expect } from '@playwright/test';
const PAGES = (process.env.PAGES ?? '/,/contact').split(',');
const LEAK = /api\.webflow\.com|Bearer\s+[A-Za-z0-9._-]{20,}/;
for (const path of PAGES) {
  test(`no Data API access from the browser: ${path}`, async ({ page, baseURL }) => {
    const calls: string[] = [], scripts: Promise<string>[] = [];
    page.on('request', (r) => { if (new URL(r.url()).hostname === 'api.webflow.com') calls.push(r.url()); });
    page.on('response', (r) => { if (r.request().resourceType() === 'script' && new URL(r.url()).origin === new URL(baseURL!).origin) scripts.push(r.text()); });
    await page.goto(path, { waitUntil: 'networkidle' });
    expect(calls).toEqual([]);
    for (const body of [await page.content(), ...(await Promise.all(scripts))]) expect(body).not.toMatch(LEAK);
  });
}
```

- **Isolation test, Webflow Cloud or a membership vendor.** Sign in as two members and request each other's records through every API route, expecting 403 or 404. Use the Next.js or Astro profile for a Webflow Cloud app, or the vendor's test accounts, and run it against a non-production environment.

## Authentication

- **Your team:** Webflow accounts offer 2FA and account activity tracking, with SSO and SCIM on Enterprise ([security](https://webflow.com/security)). Require 2FA for everyone who can see form submissions or publish (7.1, 7.4), and remove leavers on the day (7.4).
- **Visitors:** with no native accounts left, sign-in comes from a membership vendor or your Webflow Cloud app. That system owns password rules, MFA, sessions and lockout under 7.1, so check its docs and its DPA.
- **Webflow Cloud apps** run on the Workers runtime, which only partly supports Node.js APIs ([edge environment](https://developers.webflow.com/webflow-cloud/environment)). Confirm your auth library runs there before you choose it.
- **Tokens:** site tokens last until revoked, or until 365 days without use ([site token](https://developers.webflow.com/data/reference/authentication/site-token)). Webflow recommends a token per use case, minimal scopes and periodic rotation. Put them in the quarterly access review (7.4).

## Secrets

- **Custom code is public.** Head and body code, page code and Code Embeds ship in the page, so a token or key there is exposed (T-02). Data API tokens belong on a server, such as a Webflow Cloud app or your own backend.
- **Custom code through the API** is for OAuth apps only, not site or Workspace tokens ([working with custom code](https://developers.webflow.com/data/docs/working-with-custom-code)).
  - A hosted script is registered with a `hostedLocation` and an `integrityHash`, its subresource integrity hash.
  - A registered script version can't be overwritten, and no change goes live until you publish.
- **Webflow Cloud environment variables** have a **Secret** toggle ([environments](https://developers.webflow.com/webflow-cloud/environments)).
  - Everyone with access to the app can read the variables that aren't secret.
  - The page contradicts itself on secrets: one passage says they're masked in the dashboard and revealed with the eye icon, another that nobody can see them. Until Webflow confirms, don't count them as write-only (7.4): treat everyone with access to the app as able to read every secret.
  - Both kinds are available at build time and at runtime, so a secret read by a public framework variable (`NEXT_PUBLIC_`, `PUBLIC_`, `VITE_`) still ships to the browser.
  - Secrets are redacted from build logs, but don't print them anyway.
- **Webhook keys:** webhooks created through the API carry `x-webflow-timestamp` and an HMAC-SHA256 `x-webflow-signature` ([webhooks](https://developers.webflow.com/data/docs/working-with-webhooks)).
  - The signing key is the webhook's own secret key (site-token webhooks created after 14 April 2025) or your OAuth app's client secret. Store it server-side only.
  - Webhooks created in the dashboard don't carry these headers, so create form webhooks through the API.
  - Reject a request whose signature fails, or that's more than 5 minutes old.

## CSRF and XSS

- **Embeds are the XSS risk.** A Webflow-hosted site is mostly Webflow-generated pages, and the risk is the code you add. Custom code and Code Embeds run with full page access, so never inject visitor input into them (T-04). Review every Marketplace app's injected scripts as third-party code.
- **CSP and headers:** custom security headers, including a Content Security Policy and X-Frame-Options, are an Enterprise feature. HSTS is on by default for non-Enterprise sites ([security](https://webflow.com/security)). Below Enterprise you can't set the 7.4 CSP, which makes the consent gating below the main control (T-10).
- **Forms:** Webflow processes the submission. Spam submissions go to a spam inbox, and reCAPTCHA is managed in the Dashboard ([forms update](https://webflow.com/updates/form-level-settings-spam-inbox-for-form-submissions)). reCAPTCHA is a Google service, so load it only on pages with a form, and name it in the privacy notice (9.9 table: CAPTCHA).
- **Webflow Cloud apps:** CSRF, XSS escape hatches and headers follow that framework's profile (Next.js, Astro).

## Fonts and assets

- **Fonts:** Webflow sites can use uploaded custom font files ([MCP server](https://developers.webflow.com/mcp/reference/overview) lists upload, replace and remove). Run the 9.9 test against staging: if any request goes to `fonts.googleapis.com` or `fonts.gstatic.com`, replace that font with uploaded files and test again (launch trap 2).
- **Assets** (images, scripts, CSS) go out through Webflow's CDN, which its subprocessor list names as Cloudflare, with hosting on AWS ([subprocessors](https://webflow.com/legal/subprocessors)). That list isn't a host list: Webflow's own pages, for example, load assets from `cdn.prod.website-files.com` and jQuery from a CloudFront (AWS) host, which the docs don't mention. Read the exact hosts your pages use from the Network panel or the 9.9 test, add them to `ALLOWED_HOSTS` with your domain and `*.webflow.io`, and record Webflow, AWS and Cloudflare in the processor register (3.6).
- **Hosted scripts** registered through the API carry an integrity hash ([working with custom code](https://developers.webflow.com/data/docs/working-with-custom-code)). For scripts you paste in yourself, prefer copies you host over third-party CDNs (9.9 table).
- **Media:** video, maps and social embeds need a click-to-load facade (S17).

## Consent

- **No built-in banner.** Webflow's consent API covers only its own Analyze and Optimize: `wf.getUserTrackingChoice()` returns `allow`, `deny` or `none`, and `wf.allowUserTracking()` and `wf.denyUserTracking()` set it ([consent management](https://developers.webflow.com/browser/reference/consent-management)). Without Analyze or Optimize the API isn't available, and Webflow says you need your own banner or platform; every other tag needs one either way. Marketplace apps such as Finsweet and DataGrail can provide one.
- **Tracking mode first.** Analyze and Optimize each have three modes: always on, opt-out (tracks until the visitor says no) and opt-in ("Don't track by default"). Analyze sets no cookies but uses local storage, so it isn't exempt under 9.10 ([Analyze consent](https://university.webflow.com/course-lesson/analyze---1-3---tracking-consent-privacy), [Optimize consent](https://university.webflow.com/course-lesson/optimize-tracking-consent)). Choose opt-in for both; the other two track before any choice (9.8).
- **Wire it up:**
  - Call `wf.allowUserTracking({ activate: true })` only from the banner's explicit accept: `activate` defaults to `false`, so without it tracking doesn't start straight away. Call `wf.denyUserTracking()` on reject or withdrawal ([allow](https://developers.webflow.com/browser/reference/allow-user-tracking), [deny](https://developers.webflow.com/browser/reference/deny-user-tracking)).
  - Load every other tag in head or body code through the 9.7 consent loader.
  - Head code runs on every page, so a pasted pixel there is launch trap 7 and the F-18 pattern.
- **Check it:** run the 9.9 tests, including "nothing loads after Reject all", against the staging and live sites. Repeat after installing any Marketplace app or editing custom code.
- **`wf.setUserId()`** ties a visitor to your own user ID for conversion tracking, and Webflow says the ID must not contain personal data ([setUserId](https://developers.webflow.com/browser/custom-goals/off-site-conversions/setUserId)). Call it only after consent, with an opaque ID, never an email (5.1, F-15).

## Logging

- **Form submissions are personal data stored with Webflow.** Set a retention period under 5.6, and delete old submissions on schedule with the Data API's delete endpoint ([delete a submission](https://developers.webflow.com/data/reference/forms/form-submissions/delete-submission)).
- **Notification emails** go to the recipients you set for each form, which has been possible since October 2025 ([forms update](https://webflow.com/updates/form-level-settings-spam-inbox-for-form-submissions)). Name only role mailboxes, and keep special category data out of form fields (9.13).
- **Webhooks** send the submitted data to your endpoint ([webhooks](https://developers.webflow.com/data/docs/working-with-webhooks)). Log the submission ID there, not the body (7.5).
- **Webflow Cloud runtime logs** keep `console` output and uncaught errors for 1 hour, 1 day or 3 days depending on plan ([observability](https://developers.webflow.com/webflow-cloud/observability), [limits](https://developers.webflow.com/webflow-cloud/limits)). Log IDs only. Sentry has a documented setup; use its EU region and PII scrubbing (3.1).

## Testing

- **No security scanner.** Webflow has none for your site's privacy. The MCP server's quality checks cover accessibility, performance and SEO ([MCP server](https://developers.webflow.com/mcp/reference/overview)), so the tests are yours.
- **In CI**, with Playwright:
  - the 9.9 tests and the token test from section 1, against `<site>.webflow.io` before every publish and against the live domain after it;
  - a webhook test that a request with a bad `x-webflow-signature` is refused;
  - a check that no new host appears after a Marketplace app install.
- **Webflow Cloud apps** use their framework's unit and E2E tools, and the isolation test in section 1.

## Deployment

- **Where data lives.**
  - Webflow lists AWS for hosting, MongoDB as its cloud database and Mailjet for transactional email, all in the USA, and Cloudflare (USA) as its CDN ([subprocessors](https://webflow.com/legal/subprocessors)).
  - Its DPA describes AWS data centres in multiple regions, with daily backups encrypted at rest ([DPA](https://webflow.com/legal/dpa)).
  - None of the pages I could open offers a choice of hosting region, so plan on US processing. The DPA applies the EU-US Data Privacy Framework with the UK Extension first, then the EU SCCs or the UK IDTA. Record that under 9.17, and keep C3 data out of Webflow forms.
- **Webflow Cloud** runs framework apps on Cloudflare Workers at edge locations worldwide ([edge environment](https://developers.webflow.com/webflow-cloud/environment)). The pages I read don't say where D1, KV or R2 data is stored, so ask before you put personal data there.
- **Staging and publishing:** Webflow has staging, controlled publishing permissions and a version history you can restore ([security](https://webflow.com/security)). Publishing pushes every staged change live at once, including custom code changes ([working with custom code](https://developers.webflow.com/data/docs/working-with-custom-code)).
- **Backups (5.7):** don't count on site versions for form data. Export the submissions you must keep through the Data API, to storage you control, and delete them there on the same schedule (5.6).
- **Agents:** the Webflow MCP server works with your Webflow permissions. It can write site and page custom code, and list, change or delete form submissions ([MCP server](https://developers.webflow.com/mcp/reference/overview)). Under 12.1, connect it with an account that can't read real submissions, and approve every write.

## Limits

- **No server code** on a plain Webflow site: anything per-user needs a vendor or Webflow Cloud. Treat any members' area built before January 2026 as gone or migrated.
- **No CSP below Enterprise.** Third-party scripts in custom code run unchecked, so gate them by consent and keep them few (T-10).
- **US processing** by default ([subprocessors](https://webflow.com/legal/subprocessors)): add it to the transfer record (9.17) and the privacy notice.
- **Data API v1 is deprecated.** It has had no maintenance or support since 31 March 2025 ([deprecation notice](https://developers.webflow.com/data/docs/webflow-v1-api-deprecation-notice)). Move old integrations to v2 tokens with scopes.
- **Webflow's AI products:** Webflow doesn't send customer personal information to its AI providers by default, and tells you to keep personal data out of AI inputs ([subprocessors](https://webflow.com/legal/subprocessors)). That matches 12.1.

## Sources

- Webflow platform: [security](https://webflow.com/security) · [subprocessors](https://webflow.com/legal/subprocessors) · [DPA](https://webflow.com/legal/dpa) · [deprecating Logic and User Accounts](https://webflow.com/updates/deprecating-logic-and-user-accounts) · [form-level settings and spam inbox](https://webflow.com/updates/form-level-settings-spam-inbox-for-form-submissions)
- Data API: [site token](https://developers.webflow.com/data/reference/authentication/site-token) · [scopes](https://developers.webflow.com/data/reference/scopes) · [list form submissions](https://developers.webflow.com/data/reference/forms/form-submissions/list-submissions) · [delete a form submission](https://developers.webflow.com/data/reference/forms/form-submissions/delete-submission) · [working with custom code](https://developers.webflow.com/data/docs/working-with-custom-code) · [webhooks](https://developers.webflow.com/data/docs/working-with-webhooks) · [v1 deprecation](https://developers.webflow.com/data/docs/webflow-v1-api-deprecation-notice)
- Tracking modes: [Analyze tracking consent](https://university.webflow.com/course-lesson/analyze---1-3---tracking-consent-privacy) · [Optimize tracking consent](https://university.webflow.com/course-lesson/optimize-tracking-consent)
- Browser API: [consent management](https://developers.webflow.com/browser/reference/consent-management) · [allow user tracking](https://developers.webflow.com/browser/reference/allow-user-tracking) · [deny user tracking](https://developers.webflow.com/browser/reference/deny-user-tracking) · [setUserId](https://developers.webflow.com/browser/custom-goals/off-site-conversions/setUserId)
- Webflow Cloud: [storing data](https://developers.webflow.com/webflow-cloud/storing-data/overview) · [edge environment](https://developers.webflow.com/webflow-cloud/environment) · [environments and variables](https://developers.webflow.com/webflow-cloud/environments) · [observability](https://developers.webflow.com/webflow-cloud/observability) · [limits](https://developers.webflow.com/webflow-cloud/limits)
- Agents: [Webflow MCP server](https://developers.webflow.com/mcp/reference/overview)
- Casebook: F-15, F-18 (Appendix F)
