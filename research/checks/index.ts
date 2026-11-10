// The experiment's checks, each mapped to what it tests in Bansat: the README's launch traps (framework 9.26), the
// launch gate (Part 13, G3), the Day-0 triage (14.2), the threat model (7.3) and the breach casebook (Appendix F).
//
// Part 13 doesn't number its items, so the gate references here number them by position within each lettered
// group (13.C1 is the first item under "C. Security"), with the item's own words beside the number. ⛔ marks the
// items Part 13 marks as blocking.
import { checkFonts, checkTracking } from './browser.ts';
import { checkListUnsubscribe, checkUnsubscribe } from './email.ts';
import { checkHeaders } from './headers.ts';
import { type App, type CheckResult, type Facts } from './lib.ts';
import { checkAccountRights, checkAgeGate, checkPreticked, checkPrivacyNotice } from './privacy.ts';
import { checkRls } from './rls.ts';
import { checkSecrets } from './secrets.ts';
import { checkStorage } from './storage.ts';

export type Mapping = {
  traps: number[]; // launch traps, README and framework 9.26
  gate: string[]; // launch gate items, Part 13
  day0: string[]; // Day-0 triage rows, 14.2
  threats: string[]; // threat model, 7.3
  sections: string[]; // the framework sections that set the rule
  casebook: string[]; // Appendix F cases whose failure class this catches (never a claim it would have prevented them)
};
export type Check = { id: string; title: string; kind: 'static' | 'dynamic'; maps: Mapping; run?: (app: App, facts: Facts) => CheckResult };

const GATE = {
  C1: '13.C1 ⛔ Access enforced at the data layer on every table (RLS where the database supports it)',
  C2: '13.C2 ⛔ No secrets in the repo or the client bundle',
  C7: '13.C7 Security headers in place and the CSP enforced',
  D1: '13.D1 ⛔ The privacy notice is live and matches the RoPA',
  D2: '13.D2 ⛔ The age position is implemented and tested',
  D3: '13.D3 ⛔ No non-essential cookies, tracking or third-party requests before consent; fonts self-hosted',
  D4: '13.D4 ⛔ The cookie banner has equal Accept and Reject',
  D5: '13.D5 ⛔ Session replay, if used, is consent-gated',
  D6: '13.D6 ⛔ Marketing email: one-click unsubscribe plus List-Unsubscribe headers',
  D8: '13.D8 ⛔ Privacy centre: export and account deletion work end to end',
};

