<a id="p9"></a>
## Part 9 — Privacy, data protection & compliance `[CORE]`

Compliance here is a set of **product features**, each with acceptance criteria and tests like any other: consent UI, privacy centre, deletion jobs, suppression lists, the age check. Legal position as at **4 November 2026**. Not legal advice.

> **Build rule:** implement once, to the strictest common standard across your markets (EU-style opt-in for all non-essential tracking, NDPA's consent and children's rules, UK complaint handling). One codebase then serves every market.

### 9.1 Which laws apply

| Regime | Applies when | Main build impact | Regulator | Maximum penalty |
|---|---|---|---|---|
| **UK GDPR + Data Protection Act 2018**, as amended by the **Data (Use and Access) Act 2025 (DUAA)**: most changes in force 5 Feb 2026, the complaints duty from 19 Jun 2026 | You're established in the UK, or you offer services to or monitor people in the UK | All of Part 9 | The Information Commission, which took over from the ICO on 30 Sep 2026 (still at ico.org.uk; this framework says "ICO" for short) | £17.5m or 4% of worldwide annual turnover, whichever is higher |
| **PECR** (as amended by DUAA) | Cookies or similar technologies on UK users' devices; electronic marketing to UK recipients | 9.8–9.11 | ICO | Now up to UK GDPR levels |
| **EU GDPR** | You're established in the EU, or you offer goods or services to or monitor people in the EU (Art. 3(2)) | All of Part 9, plus an **EU representative** (Art. 27) if you have no EU establishment, unless the processing is occasional, low-risk and not large-scale sensitive data | National DPAs | €20m or 4% of worldwide annual turnover |
| **ePrivacy Directive** (national laws) | Cookies and e-marketing for EU users | Opt-in consent for non-essential storage or access; e-marketing consent or soft opt-in | DPAs / national regulators | National |
| **EU AI Act** | AI systems placed on the EU market, or whose output is used in the EU | 8.6 | National authorities, AI Office | Up to €15m or 3% for most obligations |
| **Nigeria Data Protection Act 2023 (NDPA)** + **GAID 2025** | The controller or processor is in Nigeria, the processing happens in Nigeria, **or you process data of people in Nigeria from abroad** (s.2(2)(c)) | All of Part 9, plus the Nigeria rows below | NDPC | Up to the greater of ₦10m or 2% of annual gross revenue (major-importance controllers) or ₦2m or 2% (others) (s.48). Failing to comply with an NDPC order is an offence (s.49). Civil claims are also possible (s.51). |
| **UK Online Safety Act 2023** `[IF: UGC]` | User-to-user or search services with links to the UK | Illegal-content and children's-access risk assessments; reporting and blocking tools. Check the Schedule 1 exemptions and Ofcom's guidance. | Ofcom | £18m or 10% of qualifying worldwide revenue |
| **US** `[IF: US users]` | COPPA: service directed at under-13s, or actual knowledge of them (amended Rule; compliance date 22 Apr 2026) · CAN-SPAM: commercial email · TCPA: marketing texts and calls · state privacy laws (thresholds vary) | 9.11, 9.12 | FTC, state AGs | Per violation |
| {{Other markets}} | e.g. India DPDP Act 2023 & Rules 2025 (phased to 2027), South Africa POPIA, Kenya DPA 2019. **Pakistan** had no comprehensive data protection law as of March 2026: the Personal Data Protection Bill 2023 was not yet passed, but PECA 2016 and the constitutional right to privacy (Art. 14) apply. | {{ }} | {{ }} | {{ }} |

> **You as a processor for overseas clients:** if you're established in the UK or EU and build or host a system for a client abroad (a school, clinic or shop), UK/EU GDPR **processor** duties apply to your processing even when the client and its users are outside the UK/EU (Art. 3(1)). These cover security, records, sub-processors and breach notice to the client. Sign a DPA with the client (9.2, Appendix D5).

### 9.2 Roles, registration & accountability

**Who is the controller?** {{Legal entity}}. In B2C, you are the controller of user data. In **B2B SaaS**, the customer is the controller of what its people put into the workspace and **you are its processor**: publish a customer DPA and a sub-processor list, notify customers of sub-processor changes ({{30 days}}), and help them with rights requests and breaches. You remain the controller for account, billing and marketing data.

| Obligation | Applies to you if | Action | Status |
|---|---|---|---|
| **ICO data protection fee** (UK) | You're a UK controller processing personal data electronically. Exemptions are narrow. | Pay before G2: Tier 1 £52 (micro: ≤ 10 staff **or** ≤ £632k turnover); Tier 2 £78 (≤ 250 staff or ≤ £36m turnover); Tier 3 £3,763. £5 off by direct debit. Non-payment can cost up to £4,350. | {{ }} |
| **EU representative** (Art. 27) | No EU establishment, but you target or monitor people in the EU | Appoint one in a member state where your users are | {{ }} |
| **UK representative** | You're outside the UK but target or monitor people in the UK | Appoint one | {{ }} |
| **DPO** (UK/EU Art. 37) | Your core activities involve large-scale regular and systematic monitoring, or large-scale special category data | Appoint and publish contact details; otherwise name a privacy lead | {{ }} |
| **NDPC registration as a Data Controller/Processor of Major Importance (DCPMI)** | You're domiciled, resident or **operating in Nigeria** (which, under GAID Art. 8(2), **includes targeting people in Nigeria**), you keep a filing system (analogue or digital), and you process the data of **more than 200** people in Nigeria in any 6 months, provide commercial ICT services on other people's devices that store personal data, or work in a designated sector (GAID Schedule 7, para 1) | Register with NDPC. Some types are placed in a tier whatever their volume: **Ultra-High (₦250,000)** includes multinationals, fintechs, payment gateways, telecoms, commercial banks, insurers, and public social media and e-mail app developers; Extra-High (₦100,000) includes government bodies, microfinance and mortgage banks, and higher institutions. Otherwise by volume: UHL > 5,000; EHL 1,000–5,000; OHL 200–1,000 (₦10,000) (para 3). A DCPMI must also designate a **DPO** (NDPA s.32; GAID Art. 7(i)). | {{ }} |
| **NDPA compliance audit** (GAID Art. 7(b)) | NDPA applies to you | Audit within 15 months of starting business, then annually | {{ }} |
| **Compliance Audit Returns** (GAID Art. 7(c), 10) | UHL/EHL DCPMI | File through a licensed DPCO (Art. 10(14)): by **31 March** each year if established before 12 Jun 2023; otherwise **within 15 months of establishment**, then annually (Art. 10(7)–(8)). Late filing adds a 50% penalty (Art. 10(9)). | {{ }} |
| **NDPA staff training** (GAID Art. 7(v)) | NDPA applies to you | Train staff within 6 months of starting business, then annually | {{ }} |

> **Nigeria nuance:** the NDPC stopped applying the NDPR 2019 once it issued the GAID on 20 March 2025 (GAID Art. 3(3)); where the GAID and the Act conflict, the Act prevails (Art. 3(2)). A UK-based app with Nigerian users is covered by the NDPA (s.2(2)(c)). Under GAID Art. 8(2), **targeting people in Nigeria counts as "operating in Nigeria"**, even with no office there. Once you process the data of more than 200 Nigerian data subjects in 6 months, expect major-importance (DCPMI) duties: registration, a DPO, audits and returns. Confirm the details with a licensed DPCO before you reach that number.

**Accountability pack.** Keep these in `docs/compliance/`, versioned:
- RoPA (9.3)
- LIAs (Appendix A1) and DPIAs (A2)
- Data protection policy and retention schedule (5.6)
- Processor register and signed DPAs (3.6)
- Cookie register (9.8)
- Breach log (A4) and rights-request log (A3)
- Training records
- An **Appropriate Policy Document** if you rely on certain DPA 2018 Schedule 1 conditions for special category data

### 9.3 Record of Processing Activities (RoPA)

The privacy notice is **generated from this table**: if a purpose isn't recorded here, the product doesn't do it.

