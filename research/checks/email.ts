// Checks on marketing email (launch trap 4; launch gate 13.D6; Day-0 T6; framework 9.11). A "we launched" email to
// a waitlist is marketing (9.11), and so is a newsletter or a product update.
//
// Marketing messages are found by name: email templates and sending scripts whose path or name says launch,
// newsletter, announcement, campaign, digest, promo, offer or product update. Verification, password reset, invite,
// receipt and other service messages are left out (they must carry no promotion, but they need no unsubscribe).
// A template that is neither is listed only if the spec includes marketing email and nothing else was found.
import { basename } from 'node:path';
import { type App, type CheckResult, type Evidence, type Facts, type SourceFile, code, evidenceOf, result, search } from './lib.ts';

const MARKETING = /newsletter|marketing|campaign|launch|announce|digest|promo|offer|product[-_ ]?update|broadcast|we-?re-?live|drip|re-?engage/i;
const SERVICE = /verif|confirm|reset|password|magic|login|sign-?in|otp|invite|invitation|receipt|invoice|order|payment|billing|security|alert|notification|transactional/i;
// A template is a file whose path mentions mail (emails/, app/Mail/, resources/views/mail/, launch-email.tsx …) and
// whose content is an email: react-email, MJML, a Laravel mail component or Mailable, or a whole HTML document.
const EMAIL_PATH = /mail|newsletter/i;
const EMAIL_BODY =/from\s+['"]@react-email\/|<mjml\b|<Html\b[\s\S]*<Body\b|@component\(\s*['"]mail::message|<x-mail::message|extends\s+Mailable\b|<body[\s\S]*<\/body>/i;
const SENDS = /\b(resend\.(emails|batch)\.send|\.sendMail\s*\(|sgMail\.send(Multiple)?\s*\(|postmark|ServerClient\s*\(|mailgun|SESv2?Client|SendEmailCommand|Mail::to\s*\(|->send\s*\(\s*new\s+\w+|mailer\.send\s*\()/i;
const PROVIDER_LISTS = /\bresend\.(broadcasts|audiences|contacts)\.|@mailchimp\/|mailchimp|buttondown|convertkit|kit\.com\/v4|loops\.so|['"]loops['"]|brevo|sendinblue|beehiiv|mailerlite|sendgrid\.com\/v3\/marketing/i;
const UNSUBSCRIBE = /unsubscribe|opt[- ]?out|email[- ]?preferences|manage (your )?(email )?preferences|\{\{\{?\s*RESEND_UNSUBSCRIBE_URL|\*\|UNSUB\|\*|%unsubscribe_url%|<%asm_group_unsubscribe(_raw)?_url%>|\{\{\s*unsubscribe/i;

type Candidate = { file: SourceFile; why: string };

// Marketing emails (templates, and senders with no template of their own), the scripts that send marketing email,
// and email templates whose purpose the name doesn't give.
export function marketingEmails(app: App): { marketing: Candidate[]; unclear: Candidate[]; senders: Candidate[] } {
  const marketing: Candidate[] = [];
  const unclear: Candidate[] = [];
  for (const file of code(app).filter((f) => f.kind === 'code')) {
    const template = EMAIL_BODY.test(file.code) && EMAIL_PATH.test(file.path);
    const sender = SENDS.test(file.code) || PROVIDER_LISTS.test(file.code);
    if (!template && !sender) continue;
    // The purpose comes from the file's name and its folder, never from a route group such as app/(marketing)/,
    // which holds landing pages, not email.
    const parent = file.path.split('/').slice(-2, -1)[0] ?? '';
    const purpose = `${/^\(.*\)$/.test(parent) ? '' : parent}/${basename(file.path)}`;
    if (MARKETING.test(purpose) && !SERVICE.test(purpose.replace(new RegExp(MARKETING.source, 'gi'), ''))) marketing.push({ file, why: template ? 'marketing email template' : 'sends marketing email' });
    else if (template && !SERVICE.test(purpose)) unclear.push({ file, why: 'email template of unclear purpose' });
  }
  // A sender that renders one of the marketing templates is the same email: the template carries the verdict, so
  // one missing link counts once.
  const senders = marketing.filter((c) => c.why === 'sends marketing email');
  const templates = marketing.filter((c) => c.why !== 'sends marketing email');
  const standalone = senders.filter((s) => !withImports(app, s.file).some((f) => templates.some((t) => t.file === f)));
  return { marketing: [...templates, ...standalone], unclear, senders };
}

// The files a file imports (relative paths, or the common `@/` alias for the app root or src/), so a sending script
// and the template it renders are read together.
function withImports(app: App, file: SourceFile): SourceFile[] {
  const dir = file.path.split('/').slice(0, -1).join('/');
  const out = [file];
  const strip = (p: string): string => p.replace(/\.(t|j)sx?$/, '').replace(/\/index$/, '');
  const normalise = (p: string): string => {
    const stack: string[] = [];
    for (const part of p.split('/')) {
      if (part === '..') stack.pop();
      else if (part && part !== '.') stack.push(part);
    }
    return stack.join('/');
  };
  for (const m of file.code.matchAll(/from\s+['"]((?:\.{1,2}|@)\/[^'"]+)['"]/g)) {
    const targets = m[1].startsWith('@/') ? [m[1].slice(2), `src/${m[1].slice(2)}`] : [normalise(`${dir}/${m[1]}`)];
    const hit = app.files.find((f) => targets.some((t) => strip(f.path) === strip(t)));
    if (hit) out.push(hit);
  }
  return out;
}

// Every marketing email carries a visible unsubscribe link (EM-02).
export function checkUnsubscribe(app: App, facts: Facts): CheckResult {
  const { marketing, unclear } = marketingEmails(app);
  if (!marketing.length) {
    if (!facts.marketing_email) return result('not-applicable', 'The spec has no marketing email, and none was found in the code.');
    if (unclear.length) return result('needs-review', 'The spec includes marketing email. No template is named as marketing, but some email templates are of unclear purpose: check whether one of them is the marketing email.', unclear.map((c) => ({ file: c.file.path, note: c.why })), unclear.length);
    return result('needs-review', 'The spec includes marketing email, but no marketing template or sender was found. The feature may be missing (record it in the review), or it may be sent from a provider dashboard.', [], 1);
  }
  const missing: Evidence[] = [];
  const present: Evidence[] = [];
  const { senders } = marketingEmails(app);
  for (const c of marketing) {
    // The link may be in the template, in what it imports, or added by the script that sends it.
    const sentBy = senders.filter((s) => withImports(app, s.file).includes(c.file)).map((s) => s.file);
    const hit = search([...withImports(app, c.file), ...sentBy], UNSUBSCRIBE)[0];
    if (hit) present.push(evidenceOf(hit, `${c.why}: has an unsubscribe link`));
    else missing.push({ file: c.file.path, note: `${c.why}: no unsubscribe link or merge tag` });
  }
  if (missing.length) return result('fail', `${missing.length} of ${marketing.length} marketing email${marketing.length === 1 ? '' : 's'} ${missing.length === 1 ? 'has' : 'have'} no unsubscribe link (9.11 EM-02).`, [...missing, ...present], missing.length);
  return result('pass', `Every marketing email (${marketing.length}) has an unsubscribe link.`, present);
}

// Marketing email is sent with List-Unsubscribe and List-Unsubscribe-Post headers, for one-click unsubscribe
// (EM-03; RFC 8058; Gmail's and Yahoo's bulk-sender rules). If the app hands its list to a newsletter provider's
// broadcast feature, the provider may add them itself, so that needs review rather than a fail.
export function checkListUnsubscribe(app: App, facts: Facts): CheckResult {
  const { marketing, senders } = marketingEmails(app);
  if (!marketing.length) return facts.marketing_email ? result('needs-review', 'The spec includes marketing email, but no marketing sender was found (see the unsubscribe check).', [], 1) : result('not-applicable', 'The spec has no marketing email, and none was found in the code.');
  const files = code(app);
  const header = search(files, /list-unsubscribe(?!-post)/i);
  const post = search(files, /list-unsubscribe-post/i);
  if (header.length && post.length) return result('pass', 'Marketing email sets List-Unsubscribe and List-Unsubscribe-Post.', [evidenceOf(header[0]), evidenceOf(post[0])]);
  if (header.length) return result('fail', 'List-Unsubscribe is set, but not List-Unsubscribe-Post, so one-click unsubscribe (RFC 8058) is missing.', [evidenceOf(header[0])], 1);
  const provider = search(files, PROVIDER_LISTS);
  if (provider.length) return result('needs-review', "No List-Unsubscribe header in the code, but marketing goes through a newsletter provider's list or broadcast feature, which may add it. Check the provider.", provider.slice(0, 3).map((m) => evidenceOf(m)), 1);
  return result('fail', 'Marketing email is sent without List-Unsubscribe headers (9.11 EM-03).', (senders.length ? senders : marketing).map((c) => ({ file: c.file.path, note: c.why })), 1);
}
