// Checks on what the app tells and asks people (framework Part 9): the age position, the privacy notice, consent
// that isn't pre-ticked or implied, and account deletion with data export.
import { basename } from 'node:path';
import { TRACKERS, trackersUsed } from './browser.ts';
import { type App, type CheckResult, type Evidence, type Facts, type SourceFile, code, evidenceOf, hasDep, result, search, uiFiles } from './lib.ts';

// ---------------------------------------------------------------------------------------------------------------
// The age gate (launch trap 1; launch gate 13.D2; Day-0 T8; framework 9.12; casebook F-17, F-19)
//
// Applies when the spec's users could include under-18s or the service needs an age position (facts.age_gate).
//   - nothing about age anywhere in the code                 -> fail: "the sign-up form never asks for age"
//   - age logic, but no age question in any page or form    -> needs review
//   - an age question, and the spec needs parental consent, but nothing about a parent or guardian -> fail
//   - otherwise                                              -> pass
// It checks that a gate exists, not that it's good: a "18 or over" tick box passes, with a note that 9.12 (AG-01)
// asks for a neutral question that doesn't show the cut-off.

const AGE = /\b(year[_ -]?of[_ -]?birth|birth[_ -]?year|date[_ -]?of[_ -]?birth|dob|birth[_ -]?date|birthday|age[_ -]?(status|check|gate|verification|verified|band|range|group|confirm(ed|ation)?)|is[_ -]?(over|under|at[_ -]?least)[_ -]?(13|16|18)|(over|under)[_ -]?(13|16|18)|minimum[_ -]?age|min[_ -]?age|how old are you|(18|16|13) or (over|older)|(at least|over) (13|16|18)( years)?)\b|name=["']age["']|id=["']age["']/i;
const PARENT = /\b(parent|parents|parental|guardian|carer)[_ -]?(email|consent|approval|verification|permission|account)?\b/i;
const FORM_CONTROL = /<(input|select|option|label|textarea)\b|<(Input|Select|SelectItem|DatePicker|Checkbox|Label|FormField|FormLabel)\b|type=["'](date|number|checkbox)["']/;

export function checkAgeGate(app: App, facts: Facts): CheckResult {
  if (facts.age_gate === 'none') return result('not-applicable', "The spec doesn't need an age position (no accounts, or a business tool for adults).");
  const files = code(app).filter((f) => f.kind === 'code');
  const age = search(files, AGE);
  if (!age.length) return result('fail', 'Nothing in the code asks for or checks age (9.12).', [{ note: 'searched for year or date of birth, age checks and "18 or over"-style questions' }], 1);
  const forms = uiFiles(app).filter((f) => FORM_CONTROL.test(f.code));
  const ui = age.filter((m) => forms.includes(m.file));
  if (!ui.length) return result('needs-review', 'Age is handled somewhere in the code, but no page or form was found that asks for it.', age.slice(0, 5).map((m) => evidenceOf(m)), 1);
  const evidence: Evidence[] = [...new Map(ui.map((m) => [`${m.file.path}:${m.line}`, evidenceOf(m, 'age question')])).values()].slice(0, 3);
  if (/18 or (over|older)|(at least|over) 18|over[_ -]?18/i.test(ui.map((m) => m.match[0]).join(' ')) && !/year|birth|dob/i.test(ui.map((m) => m.match[0]).join(' ')))
    evidence.push({ note: 'a yes/no question that shows the cut-off; 9.12 (AG-01) asks for a neutral question such as year of birth' });
  if (facts.age_gate === 'parental') {
    // A parent or guardian in a form comes first in the evidence; anywhere in the code counts.
    const parent = search(files, PARENT).sort((a, b) => Number(forms.includes(b.file)) - Number(forms.includes(a.file)));
    if (!parent.length) return result('fail', "There's an age question, but nothing about a parent or guardian, and the spec's users are children who need parental consent (9.12 AG-04).", evidence, 1);
    evidence.push(evidenceOf(parent[0], 'parent or guardian'));
  }
  return result('pass', facts.age_gate === 'parental' ? 'Sign-up asks for age and involves a parent or guardian.' : 'Sign-up asks for age.', evidence);
}

// ---------------------------------------------------------------------------------------------------------------
// The privacy notice names the processors the code uses (launch traps 6 and 8; launch gate 13.D1; Day-0 T7;
// framework 9.6 and 8.2; casebook F-19)
//
// Finds the notice (a page or content file with "privacy" in its path, outside lib/ and other code folders), then
// lists the services the code actually sends personal data to, from the dependencies and from script URLs, and looks
// for each one's name in the notice. 9.6 asks the notice to name key processors and the AI provider.
//   - no notice                                    -> fail
//   - a notice under 500 characters of text        -> needs review (a stub, or a page that loads its text elsewhere)
//   - a processor the notice doesn't name          -> fail, one finding per processor
//   - every processor named                        -> pass
// Hosting providers aren't required, because the code rarely says where it will be hosted. A name in the notice
// that the code doesn't use is noted (the notice may describe an app that doesn't exist, trap 6) but doesn't fail.

type Processor = { name: string; names: RegExp; uses: (app: App) => boolean };
const dep = (...names: (string | RegExp)[]) => (app: App): boolean => hasDep(app, ...names);
const PROCESSORS: Processor[] = [
  { name: 'Supabase', names: /supabase/i, uses: dep(/^@supabase\//) },
  { name: 'Stripe', names: /stripe/i, uses: (a) => hasDep(a, 'stripe', '@stripe/stripe-js', '@stripe/react-stripe-js', 'laravel/cashier', 'stripe/stripe-php') || search(code(a), /js\.stripe\.com/).length > 0 },
  { name: 'OpenAI', names: /openai/i, uses: dep('openai', '@ai-sdk/openai', '@langchain/openai', 'openai-php/client', 'openai-php/laravel') },
  { name: 'Anthropic', names: /anthropic|\bclaude\b/i, uses: dep('@anthropic-ai/sdk', '@ai-sdk/anthropic', '@langchain/anthropic', 'anthropic-php/client', 'mozex/anthropic-laravel') },
  { name: 'Google Gemini', names: /gemini|google/i, uses: dep('@google/generative-ai', '@google/genai', '@ai-sdk/google') },
  { name: 'Mistral', names: /mistral/i, uses: dep('@mistralai/mistralai', '@ai-sdk/mistral') },
  { name: 'Resend', names: /resend/i, uses: dep('resend', 'resend/resend-php', 'resend/resend-laravel') },
  { name: 'SendGrid', names: /sendgrid|twilio/i, uses: dep('@sendgrid/mail', 'sendgrid/sendgrid') },
  { name: 'Postmark', names: /postmark/i, uses: dep('postmark', 'wildbit/postmark-php', 'symfony/postmark-mailer') },
  { name: 'Mailgun', names: /mailgun/i, uses: dep('mailgun.js', 'mailgun/mailgun-php', 'symfony/mailgun-mailer') },
  { name: 'Amazon SES', names: /amazon|aws\b|\bses\b/i, uses: dep('@aws-sdk/client-ses', '@aws-sdk/client-sesv2', 'aws/aws-sdk-php') },
  { name: 'Twilio', names: /twilio/i, uses: dep('twilio', 'twilio/sdk') },
  { name: 'Sentry', names: /sentry/i, uses: dep(/^@sentry\//, 'sentry/sentry-laravel') },
  { name: 'Clerk', names: /clerk/i, uses: dep(/^@clerk\//) },
  { name: 'Auth0', names: /auth0|okta/i, uses: dep(/^@auth0\//) },
  { name: 'Firebase', names: /firebase|google/i, uses: dep('firebase', 'firebase-admin') },
  { name: 'Pusher', names: /pusher/i, uses: dep('pusher', 'pusher-js', 'pusher/pusher-php-server') },
  { name: 'Algolia', names: /algolia/i, uses: dep('algoliasearch', 'algolia/algoliasearch-client-php') },
  { name: 'Cloudinary', names: /cloudinary/i, uses: dep('cloudinary', 'next-cloudinary', 'cloudinary-labs/cloudinary-laravel') },
  { name: 'UploadThing', names: /uploadthing/i, uses: dep('uploadthing', '@uploadthing/react') },
  { name: 'Mapbox', names: /mapbox/i, uses: dep('mapbox-gl', 'react-map-gl') },
  { name: 'Mailchimp', names: /mailchimp|intuit/i, uses: dep('@mailchimp/mailchimp_marketing', '@mailchimp/mailchimp_transactional') },
  { name: 'Brevo', names: /brevo|sendinblue/i, uses: dep('@getbrevo/brevo', 'sib-api-v3-sdk') },
  { name: 'Loops', names: /loops/i, uses: dep('loops') },
  { name: 'Intercom', names: /intercom/i, uses: (a) => hasDep(a, '@intercom/messenger-js-sdk', 'react-use-intercom') || search(code(a), /widget\.intercom\.io/).length > 0 },
  { name: 'Crisp', names: /crisp/i, uses: (a) => hasDep(a, 'crisp-sdk-web') || search(code(a), /client\.crisp\.chat/).length > 0 },
  { name: 'Cloudflare Turnstile', names: /cloudflare|turnstile/i, uses: (a) => hasDep(a, '@marsidev/react-turnstile') || search(code(a), /challenges\.cloudflare\.com/).length > 0 },
  { name: 'hCaptcha', names: /hcaptcha/i, uses: (a) => hasDep(a, '@hcaptcha/react-hcaptcha') || search(code(a), /hcaptcha\.com/).length > 0 },
  { name: 'Google reCAPTCHA', names: /recaptcha|google/i, uses: (a) => hasDep(a, 'react-google-recaptcha', 'react-google-recaptcha-v3') || search(code(a), /google\.com\/recaptcha/).length > 0 },
];
// Trackers are processors too, named in the notice by their company.
const TRACKER_NAMES: Record<string, RegExp> = {
  'Google Analytics or Tag Manager': /google/i,
  Hotjar: /hotjar/i,
  'Microsoft Clarity': /clarity|microsoft/i,
  'Meta Pixel': /meta|facebook/i,
  'TikTok Pixel': /tiktok/i,
  'LinkedIn Insight': /linkedin/i,
  PostHog: /posthog/i,
  Mixpanel: /mixpanel/i,
  Segment: /segment|twilio/i,
  Amplitude: /amplitude/i,
  Heap: /heap/i,
  FullStory: /fullstory/i,
  LogRocket: /logrocket/i,
  'Sentry Session Replay': /sentry/i,
  Plausible: /plausible/i,
  Fathom: /fathom/i,
  Umami: /umami/i,
  'Vercel Analytics': /vercel/i,
  'Cloudflare Web Analytics': /cloudflare/i,
};

// Page-like files with "privacy" in their path: routes, views, content and static pages, not code libraries.
export function privacyNotice(app: App): SourceFile[] {
  return app.files.filter(
    (f) =>
      (f.kind === 'code' || f.kind === 'doc') &&
      /privacy|datenschutz|confidentialit/i.test(f.path) &&
      !/(^|\/)(lib|utils?|hooks|server|api|actions|services|stores?|middleware|helpers|Http|Models|config)\//.test(f.path) &&
      !/consent|banner/i.test(basename(f.path)) &&
      (/\.(md|mdx|html?|astro|svelte|vue|blade\.php|erb|njk|hbs|twig)$/.test(f.path) || /(^|\/)(page|index|\+page)\.(t|j)sx?$/.test(f.path) || /privacy[\w-]*\.(t|j)sx?$/i.test(basename(f.path))),
  );
}

// The words a person would read: tags, code punctuation and expressions taken out.
const visibleText = (s: string): string =>
  s
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s*(import|export)\b[^\n]*$/gm, ' ')
    .replace(/[{}()[\];=<>`*#|_~]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function checkPrivacyNotice(app: App, facts: Facts): CheckResult {
  if (!facts.personal_data) return result('not-applicable', 'The spec collects no personal data.');
  const notice = privacyNotice(app);
  const used = PROCESSORS.filter((p) => p.uses(app)).map((p) => ({ name: p.name, names: p.names }));
  for (const t of trackersUsed(app)) used.push({ name: t.name, names: TRACKER_NAMES[t.name] ?? new RegExp(t.name, 'i') });
  const usedList: Evidence = { note: `processors found in the code: ${used.map((u) => u.name).join(', ') || 'none'}` };
  if (!notice.length) return result('fail', 'No privacy notice page found (9.6).', [usedList, { note: 'looked for pages and content files with "privacy" in their path' }], 1);
  const text = notice.map((f) => visibleText(f.text)).join(' ');
  const where: Evidence[] = notice.map((f) => ({ file: f.path, note: 'privacy notice' }));
  if (text.length < 500) return result('needs-review', `The privacy notice has only ${text.length} characters of text: a stub, or a page that loads its text from elsewhere.`, [...where, usedList], 1);
  const missing = used.filter((u) => !u.names.test(text));
  // The reverse, as a note only: a service the notice names that the code doesn't use. Umbrella company names
  // (Google, Amazon, Microsoft, Cloudflare) are dropped, so "Google Gemini" is looked for as "Gemini".
  // Names whose distinctive word is generic ("Google Analytics", "Cloudflare Web Analytics") are skipped.
  const brand = (name: string): RegExp | undefined => {
    const word = name.replace(/^(Google|Amazon|Microsoft|Cloudflare) /, '').split(' ')[0];
    return /^(analytics|web|or)$/i.test(word) ? undefined : new RegExp(`\\b${word}\\b`, 'i');
  };
  const extra = [...PROCESSORS.map((p) => p.name), ...TRACKERS.map((t) => t.name)].filter((name) => !used.some((u) => u.name === name) && brand(name)?.test(text));
  const notes: Evidence[] = extra.length ? [{ note: `named in the notice but not found in the code: ${[...new Set(extra)].join(', ')}` }] : [];
  if (missing.length) return result('fail', `The privacy notice doesn't name ${missing.length} processor${missing.length === 1 ? '' : 's'} the code uses: ${missing.map((m) => m.name).join(', ')} (9.6).`, [...where, usedList, ...missing.map((m) => ({ note: `not named: ${m.name}` })), ...notes], missing.length);
  return result('pass', used.length ? `The privacy notice names every processor the code uses (${used.length}).` : 'A privacy notice exists, and the code uses no third-party processor.', [...where, usedList, ...notes]);
}

// ---------------------------------------------------------------------------------------------------------------
// No pre-ticked or implied consent (launch trap 11; framework 9.7 CR-02 and 9.5 DP-10)
//
// Fails on a tick box for marketing, news, updates, analytics or terms that starts ticked (`checked`,
// `defaultChecked`, or React state that starts true for a consent-like name), a database column for marketing or
// consent that defaults to true, and "by using this site you agree"-style wording. Applies to every app that
// collects personal data; with no such pattern, it passes.

const CONSENTISH = /marketing|newsletter|\bnews\b|updates|offers|promo|consent|subscribe|opt[_-]?in|terms|privacy|analytics|cookies|tracking|partners|third[- ]part/i;
export function checkPreticked(app: App, facts: Facts): CheckResult {
  if (!facts.personal_data) return result('not-applicable', 'The spec collects no personal data.');
  const fails: Evidence[] = [];
  const ui = uiFiles(app);
  // An <input type="checkbox"> (or a checkbox component) that starts ticked, with consent-like words nearby. A bare
  // `checked`, `checked="checked"`, `checked={true}` or `defaultChecked` counts; `checked={someState}` doesn't (that
  // case is caught below if the state starts true). `=>` inside an attribute doesn't end the tag.
  for (const m of search(ui, /<(?:input|Checkbox)\b(?:[^>]|=>)*?(?:\bdefaultChecked\b(?!\s*=\s*\{\s*false\s*\})|\bchecked(?:\s*=\s*(?:["']checked["']|["']true["']|\{\s*true\s*\}))?(?=[\s/>]))(?:[^>]|=>)*>/g)) {
    if (!/type=["']checkbox["']/.test(m.match[0]) && !m.match[0].startsWith('<Checkbox')) continue;
    const around = m.file.code.slice(m.index, m.index + m.match[0].length + 300);
    if (CONSENTISH.test(around)) fails.push(evidenceOf(m, 'a consent or marketing tick box that starts ticked'));
  }
  // React or Vue state for a consent-like choice that starts true.
  for (const m of search(code(app), /\b(?:const|let)\s*\[\s*(\w*(?:marketing|newsletter|consent|subscribe|optIn|opt_in|updates|analytics|tracking)\w*)\s*,\s*\w+\s*\]\s*=\s*useState\s*\(\s*true\s*\)|\b(\w*(?:marketing|newsletter|consent|subscribe|optIn|updates)\w*)\s*=\s*ref\s*\(\s*true\s*\)/gi))
    fails.push(evidenceOf(m, `${m.match[1] ?? m.match[2]} starts as true`));
  // A column that records consent and defaults to true.
  for (const m of search(app.files.filter((f) => f.kind === 'sql' || f.kind === 'prisma' || /migrations?\//.test(f.path)), /\b\w*(marketing|newsletter|opt_?in|optin|consent|subscribed)\w*["']?\s+(?:boolean|bool|Boolean)\b[^,\n]*?(?:default\s+true|@default\(\s*true\s*\))|['"]\w*(marketing|newsletter|opt_?in|consent)\w*['"]\s*\)\s*->\s*default\s*\(\s*true\s*\)/gi))
    fails.push(evidenceOf(m, 'consent is stored as given unless someone says otherwise'));
  // Implied consent wording.
  for (const m of search([...ui, ...app.files.filter((f) => f.kind === 'doc')], /\bby (?:using|continuing to use|browsing|visiting|staying on|accessing) (?:this|our|the) (?:site|website|app|service|platform)\b[^.]{0,80}?\b(?:agree|consent|accept)/gi))
    fails.push(evidenceOf(m, 'consent implied by use'));
  if (fails.length) return result('fail', `${fails.length} place${fails.length === 1 ? '' : 's'} where consent is pre-ticked or implied (9.7 CR-02).`, fails, fails.length);
  return result('pass', 'No pre-ticked consent box, consent column that defaults to true, or "by using this site you agree" wording found.');
}

// ---------------------------------------------------------------------------------------------------------------
// Account deletion and data export (launch trap 9; launch gate 13.D8; framework 9.15 and 10.2)
//
// Applies when the spec has user accounts. It looks for a way to delete the account and a way to download one's
// data, in the pages or the server code. Both found -> pass; either missing -> fail, one finding each. It shows
// that they exist, not that they work end to end (that needs the E2E test the gate asks for).

const DELETE = /delete (?:my |your |the )?account|close (?:my |your )?account|remove (?:my |your )?account|erase (?:my |your )?(?:account|data)|\bdelete_?account\b|\bdeleteAccount\b|\bdeleteMyAccount\b|auth\.admin\.deleteUser\s*\(|\bdeleteUser\s*\(|\/api\/(?:account|me|user|profile|privacy)\/delete|profile\.destroy|\$user->delete\(\)|->user\(\)->delete\(\)/i;
const EXPORT = /(?:download|export|get a copy of) (?:all )?(?:of )?(?:my |your )?(?:personal )?data|data[_ -]?export|export[_ -]?(?:my|user|account|personal)[_ -]?data|\bexport(?:User|Account|My|Personal)Data\b|\bdownload(?:My|User)Data\b|data portability|\/api\/(?:account|me|user|profile|privacy)\/export|privacy\/export/i;

export function checkAccountRights(app: App, facts: Facts): CheckResult {
  if (!facts.accounts) return result('not-applicable', 'The spec has no user accounts.');
  const files = code(app).filter((f) => f.kind === 'code');
  const del = search(files, DELETE);
  const exp = search(files, EXPORT);
  const evidence: Evidence[] = [...(del[0] ? [evidenceOf(del[0], 'account deletion')] : []), ...(exp[0] ? [evidenceOf(exp[0], 'data export')] : [])];
  const missing = [!del.length && 'account deletion', !exp.length && 'data export'].filter(Boolean) as string[];
  if (missing.length) return result('fail', `No ${missing.join(' and no ')} found (9.15).`, [...evidence, ...missing.map((m) => ({ note: `not found: ${m}` }))], missing.length);
  return result('pass', 'Users can delete their account and download their data.', evidence);
}
