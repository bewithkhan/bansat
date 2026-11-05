// Runs the framework's access-isolation tests (BLUEPRINT 5.4) against a real Postgres:
//   1. creates a throwaway database, with Supabase's roles and auth.uid() stubbed;
//   2. creates the tables from prisma/schema.prisma (prisma migrate diff), then applies
//      supabase/policies/001_rls.sql;
//   3. seeds two organisations and checks what each user can read and write.
//
// Uses DATABASE_URL if it's set (CI uses a Postgres service container). Otherwise it starts a
// temporary local Postgres with embedded-postgres. Never point DATABASE_URL at production.
import { spawnSync } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { createServer } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const read = (path) => readFileSync(here(path), 'utf8');

const A = '00000000-0000-0000-0000-00000000000a'; // MEMBER of org A
const B = '00000000-0000-0000-0000-00000000000b'; // OWNER of org B
const C = '00000000-0000-0000-0000-00000000000c'; // OWNER of org A
const ORG_A = '00000000-0000-0000-0000-0000000000a0';
const ORG_B = '00000000-0000-0000-0000-0000000000b0';

let passed = 0;
let failed = 0;
function check(name, ok, detail = '') {
  if (ok) passed++;
  else failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok || !detail ? '' : `  (${detail})`}`);
}

const freePort = () =>
  new Promise((resolvePort, reject) => {
    const server = createServer();
    server.unref();
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const { port } = server.address();
      server.close(() => resolvePort(port));
    });
  });

// --- 1. A throwaway database ---
let adminUrl = process.env.DATABASE_URL;
let embedded;
let embeddedDir;
if (!adminUrl) {
  const { default: EmbeddedPostgres } = await import('embedded-postgres');
  const port = await freePort();
  embeddedDir = mkdtempSync(join(tmpdir(), 'bansat-pg-'));
  embedded = new EmbeddedPostgres({
    databaseDir: embeddedDir,
    user: 'postgres',
    password: 'postgres',
    port,
    persistent: false,
    createPostgresUser: process.getuid?.() === 0, // Postgres refuses to run as root
    onLog: () => {},
  });
  await embedded.initialise();
  await embedded.start();
  adminUrl = `postgresql://postgres:postgres@127.0.0.1:${port}/postgres`;
  console.log(`Started a temporary Postgres on port ${port}`);
}

const dbName = `bansat_rls_${randomBytes(4).toString('hex')}`;
const testUrl = new URL(adminUrl);
testUrl.pathname = `/${dbName}`;
const admin = new pg.Client({ connectionString: adminUrl });
await admin.connect();
await admin.query(`create database ${dbName}`);
const db = new pg.Client({ connectionString: testUrl.toString() });

