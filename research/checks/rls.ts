// Check: Row Level Security on every table (launch trap 5; launch gate 13.C1; threat T-01; Day-0 triage T2;
// casebook F-01 to F-03).
//
// It reads every SQL file in the app (migrations, policy files, declarative schemas) in path order, and every
// Prisma schema, and builds up which tables exist in the `public` schema, which have RLS switched on and which
// policies they carry. Then, per table:
//   - RLS never enabled, or disabled again later            -> fail
//   - a policy that trusts user_metadata (users can edit it) -> fail (5.4)
//   - a policy that is always true for reads, updates or deletes, or a view in `public` that doesn't run with the
//     caller's rights (so it skips RLS)                     -> needs review: it may be meant for public data
//   - otherwise                                             -> pass
// RLS on with no policy at all is a pass: it denies everyone but the service role, the safe default the framework
// itself uses for server-only tables (5.4). An always-true policy for inserts only (a public sign-up form) is also a
// pass, with a note.
//
// What it can't see: whether a policy is *correct* for the app's tenants and roles (that needs the isolation tests in
// 5.4, run against a database), tables made in a dashboard rather than in code, and databases without RLS. Those
// come back as needs review, never as a pass.
import { type App, type CheckResult, type Evidence, hasDep, lineText, result } from './lib.ts';

type Stmt = { text: string; file: string; line: number };

// Splits SQL into statements, ignoring semicolons inside quotes, dollar-quoted bodies and comments, and drops the
// comments. Each statement keeps the file and line it starts on.
export function splitSql(sql: string, file: string): Stmt[] {
  const out: Stmt[] = [];
  let current = '';
  let startLine = 0;
  let line = 1;
  let i = 0;
  const push = (): void => {
    const text = current.replace(/\s+/g, ' ').trim();
    if (text) out.push({ text, file, line: startLine || line });
    current = '';
    startLine = 0;
  };
  const take = (s: string): void => {
    if (!startLine && s.trim()) startLine = line;
    current += s;
    line += (s.match(/\n/g) ?? []).length;
  };
  while (i < sql.length) {
    const rest = sql.slice(i);
    if (rest.startsWith('--')) {
      const end = sql.indexOf('\n', i);
      i = end < 0 ? sql.length : end;
      continue;
    }
    if (rest.startsWith('/*')) {
      const end = sql.indexOf('*/', i + 2);
      const stop = end < 0 ? sql.length : end + 2;
      line += (sql.slice(i, stop).match(/\n/g) ?? []).length;
      current += ' ';
      i = stop;
      continue;
    }
    const dollar = /^\$([A-Za-z_]\w*)?\$/.exec(rest);
    if (dollar) {
      const end = sql.indexOf(dollar[0], i + dollar[0].length);
      const stop = end < 0 ? sql.length : end + dollar[0].length;
      take(sql.slice(i, stop));
      i = stop;
      continue;
    }
    const ch = sql[i];
    if (ch === "'" || ch === '"') {
      let j = i + 1;
      while (j < sql.length) {
        if (sql[j] === ch && sql[j + 1] === ch) j += 2;
        else if (sql[j] === ch) break;
        else j++;
      }
      take(sql.slice(i, j + 1));
      i = j + 1;
      continue;
    }
    if (ch === ';') {
      push();
      i++;
      continue;
    }
    take(ch);
    i++;
  }
  push();
  return out;
}

// Identifiers: quoted ones keep their case, unquoted ones fold to lower case, as in Postgres.
const IDENT = String.raw`(?:"(?:[^"]|"")+"|[A-Za-z_][\w$]*)`;
const NAME = String.raw`${IDENT}(?:\s*\.\s*${IDENT})?`;
const ident = (s: string): string => (s.startsWith('"') ? s.slice(1, -1).replace(/""/g, '"') : s.toLowerCase());
// "schema.table" -> { schema, table }; unqualified names live in public (Supabase's default search path).
export function qualify(raw: string): { schema: string; table: string; key: string } {
  const parts = raw.match(new RegExp(IDENT, 'g')) ?? [raw];
  const schema = parts.length > 1 ? ident(parts[0]) : 'public';
  const table = ident(parts[parts.length - 1]);
  return { schema, table, key: `${schema}.${table}` };
}

