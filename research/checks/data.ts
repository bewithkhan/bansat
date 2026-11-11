// Checks: personal data kept out of logs (launch trap 10; framework 7.5), and no stored date of birth or identity
// document that nothing needs (launch trap 17; framework 9.5 DP-03, "store the result, not the evidence").
//
// Both read the code only. They can't see what a running app writes to a log service, or data added outside the
// repository, so a pass means "nothing found in the code", never "the logs are clean".
//
// Logs. Looks at every logging call (console.*, logger.*, log.*, Log::*, logging.*, Rails.logger.*, error_log, print in
// Python, Sentry.captureMessage) and reads its arguments with string literals removed, so the words in a message
// ("email sent") don't count, only the values logged.
//   - the spec has no personal data                                             -> not applicable
//   - an argument names a personal field (email, phone, name, address, password, date of birth ...)   -> fail
//   - an argument is a whole request body, form or user record                  -> needs review
//   - otherwise                                                                 -> pass
//
// Identity data. Looks at SQL, Prisma and model code for stored columns.
//   - the spec has no personal data                                             -> not applicable
//   - a full date of birth, or an identity document (passport, ID scan, national ID number)            -> fail
//   - a year of birth or an age in years                                        -> needs review
//   - otherwise (for example an age band or an over-13 flag)                    -> pass
// None of the six specs has a feature that needs a stored date of birth or identity document. A spec that did would
// need a fact to say so, and this check would have to read it.
import { type App, type CheckResult, type Evidence, type Facts, code, evidenceOf, result, search } from './lib.ts';

const LOG_CALL = /\b(?:console\.(?:log|info|warn|error|debug)|(?:logger|log)\.(?:log|info|warn|warning|error|debug|trace)|Log::(?:info|debug|warning|error|notice)|logging\.(?:info|debug|warning|error)|Rails\.logger\.\w+|error_log|Sentry\.captureMessage)\s*\(([^\n]*)/g;
const PY_PRINT = /^\s*print\s*\(([^\n]*)/gm;
const PERSONAL_FIELD = /e-?mail|passw|phone|mobile|\bdob\b|birth|post_?code|zip_?code|\bssn\b|national_?id|passport|card_?num|first_?name|last_?name|sur_?name|full_?name|street|ip_?addr/i;
const WHOLE_RECORD = /\b(?:req|request)\.body\b|\bformData\b|\b\$request->all\(\)|\b(?:user|profile|customer|patient|member|account|payload|body)\b(?![\w.([-]|\s*=>)/;

// The values a call logs: template interpolations and bare expressions, with the text of string literals removed.
export const loggedValues = (args: string): string =>
  args
    .replace(/`(?:\\.|[^`\\])*`/g, (t) => [...t.matchAll(/\$\{([^}]*)\}/g)].map((m) => m[1]).join(' , '))
    .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, "''");

export function checkLogs(app: App, facts: Facts): CheckResult {
  if (!facts.personal_data) return result('not-applicable', 'The spec has no personal data.');
  const calls = [...search(code(app), LOG_CALL), ...search(code(app).filter((f) => f.path.endsWith('.py')), PY_PRINT)];
  const fails: Evidence[] = [];
  const reviews: Evidence[] = [];
  for (const m of calls) {
    const values = loggedValues(m.match[1]);
    const field = values.match(PERSONAL_FIELD);
    if (field) fails.push(evidenceOf(m, `logs a personal field (${field[0]})`));
    else if (WHOLE_RECORD.test(values)) reviews.push(evidenceOf(m, 'logs a whole request, form or user record: check what it holds'));
  }
  if (fails.length) return result('fail', `${fails.length} logging call${fails.length === 1 ? '' : 's'} write${fails.length === 1 ? 's' : ''} personal data to the logs (7.5).`, [...fails, ...reviews], fails.length);
  if (reviews.length) return result('needs-review', `${reviews.length} logging call${reviews.length === 1 ? '' : 's'} may write personal data: a whole record is logged.`, reviews, reviews.length);
  return result('pass', `No personal data in ${calls.length} logging call${calls.length === 1 ? '' : 's'}.`);
}

const DOB = /\b(?:date_?of_?birth|birth_?date|birthday|dob|dateOfBirth|birthDate)\b/g;
const ID_DOC = /\b(?:passport(?:_?(?:number|no|scan|photo|image|url))?|id_?(?:scan|document|photo|card)(?:_?url)?|national_?id(?:_?number)?|driving_?licen[cs]e(?:_?number)?|ssn|nin|idDocument|passportNumber|nationalId)\b/g;
const AGE = /\b(?:birth_?year|year_?of_?birth|birthYear|yearOfBirth)\b|\bage\s+(?:int|integer|smallint|numeric|Int)\b/g;

export function checkIdentityData(app: App, facts: Facts): CheckResult {
  if (!facts.personal_data) return result('not-applicable', 'The spec has no personal data.');
  // Stored fields only: database schemas and model definitions, not forms or handlers that read a value and drop it.
  const schema = app.files.filter((f) => f.kind === 'sql' || f.kind === 'prisma' || /(^|\/)(models?|schema|entities|migrations)(\/|\.)/i.test(f.path));
  const fails = [...search(schema, DOB).map((m) => evidenceOf(m, 'a full date of birth is stored: keep the result of the age check, not the date')), ...search(schema, ID_DOC).map((m) => evidenceOf(m, 'an identity document or number is stored, and nothing in the spec needs it'))];
  const reviews = search(schema, AGE).map((m) => evidenceOf(m, 'a year of birth or an age is stored: an age band or a flag would do'));
  if (fails.length) return result('fail', `${fails.length} stored field${fails.length === 1 ? '' : 's'} keep${fails.length === 1 ? 's' : ''} a date of birth or identity document nothing needs (9.5 DP-03).`, [...fails, ...reviews], fails.length);
  if (reviews.length) return result('needs-review', `${reviews.length} stored field${reviews.length === 1 ? '' : 's'} hold${reviews.length === 1 ? 's' : ''} a year of birth or an age.`, reviews, reviews.length);
  return result('pass', 'No stored date of birth or identity document.');
}
