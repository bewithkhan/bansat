# Firebase

> **Group:** No-code and BaaS · **Covers:** Firebase JS SDK 13 (13.2), Admin SDK 14, `firebase-functions` 7, Firebase CLI 15, Cloud Firestore (Standard and Enterprise editions, Native mode), Cloud Storage and Firebase Authentication · **Checked:** 2026-11-05 against the official docs

Firebase replaces Supabase: Security Rules are your RLS (D3), and Cloud Functions hold privileged code. Read this with
your client's profile. New since 2025: Dynamic Links are gone, Data Connect is now **SQL Connect**, v7 removed
`functions.config()`, Extensions end in March 2027 and Test Lab in September 2027 ([Test Lab](https://firebase.google.com/docs/test-lab)),
Firebase 12 is the last Apple SDK on CocoaPods ([setup](https://firebase.google.com/docs/ios/setup)), and a compromised CA hit client SDKs in October 2026 (Deployment).

## Access and the isolation test

- **Rules are your RLS.** Every client-SDK request is checked against `firestore.rules`, `storage.rules` or
  `database.rules.json`, and one denied document fails the whole request
  ([rules](https://firebase.google.com/docs/firestore/security/get-started)). Create every database and bucket in
  **locked mode**. Never deploy **test mode**, which lets anyone in
  ([insecure rules](https://firebase.google.com/docs/rules/insecure-rules)). Start each file with `rules_version = '2';`.
- **Deny by default.** No `match /{document=**}` allow, and no bare `if request.auth != null`, which admits any
  signed-in user (same page). Match on ownership or membership, and split `write` into `create`, `update` and `delete`
  so that each cell of the 7.2 matrix maps to a rule. Validate every write: `request.resource.data.keys().hasOnly([..])`,
  types, lengths, and fields that must not change (`request.resource.data.orgId == resource.data.orgId`).
- **Never authorise on a field the user can write**, which is 5.4's `user_metadata` rule. Roles come from custom claims
  that the Admin SDK sets, or from membership documents that only functions can write. Claims reach the client only at
  sign-in, at token refresh or on `getIdToken(true)`
  ([claims](https://firebase.google.com/docs/auth/admin/custom-claims)), so revoke tokens when you remove a role.
- **Rules are not filters.** A query that *could* return a denied document fails whole, so every query carries the
  constraint the rule checks, for example `where('orgId', '==', orgId)`
  ([queries](https://firebase.google.com/docs/firestore/security/rules-query)). Realtime Database rules cascade: access
  granted at a parent can't be taken back lower down (insecure rules page).
- **Server code bypasses the rules.** The Admin SDK and the server client libraries use IAM instead (rules page), so
  each function re-checks the caller (7.2). `onCall` gives you a verified `request.auth`
  ([callable](https://firebase.google.com/docs/functions/callable)); an `onRequest` function verifies the ID token itself.
- **Isolation test (5.4)** with `@firebase/rules-unit-testing` 6 (Node 24.12+, `firebase` 13) on the emulator. Pass the
  rules file in: with no rules loaded, the emulator treats the project as open
  ([unit tests](https://firebase.google.com/docs/rules/unit-tests)).

```ts
// test/rules/isolation.test.ts — firebase emulators:exec --only firestore "npx vitest run test/rules"
import { readFileSync } from 'node:fs';
import { test, afterAll } from 'vitest';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
const env = await initializeTestEnvironment({ projectId: 'demo-app', firestore: { rules: readFileSync('firestore.rules', 'utf8') } });
afterAll(() => env.cleanup());
test('user A cannot read or write org B', async () => {
  await env.withSecurityRulesDisabled((c) => setDoc(doc(c.firestore(), 'orgs/B/tasks/t1'), { orgId: 'B', title: 'B only' }));
  const a = env.authenticatedContext('userA', { orgs: ['A'] }).firestore(); // claims, as the Admin SDK would set them
  await assertFails(getDoc(doc(a, 'orgs/B/tasks/t1')));
  await assertFails(setDoc(doc(a, 'orgs/B/tasks/t2'), { orgId: 'B', title: 'x' }));
  await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), 'orgs/B/tasks/t1')));
  await assertSucceeds(getDoc(doc(env.authenticatedContext('userB', { orgs: ['B'] }).firestore(), 'orgs/B/tasks/t1')));
});
```

## Authentication

- **Tokens:** ID tokens last an hour. Refresh tokens last until the user is deleted, disabled or makes a major account
  change, and a client `signOut()` revokes nothing. For 7.1 sign-out, call `revokeRefreshTokens(uid)` on the server,
  and check revocation with `verifyIdToken(token, true)` before sensitive actions
  ([sessions](https://firebase.google.com/docs/auth/admin/manage-sessions)).
- **Web sessions** persist until explicit sign-out by default, in browser storage that page scripts can reach
  ([persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence)), so the 7.4 CSP matters. For server
  rendering, mint an `HttpOnly` session cookie with the Admin SDK (5 minutes to 2 weeks), with the CSRF check its guide
  shows ([session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies)).
- **Enumeration (7.1):** email enumeration protection is on by default only in projects created on or after
  15 September 2023 ([enumeration](https://cloud.google.com/identity-platform/docs/admin/email-enumeration-protection)).
- **Passwords:** the policy's minimum length defaults to 6. Set it to 12 in **Require** mode
  ([policy](https://firebase.google.com/docs/auth/web/password-auth)). It checks length and character classes only, so
  add the breached-password check yourself, or go passwordless.
- **Magic links:** Spark sends 5 sign-in emails a day, Blaze 25,000. Caps such as 100 new accounts per IP address an
  hour are abuse ceilings, not 7.1's per-account throttle ([limits](https://firebase.google.com/docs/auth/limits)). Mobile
  links now use a Hosting domain (`linkDomain`; leave `dynamicLinkDomain` unset) ([email link](https://firebase.google.com/docs/auth/android/email-link-auth)).
- **MFA (SMS or TOTP)** needs Firebase Authentication with Identity Platform and verified emails, and SMS starts with
  every region blocked ([MFA](https://firebase.google.com/docs/auth/web/multi-factor)). Use TOTP for OWNER and ADMIN.
- **Passkeys:** the Auth docs list no built-in provider (checked 2026-11-05). Verify WebAuthn in a function and sign
  the user in with a custom token, or use a maintained integration.

## Secrets

- **The config isn't secret.** Firebase API keys are public by design and only identify the project. Keep them limited
  to Firebase APIs, never add the Generative Language (Gemini) API to one, and never ship a Gemini Developer API key
  ([API keys](https://firebase.google.com/docs/projects/api-keys)).
- **Functions:** `.env` files aren't a secure store. Use `defineSecret()` and `firebase functions:secrets:set NAME`
  (Cloud Secret Manager), bound only to the functions that need them. `functions.config()` is removed in v7, where
  calling it throws ([source](https://github.com/firebase/firebase-functions/blob/v7.4.0/src/v1/config.ts)); on 6.x and
  earlier, new deployments using it fail after March 2027 ([config](https://firebase.google.com/docs/functions/config-env)).
- **CI and agents (12.1):** no service-account key files in repos or on laptops. The CLI recommends Application Default
  Credentials; `FIREBASE_TOKEN` is legacy and less secure ([CLI](https://firebase.google.com/docs/cli)). App Check
  debug tokens are credentials too: never commit or ship one
  ([debug provider](https://firebase.google.com/docs/app-check/web/debug-provider)).

## CSRF and XSS

- **CSRF** matters wherever a cookie authenticates the request. Callable functions carry the ID token with each
  request (callable page). An `onRequest` function that accepts session cookies checks a CSRF token and `Origin` (7.4).
- **XSS:** your client renders Firestore content, so follow its profile. Send the 7.4 CSP and headers from Hosting's
  `firebase.json` ([headers](https://firebase.google.com/docs/hosting/full-config#headers)), and use your own domain as
  `authDomain` for redirect sign-in ([redirect](https://firebase.google.com/docs/auth/web/redirect-best-practices)).
- **Uploads (T-07):** check `request.resource.size` and `request.resource.contentType` in Storage rules
  ([conditions](https://firebase.google.com/docs/storage/security/rules-conditions)). Serve private files with
  `getBytes()` or `getBlob()`, which keep finer-grained control in the rules, rather than handing out download URLs
  ([download](https://firebase.google.com/docs/storage/web/download-files)).
- **Deep links:** Dynamic Links have gone ([FAQ](https://firebase.google.com/support/dynamic-links-faq)). Use App
  Links and Universal Links, and treat every link parameter as untrusted.

## Fonts and assets

- Hosting serves your build from your own domain, so self-host fonts and scripts there (9.9). Bundle the JS SDK from
  npm, not from `www.gstatic.com/firebasejs` ([CDN option](https://firebase.google.com/docs/web/alt-setup)).
- The SDKs call Google APIs such as `firestore.googleapis.com` and `identitytoolkit.googleapis.com` (API keys page).
  They are your backend: allow them in `connect-src` and in the 9.9 test.
- App Check on the web attests with reCAPTCHA Enterprise ([App Check](https://firebase.google.com/docs/app-check)) or the older
  [reCAPTCHA v3](https://firebase.google.com/docs/app-check/web/recaptcha-provider), both Google services: a security tool (9.8), so load it only where it's needed, and disclose it.

## Consent

- **Analytics** logs events as soon as it starts. In apps, set `firebase_analytics_collection_enabled` (manifest) and
  `FIREBASE_ANALYTICS_COLLECTION_ENABLED` (Info.plist) off, and every consent-mode default to denied
  (`google_analytics_default_allow_*`, `GOOGLE_ANALYTICS_DEFAULT_ALLOW_*`). After the choice, call `setConsent` and
  `setAnalyticsCollectionEnabled(true)` ([Android](https://firebase.google.com/docs/analytics/android/configure-data-collection),
  [Apple](https://firebase.google.com/docs/analytics/ios/configure-data-collection), [consent mode](https://developers.google.com/tag-platform/security/guides/app-consent)).
  On the web, call `getAnalytics()`, and the Crashlytics web SDK (preview since JS SDK 13.2.0), only from the 9.7 loader.
- Cloud Messaging, Crashlytics and Performance Monitoring start themselves: switch off auto-initialisation and start
  them after the choice ([privacy](https://firebase.google.com/support/privacy)). On iOS, leave out AdSupport (the
  IDFA) unless you track with ATT consent (Apple page above).

## Logging

- **Functions:** `firebase-functions/logger` writes structured logs to Cloud Logging
  ([logs](https://firebase.google.com/docs/functions/writing-and-viewing-logs)). Log the `uid` and a correlation ID,
  never ID tokens, emails or request bodies (7.5).
- **Crashlytics** identifies users by an ID number, token or hashed value
  ([Crashlytics](https://firebase.google.com/docs/crashlytics/customize-crash-reports)). The Analytics user ID may not
  be an email address ([user ID](https://firebase.google.com/docs/analytics/userid)).
- **Audit:** Data Access audit logs, Firestore's included, are off by default ([Cloud](https://cloud.google.com/logging/docs/audit/configure-data-access)).
  Once on, entries for Firebase Auth requests hold the token's header and payload (claims such as the email) and the
  caller's IP ([Firestore](https://cloud.google.com/firestore/native/docs/audit-logging)), so set retention (5.6),
  restrict access and record them (7.5, 9.3). Write 7.5's events to an `audit_logs` collection from functions; rules deny all clients.

## Testing

- **CI:** run `firebase emulators:exec --only auth,firestore,storage,functions "npm test"`. Seed synthetic data with
  `--import` (5.5) ([emulators](https://firebase.google.com/docs/emulator-suite/install_and_configure)), and reset it
  between tests with `clearFirestore()`.
- **Rules:** the isolation test above, plus one assertion per cell of the 7.2 matrix. Emulated databases run on Spark
  quotas (unit-test page), so keep one smoke test against staging.
- **App E2E:** connect the app to the emulators (`connectAuthEmulator`, `connectFirestoreEmulator`), using App Check's
  debug provider with its token in the CI secret store. Run the 9.9 Playwright test unchanged against the Hosting
  emulator, with the Firebase API hosts allowed.

## Deployment

- **Region:** a Firestore location is fixed at creation: pick `europe-west2` (London) or `eur3`
  ([locations](https://firebase.google.com/docs/firestore/locations)). Buckets and Realtime Database instances take
  their own ([project locations](https://firebase.google.com/docs/projects/locations)). Functions fall back to
  `us-central1` ([functions](https://firebase.google.com/docs/functions/locations)), so set `region` on each or once in
  `setGlobalOptions` ([manage functions](https://firebase.google.com/docs/functions/manage-functions)).
- **Transfers:** Firebase Authentication runs only in US data centres, and most other services run globally unless you
  choose a location (privacy page). Record the transfer (9.17) and Firebase's data processing terms in 3.6.
- **Rules ship from CI:** keep `firestore.rules`, `storage.rules` and the indexes in git, and deploy them with
  `firebase deploy --only firestore,storage`. A CLI deploy overwrites console edits, and changes take up to 10 minutes
  to reach every listener (rules page).
- **Backups:** schedule daily or weekly backups (kept up to 14 weeks) and turn on 7-day point-in-time recovery. Backups
  restore to a *new* database and outlive a deleted one, so match their retention to 5.6
  ([backups](https://firebase.google.com/docs/firestore/backups), [PITR](https://firebase.google.com/docs/firestore/pitr)).
- **Plans:** Cloud Storage needs Blaze; Spark projects lose bucket access
  ([FAQ](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024)). One project per environment
  (3.2), each with budget alerts.
- **eMudhra CA (October 2026):** some clients compiled in roots that chain to a compromised CA, so a network attacker
  could impersonate Firestore or any HTTPS host. Fixed in FirebaseFirestore for Apple 13.1.1+ (or 12.19.3, the only fix
  on CocoaPods); `cloud_firestore` 7.1.0 (or 6.10.1 on iOS and macOS, 6.10.2 on Windows); Flutter 3.47.8 for `dart:io` on
  Android, Windows and Linux; the App Distribution Gradle plugin 5.3.1+ (or 4.2.1, 3.2.1). React Native on Apple with Firestore, Unity and C++ were hit
  too. Update, republish and get users to update; the Gradle plugin needs only the update ([guide](https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca)).

## Limits

- Rules allow 10 `get()` or `exists()` calls per single-document request or query, and 20 per batch or transaction
  ([limits](https://firebase.google.com/docs/firestore/security/rules-structure)). Deep membership checks need claims
  or denormalised member maps.
- App Check is attestation, not authorisation. Within 15 minutes of enforcement it rejects every unattested request,
  old app versions included, so read its metrics first
  ([enforcement](https://firebase.google.com/docs/app-check/enable-enforcement)).
- **Erasure (9.15):** deleting an Auth user leaves their Firestore and Storage data behind; Auth purges its own copy,
  backups included, within 180 days (privacy page). Extensions, "Delete User Data" included, end on 31 March 2027
  ([notice](https://firebase.google.com/docs/extensions/users/migrate)), so erase in your own delete-account function;
  `onUserDeleted` is in Preview and bulk deletes skip it ([auth events](https://firebase.google.com/docs/functions/auth-events)).
- **SQL Connect** has no Security Rules: each operation carries an `@auth` level from `PUBLIC` to `NO_ACCESS` (the
  default) ([SQL Connect](https://firebase.google.com/docs/sql-connect/authorization-and-security)). Test them as policies.

## Sources

- Rules and App Check: [get started](https://firebase.google.com/docs/firestore/security/get-started) · [insecure rules](https://firebase.google.com/docs/rules/insecure-rules) · [queries](https://firebase.google.com/docs/firestore/security/rules-query) · [structure and limits](https://firebase.google.com/docs/firestore/security/rules-structure) · [unit tests](https://firebase.google.com/docs/rules/unit-tests) · [Storage conditions](https://firebase.google.com/docs/storage/security/rules-conditions) · [App Check](https://firebase.google.com/docs/app-check) · [reCAPTCHA v3 provider](https://firebase.google.com/docs/app-check/web/recaptcha-provider) · [enforcement](https://firebase.google.com/docs/app-check/enable-enforcement) · [debug provider](https://firebase.google.com/docs/app-check/web/debug-provider)
- Auth: [sessions](https://firebase.google.com/docs/auth/admin/manage-sessions) · [session cookies](https://firebase.google.com/docs/auth/admin/manage-cookies) · [custom claims](https://firebase.google.com/docs/auth/admin/custom-claims) · [persistence](https://firebase.google.com/docs/auth/web/auth-state-persistence) · [password policy](https://firebase.google.com/docs/auth/web/password-auth) · [limits](https://firebase.google.com/docs/auth/limits) · [MFA](https://firebase.google.com/docs/auth/web/multi-factor) · [email link](https://firebase.google.com/docs/auth/android/email-link-auth) · [redirect](https://firebase.google.com/docs/auth/web/redirect-best-practices) · [enumeration protection](https://cloud.google.com/identity-platform/docs/admin/email-enumeration-protection)
- Functions, CLI and Hosting: [API keys](https://firebase.google.com/docs/projects/api-keys) · [config and secrets](https://firebase.google.com/docs/functions/config-env) · [`functions.config()` in v7](https://github.com/firebase/firebase-functions/blob/v7.4.0/src/v1/config.ts) · [CLI](https://firebase.google.com/docs/cli) · [callable](https://firebase.google.com/docs/functions/callable) · [manage functions](https://firebase.google.com/docs/functions/manage-functions) · [auth events](https://firebase.google.com/docs/functions/auth-events) · [logs](https://firebase.google.com/docs/functions/writing-and-viewing-logs) · [emulators](https://firebase.google.com/docs/emulator-suite/install_and_configure) · [Hosting config](https://firebase.google.com/docs/hosting/full-config) · [CDN setup](https://firebase.google.com/docs/web/alt-setup)
- Data: [Firestore locations](https://firebase.google.com/docs/firestore/locations) · [project locations](https://firebase.google.com/docs/projects/locations) · [functions locations](https://firebase.google.com/docs/functions/locations) · [backups](https://firebase.google.com/docs/firestore/backups) · [PITR](https://firebase.google.com/docs/firestore/pitr) · [Firestore audit logs](https://cloud.google.com/firestore/native/docs/audit-logging) · [Data Access audit logs](https://cloud.google.com/logging/docs/audit/configure-data-access) · [Storage plan change](https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024) · [download files](https://firebase.google.com/docs/storage/web/download-files)
- Privacy and consent: [privacy and data locations](https://firebase.google.com/support/privacy) · [Analytics on Android](https://firebase.google.com/docs/analytics/android/configure-data-collection) · [on Apple platforms](https://firebase.google.com/docs/analytics/ios/configure-data-collection) · [consent mode for apps](https://developers.google.com/tag-platform/security/guides/app-consent) · [Analytics user ID](https://firebase.google.com/docs/analytics/userid) · [Crashlytics](https://firebase.google.com/docs/crashlytics/customize-crash-reports)
- Changes: [Dynamic Links FAQ](https://firebase.google.com/support/dynamic-links-faq) · [Extensions shutdown](https://firebase.google.com/docs/extensions/users/migrate) · [SQL Connect auth](https://firebase.google.com/docs/sql-connect/authorization-and-security) · [JS SDK release notes](https://firebase.google.com/support/release-notes/js) · [Test Lab](https://firebase.google.com/docs/test-lab) · [Apple setup and CocoaPods](https://firebase.google.com/docs/ios/setup) · [eMudhra CA guide](https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca)
