// Check: secret keys stay out of client code and out of the repo (launch trap 5; launch gate 13.C2; Day-0 T1;
// threat T-02; casebook F-02, F-09, F-12 to F-14).
//
// Three kinds of evidence, any one of which fails the check:
//   1. A secret behind a public prefix. Frameworks copy NEXT_PUBLIC_, VITE_, PUBLIC_, EXPO_PUBLIC_, NUXT_PUBLIC_,
//      REACT_APP_ and GATSBY_ variables into the browser bundle, so a name like NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
//      or VITE_OPENAI_API_KEY ships the key to every visitor. Publishable and anon keys are public by design and
//      pass. A public name that is only ambiguous (…_TOKEN, …_API_KEY with no provider) needs review.
//   2. An LLM SDK told to run in the browser (`dangerouslyAllowBrowser: true`), which only works with the API key
//      in the page.
//   3. A real-looking secret value: a Supabase service-role JWT (its payload is decoded to be sure), a Supabase,
//      Stripe, OpenAI, Anthropic, AWS, GitHub, SendGrid or Slack secret, a private key, or a Laravel APP_KEY. It
//      fails in source files, in built JavaScript, and in an .env file that .gitignore doesn't cover (it would be
//      committed). In .env.example and friends, and in values that look like placeholders, it's ignored. In a
//      git-ignored .env file it's noted, not failed: that's where secrets belong.
import { basename } from 'node:path';
import { type App, type CheckResult, type Evidence, type SourceFile, evidenceOf, isIgnored, result, search } from './lib.ts';

const PUBLIC_PREFIX = String.raw`(?:NEXT_PUBLIC_|VITE_|PUBLIC_|EXPO_PUBLIC_|NUXT_PUBLIC_|REACT_APP_|GATSBY_)`;
const PUBLIC_VAR = new RegExp(String.raw`\b(${PUBLIC_PREFIX}[A-Z0-9_]+)\b`, 'g');
// Keys that are public by design: publishable and anon keys, CAPTCHA site keys, public halves of key pairs, and
// client-side project keys for analytics, maps and Firebase (restricted by domain, not kept secret).
const PUBLIC_BY_DESIGN = /PUBLISHABLE|ANON_KEY|ANON$|SITE_KEY|PUBLIC_KEY|POSTHOG_(PROJECT_)?(API_)?KEY|MIXPANEL_TOKEN|SEGMENT_WRITE_KEY|MAPBOX_(ACCESS_)?TOKEN|ALGOLIA_SEARCH(_ONLY)?(_API)?_KEY|GOOGLE_MAPS_API_KEY|FIREBASE_API_KEY/;
// Settings that are not keys at all.
const NOT_A_KEY = /_URL$|_HOST$|_ID$|_DSN$|_REGION$|_ENV$|_NAME$|_VERSION$|_MODE$|_PATH$/;
const SECRET_NAME =/SERVICE_ROLE|SERVICE_KEY|SECRET|PRIVATE|PASSWORD|PASSWD|DATABASE_URL|DB_URL|AUTH_TOKEN|ACCESS_KEY|WEBHOOK_SIGNING|(OPENAI|ANTHROPIC|CLAUDE|GEMINI|GOOGLE_AI|GOOGLE_GENERATIVE_AI|MISTRAL|GROQ|COHERE|REPLICATE|TOGETHER|RESEND|SENDGRID|POSTMARK|MAILGUN|BREVO|TWILIO|AWS|SUPABASE_SECRET)_?(API_)?KEY/;
const VAGUE_NAME = /TOKEN|API_KEY|_KEY$/;

type Pattern = { name: string; re: RegExp; check?: (value: string) => boolean };
const PATTERNS: Pattern[] = [
  // The local development stack's demo key (issuer "supabase-demo") is published by Supabase and isn't a secret.
  { name: 'Supabase service-role key (JWT)', re: /eyJ[A-Za-z0-9_-]{8,}\.eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}/g, check: (v) => jwtClaims(v)?.role === 'service_role' && jwtClaims(v)?.iss !== 'supabase-demo' },
  { name: 'Supabase secret key', re: /\bsb_secret_[A-Za-z0-9_-]{16,}/g },
  { name: 'Stripe secret key', re: /\b[sr]k_(?:live|test)_[A-Za-z0-9]{16,}/g },
  { name: 'Stripe webhook secret', re: /\bwhsec_[A-Za-z0-9]{20,}/g },
  { name: 'Anthropic API key', re: /\bsk-ant-[A-Za-z0-9_-]{20,}/g },
  { name: 'OpenAI API key', re: /\bsk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_-]{32,}/g, check: (v) => !v.startsWith('sk-ant-') },
  { name: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/g },
  { name: 'GitHub token', re: /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{40,})/g },
  { name: 'SendGrid key', re: /\bSG\.[A-Za-z0-9_-]{16,}\.[A-Za-z0-9_-]{16,}/g },
  { name: 'Slack token', re: /\bxox[baprs]-[A-Za-z0-9-]{10,}/g },
  { name: 'private key', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |ENCRYPTED )?PRIVATE KEY-----/g },
  { name: 'Laravel APP_KEY', re: /\bAPP_KEY\s*=\s*base64:[A-Za-z0-9+/]{30,}={0,2}/g },
];

