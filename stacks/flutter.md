# Flutter

> **Group:** Mobile · **Covers:** Flutter 3.47 (3.47.8) with Dart 3.13, building for iOS and Android · **Checked:** 2026-11-05 against the official docs

D3 sets the mobile rules, and this profile says how to meet them in Flutter. Only the current stable release gets
security fixes ([security](https://docs.flutter.dev/security)). Flutter 3.47.8 (Dart 3.13.7) fixes a high-severity
TLS flaw on Android: `dart:io` trusted compromised eMudhra certificates
([GHSA-frr6-h895-5pxp](https://github.com/dart-lang/sdk/security/advisories/GHSA-frr6-h895-5pxp)). Upgrade, then
rebuild and re-release your Android app.

## Access and the isolation test

- **The app is a client.** Access is enforced by the backend: RLS (5.4) for Supabase, Security Rules for Firebase, or
  the 7.2 checks in your own API. Route guards such as a `go_router` `redirect` and hidden buttons are layer 3
  (convenience only).
- **Any route can arrive from a link.** Once links are set up, Flutter's default handler passes the link's path to
  your router; you opt out with `FlutterDeepLinkingEnabled` (Info.plist) or `flutter_deeplinking_enabled`
  (AndroidManifest) ([deep linking](https://docs.flutter.dev/ui/navigation/deep-linking)). So each screen loads its
  data as though it were opened cold, and shows S7 or S11 from the backend's answer.
- **Isolation test:** run the backend's own test in CI (the 5.4 SQL test, or the Firebase profile's rules test), then
  prove the app's data layer gets the same answer with `integration_test`, against a local stack or the emulators:

```dart
// integration_test/isolation_test.dart — local Supabase stack or Firebase emulators, synthetic users only (5.5)
void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();
  testWidgets("user A can't read or change user B's task", (tester) async {
    await TestBackend.signInAs(TestUsers.a);                  // your helper; never a production project
    final tasks = TaskRepository();                           // the same repository the screens use
    expect(await tasks.find(Seed.taskOfB), isNull);           // RLS or rules hide the row
    await expectLater(tasks.rename(Seed.taskOfB, 'x'), throwsA(isA<AccessDenied>()));
  });
}
```

- In the repository, map RLS's zero-row update and Firestore's `permission-denied` to one `AccessDenied`, so that each
  screen has a single S7 or S11 path.

## Authentication

- **Session storage:** `supabase_flutter` keeps the session in Shared Preferences by default, which isn't the Keychain
  or Keystore that D3 requires. Give it a custom `LocalStorage` built on `flutter_secure_storage`
  ([supabase_flutter](https://pub.dev/packages/supabase_flutter)).
- **`flutter_secure_storage` 10+** moved to its own Keystore-based ciphers. It no longer recommends Jetpack Security's
  EncryptedSharedPreferences, which Google deprecated in 2025. It also warns that restored Android backups fail with
  `InvalidKeyException`, so exclude it from Auto Backup. On iOS choose
  `KeychainAccessibility.first_unlock_this_device` ([flutter_secure_storage](https://pub.dev/packages/flutter_secure_storage)).
- **OAuth** goes through the system browser with PKCE, never a WebView. On iOS the platform session API is
  `ASWebAuthenticationSession`, which returns the callback only to the app that started it
  ([Apple](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession)).
- **Biometric unlock** with `local_auth` (from flutter.dev) only gates local access
  ([local_auth](https://pub.dev/packages/local_auth)). The re-authentication in 7.1 still happens on the server.
- **Sign-out** deletes the secure-storage entries, the local database and cached files, and the backend revokes the
  session (7.1).

## Secrets

- D3 applies: anything in the app can be extracted. `--dart-define` and `--dart-define-from-file` values are constants
  compiled into the program ([environment declarations](https://dart.dev/libraries/core/environment-declarations)), and
  assets, `.env` files included, are bundled with the app
  ([assets](https://docs.flutter.dev/ui/assets/assets-and-images)). Use them for config only.
- `--obfuscate` only renames symbols: it doesn't encrypt resources or stop reverse engineering, and Flutter calls
  storing secrets in an app poor practice ([obfuscation](https://docs.flutter.dev/deployment/obfuscate)). Ship the
  publishable key, and put every privileged call behind your server or an edge or cloud function.

## CSRF and XSS

- **CSRF** needs a cookie that's attached automatically. Authenticate API calls with bearer tokens. If the app reuses a
  cookie-session web backend, that backend's profile applies.
- **WebViews (`webview_flutter`):** turn JavaScript on (`setJavaScriptMode`) only for content you control. Return
  `NavigationDecision.prevent` from `onNavigationRequest` for anything off your allowlist, and open those links in the
  browser ([webview_flutter](https://pub.dev/packages/webview_flutter)). Treat `addJavaScriptChannel` messages as
  untrusted input: an Android WebView bridge can't tell which frame called it
  ([Android](https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges)).
- **HTML from data** (in a WebView or an HTML-rendering widget) is the XSS surface. Prefer native widgets, and run an
  allowlist sanitiser on the server first (T-04).
- **Deep links:** use App Links (`android:autoVerify`, `assetlinks.json`)
  ([Flutter](https://docs.flutter.dev/cookbook/navigation/set-up-app-links)) and Universal Links (`applinks:`)
  ([Flutter](https://docs.flutter.dev/cookbook/navigation/set-up-universal-links)) rather than custom schemes, which
  other apps can register too. Validate every parameter, never carry tokens in a link, and allow no destructive action
  straight from one ([Apple](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app),
  [Android](https://developer.android.com/privacy-and-security/risks/unsafe-use-of-deeplinks)).

## Fonts and assets

- Bundle font files and declare them under `fonts:` in `pubspec.yaml`
  ([fonts](https://docs.flutter.dev/cookbook/design/fonts)).
- **`google_fonts` fetches from fonts.google.com at runtime by default** (`allowRuntimeFetching` is `true`)
  ([config](https://pub.dev/documentation/google_fonts/latest/google_fonts/GoogleFontsConfig/allowRuntimeFetching.html)).
  Put the font files in your assets, which take priority
  ([google_fonts](https://pub.dev/packages/google_fonts)), and set `GoogleFonts.config.allowRuntimeFetching = false;`
  in `main()` before `runApp`.
- Use `Image.asset` for app images. `Image.network` pointing at a third-party host, such as stock photos or Gravatar,
  sends that host the user's IP address. Serve images from your own storage (9.9).

## Consent

- **Some SDKs start collecting as soon as they initialise**, so switch them off natively and turn them on from Dart
  after consent. For Firebase, set `firebase_analytics_collection_enabled` and
  `firebase_crashlytics_collection_enabled` to `false` in `android/app/src/main/AndroidManifest.xml`, and
  `FIREBASE_ANALYTICS_COLLECTION_ENABLED` and `FirebaseCrashlyticsCollectionEnabled` to `NO` in `ios/Runner/Info.plist`
  ([Analytics](https://firebase.google.com/docs/analytics/android/configure-data-collection),
  [Crashlytics](https://firebase.google.com/docs/crashlytics/flutter/customize-crash-reports)). After consent, call
  `setAnalyticsCollectionEnabled(true)` and `setCrashlyticsCollectionEnabled(true)`.
- **Google's consent mode:** default every type to denied (the `google_analytics_default_allow_*` keys in the manifest,
  `GOOGLE_ANALYTICS_DEFAULT_ALLOW_*` in Info.plist), then call `setConsent` with the user's choice
  ([consent mode](https://developers.google.com/tag-platform/security/guides/app-consent)).
- **Other SDKs:** call their `init()` from a consent controller that reads the stored choice, never in `main()`.
- **ATT:** request through a plugin such as `app_tracking_transparency`, with `NSUserTrackingUsageDescription`, and
  only while the app is active. In the EU the prompt can be shown again after a year, and from iOS 27.2 France,
  Germany, Italy, Poland and Romania show a full-page sheet that uses `NSUserTrackingMarkdownUsageDescription`
  ([Apple](https://developer.apple.com/documentation/apptrackingtransparency/attrackingmanager/requesttrackingauthorization%28completionhandler%3A%29)).
  ATT covers cross-app tracking only; analytics still follows 9.8.
- **Permissions (D3):** ask for each one at the moment of use, and check the merged `AndroidManifest.xml` for
  permissions your plugins add that you don't use.

## Logging

- `debugPrint()` still prints in release builds unless it sits inside a debug check or an assert
  ([logging](https://docs.flutter.dev/testing/code-debugging)). Turn on the `avoid_print` lint
  ([lint](https://dart.dev/tools/linter-rules/avoid_print)), and log through one wrapper that drops everything below
  warning when `kReleaseMode` is set.
- **`dio`'s `LogInterceptor` logs request and response headers by default**, `Authorization` included, through
  `debugPrint` ([LogInterceptor](https://pub.dev/documentation/dio/latest/dio/LogInterceptor/LogInterceptor.html)). Add it
  only in debug builds, with `requestHeader: false`.
- Send errors from `FlutterError.onError` and `PlatformDispatcher.instance.onError`
  ([errors](https://docs.flutter.dev/testing/errors)) to your crash reporter, with an opaque user ID and no personal data
  in keys or messages (7.5).

## Testing

- `flutter test` for unit and widget tests, and `integration_test` on emulators, devices or Firebase Test Lab
  ([integration tests](https://docs.flutter.dev/testing/integration-tests)). Native permission dialogs aren't Flutter
  widgets, so drive the denied state (D3) with a native UI tool.
- **No-third-party test (9.9).** Playwright can't watch a native app, so capture the device's traffic from a fresh
  install with consent rejected. On Android, use the emulator's `-tcpdump` option
  ([emulator](https://developer.android.com/studio/run/emulator-commandline)):

```bash
# tests/privacy/no-third-party-android.sh — fails if the app contacts a host outside allowed-hosts.txt
emulator -avd ci -no-window -no-snapshot -tcpdump cap.pcap & adb wait-for-device
adb install -r build/app/outputs/flutter-apk/app-release.apk
adb shell am start -W -n com.example.app/.MainActivity; sleep 30   # or run the flow that taps "Reject all"
adb emu kill; sleep 3
tshark -r cap.pcap -Y 'dns.flags.response == 0' -T fields -e dns.qry.name | sort -u > hosts.txt
if grep -vxF -f allowed-hosts.txt hosts.txt; then echo 'Third-party hosts contacted before consent'; exit 1; fi
```

- Seed `allowed-hosts.txt` with a baseline run without your app (the OS's own lookups), then add your API and backend
  hosts. Match DNS names rather than TLS SNI, which Encrypted Client Hello can hide for apps targeting Android 17
  ([Android 17](https://developer.android.com/about/versions/17/behavior-changes-17)).
- On iOS, turn on the App Privacy Report on a test device, run the same flow, export the report, and list your app's
  domains with `jq -r 'select(.type=="networkActivity" and .bundleID=="com.example.app") | .domain'`
  ([app activity](https://developer.apple.com/documentation/network/inspecting-app-activity-data)).

## Deployment

- **iOS:** Xcode 27 (the iOS 27 SDK) requires the UIScene life cycle, and an unmigrated app won't launch. Adopt
  `FlutterSceneDelegate` ([migration](https://docs.flutter.dev/release/breaking-changes/uiscenedelegate)).
- **Android:** since 31 August 2026, Google Play requires new apps and updates to target API 36
  ([Play](https://developer.android.com/google/play/requirements/target-sdk)). Exclude secure storage and local
  databases from backups with `dataExtractionRules` (Android 12+) and `fullBackupContent`
  ([backups](https://developer.android.com/privacy-and-security/risks/backup-best-practices)).
- **Stores (D3):** build the SDK inventory from `pubspec.lock`, including each plugin's native SDKs. It feeds the
  privacy manifest and label, the Data safety form, account deletion and the review account (7.1).
- **Region:** the data lives wherever the backend lives; see its profile.

## Limits

- Native Flutter has no CSP. WebViews and HTML renderers are the only places a CSP-like allowlist can apply.
- Dart-side interceptors see only Dart's own requests. Native SDKs inside plugins make their own, which is why the
  privacy test captures packets.
- Each plugin brings native code and its own data collection, so review it before you add it (T-12), and record it in
  the 3.6 and 9.8 registers.
- Flutter for web follows the web rules instead (Next.js reference, 7.4 CSP).

## Sources

- Flutter: [security](https://docs.flutter.dev/security) · [release notes](https://docs.flutter.dev/release/release-notes) · [deep linking](https://docs.flutter.dev/ui/navigation/deep-linking) · [App Links](https://docs.flutter.dev/cookbook/navigation/set-up-app-links) · [Universal Links](https://docs.flutter.dev/cookbook/navigation/set-up-universal-links) · [fonts](https://docs.flutter.dev/cookbook/design/fonts) · [assets](https://docs.flutter.dev/ui/assets/assets-and-images) · [obfuscation](https://docs.flutter.dev/deployment/obfuscate) · [logging](https://docs.flutter.dev/testing/code-debugging) · [errors](https://docs.flutter.dev/testing/errors) · [integration tests](https://docs.flutter.dev/testing/integration-tests) · [UIScene migration](https://docs.flutter.dev/release/breaking-changes/uiscenedelegate)
- Dart: [environment declarations](https://dart.dev/libraries/core/environment-declarations) · [avoid_print](https://dart.dev/tools/linter-rules/avoid_print) · [GHSA-frr6-h895-5pxp](https://github.com/dart-lang/sdk/security/advisories/GHSA-frr6-h895-5pxp)
- Packages: [supabase_flutter](https://pub.dev/packages/supabase_flutter) · [flutter_secure_storage](https://pub.dev/packages/flutter_secure_storage) · [local_auth](https://pub.dev/packages/local_auth) · [webview_flutter](https://pub.dev/packages/webview_flutter) · [google_fonts](https://pub.dev/packages/google_fonts) · [allowRuntimeFetching](https://pub.dev/documentation/google_fonts/latest/google_fonts/GoogleFontsConfig/allowRuntimeFetching.html) · [dio LogInterceptor](https://pub.dev/documentation/dio/latest/dio/LogInterceptor/LogInterceptor.html) · [app_tracking_transparency](https://pub.dev/packages/app_tracking_transparency)
- Firebase and Google: [Analytics data collection](https://firebase.google.com/docs/analytics/android/configure-data-collection) · [Crashlytics opt-in](https://firebase.google.com/docs/crashlytics/flutter/customize-crash-reports) · [consent mode for apps](https://developers.google.com/tag-platform/security/guides/app-consent)
- Platforms: [ASWebAuthenticationSession](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession) · [custom URL schemes](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app) · [ATT request](https://developer.apple.com/documentation/apptrackingtransparency/attrackingmanager/requesttrackingauthorization%28completionhandler%3A%29) · [inspecting app activity](https://developer.apple.com/documentation/network/inspecting-app-activity-data) · [WebView bridges](https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges) · [deep links](https://developer.android.com/privacy-and-security/risks/unsafe-use-of-deeplinks) · [backups](https://developer.android.com/privacy-and-security/risks/backup-best-practices) · [emulator command line](https://developer.android.com/studio/run/emulator-commandline) · [Android 17 changes](https://developer.android.com/about/versions/17/behavior-changes-17) · [Play target API](https://developer.android.com/google/play/requirements/target-sdk)