| ID | Activity / purpose | People | Personal data | Sensitive? | UK/EU basis (Art. 6) | NDPA basis (s.25) | Art. 9 / s.30 condition | Recipients | Transfers & mechanism | Retention |
|---|---|---|---|---|---|---|---|---|---|---|
| ROPA-01 | Accounts & authentication | Users | Name, email, auth IDs, IP, session data, age-check result | No | Contract | s.25(1)(b)(i) contract | — | Auth provider, email provider | {{ }} | Life of account |
| ROPA-02 | Workspace features (tasks, comments) | Users; people mentioned in content | Content, names | Incidental | Contract | s.25(1)(b)(i) | — | DB host | {{ }} | Life of workspace |
| ROPA-03 | AI summaries & suggestions | Users | Minimised task text | Avoid | Contract | s.25(1)(b)(i) | — | AI provider | {{US · DPF/SCCs}} | Provider minimum |
| ROPA-04 | Security, fraud prevention & audit | Users, visitors | IP, device, events | No | Legitimate interests (LIA-01) | s.25(1)(b)(v) | — | Hosting, monitoring | {{ }} | 90 days–12 months |
| ROPA-05 | Aggregate product analytics | Users, visitors | Pseudonymous usage events | No | Legitimate interests; UK storage exception with opt-out, EU consent (9.8) | Consent (GAID Art. 19) | — | Analytics processor | {{ }} | ≤ 25 months |
| ROPA-06 | Session replay (optional) | Visitors who consent | Masked interaction recordings | No | Consent | Consent | — | Replay vendor | {{ }} | ≤ 30 days |
| ROPA-07 | Transactional email | Users | Email, account events | No | Contract | s.25(1)(b)(i) | — | Email provider | {{ }} | {{ }} |
| ROPA-08 | Marketing email & waitlist | Subscribers | Email, name, preferences | No | Consent / soft opt-in (PECR reg. 22) | Consent (GAID Art. 18(1)(a)) | — | Email provider | {{ }} | Until unsubscribe; then hash in the suppression list |
| ROPA-09 | Support | Users | Messages, attachments | Possibly | Contract / legitimate interests | s.25(1)(b)(i)/(v) | {{if health data appears}} | Help-desk tool | {{ }} | {{24 months}} |
| ROPA-10 | Billing | Customers | Name, billing address, payment tokens (no card numbers), invoices | No | Contract + legal obligation (tax) | s.25(1)(b)(i)/(ii) | — | Payment provider | {{ }} | 6 years |
| ROPA-11 | Rights requests & complaints | Requesters | Identity check, correspondence | Possibly | Legal obligation | s.25(1)(b)(ii) | {{ }} | — | — | 3 years |
| {{ROPA-12}} | {{ }} | | | | | | | | | |

### 9.4 Choosing the lawful basis

| Processing | Typical basis (UK/EU) | Typical basis (NDPA) | Notes |
|---|---|---|---|
| Running the service the user asked for | Contract | s.25(1)(b)(i) | Only what's *necessary*. Analytics and marketing never count as necessary. |
| Security, fraud prevention, abuse handling | Legitimate interests | s.25(1)(b)(v) | Document an LIA. Under the DUAA, some purposes (e.g. crime prevention, safeguarding, emergencies) are **recognised legitimate interests** in the UK with no balancing test. They are narrow, and don't cover commercial analytics. |
| Aggregate product analytics | Legitimate interests (plus the cookie rules in 9.8) | Consent (GAID Art. 19 cookies) | |
| Non-essential cookies, replay, ad pixels | Consent | Consent | |
| B2C marketing email/SMS | Consent, or the UK/EU soft opt-in | Consent (GAID Art. 18(1)(a)) | 9.11 |
| B2B marketing to corporate addresses | Legitimate interests (UK PECR permits it with an opt-out) | Consent is the safe default | |
| Special category data | Explicit consent (typical for apps) | s.30(1)(a) consent | DPIA (9.13) |
| Children's data relying on consent | Parental consent below the national age | Parental consent under 18 (s.31) | 9.12 |
| Tax and accounting records | Legal obligation | s.25(1)(b)(ii) | |

**Legitimate interests require a documented LIA** (Appendix A1): purpose test, necessity test and balancing test. Under the NDPA, legitimate interests are invalid where they override the person's rights, conflict with the other bases, or go beyond what the person would reasonably expect (s.25(2)). The GAID expects the assessment to be completed *before* processing starts (Art. 26).

**Valid consent** is freely given, specific, informed, unambiguous and an affirmative act. It is not bundled with the terms, and it is as easy to withdraw as to give (UK/EU Art. 7; NDPA s.26, s.35). Under the NDPA:
- Silence or inactivity is not consent (s.26(3)).
- Pre-selected boxes are invalid (s.26(7)(a)).
- You must tell people about their right to withdraw *before* they consent (s.26(4)).
- You carry the burden of proof (s.26(1)).

### 9.5 Privacy by design & default

- [ ] **DP-01** Collect only fields with a documented purpose (5.2). Mark optional fields "optional".
- [ ] **DP-02** Defaults are the most protective: profiles private, marketing off, analytics and replay off until consent, location off.
- [ ] **DP-03** Store results, not evidence: an age-check result rather than a date of birth, and no ID scans unless a specialist provider handles them.
- [ ] **DP-04** Pseudonymise analytics and logs with internal IDs, never emails.
- [ ] **DP-05** C3 data lives in separate tables with stricter RLS and app-level encryption where feasible.
- [ ] **DP-06** Retention and deletion are automated (5.6).
- [ ] **DP-07** An in-product privacy centre covers export, delete, consents, marketing preferences, cookie settings and complaints.
- [ ] **DP-08** Show a just-in-time notice at every point where data is collected (9.6).
- [ ] **DP-09** UK services likely to be accessed by children take the **children's higher protection matters** into account in their design (UK GDPR Art. 25(1A)–(1B), inserted by DUAA s.81, in force since 5 Feb 2026). See also the Age Appropriate Design Code (9.12).
- [ ] **DP-10** No dark patterns: Accept and Reject carry equal weight, there's no confirmshaming, cancelling is easy, and nothing is pre-ticked.
- [ ] **DP-11** Every PR that touches personal data answers the privacy questions in the PR template (11.4).

### 9.6 Transparency: privacy notice & just-in-time notices

The privacy notice **must** cover the items below (UK/EU Arts. 13–14; NDPA s.27; GAID Art. 27(3)):

- [ ] Controller identity, place of business and contact details; representative and DPO, where applicable
- [ ] Each purpose **and its lawful basis**, including the legitimate interests pursued
- [ ] The categories of data, and their source where they weren't collected from the person
- [ ] Recipients, naming key processors and the AI provider
- [ ] International transfers and the safeguards used (9.17)
- [ ] Retention periods, or the criteria for them (5.6)
- [ ] Rights and how to use them (9.15), including withdrawing consent and **objecting to direct marketing**
- [ ] Your complaints route (9.16), and the right to complain to the **ICO**, the relevant **EU DPA** and the **NDPC** (NDPA s.27(1)(f))
- [ ] Automated decision-making and profiling: meaningful information about the logic involved (UK/EU), plus its significance, the envisaged consequences, and the right to object and challenge (NDPA s.27(1)(g))
- [ ] Whether giving the data is a requirement, and what happens if someone doesn't
- [ ] Cookies and tracking, with a link to the cookie notice
- [ ] A child-friendly version, if children can use the service
- [ ] Version number, effective date and a changelog

Write it in plain language, in layers, linked from every footer and every collection point. It must describe what the product *actually* does, generated from the RoPA, never copied. Update it **before** new processing starts, and tell users about material changes.

**Just-in-time examples:**
- *Sign-up:* "We use your email to create your account and send essential service messages. See our [Privacy Notice]."
- *Waitlist:* "We'll email you **once**, when we launch. Want occasional product news too? ☐ Yes (optional)."
- *AI feature:* "Your task text is sent to {{provider}} to write this summary. It isn't used to train their models."

