// A small static server for the privacy tests' fixture pages, with no dependencies.
// It also serves the framework's consent loader (lib/privacy/consent.ts) to the browser as
// JavaScript, by stripping its types, so the tests exercise the real code.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { extname, join, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
const SITE = resolve(here('../../fixtures/site'));
const CONSENT_TS = here('../../lib/privacy/consent.ts');
const PORT = Number(process.argv[2] ?? 4173);
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript' };

async function handle(req, res) {
  const { pathname } = new URL(req.url ?? '/', 'http://127.0.0.1');
  if (pathname === '/api/privacy/consent' && req.method === 'POST') {
    req.resume(); // the consent log endpoint: accept and discard
    return res.writeHead(204).end();
  }
  if (pathname === '/lib/privacy/consent.js') {
    const js = stripTypeScriptTypes(await readFile(CONSENT_TS, 'utf8'));
    return res.writeHead(200, { 'content-type': TYPES['.js'] }).end(js);
  }
  const file = resolve(SITE, `.${decodeURIComponent(pathname)}`);
  if (file !== SITE && !file.startsWith(SITE + sep)) return res.writeHead(403).end();
  for (const candidate of pathname.endsWith('/') ? [join(file, 'index.html')] : [file, join(file, 'index.html')]) {
    try {
      const body = await readFile(candidate);
      if (candidate !== file && !pathname.endsWith('/')) return res.writeHead(301, { location: `${pathname}/` }).end();
      return res.writeHead(200, { 'content-type': TYPES[extname(candidate)] ?? 'application/octet-stream' }).end(body);
    } catch {
      // try the next candidate
    }
  }
  res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
}

createServer((req, res) => {
  handle(req, res).catch(() => res.writeHead(500).end());
}).listen(PORT, '127.0.0.1', () => console.log(`Fixture pages on http://127.0.0.1:${PORT}`));