// The text inside the parentheses that follow `keyword`, balancing nested parentheses.
function clause(text: string, keyword: RegExp): string | undefined {
  const m = keyword.exec(text);
  if (!m) return undefined;
  let i = text.indexOf('(', m.index + m[0].length - 1);
  if (i < 0) return undefined;
  const start = i + 1;
  let depth = 1;
  for (i = start; i < text.length && depth; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') depth--;
  }
  return text.slice(start, i - 1).trim();
}

export type Policy = { name: string; command: string; roles: string; using?: string; check?: string; file: string; line: number };
export type Table = {
  key: string;
  schema: string;
  table: string;
  from: Evidence; // where it was created
  rls: boolean;
  rlsAt?: Evidence; // where RLS was last switched on or off
  policies: Policy[];
  granted: boolean; // an explicit grant to anon or authenticated was seen
  view?: { securityInvoker: boolean; materialized: boolean };
};

const isTrue = (expr?: string): boolean => expr !== undefined && /^\(*\s*(true|1\s*=\s*1)\s*\)*$/i.test(expr);

// Builds the table model from SQL statements, in order.
export function readSchema(statements: Stmt[]): Map<string, Table> {
  const tables = new Map<string, Table>();
  const at = (s: Stmt): Evidence => ({ file: s.file, line: s.line, text: s.text.length > 160 ? `${s.text.slice(0, 157)}...` : s.text });
  for (const s of statements) {
    const t = s.text;
    let m: RegExpExecArray | null;
    if ((m = new RegExp(String.raw`^create\s+(?:(global|local)\s+)?(?:(temp|temporary|unlogged)\s+)?table\s+(?:if\s+not\s+exists\s+)?(${NAME})`, 'i').exec(t))) {
      if (/^temp/i.test(m[2] ?? '')) continue;
      const q = qualify(m[3]);
      if (!tables.has(q.key)) tables.set(q.key, { ...q, from: at(s), rls: false, policies: [], granted: false });
    } else if ((m = new RegExp(String.raw`^create\s+(?:or\s+replace\s+)?(?:(?:temp|temporary)\s+)?(?:recursive\s+)?(materialized\s+)?view\s+(?:if\s+not\s+exists\s+)?(${NAME})([\s\S]*?)\bas\b`, 'i').exec(t))) {
      const q = qualify(m[2]);
      const invoker = /security_invoker\s*(?:=\s*(?:true|on|1|yes|'true'|'on'))?\s*[,)]/i.test(m[3]);
      tables.set(q.key, { ...q, from: at(s), rls: false, policies: [], granted: false, view: { securityInvoker: invoker, materialized: Boolean(m[1]) } });
    } else if ((m = new RegExp(String.raw`^alter\s+view\s+(?:if\s+exists\s+)?(${NAME})\s+set\s*\(([^)]*)\)`, 'i').exec(t))) {
      const view = tables.get(qualify(m[1]).key)?.view;
      if (view && /security_invoker\s*(=\s*(true|on|1|yes))?\s*$/i.test(m[2].trim())) view.securityInvoker = true;
    } else if ((m = new RegExp(String.raw`^alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(${NAME})\s+(enable|disable)\s+row\s+level\s+security`, 'i').exec(t))) {
      const table = tables.get(qualify(m[1]).key);
      if (table) {
        table.rls = m[2].toLowerCase() === 'enable';
        table.rlsAt = at(s);
      }
    } else if ((m = new RegExp(String.raw`^alter\s+table\s+(?:if\s+exists\s+)?(?:only\s+)?(${NAME})\s+rename\s+to\s+(${IDENT})`, 'i').exec(t))) {
      const old = qualify(m[1]);
      const table = tables.get(old.key);
      if (table) {
        tables.delete(old.key);
        table.table = ident(m[2]);
        table.key = `${table.schema}.${table.table}`;
        tables.set(table.key, table);
      }
    } else if ((m = /^drop\s+(?:table|view|materialized\s+view)\s+(?:if\s+exists\s+)?(.+?)(?:\s+(?:cascade|restrict))?$/i.exec(t))) {
      for (const name of m[1].split(',')) tables.delete(qualify(name.trim()).key);
    } else if ((m = new RegExp(String.raw`^create\s+policy\s+(${IDENT})\s+on\s+(${NAME})([\s\S]*)$`, 'i').exec(t))) {
      const table = tables.get(qualify(m[2]).key);
      if (!table) continue;
      const rest = m[3];
      // FOR and TO come before USING and WITH CHECK, so look for them only there.
      const head = rest.split(/\busing\s*\(|\bwith\s+check\s*\(/i)[0];
      table.policies.push({
        name: ident(m[1]),
        command: (/\bfor\s+(all|select|insert|update|delete)\b/i.exec(head)?.[1] ?? 'all').toLowerCase(),
        roles: (/\bto\s+(.+?)\s*$/i.exec(head)?.[1] ?? 'public').toLowerCase(),
        using: clause(rest, /\busing\s*\(/i),
        check: clause(rest, /\bwith\s+check\s*\(/i),
        file: s.file,
        line: s.line,
      });
    } else if ((m = new RegExp(String.raw`^drop\s+policy\s+(?:if\s+exists\s+)?(${IDENT})\s+on\s+(${NAME})`, 'i').exec(t))) {
      const table = tables.get(qualify(m[2]).key);
      if (table) table.policies = table.policies.filter((p) => p.name !== ident(m![1]));
    } else if ((m = new RegExp(String.raw`^grant\s+[\w\s,]+?\s+on\s+all\s+tables\s+in\s+schema\s+(${IDENT})\s+to\s+(.+)$`, 'i').exec(t))) {
      if (!/\b(anon|authenticated|public)\b/i.test(m[2])) continue;
      for (const table of tables.values()) if (table.schema === ident(m[1])) table.granted = true;
    } else if ((m = new RegExp(String.raw`^grant\s+[\w\s,]+?\s+on\s+(?:table\s+)?(${NAME}(?:\s*,\s*${NAME})*)\s+to\s+(.+)$`, 'i').exec(t))) {
      if (!/\b(anon|authenticated|public)\b/i.test(m[2])) continue;
      for (const name of m[1].split(',')) {
        const table = tables.get(qualify(name.trim()).key);
        if (table) table.granted = true;
      }
    }
  }
  return tables;
}

// Prisma models become tables named after the model, or its @@map, in its @@schema or public.
export function prismaTables(schema: string, file: string): { tables: Map<string, Table>; provider?: string } {
  const tables = new Map<string, Table>();
  const provider = /datasource\s+\w+\s*\{[^}]*provider\s*=\s*"(\w+)"/.exec(schema)?.[1];
  const re = /^[ \t]*model\s+(\w+)\s*\{([\s\S]*?)^[ \t]*\}/gm;
  for (let m = re.exec(schema); m; m = re.exec(schema)) {
    const table = /@@map\(\s*(?:name\s*:\s*)?"([^"]+)"/.exec(m[2])?.[1] ?? m[1];
    const s = /@@schema\(\s*"([^"]+)"/.exec(m[2])?.[1] ?? 'public';
    const line = schema.slice(0, m.index).split('\n').length;
    tables.set(`${s}.${table}`, { key: `${s}.${table}`, schema: s, table, from: { file, line, text: lineText(schema, line) }, rls: false, policies: [], granted: false });
  }
  return { tables, provider };
}

export function checkRls(app: App): CheckResult {
  const sqlFiles = app.files.filter((f) => f.kind === 'sql').sort((a, b) => a.path.localeCompare(b.path));
  const statements = sqlFiles.flatMap((f) => splitSql(f.text, f.path));
  const prisma = app.files.filter((f) => f.kind === 'prisma').map((f) => prismaTables(f.text, f.path));
  const prismaPostgres = prisma.filter((p) => !p.provider || /^postgres/.test(p.provider));
  const prismaOther = prisma.filter((p) => p.provider && !/^postgres/.test(p.provider));

  // Each Prisma model counts as a CREATE TABLE that runs before any SQL file, so a policy file can switch RLS on for
  // it (the framework's own pattern: Prisma makes the tables, supabase/policies/*.sql secures them, 5.3-5.4).
  const fromPrisma: Stmt[] = prismaPostgres.flatMap((p) =>
    [...p.tables.values()].map((t) => ({ text: `create table "${t.schema}"."${t.table.replace(/"/g, '""')}" ()`, file: t.from.file!, line: t.from.line! })),
  );
  const tables = readSchema([...fromPrisma, ...statements]);

  const exposed = [...tables.values()].filter((t) => t.schema === 'public');
  const elsewhere = [...tables.values()].filter((t) => t.schema !== 'public' && t.schema !== 'private');

  if (!exposed.length) {
    const supabase = hasDep(app, /^@supabase\//) || app.dirs.has('supabase') || app.files.some((f) => /SUPABASE_URL/.test(f.text));
    const laravel = hasDep(app, 'laravel/framework');
    const noRlsDb = prismaOther.length > 0 || laravel || hasDep(app, 'mysql', 'mysql2', 'better-sqlite3', 'sqlite3', '@libsql/client');
    if (noRlsDb)
      return result('needs-review', 'The database has no row-level security (MySQL, MariaDB or SQLite, or Laravel migrations), so a static check cannot verify access control. Review that every query is scoped by user and tenant, with a policy per action, and that isolation tests exist (5.4).', [
        ...(laravel ? [{ note: 'Laravel detected (composer.json requires laravel/framework)' }] : []),
        ...prismaOther.map((p) => ({ note: `Prisma provider ${p.provider}` })),
      ], 1);
    if (supabase || hasDep(app, 'pg', 'postgres', 'drizzle-orm', '@neondatabase/serverless'))
      return result('needs-review', 'The app uses Postgres or Supabase, but no table definitions were found in the code (they may have been made in a dashboard or with an ORM this check does not read), so their RLS cannot be checked.', [], 1);
    return result('not-applicable', 'No database tables found, and no database client in the dependencies.', elsewhere.map((t) => ({ ...t.from, note: `table in schema ${t.schema}` })));
  }

  const failures: Evidence[] = [];
  const reviews: Evidence[] = [];
  const notes: Evidence[] = [];
  for (const t of exposed) {
    const name = `public.${t.table}`;
    if (t.view) {
      if (t.view.materialized) reviews.push({ ...t.from, note: `${name} is a materialized view in public: it can't have RLS, so anyone the Data API lets in can read all of it` });
      else if (!t.view.securityInvoker) reviews.push({ ...t.from, note: `${name} is a view without security_invoker, so it runs with its owner's rights and skips the RLS of the tables it reads` });
      continue;
    }
    if (!t.rls) {
      const where = t.rlsAt ? `RLS was switched off again (${t.rlsAt.file}:${t.rlsAt.line})` : 'RLS is never enabled';
      failures.push({ ...t.from, note: `${name}: ${where}${t.granted ? '; it is also granted to anon or authenticated' : ''}` });
      continue;
    }
    for (const p of t.policies) {
      const where = { file: p.file, line: p.line };
      if (/user_metadata|raw_user_meta_data/i.test(`${p.using ?? ''} ${p.check ?? ''}`)) failures.push({ ...where, note: `${name}: policy "${p.name}" trusts user_metadata, which users can edit (5.4)` });
      else if (['select', 'update', 'delete', 'all'].includes(p.command) && isTrue(p.using)) reviews.push({ ...where, note: `${name}: policy "${p.name}" lets ${p.roles} ${p.command === 'all' ? 'do anything to' : p.command} every row (using true). Fine for public data, a leak for anything else.` });
      else if (['update', 'all'].includes(p.command) && isTrue(p.check)) reviews.push({ ...where, note: `${name}: policy "${p.name}" accepts any new row on ${p.command} (with check true)` });
      else if (p.command === 'insert' && isTrue(p.check)) notes.push({ ...where, note: `${name}: anyone in ${p.roles} may insert (with check true); reads stay closed` });
    }
    if (!t.policies.length) notes.push({ ...t.from, note: `${name}: RLS on, no policies, so only the service role can reach it (the safe default, 5.4)` });
  }
  const counted = `${exposed.length} table${exposed.length === 1 ? '' : 's'} and view${exposed.length === 1 ? '' : 's'} in public, from ${sqlFiles.length} SQL file${sqlFiles.length === 1 ? '' : 's'} and ${prisma.length} Prisma schema${prisma.length === 1 ? '' : 's'}`;
  if (failures.length) return result('fail', `${failures.length} problem${failures.length === 1 ? '' : 's'} with row-level security across ${counted}.`, [...failures, ...reviews, ...notes], failures.length);
  if (reviews.length) return result('needs-review', `RLS is on for every table (${counted}), but ${reviews.length} polic${reviews.length === 1 ? 'y or view needs' : 'ies or views need'} a person to judge.`, [...reviews, ...notes], reviews.length);
  return result('pass', `RLS is on for every table (${counted}), and no policy is always true for reads or writes.`, notes);
}