### 9.7 Consent architecture

| ID | Requirement |
|---|---|
| CR-01 | One choice per purpose (analytics, replay, marketing …), kept separate from accepting the terms. |
| CR-02 | Consent takes an affirmative action. No pre-ticked boxes, and never "by continuing you agree". |
| CR-03 | Before asking, say who is asking (including named third parties), what for, and how to withdraw (NDPA s.26(4)). |
| CR-04 | Withdrawing takes the same effort as consenting: a persistent "Privacy settings" link, and the same number of clicks (UK/EU Art. 7(3); NDPA s.35(2)). |
| CR-05 | Record who, what, when, how, the notice version and the **exact wording** in the append-only `consent_records` table. Include these records in access requests. |
| CR-06 | Enforce consent at runtime: the server checks it before any marketing send, and the client loader checks it before any script loads. |
| CR-07 | Ask again when the purpose changes materially or a new third party is added (bump `CONSENT_VERSION`). |
| CR-08 | Never make consent a condition of the service unless the processing is genuinely necessary for it. |
| CR-09 | Where the law requires it, children's consent comes from a parent (9.12). |

**Sign-up form pattern:**

```text
Email           [                    ]      [Continue with Google]
Year of birth   [ Select ▾ ]                 ← no default, no hint of the cut-off (9.12)
☐ Send me product news and tips (optional; unsubscribe any time)
By creating an account you agree to our Terms. Our Privacy Notice explains how we use your data.
[ Create account ]
```

> Don't add an "I agree to the Privacy Policy" checkbox. A privacy notice is information, not a contract or a consent. Asking people to "agree" to it misrepresents the lawful basis.

**Client consent module** (`lib/privacy/consent.ts`, type-checked):

```ts
// lib/privacy/consent.ts — first-party consent state and a consent-gated script loader (client only)
export type ConsentPurpose = 'analytics' | 'replay' | 'marketing';
export type ConsentState = Record<ConsentPurpose, boolean> & { version: string; decidedAt: string };

const COOKIE_NAME = 'consent_v1'; // strictly necessary: it only remembers the choice itself
export const CONSENT_VERSION = '2026-11-01'; // bump when purposes or vendors change, so people are asked again

export function readConsent(): ConsentState | null {
  const raw = document.cookie
    .split('; ')
    .find((c) => c.startsWith(`${COOKIE_NAME}=`))
    ?.slice(COOKIE_NAME.length + 1);
  if (!raw) return null;
  try {
    const state = JSON.parse(decodeURIComponent(raw)) as ConsentState;
    return state.version === CONSENT_VERSION ? state : null;
  } catch {
    return null;
  }
}

export function saveConsent(choice: Record<ConsentPurpose, boolean>): ConsentState {
  const state: ConsentState = { ...choice, version: CONSENT_VERSION, decidedAt: new Date().toISOString() };
  const sixMonths = 60 * 60 * 24 * 182;
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(state))}; Max-Age=${sixMonths}; Path=/; SameSite=Lax; Secure`;
  window.dispatchEvent(new CustomEvent<ConsentState>('consentchange', { detail: state }));
  // Evidence for the append-only consent log (ConsentRecord); keepalive survives navigation.
  void fetch('/api/privacy/consent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(state),
    keepalive: true,
  });
  return state;
}

