// Check: storage for user uploads is private (launch trap 14; Day-0 T3; threat T-07).
//
// Finds buckets and upload targets the code makes public: Supabase buckets created in SQL, in supabase/config.toml
// or with createBucket/updateBucket, S3 objects written with a public-read ACL, and Laravel's `public` disk.
//   - none found                                            -> not applicable
//   - every bucket private                                  -> pass
//   - a public bucket whose name says it holds people's files (uploads, documents, attachments, avatars of
//     children, health records, ID scans, receipts, exports, recordings ...)           -> fail
//   - any other public bucket or public upload, such as product photos meant to be public -> needs review
import { type App, type CheckResult, type Evidence, code, evidenceOf, result, search } from './lib.ts';

// Word boundaries on the short words, so "profile-pictures" isn't read as "file".
const PRIVATE_CONTENT = /upload|document|\bdocs?\b|\bfiles?\b|attachment|private|personal|user[-_]?(?:content|data)|medical|health|record|kyc|identity|\bids?\b|passport|licen[cs]e|receipt|invoice|statement|export|backup|chat|message|voice|audio|photo[-_]?id|child|pupil|student|patient|homework|submission/i;

type Bucket = { name: string; public: boolean; at: Evidence };

export function findBuckets(app: App): { buckets: Bucket[]; publicUploads: Evidence[] } {
  const buckets: Bucket[] = [];
  const sql = app.files.filter((f) => f.kind === 'sql');
  // insert into storage.buckets (id, name, public) values ('x', 'x', true), ('y', 'y', false)
  for (const m of search(sql, /insert\s+into\s+storage\.buckets\s*\(([^)]*)\)\s*values\s*((?:\([^)]*\)\s*,?\s*)+)/gi)) {
    const cols = m.match[1].split(',').map((c) => c.trim().replace(/"/g, '').toLowerCase());
    for (const row of m.match[2].matchAll(/\(([^)]*)\)/g)) {
      const values = row[1].split(',').map((v) => v.trim().replace(/^'|'$/g, ''));
      const name = values[cols.indexOf('name')] ?? values[cols.indexOf('id')] ?? '?';
      const pub = cols.includes('public') ? /^true$/i.test(values[cols.indexOf('public')]) : false;
      buckets.push({ name, public: pub, at: evidenceOf(m) });
    }
  }
  for (const m of search(sql, /update\s+storage\.buckets\s+set\s+public\s*=\s*true\s+where\s+(?:id|name)\s*=\s*'([^']+)'/gi)) buckets.push({ name: m.match[1], public: true, at: evidenceOf(m) });
  // supabase/config.toml: [storage.buckets.x] public = true
  for (const f of app.files.filter((f) => /(^|\/)supabase\/config\.toml$/.test(f.path))) {
    for (const m of f.code.matchAll(/^\[storage\.buckets\.([\w-]+)\]([\s\S]*?)(?=^\[|$(?![\s\S]))/gm)) {
      const line = f.code.slice(0, m.index).split('\n').length;
      buckets.push({ name: m[1], public: /^\s*public\s*=\s*true/m.test(m[2]), at: { file: f.path, line, text: `[storage.buckets.${m[1]}]` } });
    }
  }
  // supabase.storage.createBucket('x', { public: true }) and updateBucket
  for (const m of search(code(app), /\.(?:createBucket|updateBucket)\s*\(\s*['"`]([^'"`]+)['"`]\s*(?:,\s*\{([^}]*)\})?/g)) buckets.push({ name: m.match[1], public: /public\s*:\s*true/.test(m.match[2] ?? ''), at: evidenceOf(m) });
  // Uploads written somewhere public by other means.
  const publicUploads = [
    ...search(code(app), /ACL\s*:\s*['"]public-read(?:-write)?['"]|['"]x-amz-acl['"]\s*:\s*['"]public-read/g).map((m) => evidenceOf(m, 'an S3 object written with a public-read ACL')),
    ...search(code(app), /->storePublicly(?:As)?\s*\(|->store(?:As)?\s*\([^)]*['"]public['"]\s*\)|Storage::disk\(\s*['"]public['"]\s*\)->put/g).map((m) => evidenceOf(m, "an upload saved to Laravel's public disk")),
  ];
  return { buckets, publicUploads };
}

export function checkStorage(app: App): CheckResult {
  const { buckets, publicUploads } = findBuckets(app);
  if (!buckets.length && !publicUploads.length) return result('not-applicable', 'No storage buckets or file uploads to storage found.');
  const fails = buckets.filter((b) => b.public && PRIVATE_CONTENT.test(b.name)).map((b) => ({ ...b.at, note: `bucket "${b.name}" is public, and its name says it holds people's files` }));
  const reviews = [...buckets.filter((b) => b.public && !PRIVATE_CONTENT.test(b.name)).map((b) => ({ ...b.at, note: `bucket "${b.name}" is public: fine for files meant for everyone, not for private uploads` })), ...publicUploads];
  const ok = buckets.filter((b) => !b.public).map((b) => ({ ...b.at, note: `bucket "${b.name}" is private` }));
  if (fails.length) return result('fail', `${fails.length} public bucket${fails.length === 1 ? '' : 's'} for people's uploads (T-07).`, [...fails, ...reviews, ...ok], fails.length);
  if (reviews.length) return result('needs-review', `${reviews.length} public bucket${reviews.length === 1 ? '' : 's'} or upload${reviews.length === 1 ? '' : 's'}: check that only files meant for everyone go there.`, [...reviews, ...ok], reviews.length);
  return result('pass', `Every bucket (${buckets.length}) is private.`, ok);
}