export const CHECKS: Check[] = [
  {
    id: 'rls-every-table',
    title: 'Row Level Security on every table, with no policy that trusts user_metadata or is always true',
    kind: 'static',
    maps: { traps: [5], gate: [GATE.C1], day0: ['T2'], threats: ['T-01'], sections: ['5.4', '7.2'], casebook: ['F-01', 'F-02', 'F-03'] },
    run: (app) => checkRls(app),
  },
  {
    id: 'secrets-not-in-client',
    title: 'Secret keys stay out of client code, built files and committed .env files',
    kind: 'static',
    maps: { traps: [5], gate: [GATE.C2], day0: ['T1'], threats: ['T-02'], sections: ['3.7', '7.4', '12.1'], casebook: ['F-02', 'F-09', 'F-12', 'F-13', 'F-14'] },
    run: (app) => checkSecrets(app),
  },
  {
    id: 'self-hosted-fonts',
    title: 'No fonts from Google Fonts or any other font host or CDN',
    kind: 'static',
    maps: { traps: [2], gate: [GATE.D3], day0: ['T4'], threats: ['T-10'], sections: ['9.9', '7.4'], casebook: [] },
    run: (app) => checkFonts(app),
  },
  {
    id: 'consent-gated-tracking',
    title: 'Analytics, session replay and ad pixels load only behind consent',
    kind: 'static',
    maps: { traps: [3, 7], gate: [GATE.D3, GATE.D5], day0: ['T5'], threats: ['T-10'], sections: ['9.7', '9.8', '9.10'], casebook: ['F-18'] },
    run: (app) => checkTracking(app),
  },
  {
    id: 'security-headers',
    title: 'An enforced CSP, X-Content-Type-Options and Referrer-Policy are configured',
    kind: 'static',
    maps: { traps: [], gate: [GATE.C7], day0: [], threats: ['T-04', 'T-10'], sections: ['7.4'], casebook: [] },
    run: (app) => checkHeaders(app),
  },
  {
    id: 'marketing-email-unsubscribe',
    title: 'Every marketing email has an unsubscribe link',
    kind: 'static',
    maps: { traps: [4], gate: [GATE.D6], day0: ['T6'], threats: [], sections: ['9.11 EM-02'], casebook: [] },
    run: checkUnsubscribe,
  },
  {
    id: 'marketing-email-list-unsubscribe',
    title: 'Marketing email is sent with List-Unsubscribe and List-Unsubscribe-Post headers',
    kind: 'static',
    maps: { traps: [4], gate: [GATE.D6], day0: ['T6'], threats: [], sections: ['9.11 EM-03'], casebook: [] },
    run: checkListUnsubscribe,
  },
  {
    id: 'age-gate',
    title: 'Sign-up asks for age where the spec needs it, with a parental flow for children',
    kind: 'static',
    maps: { traps: [1], gate: [GATE.D2], day0: ['T8'], threats: [], sections: ['9.12 AG-01', '9.12 AG-04'], casebook: ['F-17', 'F-19'] },
    run: checkAgeGate,
  },
  {
    id: 'privacy-notice-names-processors',
    title: 'A privacy notice exists and names every processor the code uses, the AI provider included',
    kind: 'static',
    maps: { traps: [6, 8], gate: [GATE.D1], day0: ['T7'], threats: [], sections: ['9.6', '3.6', '8.2'], casebook: ['F-19'] },
    run: checkPrivacyNotice,
  },
  {
    id: 'no-preticked-consent',
    title: 'No pre-ticked consent boxes, consent columns that default to true, or "by using this site you agree"',
    kind: 'static',
    maps: { traps: [11], gate: [], day0: [], threats: [], sections: ['9.7 CR-02', '9.5 DP-10'], casebook: [] },
    run: checkPreticked,
  },
  {
    id: 'private-storage-buckets',
    title: "Storage for people's uploads is private",
    kind: 'static',
    maps: { traps: [14], gate: [], day0: ['T3'], threats: ['T-07'], sections: ['7.3 T-07'], casebook: [] },
    run: (app) => checkStorage(app),
  },
  {
    id: 'account-deletion-export',
    title: 'Users can delete their account and download their data',
    kind: 'static',
    maps: { traps: [9], gate: [GATE.D8], day0: [], threats: [], sections: ['9.15', '10.2'], casebook: [] },
    run: checkAccountRights,
  },
  {
    id: 'no-third-party-before-consent',
    title: 'In a browser, no third-party request or tracker cookie before consent',
    kind: 'dynamic',
    maps: { traps: [2, 3, 7], gate: [GATE.D3], day0: ['T4'], threats: ['T-10'], sections: ['9.9'], casebook: ['F-18'] },
  },
  {
    id: 'reject-all-honoured',
    title: 'The cookie banner has a Reject button, and after it nothing third-party loads',
    kind: 'dynamic',
    maps: { traps: [12], gate: [GATE.D4], day0: [], threats: [], sections: ['9.8', '9.9'], casebook: ['F-18'] },
  },
];

export type Scored = Check & { result: CheckResult };

// Runs every static check. A check that throws is reported as needs review, with the error, never silently passed.
export function runStatic(app: App, facts: Facts): Scored[] {
  return CHECKS.filter((c) => c.kind === 'static').map((c) => {
    try {
      return { ...c, result: c.run!(app, facts) };
    } catch (error) {
      return { ...c, result: { status: 'needs-review', summary: `The check itself failed: ${error instanceof Error ? error.message : String(error)}`, evidence: [], findings: 1 } };
    }
  });
}