try {
  await db.connect();

  // Supabase's API roles and auth.uid(), so the policies run unchanged.
  await db.query(`
    do $$ begin
      if not exists (select from pg_roles where rolname = 'anon') then create role anon nologin; end if;
      if not exists (select from pg_roles where rolname = 'authenticated') then create role authenticated nologin; end if;
      if not exists (select from pg_roles where rolname = 'service_role') then create role service_role nologin bypassrls; end if;
    end $$;
    create schema if not exists auth;
    create or replace function auth.uid() returns uuid language sql stable as $$
      select nullif(coalesce(current_setting('request.jwt.claim.sub', true),
             (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')), '')::uuid $$;
    grant usage on schema auth to anon, authenticated;`);

  // --- 2. Tables from the Prisma schema, then the policies ---
  const prisma = spawnSync(
    process.execPath,
    [here('../../node_modules/prisma/build/index.js'), 'migrate', 'diff', '--from-empty', '--to-schema', 'prisma/schema.prisma', '--script'],
    {
      cwd: here('../..'),
      env: { ...process.env, DIRECT_URL: testUrl.toString(), PRISMA_HIDE_UPDATE_MESSAGE: '1' },
      encoding: 'utf8',
    },
  );
  if (prisma.status !== 0) throw new Error(`prisma migrate diff failed:\n${prisma.stderr}`);
  await db.query(prisma.stdout);
  check('the Prisma schema creates its tables', true);

  // Supabase grants table privileges to its API roles; RLS is what limits them.
  await db.query(`grant usage on schema public to anon, authenticated;
                  grant select, insert, update, delete on all tables in schema public to anon, authenticated;`);
  await db.query(read('../../supabase/policies/001_rls.sql'));
  check('the RLS policies apply cleanly', true);

  // Seed as the table owner, which bypasses RLS.
  await db.query(`
    insert into profiles (id, email, display_name, updated_at) values
      ('${A}', 'a@example.test', 'User A', now()), ('${B}', 'b@example.test', 'User B', now()), ('${C}', 'c@example.test', 'Owner C', now());
    insert into organizations (id, name, slug, updated_at) values
      ('${ORG_A}', 'Org A', 'org-a', now()), ('${ORG_B}', 'Org B', 'org-b', now());
    insert into memberships (id, user_id, organization_id, role) values
      (gen_random_uuid(), '${A}', '${ORG_A}', 'MEMBER'), (gen_random_uuid(), '${C}', '${ORG_A}', 'OWNER'),
      (gen_random_uuid(), '${B}', '${ORG_B}', 'OWNER');
    insert into tasks (id, organization_id, title, creator_id, updated_at) values
      (gen_random_uuid(), '${ORG_A}', 'A task', '${C}', now()), (gen_random_uuid(), '${ORG_B}', 'B secret task', '${B}', now());
    insert into consent_records (id, profile_id, purpose, granted, notice_version, wording, source)
      values (gen_random_uuid(), '${A}', 'ANALYTICS', true, 'v1', 'Allow analytics', 'COOKIE_BANNER');`);

  // Run one statement as a signed-in user (or anon), then roll back.
  const as = async (uid, sql, params = []) => {
    await db.query('begin');
    try {
      await db.query(`set local role ${uid ? 'authenticated' : 'anon'}`);
      if (uid) await db.query(`select set_config('request.jwt.claims', $1, true)`, [JSON.stringify({ sub: uid, role: 'authenticated' })]);
      const result = await db.query(sql, params);
      return { rows: result.rows, rowCount: result.rowCount };
    } catch (error) {
      return { error: error.message };
    } finally {
      await db.query('rollback');
    }
  };
  const count = (r) => r.rows?.[0]?.n;
  const rlsError = (r) => /row-level security/.test(r.error ?? '');
  const insertTask = `insert into tasks (id, organization_id, title, creator_id, updated_at) values (gen_random_uuid(), $1, 'x', $2, now())`;

  // --- 3. Who can read and write what ---
  let r = await as(A, `select count(*)::int n from tasks where organization_id = $1`, [ORG_B]);
  check("a member can't read another organisation's tasks", count(r) === 0, JSON.stringify(r));
  r = await as(A, `select count(*)::int n from tasks`);
  check('a member reads only their own organisation\'s tasks', count(r) === 1, JSON.stringify(r));
  r = await as(A, insertTask, [ORG_B, A]);
  check("a member can't create a task in another organisation", rlsError(r), r.error ?? 'no error');
  r = await as(A, insertTask, [ORG_A, A]);
  check('a member can create a task in their own organisation as themselves', !r.error && r.rowCount === 1, r.error);
  r = await as(A, insertTask, [ORG_A, C]);
  check("a member can't create a task as someone else", rlsError(r), r.error ?? 'no error');
  r = await as(A, `update tasks set title = 'changed' where organization_id = $1`, [ORG_B]);
  check("a member can't update another organisation's tasks", r.rowCount === 0, JSON.stringify(r));
  r = await as(A, `update tasks set organization_id = $1 where organization_id = $2`, [ORG_B, ORG_A]);
  check("a member can't move a task into another organisation", rlsError(r), r.error ?? JSON.stringify(r));
  r = await as(A, `delete from tasks where organization_id = $1`, [ORG_A]);
  check("a MEMBER can't delete tasks", r.rowCount === 0, JSON.stringify(r));
  r = await as(C, `delete from tasks where organization_id = $1`, [ORG_A]);
  check('an OWNER can delete tasks in their own organisation', r.rowCount === 1, JSON.stringify(r));
  r = await as(A, `select count(*)::int n from profiles`);
  check('a user reads only their own profile', count(r) === 1, JSON.stringify(r));
  r = await as(A, `select count(*)::int n from consent_records`);
  check('server-only tables are invisible to signed-in users', count(r) === 0, JSON.stringify(r));
  r = await as(null, `select count(*)::int n from tasks`);
  check('anonymous visitors see no tasks', count(r) === 0, JSON.stringify(r));
  r = await as(A, `select count(*)::int n from memberships`);
  check("a member sees only their own organisation's memberships", count(r) === 2, JSON.stringify(r));

  // The framework's own SQL files behave as the text says.
  try {
    await db.query(read('./tenant_isolation.sql'));
    check('tests/rls/tenant_isolation.sql rejects the cross-organisation insert', false, 'no error');
  } catch (error) {
    await db.query('rollback').catch(() => {});
    check('tests/rls/tenant_isolation.sql rejects the cross-organisation insert', /row-level security/.test(error.message), error.message);
  }
  const audit = read('./tables_without_rls.sql');
  r = await db.query(audit);
  check('every table has RLS turned on (the Day-0 audit query finds none)', r.rows.length === 0, JSON.stringify(r.rows));
  await db.query('create table public.probe_without_rls (id int)');
  r = await db.query(audit);
  check('the audit query does find a table without RLS', r.rows.some((row) => row.table_without_rls === 'probe_without_rls'), JSON.stringify(r.rows));
} catch (error) {
  console.error(`SETUP ERROR  ${error.message}`);
  failed++;
} finally {
  await db.end().catch(() => {});
  await admin.query(`drop database if exists ${dbName} with (force)`).catch(() => {});
  await admin.end().catch(() => {});
  if (embedded) await embedded.stop().catch(() => {});
  if (embeddedDir) rmSync(embeddedDir, { recursive: true, force: true });
  console.log(`\n${passed} passed, ${failed} failed`);
  process.exitCode = failed ? 1 : 0;
}
