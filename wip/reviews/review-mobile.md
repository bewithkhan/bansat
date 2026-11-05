# Review of six Bansat stack profiles (Angular, mobile, Firebase)

Profiles: angular.md, flutter.md, react-native-expo.md, swift-ios.md, kotlin-android.md, firebase.md.

Totals: 2 Blockers (Flutter, Firebase), ~25 Should fix, Nits. Most versions, dates and advisory IDs are right.
Sources: github.com refuses direct fetches here; GitHub advisories were read through OSV (api.osv.dev), cross-checked
against NVD and CISA. The Dart SDK advisory isn't in OSV (read through WebFetch; details match the Flutter changelog
and Firebase's eMudhra guide). Apple pages read through their DocC JSON. Every link in the six profiles resolves.
Copies of fetched pages: /tmp/claude-0/-home-claude/481a3ee1-8cae-5706-8d27-31c282fbf964/scratchpad/review/pages/

## Shared findings
S1 · Should fix · Testing, the Android no-third-party script (Flutter, React Native, Kotlin).
- Boot race: `adb wait-for-device` returns once the emulator is in `device` state, which can appear while the system is
  still booting (https://developer.android.com/tools/adb), so `adb install`, `am start`, `installRelease` can fail or
  race. Wait with `adb wait-for-device shell 'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 1; done'`.
- Fails open: if the capture misses DNS lookups, `hosts.txt` is empty, `grep -v` finds nothing, the test passes. Assert
  your own API host appears in `hosts.txt` before checking the allowlist.
- Baseline: a Google Play image's baseline includes hosts Play services contacts by itself; because the check matches
  names, not processes, an allowlisted Google host also hides your app's SDKs contacting it. Review the baseline by hand.

S2 · Should fix · the eMudhra intermediate CA compromise reaches beyond `dart:io` (Firebase, Swift, Flutter, React
Native; Nit for Kotlin). Firebase's guide
https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca (Oct 2026) lists as affected:
- Native Apple apps using Cloud Firestore: FirebaseFirestore 13.1.0 and earlier, except 12.19.3. Fixed in 13.1.1+ or
  12.19.3. CocoaPods users need 12.19.3 (Firebase 12 is the last major published to CocoaPods).
- Flutter on Apple or Windows using `cloud_firestore`: 7.0.0 and earlier, except 6.10.1 and 6.10.2. Fixed in 7.1.0
  (BoM 5.1.0), or 6.10.1 on iOS/macOS.
- Flutter's `dart:io`: Flutter 3.47.8.
- React Native on Apple using Firestore. Unity and C++.
- The Android App Distribution Gradle plugin: fixed in 5.3.1+, 4.2.1 or 3.2.1.
Required actions: update, republish, get users to update (trusted roots are compiled into the app). Only Flutter's
`dart:io` note covers any of this today.

S3 · Nit · Firebase services that start themselves (Flutter, Swift, Kotlin): only Analytics and Crashlytics switches are
listed. https://firebase.google.com/support/privacy says Cloud Messaging and Performance Monitoring also start
automatically and their auto-init can be turned off. Add a line or point to the Firebase profile.

S4 · Nit · helper-based isolation tests (Flutter, Swift, Kotlin) prove isolation only if `signInAs` throws on failure.
Add one positive assertion (A reads A's own task).

S5 · Nit · own words, verbatim quotes: Angular's environments sentence (16 words); React Native "are not a replacement
for server-side authentication or access control" and "visible in plain-text in your compiled application"; Swift "a
compromised app can falsify the results"; Kotlin "in favour of existing platform APIs and direct use of Android
Keystore". Paraphrase at least the Angular one.

## flutter.md
1. BLOCKER · Logging, dio's `LogInterceptor`: "logs request and response headers by default, `Authorization` included,
   through `debugPrint`" — the header defaults (`requestHeader`, `responseHeader` true) and unredacted printing are
   right, but the default printer isn't `debugPrint`: `logPrint = _debugPrint`, and `_debugPrint`
   (`dio/lib/src/interceptors/log.dart`) calls `print` inside an `assert`, so default output appears in debug builds
   only. Release builds leak when you pass `debugPrint` or `print` as `logPrint`, which dio's doc comment tells Flutter
   users to do. Fix: defaults print every header (Authorization included) in debug builds; passing `debugPrint` makes it
   print in release too; add it only under `kDebugMode`, with `requestHeader: false`.
2. Should fix · Intro and Deployment, eMudhra on iOS: "TLS flaw on Android" matches the Dart advisory (High, no CVE,
   published 23 Oct 2026, Android, Windows, Linux; iOS not affected). But per S2 iOS apps using `cloud_firestore` were
   affected through the native SDK: need `cloud_firestore` 7.1.0 or 6.10.1, rebuild, re-release; prompt users to update.
3. Should fix · CSRF and XSS, `webview_flutter` JavaScript default: "turn JavaScript on (`setJavaScriptMode`) only for
   content you control" implies it's off by default. The API page states no default; the iOS implementation
   (`webview_flutter_wkwebview`, `webkit_webview_controller.dart`) sets JS only inside that method, so WKWebView's
   default applies (Apple: `allowsContentJavaScript` true); Android WebView starts with JS disabled. Fix: "The package
   sets no default. On iOS JavaScript runs unless you call `setJavaScriptMode(JavaScriptMode.disabled)`; on Android it
   starts off. Set it explicitly."
4. Should fix · Header: 3.47.8 stated, current stable is 3.47.9 (29 Oct 2026, still Dart 3.13.7) per releases_linux.json
   and the CHANGELOG; the security page commits to fixes only for current stable. Fix: "3.47 (3.47.9)", keep "3.47.8 or
   later" for the TLS fix.
5. Should fix · Testing, Firebase Test Lab is deprecated and shuts down 30 Sept 2027
   (https://firebase.google.com/docs/test-lab), migration to Google's Developer Device Platform. Flag it.
6. Should fix · Testing script: S1. 7. Nits: S3, S4.

## angular.md
1. Should fix · Access and Deployment, SSR pages in shared caches: GHSA-q6f4-qqrg-jv6x (CVE-2026-50170, High, June
   2026): credentialed responses were cached into TransferState by default, and a CDN/proxy caching SSR HTML served one
   user's data to others. Fix: `Cache-Control: private, no-store` on signed-in SSR routes (route `headers` or
   `RESPONSE_INIT`), keep those pages out of CDN caches.
2. Should fix · CSP with `autoCsp`: the security page says if you also send a CSP header, omit `script-src` and
   `default-src` from it (both policies apply; the header would block the hashed scripts). Deployment says "set the 7.4
   headers", whose policy has both. Fix: with `autoCsp`, send the rest of 7.4's policy as a header without those two,
   listing `font-src`, `connect-src`, `img-src` etc. explicitly.
3. Should fix · Access, prerender default: the SSR guide says Angular prerenders the entire app by default. Fix: every
   route is prerendered until signed-in routes are set to `RenderMode.Server` or `RenderMode.Client`.
4. Should fix · Limits: GHSA-48r7-hpm6-gfxm (CVE-2026-54268) is cited for three problems but covers `formatDate` only.
   `digitsInfo` is GHSA-p3vc-36g9-x9gr (CVE-2026-50171); the i18n XSS is GHSA-jj27-h5hq-8x99 (CVE-2026-69151). Cite each.
5. Should fix · Fonts, inlining claim: accurate, but the cited workspace-config page only says the build inlines "CSS
   definitions". CLI source `packages/angular/build/src/utils/index-file/inline-fonts.ts` inlines the fetched CSS
   unchanged (font URLs still point to Google) and injects
   `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`, itself a request to Google before consent.
   Cite the source and mention the preconnect.
6. Nits: Node engines are `^22.22.3`, not 22.22+. The 1 MB cap covers `HttpClient` on the default fetch backend during
   SSR, not `fetch()` in `server.ts`. The SSR page's "leak between requests" warning sits on `includeHeaders`, so say
   never to put auth headers there. The E2E test's API half works with same-origin cookie sessions (Playwright passes
   `storageState` cookies to `request`) but not bearer tokens. S5.

## react-native-expo.md
1. Should fix · Access, isolation test can pass vacuously: supabase-js returns `{ data, error }` rather than throwing; if
   sign-in fails, queries run anonymously, RLS returns `[]`, both assertions pass. Fix: `expect(error).toBeNull()` on
   sign-in, plus a positive control (A reads A's own tasks).
2. Should fix · CSRF and XSS, `onMessage` on Android: `event.nativeEvent.url` doesn't say which frame sent a message on
   Android. react-native-webview `RNCWebView.java` reports `mWebView.getUrl()` (top-level page); Android's bridge is
   exposed to every frame. iOS `RNCWebViewImpl.m` reports the sending frame's URL (`message.frameInfo.request.URL`).
   So a third-party iframe in an allowed page passes on Android. Fix: say so, keep untrusted iframes out of pages using
   `onMessage`, validate message content.
3. Should fix · Deployment, eMudhra: per S2, update to a React Native Firebase release whose iOS Firestore SDK is fixed
   (12.19.3 on CocoaPods), rebuild, republish.
4. Should fix · Consent: RNFB's `packages/app/firebase-schema.json` has `analytics_default_allow_*` (consent-mode
   defaults on both platforms), `crashlytics_auto_collection_enabled`, `messaging_auto_init_enabled`,
   `perf_auto_collection_enabled`. The profile sets only analytics collection and has builders hand-write native consent
   keys. Fix: use these keys; keep Crashlytics, Messaging, Performance off until consent.
5. Should fix · Deployment, CVE-2025-11953 context (ID, severity, fixed versions match GHSA-399j-vxmf-hjvr and NVD):
   add that it's in CISA KEV (added 5 Feb 2026); JFrog (the CNA) says `cli-server-api` 4.8.0 to 17.x is affected too,
   no backports; if you can't upgrade bind with `--host 127.0.0.1`. It hits any project starting Metro through
   `@react-native-community/cli`, not only bare projects. Suggest `npm ls @react-native-community/cli-server-api`.
6. Should fix · Testing script: S1.
7. Nits: add `NSUserTrackingMarkdownUsageDescription` via `ios.infoPlist` (`userTrackingPermission` sets only the plain
   key). S5.

## swift-ios.md
1. Should fix · eMudhra and Firestore: per S2, FirebaseFirestore 13.1.1+ (or 12.19.3), republish, prompt users.
2. Should fix · CSRF and XSS, app-bound domains: `limitsNavigationsToAppBoundDomains` needs the `WKAppBoundDomains`
   Info.plist key (up to 10 domains). https://webkit.org/blog/10882/app-bound-domains/ says once the key exists, web
   views deny script injection, cookie changes and message handlers unless the flag is set. Add the key and limit; link
   to the `WKScriptMessageHandler` advice.
3. Nit · Testing: App Privacy Report keeps seven days of activity, so earlier consented runs end up in the export;
   filter on `timeStamp` after the fresh install.
4. Nits: signatures are required only when the listed SDKs are binary dependencies. S3, S4, S5.

## kotlin-android.md
1. Should fix · Logging, R8 rule has no effect until R8 is on: set `isMinifyEnabled = true` (app-optimisation page;
   log-disclosure page says R8 must be enabled). Add to the comment.
2. Should fix · Access, test reaches `10.0.2.2` over HTTP: cleartext off by default since API 28; a local stack serves
   plain HTTP. Add a debug/test-only network security config allowing cleartext to `10.0.2.2`, never in release.
3. Should fix · Testing script: S1.
4. Nits: App Distribution plugin update (S2); `installRelease` exists only when the release build has a signing config;
   the 18-month window covers Kotlin's standard library for the JVM; S3, S4, S5.

## firebase.md
1. BLOCKER · Intro and Secrets, `functions.config()`: profile covers firebase-functions 7 but says it "is deprecated"
   and fails after March 2027. In 7.4.0 it throws "functions.config() has been removed in firebase-functions v7"
   (`lib/v1/config.js`). The config-env page says deprecated in 6.0.0, decommissioned in the next major; March 2027 is
   the cut-off for older SDKs. Fix: "Removed in v7 (calling it throws). On 6.x and earlier, new deployments that use it
   fail after March 2027. Use params and `defineSecret`."
2. Should fix · Intro and Deployment, eMudhra: add S2 in full with the required actions.
3. Should fix · Logging, audit logs: the cited Firestore page doesn't say data-access logs are off by default;
   https://cloud.google.com/logging/docs/audit/configure-data-access says they're disabled for all services except some
   BigQuery ones. The Firestore page also says entries for Firebase Auth requests include the request's auth token
   (header and payload) and caller IP. Fix: cite the Cloud page; warn enabling these logs stores token claims (email
   included) and IPs: set retention (5.6), restrict access, record the logs (7.5, 9.3).
4. Nits: `onUserDeleted` is a Preview trigger, keep the delete-account function as the main path. Also list Test Lab's
   shutdown, the end of CocoaPods releases after Firebase 12, and JS SDK 13.2.0 (30 Oct 2026) adding a Crashlytics web
   SDK in preview (belongs behind the consent loader). App Check on the web also offers reCAPTCHA v3. SQL Connect
   operations without `@auth` default to `NO_ACCESS`. At 196 lines the profile is over the ~180 guide.

## Checked and correct (don't change)
Versions and dates across all six (Flutter 3.47.8/Dart 3.13.7 dates, Angular v22 cadence and LTS dates, Expo SDK 58/RN
0.88, Xcode 27.2/Swift 6.4, Kotlin 2.4.21, Firebase SDK versions), all cited GHSAs except the Angular attribution above,
the code examples (Firebase rules-unit-testing test has a positive control), ATT details, store requirements.
