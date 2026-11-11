// Tests for the experiment's checks (research/checks). Every check must pass the good fixture app and fail the bad
// one, and the edge cases that decide between pass, fail, needs review and not applicable must behave as the README
// says. Secret-looking values are built at run time, so no file in the repository holds anything a secret scanner
// would flag. The dynamic tests launch Chromium through Playwright and send nothing to the network.
//   node research/checks/checks.test.ts
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { after, describe, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { scoreBlueprint } from './blueprint.ts';
import { checkFonts, checkTracking } from './browser.ts';
import { judge, runDynamic } from './dynamic.ts';
import { checkListUnsubscribe, checkUnsubscribe } from './email.ts';
import { checkHeaders } from './headers.ts';
import { CHECKS, runStatic } from './index.ts';
import { type Facts, type Status, indexApp, loadSpec } from './lib.ts';
import { checkAccountRights, checkAgeGate, checkPreticked, checkPrivacyNotice } from './privacy.ts';
import { checkRls, splitSql } from './rls.ts';
import { checkSecrets } from './secrets.ts';
import { checkStorage } from './storage.ts';
import { checkIdentityData, checkLogs, loggedValues } from './data.ts';

const RESEARCH = join(dirname(fileURLToPath(import.meta.url)), '..');
const FIXTURES = join(RESEARCH, 'fixtures');
const fixtureFacts = loadSpec(join(FIXTURES, 'fixture-spec.md')).facts;

// Temporary apps, written from a map of path -> content and removed at the end.
const temp = mkdtempSync(join(tmpdir(), 'bansat-checks-'));
after(() => rmSync(temp, { recursive: true, force: true }));
let n = 0;
function makeApp(files: Record<string, string>): string {
  const root = join(temp, `app-${++n}`);
  for (const [path, content] of Object.entries(files)) {
    mkdirSync(dirname(join(root, path)), { recursive: true });
    writeFileSync(join(root, path), content);
  }
  mkdirSync(root, { recursive: true });
  return root;
}
const app = (files: Record<string, string>) => indexApp(makeApp(files));
const facts = (over: Partial<Facts> = {}): Facts => ({ personal_data: true, accounts: false, age_gate: 'none', marketing_email: false, analytics: false, ai: false, payments: false, special_category: false, multi_tenant: false, uploads: false, ...over });
const is = (r: { status: Status; summary: string }, status: Status): void => assert.equal(r.status, status, r.summary);

// Secret-shaped values, assembled here so they never sit in a file as one string.
const b64 = (o: object): string => Buffer.from(JSON.stringify(o)).toString('base64url');
const jwt = (claims: object): string => [b64({ alg: 'HS256', typ: 'JWT' }), b64(claims), 'Q7wEr5Ty'.repeat(5)].join('.');
const SERVICE_ROLE = jwt({ iss: 'supabase', ref: 'abcdefghijklmnopqrst', role: 'service_role', iat: 1767225600, exp: 2082758400 });
const ANON = jwt({ iss: 'supabase', ref: 'abcdefghijklmnopqrst', role: 'anon', iat: 1767225600, exp: 2082758400 });
const DEMO = jwt({ iss: 'supabase-demo', role: 'service_role', exp: 1983812996 });
const STRIPE = ['sk', 'live', 'Q7wEr5Ty'.repeat(4)].join('_');

describe('the fixture apps', () => {
  const good = indexApp(join(FIXTURES, 'good-app'));
  const bad = indexApp(join(FIXTURES, 'bad-app'));
  const goodResults = runStatic(good, fixtureFacts);
  const badResults = runStatic(bad, fixtureFacts);
  for (const c of CHECKS.filter((c) => c.kind === 'static')) {
    test(`${c.id} passes the good app`, () => is(goodResults.find((r) => r.id === c.id)!.result, 'pass'));
    test(`${c.id} fails the bad app`, () => {
      const r = badResults.find((r) => r.id === c.id)!.result;
      is(r, 'fail');
      assert.ok(r.findings >= 1, 'a fail counts at least one finding');
      assert.ok(r.evidence.length >= 1, 'a fail carries evidence');
    });
  }

  test('the dynamic checks pass the good build and fail the bad one', async () => {
    const g = await runDynamic({ staticDir: join(FIXTURES, 'good-app/dist'), allow: ['supabase.co'], pages: ['/privacy/'] });
    is(g.beforeConsent, 'pass');
    is(g.rejectAll, 'pass');
    assert.deepEqual(g.report.pages.map((p) => p.path).sort(), ['/', '/pricing/', '/privacy/'], 'it follows the home page links and the spec pages');
    const b = await runDynamic({ staticDir: join(FIXTURES, 'bad-app/dist'), allow: ['supabase.co'] });
    is(b.beforeConsent, 'fail');
    assert.match(JSON.stringify(b.beforeConsent.evidence), /fonts\.vendor\.invalid/);
    assert.match(JSON.stringify(b.beforeConsent.evidence), /analytics\.vendor\.invalid/);
    assert.match(JSON.stringify(b.beforeConsent.evidence), /_ga/, 'a tracker cookie set before consent counts');
    is(b.rejectAll, 'fail');
    assert.match(b.rejectAll.summary, /Accept but no Reject/);
  });

  test('documentation, the installed skill and top-level Markdown are never read', () => {
    const paths = [...good.files, ...bad.files].map((f) => f.path);
    assert.ok(!paths.some((p) => p.startsWith('docs/') || p.startsWith('.claude/') || p === 'README.md'), paths.join(', '));
    assert.ok(good.bundle.some((f) => f.path === 'dist/index.html'), 'build output is kept apart, for the bundle scan');
    assert.ok(!good.files.some((f) => f.path.startsWith('dist/')), 'build output is not read as source');
  });
});

describe('rls-every-table', () => {
  test('splits SQL into statements, keeping a function body with semicolons whole', () => {
    const s = splitSql("create function f() returns int language sql as $$ select 1; select 2; $$;\n-- a comment; with a semicolon\nselect 'a;b';", 'x.sql');
    assert.equal(s.length, 2);
    assert.match(s[0].text, /select 2; \$\$$/);
    assert.equal(s[1].line, 3);
  });
  test('not applicable when there is no database at all', () => is(checkRls(app({ 'package.json': '{"dependencies":{"next":"1"}}' })), 'not-applicable'));
  test('needs review when the app uses Supabase but defines no tables', () => is(checkRls(app({ 'package.json': '{"dependencies":{"@supabase/supabase-js":"1"}}' })), 'needs-review'));
  test('needs review for Laravel and MySQL, which have no RLS', () => is(checkRls(app({ 'composer.json': '{"require":{"laravel/framework":"^12"}}' })), 'needs-review'));
  test('passes a table with RLS on and no policy: only the service role reaches it', () => {
    const r = checkRls(app({ 'supabase/migrations/1.sql': 'create table audit (id int);\nalter table audit enable row level security;' }));
    is(r, 'pass');
    assert.match(JSON.stringify(r.evidence), /safe default/);
  });
  test('needs review for a read policy that is always true', () => is(checkRls(app({ 'supabase/migrations/1.sql': 'create table posts (id int);\nalter table posts enable row level security;\ncreate policy "all read" on posts for select to anon using (true);' })), 'needs-review'));
  test('fails a table whose RLS is switched off again by a later migration', () => {
    const r = checkRls(app({ 'supabase/migrations/1.sql': 'create table t (id int); alter table t enable row level security;', 'supabase/migrations/2.sql': 'alter table public.t disable row level security;' }));
    is(r, 'fail');
    assert.match(JSON.stringify(r.evidence), /switched off again/);
  });
  test("reads Prisma models as tables, and a policy file can switch their RLS on (the framework's pattern)", () => {
    const schema = 'datasource db {\n  provider = "postgresql"\n}\nmodel Task {\n  id Int @id\n  @@map("tasks")\n}\nmodel Note {\n  id Int @id\n}\n';
    is(checkRls(app({ 'prisma/schema.prisma': schema, 'supabase/policies/001_rls.sql': 'alter table public.tasks enable row level security;\nalter table "Note" enable row level security;' })), 'pass');
    const r = checkRls(app({ 'prisma/schema.prisma': schema, 'supabase/policies/001_rls.sql': 'alter table public.tasks enable row level security;' }));
    is(r, 'fail');
    assert.match(JSON.stringify(r.evidence), /public\.Note: RLS is never enabled/);
  });
  test('keeps quoted and unquoted names apart, as Postgres does', () => is(checkRls(app({ 'db/1.sql': 'create table "Profile" (id int);\nalter table profile enable row level security;' })), 'fail'));
  test('needs review for a view that skips RLS, and passes one with security_invoker', () => {
    const base = 'create table t (id int); alter table t enable row level security;\n';
    is(checkRls(app({ 'db/1.sql': `${base}create view v as select * from t;` })), 'needs-review');
    is(checkRls(app({ 'db/1.sql': `${base}create view v with (security_invoker = true) as select * from t;` })), 'pass');
  });
});

describe('self-hosted-fonts', () => {
  test('fails a CSS @import from Google Fonts and a Bunny Fonts link', () => {
    is(checkFonts(app({ 'src/styles/global.css': "@import url('https://fonts.googleapis.com/css2?family=Inter');" })), 'fail');
    is(checkFonts(app({ 'resources/views/welcome.blade.php': '<link href="https://fonts.bunny.net/css?family=figtree:400" rel="stylesheet" />' })), 'fail');
  });
  test('ignores a font host named only in a comment', () => is(checkFonts(app({ 'app/layout.tsx': '// never load fonts.googleapis.com: https://fonts.googleapis.com/css2\nexport default 1;' })), 'pass'));
  test('needs review when a CSP allows a font host that nothing loads', () => is(checkFonts(app({ 'next.config.mjs': `const csp = "font-src 'self' https://fonts.gstatic.com";` })), 'needs-review'));
});

describe('consent-gated-tracking', () => {
  test('not applicable with no tracker', () => is(checkTracking(app({ 'app/page.tsx': 'export default 1;' })), 'not-applicable'));
  test('passes a tracker rendered behind a consent condition', () => is(checkTracking(app({ 'app/layout.tsx': "import { GoogleAnalytics } from '@next/third-parties/google';\nexport default function L({ consent }) {\n  return <body>{consent.analytics && <GoogleAnalytics gaId=\"G-1\" />}</body>;\n}" })), 'pass'));
  test('needs review for a tracker in a component, which a parent may mount behind consent', () => is(checkTracking(app({ 'components/Replay.tsx': "import Clarity from '@microsoft/clarity';\nexport function Replay() { Clarity.init('abc'); return null; }" })), 'needs-review'));
  test('needs review, not fail, for a cookieless tool in the root layout', () => is(checkTracking(app({ 'app/layout.tsx': '<script defer data-domain="x.com" src="https://plausible.io/js/script.js"></script>' })), 'needs-review'));
});

describe('secrets-not-in-client', () => {
  test('fails a service-role key in client code, and passes the anon key and the local demo key', () => {
    is(checkSecrets(app({ 'lib/supabase.ts': `'use client';\nexport const key = '${SERVICE_ROLE}';` })), 'fail');
    is(checkSecrets(app({ 'lib/supabase.ts': `export const key = '${ANON}';` })), 'pass');
    is(checkSecrets(app({ 'scripts/seed.ts': `const key = '${DEMO}';` })), 'pass');
  });
  test('fails a secret in an .env file that .gitignore misses, and only notes it in one that it covers', () => {
    is(checkSecrets(app({ '.env': `STRIPE_SECRET_KEY=${STRIPE}\n` })), 'fail');
    const ok = checkSecrets(app({ '.env.local': `STRIPE_SECRET_KEY=${STRIPE}\n`, '.gitignore': '.env*.local\n' }));
    is(ok, 'pass');
    assert.match(JSON.stringify(ok.evidence), /\.gitignore covers/);
    assert.doesNotMatch(JSON.stringify(ok.evidence), new RegExp(STRIPE), 'the value itself is never copied into the report');
  });
  test('ignores placeholders and example files', () => is(checkSecrets(app({ '.env.example': `STRIPE_SECRET_KEY=${STRIPE}\n`, 'lib/x.ts': `const k = '${['sk', 'live', 'x'.repeat(20)].join('_')}';` })), 'pass'));
  test('fails a secret in built browser code', () => is(checkSecrets(app({ '.next/static/chunks/main.js': `var k="${STRIPE}";` })), 'fail'));
  test('reads public variable names: secrets fail, public keys pass, vague names need review', () => {
    is(checkSecrets(app({ '.env.example': 'NEXT_PUBLIC_DATABASE_URL=\n' })), 'fail');
    is(checkSecrets(app({ '.env.example': 'NEXT_PUBLIC_MAPBOX_TOKEN=\nPUBLIC_SUPABASE_ANON_KEY=\nNEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=\n' })), 'pass');
    is(checkSecrets(app({ '.env.example': 'VITE_API_KEY=\n' })), 'needs-review');
  });
});

describe('security-headers', () => {
  test('fails when the only CSP is Report-Only', () => {
    const r = checkHeaders(app({ 'public/_headers': '/*\n  Content-Security-Policy-Report-Only: default-src \'self\'\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n' }));
    is(r, 'fail');
    assert.match(r.summary, /only Report-Only/);
  });
  test('passes a CSP in a <meta> tag with the other headers in a host file', () => is(checkHeaders(app({ 'src/layouts/Base.astro': '<meta http-equiv="Content-Security-Policy" content="default-src \'self\'">', 'public/_headers': '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n' })), 'pass'));
  test('passes helmet, unless its CSP is switched off', () => {
    is(checkHeaders(app({ 'package.json': '{"dependencies":{"helmet":"8"}}', 'server.js': 'app.use(helmet());' })), 'pass');
    is(checkHeaders(app({ 'package.json': '{"dependencies":{"helmet":"8"}}', 'server.js': 'app.use(helmet({ contentSecurityPolicy: false }));' })), 'fail');
  });
});

describe('marketing email', () => {
  const template = (body: string) => `import { Html } from '@react-email/components';\nexport default function E() { return <Html>${body}</Html>; }`;
  test('not applicable when the spec has none and the code has none', () => {
    is(checkUnsubscribe(app({}), facts()), 'not-applicable');
    is(checkListUnsubscribe(app({}), facts()), 'not-applicable');
  });
  test('needs review when the spec has marketing email but the code has none', () => is(checkUnsubscribe(app({ 'app/page.tsx': 'export default 1;' }), facts({ marketing_email: true })), 'needs-review'));
  test("a route group named (marketing) isn't marketing email", () => is(checkUnsubscribe(app({ 'app/(marketing)/actions.ts': "await resend.emails.send({ subject: 'Confirm your email' });" }), facts()), 'not-applicable'));
  test('counts an unsubscribe link that the sending script adds to the template', () =>
    is(checkUnsubscribe(app({ 'emails/newsletter.tsx': template('<p>News</p>'), 'scripts/send-newsletter.ts': "import N from '../emails/newsletter';\nconst footer = '<a href=\"{{unsubscribe}}\">Unsubscribe</a>';\nresend.emails.send({ react: N(), html: footer });" }), facts()), 'pass'));
  test('List-Unsubscribe without List-Unsubscribe-Post fails; a newsletter provider needs review', () => {
    is(checkListUnsubscribe(app({ 'lib/send-launch.ts': "resend.emails.send({ headers: { 'List-Unsubscribe': '<u>' } });" }), facts()), 'fail');
    is(checkListUnsubscribe(app({ 'lib/send-launch.ts': 'await resend.broadcasts.create({ audienceId });' }), facts()), 'needs-review');
  });
});

describe('age-gate', () => {
  const form = (inner: string) => `export default function SignUp() { return <form><input name="email" />${inner}</form>; }`;
  test('not applicable when the spec needs no age position', () => is(checkAgeGate(app({}), facts()), 'not-applicable'));
  test('passes a yes/no "18 or over" box, with a note that 9.12 asks for a neutral question', () => {
    const r = checkAgeGate(app({ 'app/signup/page.tsx': form('<label><input type="checkbox" name="adult" required /> I am 18 or over</label>') }), facts({ age_gate: 'age-check' }));
    is(r, 'pass');
    assert.match(JSON.stringify(r.evidence), /neutral question/);
  });
  test('needs review when age is handled only on the server', () => is(checkAgeGate(app({ 'lib/age.ts': 'export const ageStatus = (y: number) => y;' }), facts({ age_gate: 'age-check' })), 'needs-review'));
  test('fails a children\'s app that asks for age but never involves a parent', () => is(checkAgeGate(app({ 'app/signup/page.tsx': form('<select name="birth_year"></select>') }), facts({ age_gate: 'parental' })), 'fail'));
});

describe('privacy-notice-names-processors', () => {
  const long = 'We explain here what we collect, why, and for how long, and how you can use your rights. '.repeat(8);
  test('not applicable when the spec collects no personal data', () => is(checkPrivacyNotice(app({}), facts({ personal_data: false })), 'not-applicable'));
  test('fails with no notice, and needs review for a stub', () => {
    is(checkPrivacyNotice(app({ 'app/page.tsx': 'export default 1;' }), facts()), 'fail');
    is(checkPrivacyNotice(app({ 'app/privacy/page.tsx': 'export default () => <p>Coming soon</p>;' }), facts()), 'needs-review');
  });
  test('passes a notice in Markdown content that names the AI provider', () => is(checkPrivacyNotice(app({ 'package.json': '{"dependencies":{"@ai-sdk/anthropic":"1"}}', 'src/content/legal/privacy.md': `${long} Anthropic runs the assistant.` }), facts()), 'pass'));
  test("doesn't take the consent library for the notice", () => is(checkPrivacyNotice(app({ 'lib/privacy/consent.ts': long }), facts()), 'fail'));
});

describe('no-preticked-consent', () => {
  test('fails React state for marketing that starts true, and a Laravel column that defaults to true', () => {
    is(checkPreticked(app({ 'app/signup/page.tsx': 'const [marketingOptIn, setMarketingOptIn] = useState(true);' }), facts()), 'fail');
    is(checkPreticked(app({ 'database/migrations/2026_create_users.php': "$table->boolean('newsletter_opt_in')->default(true);" }), facts()), 'fail');
  });
  test('passes a controlled checkbox and "By creating an account you agree to our Terms"', () => is(checkPreticked(app({ 'app/signup/page.tsx': '<input type="checkbox" checked={news} onChange={(e) => setNews(e.target.checked)} /> News\n<p>By creating an account you agree to our Terms.</p>' }), facts()), 'pass'));
});

describe('private-storage-buckets', () => {
  test('not applicable with no storage', () => is(checkStorage(app({})), 'not-applicable'));
  test('needs review for a public bucket of photos meant for everyone', () => is(checkStorage(app({ 'supabase/migrations/1.sql': "insert into storage.buckets (id, name, public) values ('listing-images', 'listing-images', true);" })), 'needs-review'));
  test('fails a public bucket for documents made in code, and passes private buckets in config.toml', () => {
    is(checkStorage(app({ 'lib/setup.ts': "await supabase.storage.createBucket('documents', { public: true });" })), 'fail');
    is(checkStorage(app({ 'supabase/config.toml': '[storage.buckets.receipts]\npublic = false\nfile_size_limit = "5MiB"\n' })), 'pass');
  });
});

describe('account-deletion-export', () => {
  test('not applicable without accounts', () => is(checkAccountRights(app({}), facts()), 'not-applicable'));
  test('fails with one finding when only deletion exists', () => {
    const r = checkAccountRights(app({ 'app/account/page.tsx': '<button>Delete my account</button>' }), facts({ accounts: true }));
    is(r, 'fail');
    assert.equal(r.findings, 1);
  });
});

describe('dynamic checks, edge cases', () => {
  const page = (body: string) => `<!doctype html><html><head><meta charset="utf-8"><title>t</title></head><body>${body}</body></html>`;
  test('fails a Reject button that is not honoured, counting only what loads after the click', async () => {
    const dir = makeApp({ 'index.html': page('<section><p>We use cookies.</p><button onclick="document.cookie=\'c=1\'">Accept all</button><button onclick="var s=document.createElement(\'script\');s.src=\'https://tags.vendor.invalid/t.js\';document.head.appendChild(s);document.cookie=\'_fbp=1; path=/\'">Reject all</button></section>') });
    const r = await runDynamic({ staticDir: dir, settleMs: 200 });
    is(r.beforeConsent, 'pass');
    is(r.rejectAll, 'fail');
    assert.match(JSON.stringify(r.rejectAll.evidence), /tags\.vendor\.invalid/);
  });
  test("passes a page that loads nothing optional, where no banner isn't needed", async () => {
    const r = await runDynamic({ staticDir: makeApp({ 'index.html': page('<h1>Hi</h1><footer><a href="/cookies">Cookie settings</a></footer>') }), settleMs: 200 });
    is(r.beforeConsent, 'pass');
    is(r.rejectAll, 'not-applicable');
  });
  test('needs review for a payment provider loaded before consent, and for an app that cannot be loaded', async () => {
    const r = await runDynamic({ staticDir: makeApp({ 'index.html': page('<script src="https://js.stripe.com/v3/"></script>') }), settleMs: 200 });
    is(r.beforeConsent, 'needs-review');
    const down = await runDynamic({ url: 'http://127.0.0.1:9/', settleMs: 200 });
    is(down.beforeConsent, 'needs-review');
    assert.match(down.beforeConsent.summary, /couldn't be loaded/);
  });
  test('a notice banner with only "Got it" needs review', () => {
    const r = judge({ base: 'http://x/', pages: [{ path: '/', status: 200, thirdParty: [], trackerCookies: [] }], banner: { found: ['Got it'], after: { path: '/', thirdParty: [], trackerCookies: [] } } });
    is(r.rejectAll, 'needs-review');
  });
});

describe('blueprint completeness', () => {
  const spec = loadSpec(join(FIXTURES, 'fixture-spec.md'));
  test("scores the good fixture's blueprint as complete for its tier", () => {
    const b = scoreBlueprint(join(FIXTURES, 'good-app'), spec);
    assert.ok(b.found);
    assert.equal(b.score, 1, JSON.stringify(b.items.filter((i) => !i.ok)));
    assert.equal(b.statedTier, 'high');
    assert.equal(b.tierMatches, true);
    assert.ok(b.g1Signed);
  });
  test('marks down a blueprint with empty parts and an unsigned gate', () => {
    const dir = makeApp({ 'docs/BLUEPRINT.md': '# Blueprint\n\n| G1 Blueprint approved | | | |\n\n## Part 0 — Intake\n\nRisk tier: Low\n\n## Part 1 — Product\n\n{{TBD}}\n' });
    const b = scoreBlueprint(dir, spec);
    assert.ok(b.score < 0.3, String(b.score));
    assert.equal(b.tierMatches, false);
    assert.equal(b.g1Signed, false);
    assert.equal(b.placeholders, 1);
  });
  test('reports a missing blueprint as not found', () => assert.equal(scoreBlueprint(makeApp({}), spec).found, false));
});

describe('the specs and the registry', () => {
  const files = readdirSync(join(RESEARCH, 'specs')).filter((f) => f.endsWith('.md'));
  const specs = files.map((f) => loadSpec(join(RESEARCH, 'specs', f)));
  test('six specs, named after their ids, spanning an individual, a startup and an organisation', () => {
    assert.equal(specs.length, 6);
    for (const s of specs) assert.equal(`${s.id}.md`, files[specs.indexOf(s)]);
    assert.deepEqual([...new Set(specs.map((s) => s.size))].sort(), ['individual', 'organisation', 'startup']);
  });
  test('cover the risks the brief asks for', () => {
    const any = (k: keyof Facts, v: unknown = true) => specs.some((s) => s.facts[k] === v);
    assert.ok(any('marketing_email') && any('multi_tenant') && any('age_gate', 'parental') && any('special_category') && any('ai') && any('payments'));
  });
  test("each prompt gives a brief, users and markets, and a stack, and names none of the controls it's scored on", () => {
    for (const s of specs) {
      for (const h of ['## The brief', '## Who it\'s for', '## Stack']) assert.ok(s.prompt.includes(h), `${s.id} lacks ${h}`);
      assert.doesNotMatch(s.prompt, /^---|bansat|blueprint|gdpr|row[- ]level|\brls\b|consent|unsubscribe|privacy|cookie|content[- ]security|\bcsp\b|age (gate|check|verification)|compliance|compliant|launch trap/im, s.id);
      assert.ok(s.features.length >= 4, `${s.id} needs features for the reviewer to tick`);
    }
  });
  test('every check has a unique id and maps to a launch trap or a launch-gate item', () => {
    assert.equal(new Set(CHECKS.map((c) => c.id)).size, CHECKS.length);
    for (const c of CHECKS) {
      assert.ok(c.maps.traps.length + c.maps.gate.length > 0, c.id);
      for (const t of c.maps.traps) assert.ok(t >= 1 && t <= 17, `${c.id}: trap ${t}`);
      for (const g of c.maps.gate) assert.match(g, /^13\.[A-G]\d+ /, c.id);
    }
  });
});

describe('no-personal-data-in-logs', () => {
  test('not applicable without personal data', () => is(checkLogs(app({ 'lib/a.ts': 'console.log(user.email);' }), facts({ personal_data: false })), 'not-applicable'));
  test('passes with no logging, and with logging that names no personal value', () => {
    is(checkLogs(app({ 'lib/a.ts': 'export const a = 1;' }), facts()), 'pass');
    is(checkLogs(app({ 'lib/a.ts': "console.log('email sent to the list', count);\nlogger.info(`order ${order.id} paid`);\nconsole.error('sign-up failed', error);" }), facts()), 'pass');
  });
  test('the words inside a message never count, only the values', () => {
    assert.equal(loggedValues("'password reset email sent', id"), "'', id");
    assert.equal(loggedValues('`welcome ${user.email} to ${plan}`').includes('user.email'), true);
  });
  test('fails when a personal field is logged', () => {
    is(checkLogs(app({ 'lib/a.ts': "console.log('new sign-up', user.email);" }), facts()), 'fail');
    is(checkLogs(app({ 'lib/a.ts': 'logger.info(`reset for ${customer.phoneNumber}`);' }), facts()), 'fail');
    is(checkLogs(app({ 'app/a.php': "<?php Log::info('created', ['email' => $user->email]);" }), facts()), 'fail');
    is(checkLogs(app({ 'app/a.py': 'print(patient.date_of_birth)' }), facts()), 'fail');
  });
  test('needs review when a whole record is logged', () => {
    is(checkLogs(app({ 'lib/a.ts': "console.log('body', req.body);" }), facts()), 'needs-review');
    is(checkLogs(app({ 'lib/a.ts': "console.log('created', user);" }), facts()), 'needs-review');
    is(checkLogs(app({ 'lib/a.ts': "console.log('created', user.id);" }), facts()), 'pass');
  });
});

describe('no-unneeded-identity-data', () => {
  test('not applicable without personal data', () => is(checkIdentityData(app({ 'db/1.sql': 'create table p (date_of_birth date);' }), facts({ personal_data: false })), 'not-applicable'));
  test('passes when only the result of the age check is stored', () => is(checkIdentityData(app({ 'db/1.sql': "create table profiles (id uuid primary key, age_status text not null, age_band text);" }), facts()), 'pass'));
  test('fails for a stored date of birth or identity document', () => {
    is(checkIdentityData(app({ 'db/1.sql': 'create table profiles (id uuid primary key, date_of_birth date);' }), facts()), 'fail');
    is(checkIdentityData(app({ 'prisma/schema.prisma': 'model User {\n  id String @id\n  passportNumber String?\n}' }), facts()), 'fail');
    is(checkIdentityData(app({ 'app/models/user.py': 'class User(Base):\n    id_scan_url = Column(String)' }), facts()), 'fail');
  });
  test('needs review for a year of birth or an age', () => is(checkIdentityData(app({ 'db/1.sql': 'create table profiles (id uuid primary key, birth_year int);' }), facts()), 'needs-review'));
  test('a form field that is read and dropped is not a stored field', () => is(checkIdentityData(app({ 'app/signup/page.tsx': '<input name="date_of_birth" type="date" />', 'db/1.sql': 'create table profiles (id uuid primary key, age_status text);' }), facts()), 'pass'));
});