// The claims of a JWT, or undefined if it doesn't decode.
export function jwtClaims(token: string): { role?: string; iss?: string } | undefined {
  try {
    return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as { role?: string; iss?: string };
  } catch {
    return undefined;
  }
}

// Values an agent writes when it has no real key: "sk_test_xxxxxxxx", "sk-your-key-here", "…EXAMPLE…".
const placeholder = (v: string): boolean => /x{6,}|0{8,}|your|example|placeholder|changeme|dummy|fake|replace|\.\.\.|<|\*{3,}/i.test(v);
const isExampleEnv = (f: SourceFile): boolean => /^\.env(\.[\w-]+)*\.(example|sample|template|dist|defaults)$/i.test(basename(f.path));

export function checkSecrets(app: App): CheckResult {
  const fails: Evidence[] = [];
  const reviews: Evidence[] = [];
  const notes: Evidence[] = [];
  const scanned = app.files.filter((f) => f.kind !== 'doc');

  // 1. Secret-looking names behind a public prefix, in code, config and every .env file (examples included: a
  //    variable named there is the one the app reads). One finding per variable, wherever it appears.
  const seen = new Set<string>();
  for (const m of search(scanned, PUBLIC_VAR)) {
    const name = m.match[1];
    const rest = name.replace(new RegExp(`^${PUBLIC_PREFIX}`), '');
    if (seen.has(name) || PUBLIC_BY_DESIGN.test(rest)) continue;
    seen.add(name);
    // A secret word wins over a harmless suffix, so NEXT_PUBLIC_DATABASE_URL still fails.
    if (SECRET_NAME.test(rest)) fails.push(evidenceOf(m, `${name} is copied into the browser bundle, and its name says it's a secret`));
    else if (!NOT_A_KEY.test(rest) && VAGUE_NAME.test(rest)) reviews.push(evidenceOf(m, `${name} is copied into the browser bundle; check it's meant to be public`));
  }

  // 2. LLM SDKs switched to browser mode.
  for (const m of search(scanned.filter((f) => f.kind === 'code'), /dangerouslyAllowBrowser\s*:\s*true/g)) fails.push(evidenceOf(m, 'an LLM SDK runs in the browser, so its API key is in the page'));

  // 3. Secret values.
  for (const p of PATTERNS) {
    for (const m of search([...scanned, ...app.bundle], p.re)) {
      const value = m.match[0];
      if (p.check && !p.check(value)) continue;
      if (placeholder(value)) continue;
      const f = m.file;
      if (f.kind === 'env') {
        if (isExampleEnv(f)) continue;
        if (isIgnored(app, f.path)) notes.push({ file: f.path, line: m.line, note: `${p.name} in ${f.path}, which .gitignore covers (value not shown)` });
        else fails.push({ file: f.path, line: m.line, note: `${p.name} in ${f.path}, which .gitignore doesn't cover, so it would be committed (value not shown)` });
      } else if (app.bundle.includes(f)) fails.push({ file: f.path, line: m.line, note: `${p.name} in built browser code (value not shown)` });
      else fails.push({ file: f.path, line: m.line, note: `${p.name} written into the source (value not shown)` });
    }
  }

  const scope = `${scanned.length} source and config files and ${app.bundle.length} built files`;
  if (fails.length) return result('fail', `${fails.length} secret${fails.length === 1 ? '' : 's'} exposed to the browser or the repo (searched ${scope}).`, [...fails, ...reviews, ...notes], fails.length);
  if (reviews.length) return result('needs-review', `No secret found, but ${reviews.length} public variable${reviews.length === 1 ? ' has' : 's have'} a name that could be one (searched ${scope}).`, [...reviews, ...notes], reviews.length);
  return result('pass', `No secret found in client code, built files or committed .env files (searched ${scope}).`, notes);
}
