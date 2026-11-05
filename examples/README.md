# Tested examples

The framework's code samples, run in CI, so the code you copy from the framework is code that works ([issue #1](https://github.com/bewithkhan/bansat/issues/1), point 2).

The framework is the source. `scripts/check-examples.ts` copies each sample out of `framework/*.md`, and CI fails if a file here differs from the sample printed in the framework.

| File | Framework | How it's tested |
|---|---|---|
| `prisma/schema.prisma` | 5.3 | Prisma generates the tables from it, in a real Postgres |
| `prisma.config.ts` | 5.3 | Type-checked; Prisma loads it for every command |
| `supabase/policies/001_rls.sql` | 5.4 | Applied to those tables, then 13 access checks: reads, writes, roles, tenant isolation, anonymous access |
| `tests/rls/tenant_isolation.sql` | 5.4 | Must fail with a row-level security error |
| `tests/rls/tables_without_rls.sql` | 14.2 | Must find nothing after the policies, and must find a table that has no RLS |
| `lib/privacy/consent.ts` | 9.8 | Type-checked, then run in Chromium: a vendor script loads only after "Accept all", and each choice is logged |
| `tests/privacy/no-third-party-before-consent.spec.ts` | 9.9 | Passes on clean pages, and must fail on a page that loads a third-party font before consent |
| `lib/ui/view-state.tsx` | 10.7 | Type-checked strictly; an unhandled state fails the build |

## Run it

You need Node.js 22.18 or later.

```bash
cd examples
npm ci
npx playwright install chromium
npm test
```

`npm test` runs the type-check, the RLS tests and the privacy tests. The RLS tests use `DATABASE_URL` if it's set, and otherwise start a temporary Postgres with `embedded-postgres`. Either way, they create a throwaway database and drop it afterwards. Never point `DATABASE_URL` at production.

To run one part: `npm run typecheck`, `npm run test:rls`, `npm run test:privacy` or `npm run test:privacy:leak`.

## Change a sample

1. Edit the code block in `framework/*.md`.
2. Run `node scripts/build-framework.ts` and `node scripts/check-examples.ts --write` from the repo root.
3. Run `npm test` here, and commit everything together.

## What this does and doesn't prove

- The RLS tests stub Supabase's `anon` and `authenticated` roles and `auth.uid()`, so the policies run unchanged, but they don't start a full Supabase stack.
- `view-state.tsx` uses components that each app provides. `types/framework-stubs.d.ts` declares them so the sample type-checks exactly as printed.
- The fixture pages in `fixtures/site/` stand in for your app. To check your own site, run the privacy test with `baseURL` set to your staging or live URL and `ALLOWED_HOSTS` set to your domains (14.2, T4).
- Versions are pinned: Prisma 7.10.1 (npm's `latest` tag now points to a Prisma 8 release candidate, which the samples haven't been tested with), Playwright 1.63.0 and TypeScript 7.0.2. CI uses Postgres 17.