/** Injects a third-party script only after its purpose is granted. On withdrawal, clear the vendor's cookies and reload. */
export function loadWhenConsented(purpose: ConsentPurpose, src: string, onLoad?: () => void): void {
  const inject = (state: ConsentState | null) => {
    if (!state?.[purpose] || document.querySelector(`script[src="${src}"]`)) return;
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    if (onLoad) s.addEventListener('load', onLoad);
    document.head.appendChild(s);
  };
  inject(readConsent());
  window.addEventListener('consentchange', (e) => inject((e as CustomEvent<ConsentState>).detail));
}
```

For Microsoft Clarity: load its official snippet only after consent, then immediately pass the signal with `window.clarity('consentv2', { ad_Storage: "denied", analytics_Storage: "granted" })`. Clarity has enforced consent signals for UK, EEA and Swiss traffic since 31 October 2025. For Google tags, use Consent Mode with every type set to `denied` by default.

### 9.8 Cookies, local storage, SDKs & tracking technologies

**Scope:** cookies, `localStorage`/`sessionStorage`/IndexedDB, pixels, fingerprinting, and mobile SDKs that read device identifiers. The ICO calls these "storage and access technologies" (final guidance, 29 Apr 2026).

| Category | Examples | UK (PECR as amended) | EU (ePrivacy) | Nigeria (GAID Art. 19) |
|---|---|---|---|---|
| Strictly necessary | Session and auth cookies, CSRF, load balancing, the consent-choice cookie, basket | No consent | No consent | No tick-box for necessary cookies that don't process sensitive, financial or privately stored data (Art. 19(5)); still disclose them |
| Security & fraud prevention | Bot defence, account security | No consent (DUAA exception) | Case by case. Usually fine if it's strictly for security of the requested service. | Treat as necessary only if it's limited to security |
| Appearance & preferences | Theme, language, layout | **No consent** if solely to remember the user's own choices. Give clear information and a free, simple opt-out. | Consent unless strictly necessary for a function the user requested | Consent ("specific selection") |
| Statistics / analytics (first-party, aggregate, solely to improve your service) | Page views, feature usage | **No consent** if that is the *sole* purpose. Give clear information and a free, simple opt-out. | **Consent**, apart from narrow national exemptions (e.g. CNIL-approved audience measurement) | **Consent** |
| Session replay, heatmaps, user-level journeys | Hotjar, Clarity, replay SDKs | Consent | Consent | Consent |
| Advertising, retargeting, social pixels | Meta, TikTok, Google Ads, LinkedIn | Consent | Consent | Consent |
| Third-party embeds that set cookies or read the device | YouTube, maps, chat widgets | Consent, or click-to-load (S17) | Consent / click-to-load | Consent / click-to-load |

**Banner & settings requirements (all markets):**

1. **Nothing non-essential runs before a choice is made.** No implied consent, and scrolling doesn't count.
2. The first layer has **Accept all** and **Reject all** with equal prominence (size, colour, position), plus **Manage choices**.
3. It's visible without scrolling on the homepage and every entry page. For Nigeria it must also cover the middle, left or right of the homepage; a bottom bar is treated as a transparency failure (GAID Art. 7(l), Art. 19). A centred or side panel satisfies every market.
4. Every category is **off by default**. The GAID lists pre-selected non-necessary cookies as a complaint category.
5. Name the providers and purposes, and link to the cookie notice table.
6. Store the choice in a necessary cookie with a version. Ask again only on material change, and never nag after a rejection.
7. A **"Cookie settings"** link in the footer of every page lets people change their mind.
8. Withdrawal works immediately: stop the vendor, delete its cookies where possible, and reload.
9. For UK exempt analytics, show the opt-out toggle and an explanation in cookie settings.
10. Respect **Global Privacy Control** where US state law requires it. As good practice, treat it as "Reject non-essential" everywhere.
11. In mobile apps, apply the same rules to SDKs. Cross-app tracking needs the iOS **App Tracking Transparency** prompt. Declare SDK data use in privacy manifests and store labels (9.25).

**Cookie & storage register** (published in the cookie notice):

| Name | Provider | Purpose | Category | Duration | 1st/3rd party | Basis or exception | Set before consent? |
|---|---|---|---|---|---|---|---|
| `consent_v1` | Us | Remembers the cookie choice | Strictly necessary | 6 months | 1st | Strictly necessary | Yes |
| `sb-*-auth-token` | Supabase (ours) | Keeps you signed in | Strictly necessary | Session / refresh | 1st | Strictly necessary | Yes (after sign-in) |
| {{ }} | | | | | | | |

### 9.9 Third-party requests & embedded resources (the "Google Fonts problem")

**Why it matters.** Every request the visitor's browser makes to another company's server discloses their **IP address**, user agent and, through the Referer, the page they're on. An IP address is personal data: an "online identifier" under the NDPA (s.65) and the GDPR (Art. 4(1)). In 2022 a Munich court ordered a site that loaded Google Fonts from Google's servers without consent to pay €100 in damages (LG München I, 3 O 17493/20), and a wave of claim letters followed. Under the NDPA, the same request can also be an unrecorded cross-border transfer (s.41).

**Rule (ADR-004).** Until consent is given, the browser may contact only:
- your own domains;
- your backend (e.g. `{{project-ref}}.supabase.co`);
- services strictly necessary for the specific page, such as the payment provider on checkout.

Everything else is consent-gated or click-to-load.

| Resource | Risky pattern | Compliant pattern |
|---|---|---|
| Web fonts | `<link href="https://fonts.googleapis.com/…">` or a CSS `@import` | `next/font/google` (downloads at build time and self-hosts; the browser sends no requests to Google), `@fontsource/*` packages, or local `woff2` files with `font-src 'self'` |
| JS/CSS libraries | `<script src="https://cdn.jsdelivr.net/…">`, unpkg, cdnjs | Install from npm and bundle |
| Icons | Icon-font CDNs | Bundled SVG icons (e.g. `lucide-react`) |
| Images | Hotlinked stock photos or remote avatars | Serve from your own storage or CDN |
| Avatars | Gravatar (it receives a hash of the email) | Uploaded avatar in your own storage, or generated initials |
| Maps | Map JavaScript loaded with the page | A static map image rendered server-side, or click-to-load with a notice (S17) |
| Video | A YouTube or Vimeo iframe on load | A facade (thumbnail + "Load video — YouTube will set cookies"). `youtube-nocookie.com` still contacts Google on play. |
| Social embeds & share buttons | Vendor SDK widgets | Plain links |
| Chat or support widget | Loaded on every page | Loaded on click ("Chat with us"), after a notice |
| CAPTCHA | On every page | Only on the form that needs it, with a privacy-friendly option, disclosed |
| Payments | The provider's script on every page | Load it on checkout and billing pages only. If you load it site-wide for fraud signals, justify that in an ADR and disclose it. |
| Error monitoring / RUM | SDK with session replay on | Replay off or consent-gated; PII scrubbing; EU data region |
| Analytics & pixels | In the root layout | Only through the consent loader (9.7), or privacy-first aggregate analytics |

**Verify it three ways:**
1. **Manually:** open DevTools → Network in a fresh profile, hard-reload and check every domain.
2. **CSP:** the policy in 7.4 enforces the allowlist.
3. **Automated CI test** (it fails when a page contacts a third party before consent):

```ts
// tests/privacy/no-third-party-before-consent.spec.ts — fails CI if any page contacts a third party before consent
import { test, expect, type Page } from '@playwright/test';

const ALLOWED_HOSTS = (process.env.ALLOWED_HOSTS ?? 'localhost,127.0.0.1').split(','); // add your app domain + <project-ref>.supabase.co
const PAGES = (process.env.PAGES ?? '/,/pricing,/signup,/login').split(',');

function recordThirdPartyHosts(page: Page): Set<string> {
  const hosts = new Set<string>();
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (!url.protocol.startsWith('http')) return; // ignore data:, blob:
    const allowed = ALLOWED_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`));
    if (!allowed) hosts.add(url.hostname);
  });
  return hosts;
}

for (const path of PAGES) {
  test(`no third-party requests before consent: ${path}`, async ({ page }) => {
    const hosts = recordThirdPartyHosts(page);
    await page.goto(path, { waitUntil: 'networkidle' });
    await page.waitForTimeout(1500); // catch late-loading tags
    expect([...hosts], 'third-party hosts contacted before consent').toEqual([]);
  });
}

test('nothing non-essential loads after "Reject all"', async ({ page }) => {
  const hosts = recordThirdPartyHosts(page); // record from the start, so a leak from the click itself counts
  await page.goto('/');
  await page.getByRole('button', { name: 'Reject all' }).click();
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForTimeout(1500);
  expect([...hosts], 'third-party hosts contacted before or after rejecting').toEqual([]);
});
```

### 9.10 Analytics & session replay

**Preferred analytics setup:**
- Aggregate, first-party or processor-run analytics.
- No cross-site tracking, and no vendor reuse of your data for its own purposes.
- IP addresses truncated or discarded; UK/EU hosting; short retention.

**Legal footing:**
- **UK:** may use the *statistical purposes* exception for storage and access (9.8).
- **EU and Nigeria:** get consent. A "cookieless" tool only avoids the consent rule if it truly stores and reads nothing on the device; fingerprinting counts as access.

**Session replay** is optional. If you use it at all:

- [ ] **SR-01** Consent only. It's a separate "Session recordings" choice and off by default.
- [ ] **SR-02** Use the **strictest masking mode** (all text and inputs masked). Mark sensitive elements as well: Hotjar `data-hj-suppress`, Clarity `data-clarity-mask="True"`.
- [ ] **SR-03** Never record auth, password reset, payment, billing, account and privacy settings, admin pages, or any screen showing C3 data (health, children, location).
- [ ] **SR-04** Don't link recordings to identity: no `identify` calls or tags carrying emails or names.
- [ ] **SR-05** Keep recordings ≤ 30 days, restrict access to named people, and don't export them.
- [ ] **SR-06** Name the vendor, the purpose and the retention in the cookie and privacy notices.
- [ ] **SR-07** Before launch, watch 10 staging recordings and confirm nothing personal shows. Pay special attention to custom inputs: rich-text editors, `contenteditable`, canvas and shadow DOM.

### 9.11 Electronic marketing: email, SMS, push, WhatsApp `[IF: marketing]`

**Classify every message first.**

| Type | Examples | Marketing? | Marketing consent needed? |
|---|---|---|---|
| Transactional / service | Verification, password reset, receipts, security alerts, legal or service changes | No. Keep promotions out of these. | No |
| Marketing | "We launched", newsletters, offers, re-engagement, product tips with promotional intent | **Yes** | **Yes** (rules below) |

> A "We launched" email to a waitlist **is marketing**. The waitlist consent covers only what you said you'd send at sign-up.

**Rules by market:**

| Market | Rule |
|---|---|
| **UK** (PECR regs 22–23) | **Individuals** (including sole traders and partnerships) need consent, or the **soft opt-in**: their details were collected during a sale or negotiation, you're marketing your own similar products, and they had an opt-out when you collected the details and in every message. **Corporate addresses** need no consent, but you must identify yourself and give an opt-out; staff can still object (UK GDPR Art. 21). Charities have a soft opt-in for charitable purposes (DUAA). |
| **EU** (ePrivacy + national law) | Consent, or the soft opt-in for existing customers. Double opt-in is strongly advised, and is the practical standard in Germany for proving consent. |
| **Nigeria** (NDPA s.36; GAID Art. 18(1)(a)) | Consent for direct marketing. People can object at any time, and you must stop (s.36(3)–(4)). Withdrawing must be as easy as consenting (s.35(2)). |
| **US** (CAN-SPAM; TCPA for texts) | Opt-out model. Every commercial email needs accurate headers and subject line, a **valid physical postal address** and a working opt-out honoured within **10 business days**. Marketing texts generally need prior express written consent. |

**Every marketing message MUST:**

- [ ] **EM-01** Identify the sender (brand + legal entity).
- [ ] **EM-02** Have a visible **one-step unsubscribe** that needs no sign-in.
- [ ] **EM-03** Send `List-Unsubscribe` and `List-Unsubscribe-Post: List-Unsubscribe=One-Click` headers (RFC 8058). Gmail and Yahoo require one-click unsubscribe from bulk senders.
- [ ] **EM-04** Include a **postal address**, which CAN-SPAM requires. UK companies must also show their registered name, number, place of registration and registered office on websites and in business correspondence, including email.
- [ ] **EM-05** Say why the person is getting it: "You joined the {{App}} waitlist on {{date}}."
- [ ] **EM-06** Process unsubscribes immediately (Gmail expects within 2 days; CAN-SPAM allows 10 business days) and add the address to the **global suppression list**.
- [ ] **EM-07** Never email a bought or scraped list, or an import with no consent evidence.
- [ ] **EM-08** Offer preference categories where useful. "Unsubscribe from all" is always there.
- [ ] **EM-09** After an erasure request, keep a **hashed** suppression entry so the address is never re-added.
- [ ] **EM-10** Deliverability: SPF, DKIM and DMARC on the sending domain; marketing on a subdomain; spam complaint rate below 0.1%, and never reaching 0.3% (Gmail's guidelines); bounces handled.

**Footer template:**

```text
You're receiving this because you joined the {{App}} waitlist on {{12 Oct 2026}}.
Unsubscribe in one click: {{link}} · Email preferences: {{link}} · Privacy notice: {{link}}
{{Legal entity name}} · {{Registered office / postal address}} · Company no. {{12345678}} (registered in {{Scotland}})
```

**Waitlist flow:**
1. The form records the consent wording and a timestamp.
2. (EU/Germany) Send a double opt-in confirmation email.
3. Send the **launch email only**.
4. Ask for ongoing updates as a separate, optional choice.

**Push, SMS and WhatsApp:**
- The OS notification permission is **not** marketing consent. Marketing pushes need their own in-app toggle, off by default.
- SMS follows the email rules.
- WhatsApp Business requires an opt-in.


### 9.12 Children & age assurance `[IF: under-18s could use it]`

**Step 1: choose a position.**

| Position | What it takes |
|---|---|
| **Adults only (18+)**: simplest | Terms say 18+. A neutral age check at sign-up blocks under-18s. Accounts found to be underage are suspended and their data deleted. There's a "report an underage user" route. This sidesteps the NDPA parental-consent rule, which applies to everyone under 18. |
| **Teens allowed** | Thresholds per market (below), parental consent where it's required, child-appropriate defaults, a DPIA |
| **Child-directed** (e.g. under-13s, education) | **High risk.** Verifiable parental consent (COPPA, if US), full Age Appropriate Design Code conformance, a DPIA and specialist review |

**Thresholds by market:**

| Market | Who is a child | When parental consent is needed for online services that rely on consent | Notes |
|---|---|---|---|
| **UK** | Under 18 (Age Appropriate Design Code scope) | Under **13** (DPA 2018 s.9) | The AADC's 15 standards apply to services *likely to be accessed* by under-18s. DUAA adds the children's higher protection matters (DP-09). |
| **EU** | Under 18 | Under **16** by default; member states may set 13–16 (e.g. Ireland, Germany and the Netherlands 16; France 15; Italy 14; Belgium, Denmark and Sweden 13). Check current national law. | Art. 8: make reasonable efforts to verify parental consent |
| **Nigeria** | Under **18** (Child's Rights Act; NDPA s.65) | Under **18** whenever you rely on consent (s.31(1)), and the GAID lists processing a child's data among the cases that need consent (Art. 18(1)(d)). Both stand "without prejudice to" the Act, so its exceptions remain: vital interests; education, medical or social care by a professional bound by confidentiality; court proceedings (s.31(4)). | You must **verify age and consent** with appropriate mechanisms (s.31(2)). Government-approved ID counts as appropriate (s.31(3)). The NDPC must make regulations for children aged 13+ who request online services themselves (s.31(5)). |
| **US** | — | Under **13** (COPPA verifiable parental consent) | Applies to child-directed services, or where you have actual knowledge of under-13s |

**Step 2: design the age check.**

- [ ] **AG-01** Ask neutrally: year (and month) of birth, with no default and no hint of the cut-off. Compute the age on the server and store only the **result** (`age_status`) and the **method**, not the date of birth.
- [ ] **AG-02** Stop instant retries after a block: a short-lived, strictly necessary session flag is enough.
- [ ] **AG-03** Match the strength of the check to the risk. Self-declaration suits low-risk services. Use age estimation or ID checks through a specialist provider (so you never hold the documents) where the risk is higher or the NDPA's verification duty applies.
- [ ] **AG-04** Parental consent flow, where it applies:
  1. Collect the parent's email.
  2. Send a link explaining the processing in plain language.
  3. The parent confirms. Record a `PARENTAL` consent record.
  4. Activate the account with child defaults. Use stronger verification for higher-risk services.
- [ ] **AG-05** Child defaults (AADC):
  - high privacy settings and no public profile;
  - geolocation and profiling off;
  - no nudge techniques and no marketing;
  - parental controls the child can see;
  - privacy information the child can understand.
- [ ] **AG-06** Never use children's data for marketing, profiling or ads. No session replay or AI processing of children's content without a DPIA.
- [ ] **AG-07** When you learn an account is underage: suspend it, then within {{14}} days either get valid parental consent or delete the data.
- [ ] **AG-08** If users can communicate or share content and you have UK users, complete the Online Safety Act children's-access and risk assessments (9.1).

### 9.13 Special category & sensitive data `[IF: health, biometric, etc.]`

- **What counts:** health (including wellbeing and fitness data such as heart rate, sleep or symptoms where they reveal health), biometric data used for identification, genetic data, sex life or orientation, religion or beliefs, racial or ethnic origin, political opinions, trade-union membership. NDPA s.65 has a similar list.
- **Two legal conditions are needed:** an Art. 6 basis **plus** an Art. 9 condition (for consumer apps, usually **explicit consent**). In the UK, some DPA 2018 Schedule 1 conditions also require an Appropriate Policy Document. In Nigeria, a s.30 condition is needed.
- **Explicit consent UX:** a separate, specific statement, e.g. "I agree to {{App}} processing my heart-rate and sleep data to show trends and alerts." It's never bundled. Withdrawal stops the processing and switches the feature off.
- **Controls:**
  - A DPIA (mandatory; 9.21).
  - Segregated tables with app-level encryption where feasible.
  - Owner-only RLS, plus explicitly shared carers.
  - Access logging and UK/EU residency.
  - Passkeys or MFA for every account that can see this data, and re-authentication before any download or export (7.1).
  - No analytics, replay or error-monitoring payloads on these screens.
  - AI only with DPIA approval and provider assurances.
  - Short retention.
- **US state laws:** Illinois BIPA requires written notice and a signed written release before collecting a biometric identifier, and a published retention and destruction schedule (740 ILCS 14/15). Washington's My Health My Data Act requires consent to collect consumer health data and a separate consent to share it (RCW 19.373.030). Check the law registry for the states you serve.
- **Monitoring other people** (family, carers): the monitored adult must be told and must consent themselves. For a child, the parent acts, but the child is told in age-appropriate terms.
- **Medical device check:** software intended to diagnose, prevent, monitor, predict, treat or alleviate disease (beyond general wellness) may be a **medical device** under UK MDR 2002 or EU MDR 2017/745. Get regulatory advice before making clinical claims. Selling to the NHS brings in DTAC, the DSPT and clinical safety standards (DCB0129 for manufacturers).
- **Connected devices (UK PSTI regime, since 29 Apr 2024):** consumer connectable products need no universal default passwords, a published vulnerability disclosure policy, and a stated minimum security-update period. Also: secure pairing, encrypted transport and signed firmware updates.

### 9.14 Location, tracking & worker monitoring `[IF: location / monitoring]`

- **Precise location is high-risk:**
  - Collect it only while a feature needs it (e.g. during an active delivery or shift), at the lowest precision that works, with a visible indicator.
  - Stop when the task ends. Never track workers outside working time.
- **Workers** (employees, drivers, contractors):
  - Publish a monitoring policy: what is monitored, when, why, and who sees it.
  - Do a DPIA, following the ICO's guidance on monitoring workers.
  - The basis is usually legitimate interests or contract. Consent is rarely valid because of the power imbalance.
  - No covert monitoring except in exceptional, documented circumstances.
  - Workers can see their own data. Retention is short (e.g. route history {{30–90 days}}).
  - Data isn't used for undisclosed purposes such as discipline.
  - If AI scores or monitors workers, see 8.6 (AI Act high-risk).
- **Mobile OS:**
  - Request "while using the app" first, and justify "always" or background access.
  - Android shows a foreground-service notification during tracking.
  - Disclose location use in the store listings.
- **Sharing location** (e.g. a customer sees a driver approaching): only during the active job, approximate where possible, through expiring links.

### 9.15 Data subject rights: operations

| Right | UK/EU | NDPA | How it's fulfilled | Target |
|---|---|---|---|---|
| Be informed | Arts. 13–14 | s.27 | Privacy notice and just-in-time notices | — |
| Access | Art. 15 | s.34(1)(a)–(b) | Self-service **Download my data** (JSON + CSV), plus a manual search for everything else: logs, emails, support | ≤ 30 days |
| Rectification | Art. 16 | s.34(1)(c) | Edit profile; request form | ≤ 30 days |
| Erasure | Art. 17 | s.34(1)(d), 34(2) | In-app **Delete account** → 30-day grace → hard delete + processor propagation | ≤ 30 days |
| Restriction | Art. 18 | s.34(1)(e) | A restriction flag plus a manual process | ≤ 30 days |
| Portability | Art. 20 | s.38 | Machine-readable JSON export | ≤ 30 days |
| Object (absolute for direct marketing) | Art. 21 | s.36 | Unsubscribe and marketing toggles; objection form | Marketing: immediately |
| Withdraw consent | Art. 7(3) | s.35 | Privacy and cookie settings | Immediately |
| Automated decisions | UK Arts. 22A–22D · EU Art. 22 | s.37 | "Request human review" (9.22) | ≤ 30 days |
| Complain | To you (UK s.164A) and to the regulator | s.46 (to NDPC) | 9.16 | Acknowledge ≤ 30 days |

**Timelines:**
- **UK/EU:** one month from receipt, extendable by two months for complex or numerous requests (tell the person within the first month). The UK DUAA confirms that searches need only be reasonable and proportionate, and that the clock pauses while you wait for clarification you genuinely need.
- **NDPA:** "without constraint or unreasonable delay". Operate to 30 days at most.

**Operating checklist:**

- [ ] **DSR-01** Accept requests through any channel (privacy@, web form, in-app, support) with no special wording required. Train anyone who might receive one.
- [ ] **DSR-02** Verify identity proportionately. A signed-in session is enough for self-service. Don't demand ID documents by default.
- [ ] **DSR-03** Log every request in `data_subject_requests`, with the due date calculated automatically and alerts at 7 and 3 days before it.
- [ ] **DSR-04** Keep a data map for searches: DB tables, storage buckets, logs, email provider, help desk, analytics, AI logs, backups.
- [ ] **DSR-05** Erasure propagates everywhere:
  - DB cascade, storage objects and the auth user;
  - email provider contacts (keep the suppression hash);
  - the analytics deletion API, error-monitoring user data and the AI provider (per retention);
  - backups age out, and the deletion log is re-applied after any restore.
- [ ] **DSR-06** Document any exemption you rely on (e.g. invoices kept for tax).
- [ ] **DSR-07** Keep templates ready: acknowledgement, clarification, extension, completion, refusal (with reasons and the right to complain).
- [ ] **DSR-08** App stores: Apple requires in-app account deletion for apps that create accounts. Google Play requires an in-app path and a web link.

### 9.16 Complaints handling

- **UK** (DPA 2018 s.164A, for complaints received on or after 19 June 2026), per the ICO's complaints guidance (Feb 2026):
  - Give people a way to complain, such as an electronic form.
  - **Acknowledge within 30 days.**
  - Investigate without undue delay and keep the complainant updated.
  - Tell them the outcome.
- **Nigeria:**
  - People can complain to the NDPC (NDPA s.46), and the privacy notice must say so.
  - The GAID expects a prompt internal remediation contact (Art. 27(3)(i)) and sets out a grievance-notice procedure (Art. 40).
  - If you receive a grievance notice (SNAG), respond within the period it states, and report your decision to the NDPC (Art. 40(6)).
  - Reply to any NDPC notice of investigation within 21 days (Art. 39(8)).
  - Use the UK's 30-day acknowledgement as your internal maximum in every market.
- **Build it:**
  - A "Raise a privacy concern" form in the privacy centre and the privacy notice.
  - An automatic acknowledgement email, tracked as `COMPLAINT` in `data_subject_requests`.
  - An outcome message that includes the right to complain to the regulator.

### 9.17 International transfers

Map where every processor stores or accesses data (3.6). Remote access from another country counts as a transfer.

| From | Mechanisms |
|---|---|
| **UK** | Adequacy regulations (e.g. the EEA); the **UK–US data bridge** for US companies certified under the DPF with the UK Extension; otherwise the IDTA or the UK Addendum to the EU SCCs, plus a transfer risk assessment under the DUAA's "not materially lower" data protection test |
| **EU/EEA** | Adequacy: the **UK** (renewed 19 Dec 2025, valid to 27 Dec 2031) and the **US** for DPF-certified companies. The DPF was upheld by the General Court on 3 Sep 2025, but an appeal is pending at the CJEU (C‑703/25 P), so keep SCCs ready as a fallback. Otherwise use the 2021 SCCs plus a transfer impact assessment. |
| **Nigeria** | The recipient must be subject to a law, binding corporate rules, contractual clauses, a code of conduct or a certification giving adequate protection (s.41(1)(a), assessed under s.42), **or** a s.43 basis must apply: informed consent after being told the risks, contract necessity, the person's sole benefit, public interest, legal claims or vital interests. **Record the basis and the adequacy assessment** (s.41(2)). The GAID adds approved transfer instruments (Art. 45, Schedule 5) and lists consent among its consent cases for transfers to countries without an NDPC adequacy decision (Art. 18). Confirm your approach with a DPCO. |

Choose UK/EU regions for databases and storage, and use EU/UK processing options for AI, email and monitoring vendors wherever they exist.

### 9.18 Processors & vendor management

Before adding any vendor that touches personal data or runs in the browser:

1. Confirm its role (processor or independent controller).
2. Sign a DPA (UK/EU Art. 28; a written agreement under NDPA s.29). Most SaaS vendors offer click-through DPAs.
3. Review its sub-processors and their locations.
4. Check its security assurance (SOC 2 Type II or ISO 27001, encryption, a breach notice period of ≤ {{48 h}}).
5. Check data retention and deletion at the end of the contract.
6. Make sure training on your data, or other secondary use, is off.
7. Add it to the register (3.6), the privacy notice (if it's a new recipient category) and the cookie register (if it runs in the browser).

### 9.19 Security of processing

The legal duty (UK/EU Art. 32; NDPA s.39) is met through Part 7. Keep evidence: test results, scans, access reviews, restore drills.

### 9.20 Personal data breach response

T0 is the moment you become aware of the breach.

Treat a credible claim as a possible breach: a researcher's report, your data offered for sale, or a ransom note. Open a breach-log entry, preserve evidence and start checking at once, and contain as soon as the claim checks out. T0, and the 72-hour clock, starts when you're reasonably sure personal data was compromised, so keep the check short. Record the outcome even if you rule it out.

| When | Step |
|---|---|
| **T0** | Contain: revoke keys, disable the feature, block access. Preserve evidence. Open an entry in the **breach log**. Record *every* breach, even unreported ones (Art. 33(5); NDPA s.40(8)). |
| **≤ 24 h** | Assess what data, how many people, how sensitive, the likely consequences, whether it was encrypted, and what mitigations exist. |
| **≤ 72 h** | **Notify regulators where required:** the **ICO** if there's a risk to individuals (Art. 33); the **lead/relevant EU DPA** if there's a risk; the **NDPC** if a risk is likely (NDPA s.40(2); GAID Art. 7(p)). Report in phases if facts are still emerging (Art. 33(4); NDPA s.40(9)). |
| **Without undue delay / immediately** | **Tell affected people** if the risk is high (Art. 34; NDPA s.40(3) and GAID Art. 33(3) say "immediately"). Say in plain language what happened, the likely consequences, what you're doing, what they should do, and who to contact. |
| **Processors** | Tell the controller without undue delay (UK/EU Art. 33(2)); under the NDPA, on becoming aware (s.40(1)). For B2B customers, follow the DPA terms. |
| **After** | Root cause, fixes, lessons learned. Update the threat model, the DPIA and this runbook. |

**Contacts:**
- **ICO:** 0303 123 1113 or the online breach form.
- **NDPC:** via ndpc.gov.ng.
- **EU DPA:** {{lead authority}}.
- **Legal / insurer:** {{ }}.

### 9.21 Data protection impact assessment (DPIA)

- **UK/EU** (Art. 35): required where processing is likely to be high-risk. The ICO's list includes:
  - innovative technology, decisions that deny a service, large-scale profiling;
  - biometric or genetic data, data matching, invisible processing;
  - **tracking** (location or online behaviour);
  - **targeting children** or vulnerable people;
  - risk of physical harm.
- **Nigeria** (NDPA s.28; GAID Art. 28):
  - The list is **very broad**: profiling, automated decisions, systematic monitoring, sensitive data, vulnerable people (including children), new technologies, health, education, e-commerce, cross-border transfers and more.
  - In the listed cases the DPIA must be **submitted to the NDPC before processing starts**, vetted and signed by an NDPC-accredited DPO, and its outcome reported in the compliance audit return (GAID Art. 28(3)–(5), (9), (12)). Expect to need one for most apps that serve Nigeria.
- **Practice:**
  - Screen every project (Part 0) and do a full DPIA (Appendix A2) for the High tier.
  - Review it on every material change.
  - Consult the regulator if high risk remains after mitigation (Art. 36; NDPA s.28(2)).

### 9.22 Automated decision-making & profiling

- **Identify** decisions made **solely** by automated means with legal or similarly significant effects: account bans, eligibility, pricing, hiring, worker deactivation.
- **UK** (Arts. 22A–22D, substituted by the DUAA): broadly permitted with safeguards (information, the chance to make representations, human intervention, the right to contest), but restricted where special category data is involved.
- **EU** (Art. 22): only with contract necessity, legal authorisation or explicit consent, and with safeguards.
- **Nigeria** (NDPA s.37): the right not to be subject to such decisions unless they rest on contract, law or consent, plus safeguards (human intervention, a chance to give one's view, a way to contest). The GAID lists such decisions among its consent cases (Art. 18).
- **Build:** a "Request human review" action, a plain explanation of the main factors, logging of decision inputs, and an appeal SLA of {{5 working days}}.

### 9.23 Retention

See 5.6. The schedule is enforced by jobs and tests, disclosed in the privacy notice and reviewed annually.

### 9.24 Governance, training & compliance calendar

**Roles:** privacy lead / DPO {{ }} · security lead {{ }} · product owner {{ }}. Solo founders hold all three, so write that down.

**Policies:**
- data protection
- retention
- breach response
- rights requests
- information security
- acceptable use
- AI use
- an Appropriate Policy Document, if one is needed

**Training:** before anyone gets access to personal data, then annually. For Nigeria, train within 6 months of starting business, then annually (GAID Art. 7(v)).

| Task | Frequency | Next due | Owner |
|---|---|---|---|
| ICO fee renewal | Annual | {{ }} | {{ }} |
| NDPC registration renewal (OHL) or Compliance Audit Returns (UHL/EHL: 31 March if established before 12 Jun 2023; otherwise 15 months after establishment, then annually) | Annual | {{ }} | {{ }} |
| NDPA compliance audit | Within 15 months of starting, then annual | {{ }} | {{ }} |
| RoPA and privacy notice review | On every data change; at least every 6 months | {{ }} | {{ }} |
| DPIA review | Annual or on change | {{ }} | {{ }} |
| Vendor, DPA and sub-processor review | Annual | {{ }} | {{ }} |
| Cookie scan and register update | Quarterly, and on every release that adds a script | {{ }} | {{ }} |
| Access review (admin, DB, providers, leavers, third-party app grants) | Quarterly | {{ }} | {{ }} |
| Backup restore drill | Quarterly | {{ }} | {{ }} |
| DAST / pen test | Before launch; then annually | {{ }} | {{ }} |
| Breach tabletop exercise | Annual | {{ }} | {{ }} |
| Regulatory watch (ICO, EDPB, NDPC, EU Digital Omnibus) | Monthly | {{ }} | {{ }} |

### 9.25 Legal pages, product surfaces & platform rules

| Item | Required when | Where |
|---|---|---|
| Privacy notice | Always | Footer, sign-up, settings |
| Cookie notice + **Cookie settings** | Anything beyond strictly necessary storage (good practice always) | Banner + footer |
| Terms of service | Accounts or payments | Sign-up |
| Acceptable use / community rules | UGC | Sign-up, report flow |
| Customer DPA + sub-processor list | You're a B2B processor | Trust/legal page |
| Complaints procedure | UK (s.164A), Nigeria | Privacy centre |
| Company information | UK companies: registered name, number, place of registration, registered office (website and emails). Germany: an Impressum (§5 DDG) if you target German users. | Footer |
| `security.txt` | Always | `/.well-known/` |
| Accessibility statement | Good practice; required for UK public-sector bodies | Footer |
| Children's privacy information | Under-18s allowed | Sign-up, settings |
| Consumer information (B2C paid) | UK: pre-contract information; 14-day cancellation for digital services/content (Consumer Contracts Regulations 2013) unless validly waived; no drip pricing and no fake reviews (DMCC Act 2024). Check the commencement status of the DMCC subscription-contract rules. EU: from 19 Jun 2026, contracts concluded online need a "withdraw from contract here" function (Consumer Rights Directive Art. 11a, added by Directive (EU) 2023/2673). | Checkout |
| App stores | Apple: privacy "nutrition" label, privacy policy URL, in-app account deletion, App Tracking Transparency, SDK privacy manifests. Google Play: Data safety form, in-app + web account deletion, Families policy if children are targeted. | Store listings |
| Payments | Hosted checkout or fields, so card data never touches your servers (PCI DSS SAQ A scope). Strong customer authentication is handled by the provider. | Checkout |
| Accessibility law | UK Equality Act 2010 (reasonable adjustments). The European Accessibility Act (since 28 Jun 2025) covers e-commerce and certain consumer services in the EU, with an exemption for micro-enterprises providing services. Target WCAG 2.2 AA (10.6). | Whole product |

### 9.26 Launch-trap audit: the vibe-coding failures that get apps fined

Run this before G2 and again before G3. Each row needs evidence.

| # | Trap | Why it bites | Fix | Verify |
|---|---|---|---|---|
| 1 | **The sign-up form never asks for age** | You may be processing children's data without parental consent, verification or child safeguards (UK DPA 2018 s.9 and the AADC; EU Art. 8; **NDPA s.31: anyone under 18**) | Pick a position and add a neutral age check (9.12) | E2E test of the underage path |
| 2 | **Fonts from `fonts.googleapis.com`** (or any CDN) | Visitor IP addresses go to a third party with no basis; German courts have awarded damages; under the NDPA it's an unrecorded transfer (s.41) | Self-host (`next/font`, `@fontsource`); `font-src 'self'` | Privacy test (9.9) + CSP |
| 3 | **Session replay or heatmaps load without consent** | A PECR/ePrivacy/GAID consent breach, and recordings may capture personal data | Consent-gated loader, strictest masking, excluded pages (9.10) | Test + review staging recordings |
| 4 | **"We launched" email with no unsubscribe, sender identity or address** | Breaches PECR regs 22–23 (UK), CAN-SPAM (US) and NDPA s.36 + GAID Art. 18 (Nigeria); fails Gmail and Yahoo sender rules | Compliant template, one-click unsubscribe, suppression list (9.11) | Seed-inbox test; check the headers |
| 5 | **RLS off (or unscoped queries), or the secret key in the client** | Anyone can read or write your database: a breach with 72-hour deadlines | RLS on every table (data-layer scoping where there's no RLS); keys server-only; bundle scan (5.4, 7.3) | Isolation tests in CI |
| 6 | **A template or AI-written privacy policy** that doesn't match reality | Breaches transparency (Arts. 13–14; NDPA s.27) and misleads users | Generate it from the RoPA; review on every release | Checklist 9.6 |
| 7 | **Ad or analytics pixels in the root layout** | Consent breach; data shared with ad platforms | Consent loader; Consent Mode set to denied by default | Privacy test |
| 8 | **User data sent to an LLM** without disclosure or a DPA | Transparency, transfer and processor-contract breaches; possible training on your data | ADR-006; DPA; redaction; notice wording | Vendor register |
| 9 | **No way to delete an account or export data** | A rights breach, and App Store rejection | Privacy centre (9.15) | E2E tests |
| 10 | **Personal data in logs or error trackers** | Breaches minimisation and widens any breach | Scrubbing; logging rules (7.5) | Log review |
| 11 | **Pre-ticked boxes or "by using this site you agree"** | Invalid consent (NDPA s.26(3), s.26(7)(a); GDPR Arts. 4(11) and 7; CJEU *Planet49*) | Unticked, granular choices (9.7) | UI review |
| 12 | **A cookie banner with no "Reject all"** | Invalid consent, and a top regulator enforcement theme | Equal Accept and Reject on the first layer | Screenshot review |
| 13 | **Real customer data in preview or staging** | Security and purpose-limitation breach | Synthetic seed data only (3.2) | Environment audit |
| 14 | **A public storage bucket for user uploads** | Data exposure | Private buckets + signed URLs | Integration test |
| 15 | **ICO fee unpaid; NDPC status unchecked** | ICO penalties up to £4,350; missed DCPMI duties | Pay and register before G2 (9.2) | Calendar |
| 16 | **No breach plan** | Missed 72-hour clocks | Runbook (9.20) | Tabletop drill |
| 17 | **DOB or ID scans collected "just in case"** | Minimisation breach, and a honeypot for attackers | Store the result, not the evidence (DP-03) | Data dictionary review |
| 18 | **A chatbot or AI feature that doesn't say it's AI** | EU AI Act Art. 50 (since 2 Aug 2026): tell people they're interacting with an AI system unless it's obvious, and mark generated audio, images, video and text in a machine-readable way | Say it's AI where people meet it; label and mark generated output (8.6) | UI review; check the marking |
| 19 | **"Do Not Sell or Share" missing, or Global Privacy Control ignored** | US state laws, California's among them, make a business that sells or shares data for cross-context advertising treat an opt-out preference signal such as GPC as an opt-out (see the law registry) | Treat GPC as "Reject non-essential" everywhere; add the opt-out link where a state law requires it (9.8) | Privacy test with GPC on: no ad or analytics requests |
| 20 | **Face, voice or fingerprint features without written consent** | Biometric data used for identification is special category data (Art. 9). Illinois BIPA requires written notice and a signed written release before collection, and a published retention schedule with destruction when the purpose is met or within 3 years of the last interaction (740 ILCS 14/15) | Explicit consent before capture, a DPIA and a retention schedule; prefer on-device processing that stores no template (9.13) | Consent records; data dictionary review |
| 21 | **Wellness or symptom features without health-data consent** | Health data is special category data (Art. 9). Washington's My Health My Data Act requires consent to collect consumer health data, and a separate consent to share it, beyond what the requested service needs (RCW 19.373.030) | Separate, specific consents; no analytics, replay or pixels on these screens (9.13) | E2E test of both consents; privacy test on those screens |
| 22 | **No online way to withdraw or cancel** | EU: from 19 Jun 2026, distance contracts concluded through an online interface need a "withdraw from contract here" function, and the trader must acknowledge the withdrawal on a durable medium (Consumer Rights Directive Art. 11a, added by Directive (EU) 2023/2673). UK: 14-day cancellation for digital services (9.25) | A withdrawal button and confirmation flow; cancelling is as easy as signing up (DP-10, 9.25) | E2E test of withdrawal and cancellation |
| 23 | **No company details or legal notice** | UK companies must show their registered name, number, place of registration and office on the website; a site that targets German users needs an Impressum (§5 DDG) | A legal notice linked from the footer (9.25) | Page review |
| 24 | **An EU shop or consumer service that fails accessibility law** | The European Accessibility Act (since 28 Jun 2025) covers e-commerce and certain consumer services in the EU; micro-enterprises providing services are exempt | WCAG 2.2 AA (10.6) and an accessibility statement | axe in CI, a keyboard-only run and a screen-reader check |
| 25 | **Authorisation only in the UI or in middleware** | Hidden buttons don't stop direct calls to server actions and API routes. A critical 2025 flaw let requests skip Next.js middleware (CVE-2025-29927), so apps whose only check sat there were open | `assertCan` in the data-access layer for every action, deny by default (7.2) | The role-matrix test (11.3); calls with no session and with another user's |
| 26 | **AI endpoints with no quota or spend cap** | Anyone who finds the endpoint can run up the model bill ("denial of wallet", OWASP LLM10:2025), and text the model reads can carry injected instructions (LLM01) | Authentication, per-user quotas and a hard spend cap; input treated as data; no side-effect tools without the user's confirmation (8.7, T-05) | Rate-limit test; the cap set at the provider; the injection eval set |
| 27 | **App store privacy labels that don't match the app** | Apple's privacy label and SDK privacy manifests, and Google Play's Data safety form, must describe what the app and its SDKs collect | Fill them in from the data dictionary and the SDK list (9.25) | Compare the labels with the data dictionary before each submission |
| 28 | **Card details collected in your own form** | Card data on your servers brings full PCI DSS scope, and a breach exposes every card | Hosted checkout or hosted fields, so card data never touches your servers (9.25) | Check that no card field reaches your API, database or logs |
| 29 | **Payment webhooks accepted without a signature check** | Anyone can post a fake "payment succeeded" event and unlock paid features | Verify the HMAC signature, reject stale timestamps, deduplicate by event ID (6.5) | A test that an unsigned or replayed event is rejected |

### 9.27 Myth vs fact: what the viral compliance threads get right and wrong

| Claim | What the law actually says |
|---|---|
| "Your app can be fined ₦10m before its first sale." | The NDPC **may** impose a penalty up to a cap after investigating: the greater of ₦10m or 2% of annual gross revenue for major-importance controllers, or ₦2m or 2% for others (NDPA s.48(3)–(5)). It weighs gravity, intent, cooperation and other factors (s.48(6)). The risk is real, but these are discretionary maximums, not automatic fines. Note: targeting Nigerian users counts as operating in Nigeria (GAID Art. 8(2)), so the major-importance threshold is just **200** Nigerian users in 6 months. |
| "Every email without an unsubscribe = a ₦10m fine." | There's no per-email tariff. Ignoring an objection to direct marketing *is* a clear breach (s.36(3)–(4)), each complaint can trigger an investigation, and in the UK PECR fines now reach UK GDPR levels. |
| "Hotjar and Clarity record every keystroke, including passwords, by default." | Not by default. Hotjar suppresses keystrokes and never captures password or email-type fields. Clarity masks sensitive content by default and has enforced consent signals for UK, EEA and Swiss traffic since 31 Oct 2025. The real failures are **missing consent**, relaxed masking and unmasked custom inputs (9.10). |
| "The NDPA requires a physical address in emails." | The postal-address rule comes from US CAN-SPAM, and UK companies must show company details in business email. The NDPA's rules are about consent and the right to object. Use one footer template that satisfies them all (9.11). |
| "IP addresses are personal data." | Correct in practice: both the NDPA (s.65) and the GDPR (Art. 4(1)) treat online identifiers as personal data. |
| "Anyone under 18 needs parental consent." | Under the NDPA, yes, when you rely on consent, with limited exceptions (s.31). UK and EU thresholds for consenting to online services are 13–16. Build to your markets, or make the service 18+ (9.12). |
