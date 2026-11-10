# Kotlin (Android)

> **Group:** Mobile · **Covers:** Kotlin 2.4 (2.4.21) on Android, targeting API 36 (Android 16) as Google Play requires, with Android 17 (API 37) changes flagged · **Checked:** 2026-11-05 against the official docs

D3 sets the mobile rules, and this profile says how to meet them natively on Android. Changed in 2025–2026: Google
Play has required target API 36 since 31 August 2026; Jetpack Security Crypto (EncryptedSharedPreferences) and
Google Sign-In for Android are deprecated; developer verification began on 30 September 2026 in some regions; and
Android 17 adds a local-network permission, certificate transparency by default and Encrypted Client Hello.

## Access and the isolation test

- **The app is a client.** Access is enforced by the backend: RLS (5.4) for Supabase, Security Rules for Firebase, or
  the 7.2 checks in your own API. Hiding a screen is layer 3 (convenience only).
- **Other apps are callers too.** Set `android:exported` explicitly on every component (its default has changed across
  versions), and export only what must be reachable
  ([exported](https://developer.android.com/privacy-and-security/risks/android-exported)). Never launch an intent
  taken from another app's extras
  ([intent redirection](https://developer.android.com/privacy-and-security/risks/intent-redirection)).
- **Isolation test:** run the backend's own test in CI (the 5.4 SQL test, or the Firebase profile's rules test), then
  prove the app's repository gets the same answer in an instrumented test. The emulator reaches a local stack at
  `10.0.2.2` ([emulator networking](https://developer.android.com/studio/run/emulator-networking-address)), usually over
  HTTP, which API 28+ blocks: allow cleartext for `10.0.2.2` alone in a network security config in the debug source set
  (`src/debug/res/xml/`), never in release ([config](https://developer.android.com/privacy-and-security/security-config)).

```kotlin
// app/src/androidTest/java/com/example/app/IsolationTest.kt — local stack via 10.0.2.2, synthetic users only (5.5)
@RunWith(AndroidJUnit4::class)
class IsolationTest {
    @Test fun userA_cannotReadOrChange_userBsTask() = runTest {
        val tasks = TaskRepository(TestBackend.signInAs(TestUsers.A))   // the same repository the screens use
        assertNotNull(tasks.find(Seed.TASK_OF_A))                         // control: proves the sign-in worked
        assertNull(tasks.find(Seed.TASK_OF_B))                            // RLS or rules hide the row
        assertFailsWith<AccessDenied> { tasks.rename(Seed.TASK_OF_B, "x") } // map 0 rows / 403 / permission-denied
    }
}
```

## Authentication

- **Credential Manager** is the recommended Jetpack API for passkeys, passwords, Sign in with Google and digital
  credentials ([Credential Manager](https://developer.android.com/identity/credential-manager)). Google Sign-In for
  Android (`play-services-auth`) is deprecated and will be removed
  ([migration](https://developer.android.com/identity/sign-in/legacy-gsi-migration)).
- **Other OAuth providers:** use the system browser with PKCE, never a WebView.
- **Token storage (D3):** Google deprecated every Jetpack Security Crypto API in 2025, EncryptedSharedPreferences
  included, and points to the platform APIs and the Android Keystore instead
  ([AndroidX Security](https://developer.android.com/jetpack/androidx/releases/security)). Encrypt tokens with an AES
  key you generate in the Android Keystore, and keep the ciphertext in DataStore. Keystore keys can't be extracted, and
  can be bound to the TEE or StrongBox ([Keystore](https://developer.android.com/privacy-and-security/keystore)).
  Android 17 caps apps that target it at 50,000 keys, so don't create a key per item
  ([Android 17](https://developer.android.com/about/versions/17/behavior-changes-all)).
- **Backups:** Auto Backup is on by default. Exclude tokens and local databases in `dataExtractionRules` (Android 12+)
  and `fullBackupContent` (Android 11 and lower). Without a `<device-transfer>` section, everything moves in a
  device-to-device transfer ([backups](https://developer.android.com/privacy-and-security/risks/backup-best-practices)).
- **Sign-out** clears DataStore, Room, caches and the Keystore key, and the backend revokes the session (7.1).

## Secrets

- D3 applies. Secrets in code or in `strings.xml` are easy to recover with reverse-engineering tools
  ([hardcoded secrets](https://developer.android.com/privacy-and-security/risks/hardcoded-cryptographic-secrets)), and
  so is every `BuildConfig` field and resource you compile in. Use them for config only.
- The Firebase `google-services.json` key is public by design. Restrict it to Firebase APIs
  ([API keys](https://firebase.google.com/docs/projects/api-keys)).
- To prove a request comes from your genuine app on a genuine device, use Play Integrity
  ([Play Integrity](https://developer.android.com/google/play/integrity/overview)) rather than an embedded key. It
  isn't authorisation.

## CSRF and XSS

- **CSRF** needs a cookie that's attached automatically. Authenticate API calls with bearer tokens. If the app shares a
  cookie-session web backend, that backend's profile applies.
- **WebView** runs no JavaScript until you call `setJavaScriptEnabled(true)`, so leave it off for static content.
  `addJavascriptInterface` exposes the object to every frame, iframes included, with no way to check the caller's
  origin. Remove it before untrusted content loads, load only HTTPS, and allowlist scheme and host, sending other links
  to the browser ([bridges](https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges)).
- **Local files in WebViews:** don't enable `setAllowFileAccess`, `setAllowFileAccessFromFileURLs` or
  `setAllowUniversalAccessFromFileURLs`. Serve local content with `WebViewAssetLoader`
  ([file inclusion](https://developer.android.com/privacy-and-security/risks/webview-unsafe-file-inclusion)).
- **Transport:** cleartext has been off by default since API 28; allow it per domain in a network security config,
  never app-wide ([cleartext](https://developer.android.com/privacy-and-security/risks/cleartext-communications)).
  Google plans to deprecate `usesCleartextTraffic`
  ([all apps](https://developer.android.com/about/versions/17/behavior-changes-all)), and apps targeting Android 17
  get certificate transparency by default
  ([targeting 17](https://developer.android.com/about/versions/17/behavior-changes-17)).
- **Deep links:** any app can register the same deep-link URI. Use App Links with `android:autoVerify="true"` and a
  Digital Asset Links file
  ([deep links](https://developer.android.com/privacy-and-security/risks/unsafe-use-of-deeplinks),
  [verify](https://developer.android.com/training/app-links/verify-applinks)). Validate every parameter, never carry
  tokens in a link, and show S11 for deleted content.

## Fonts and assets

- Put font files in `res/font` and use them as font resources, `Font(R.font.…)` in Compose
  ([Compose fonts](https://developer.android.com/develop/ui/compose/text/fonts)).
- **Don't use downloadable fonts:** Compose's `ui-text-google-fonts` and the Downloadable Fonts API fetch Google Fonts
  at runtime through Google Play services
  ([downloadable fonts](https://developer.android.com/develop/ui/views/text-and-emoji/downloadable-fonts)).
- Ship app images in `res/drawable`. An image loader fetching from a third-party host sends that host the user's IP
  address, so serve images from your own storage (9.9).

## Consent

- **Start SDKs after the choice.** Some libraries initialise themselves at process start through merged manifest
  entries. For those built on App Startup, remove the initializer's `<meta-data>` entry and call it yourself after
  consent ([App Startup](https://developer.android.com/topic/libraries/app-startup)).
- **Firebase:** set the `firebase_analytics_collection_enabled` and `firebase_crashlytics_collection_enabled`
  meta-data to `false`, then call `setAnalyticsCollectionEnabled(true)` and `setCrashlyticsCollectionEnabled(true)`
  after consent ([Analytics](https://firebase.google.com/docs/analytics/android/configure-data-collection),
  [Crashlytics](https://firebase.google.com/docs/crashlytics/android/customize-crash-reports)). Cloud Messaging and
  Performance Monitoring start themselves too: set `firebase_messaging_auto_init_enabled` and
  `firebase_performance_collection_enabled` to `false` until consent ([privacy](https://firebase.google.com/support/privacy),
  [FCM](https://firebase.google.com/docs/cloud-messaging/android/client), [Performance](https://firebase.google.com/docs/perf-mon/disable-sdk?platform=android)).
- **Google's consent mode:** default the `google_analytics_default_allow_*` meta-data to `false`, and pass the user's
  choice with `setConsent` ([consent mode](https://developers.google.com/tag-platform/security/guides/app-consent)).
- **Advertising ID:** SDKs can merge the `AD_ID` permission into your manifest
  ([Play](https://support.google.com/googleplay/android-developer/answer/6048248)). If you don't use the ID, remove it
  with `tools:node="remove"`.
- **Permissions at the moment of use (D3):** use the photo picker instead of media permissions
  ([photo picker](https://developer.android.com/training/data-storage/shared/photopicker)). Apps that target Android 17
  need `ACCESS_LOCAL_NETWORK`, or a system device picker, to reach devices on the local network (D4) (Android 17 page).
- **Data safety form:** include what your third-party SDKs collect
  ([data use](https://developer.android.com/privacy-and-security/declare-data-use)).

## Logging

- `Log.*` writes to logcat. Sanitise logging in release builds, log compile-time constants where you can, and let R8
  remove every level below warning
  ([log disclosure](https://developer.android.com/privacy-and-security/risks/log-info-disclosure)). R8 runs only once
  you turn it on for release, with `optimization { enable = true }` from AGP 9.3 or `isMinifyEnabled = true` before it
  ([app optimisation](https://developer.android.com/topic/performance/app-optimization/enable-app-optimization)):

```proguard
# app/src/main/keepRules/strip-logs.keep (or proguard-rules.pro on the old DSL) — R8 drops v, d and i logging
-assumenosideeffects class android.util.Log {
    public static int v(...); public static int d(...); public static int i(...);
}
```

- Release builds keep `android:debuggable` false, which is the default
  ([debuggable](https://developer.android.com/privacy-and-security/risks/android-debuggable)). Crash reports carry an
  opaque user ID, with no personal data in keys or logs (D3, 7.5).

## Testing

- Local tests run on the JVM, with Robolectric when you need Android classes. Instrumented tests run on a device or
  emulator for UI and integration ([fundamentals](https://developer.android.com/training/testing/fundamentals)).
  Drive OS permission dialogs and their denied states (D3) with a UI tool that reaches system UI.
- **No-third-party test (9.9):** install a fresh build on an emulator started with `-tcpdump`
  ([emulator](https://developer.android.com/studio/run/emulator-commandline)), run the flow that taps "Reject all",
  then compare the DNS names looked up with an allowlist: a baseline run without your app, plus your API and backend
  hosts. Review the baseline by hand: on a Google Play image it holds hosts Play services contacts by itself, and as
  the check matches names, not apps, each one also hides your own SDKs' calls to it:

```bash
# tests/privacy/no-third-party-android.sh — fails if the app contacts a host outside allowed-hosts.txt
emulator -avd ci -no-window -no-snapshot -wipe-data -tcpdump cap.pcap &   # -wipe-data: no consent left from a past run
adb wait-for-device shell 'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 1; done'  # "device" comes before boot ends
./gradlew installRelease && adb shell am start -W -n com.example.app/.MainActivity; sleep 30  # needs a release signingConfig
adb emu kill; sleep 3
tshark -r cap.pcap -Y 'dns.flags.response == 0' -T fields -e dns.qry.name | sort -u > hosts.txt
grep -qxF api.example.com hosts.txt || { echo 'No lookup of your API host: the capture missed DNS'; exit 1; }
if grep -vxF -f allowed-hosts.txt hosts.txt; then echo 'Third-party hosts contacted before consent'; exit 1; fi
```

- adb reports `device` before Android has finished booting ([adb](https://developer.android.com/tools/adb)), hence the
  boot wait; the API-host check stops an empty capture from passing. Match DNS names, not TLS SNI: for apps targeting
  Android 17, Encrypted Client Hello can hide SNI (Android 17 page).

## Deployment

- **Target API:** from 31 August 2026, new apps and updates must target Android 16 (API 36)
  ([Play](https://developer.android.com/google/play/requirements/target-sdk)).
- **Developer verification:** enforcement began on 30 September 2026 for some stores and regions, and rolls out
  globally through 2027. Play registers most apps for you; register any you distribute elsewhere
  ([verification](https://developer.android.com/developer-verification)).
- **Store (D3):** build the SDK inventory from the resolved dependencies (`./gradlew :app:dependencies`). It feeds the
  Data safety form, alongside account deletion in the app and through a web link
  ([Play](https://support.google.com/googleplay/android-developer/answer/13327111)) and a review account with the lowest
  role and synthetic data (7.1). The data region is the backend's.
- **eMudhra CA (October 2026):** the Firebase App Distribution Gradle plugin trusted a compromised CA. Update it to
  5.3.1+ (or 4.2.1, 3.2.1); no app republish needed ([Firebase](https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca)).
- **Kotlin:** from 2.4.0, each release line of the standard library for the JVM gets security fixes for 18 months
  ([Kotlin releases](https://kotlinlang.org/docs/releases.html)). Plan the move to 2.5.

## Limits

- No CSP outside WebViews; there, the allowlists above stand in for one.
- Backup behaviour varies by manufacturer: on some devices `android:allowBackup="false"` stops only cloud backup
  ([Auto Backup](https://developer.android.com/identity/data/autobackup)). The exclusion rules are what you can rely
  on.
- Play Integrity's Standard tier allows 10,000 calls a day (App Check page), so attest at sign-in and for risky actions,
  not on every request.

## Sources

- Android security: [exported](https://developer.android.com/privacy-and-security/risks/android-exported) · [intent redirection](https://developer.android.com/privacy-and-security/risks/intent-redirection) · [hardcoded secrets](https://developer.android.com/privacy-and-security/risks/hardcoded-cryptographic-secrets) · [WebView bridges](https://developer.android.com/privacy-and-security/risks/insecure-webview-native-bridges) · [WebView file inclusion](https://developer.android.com/privacy-and-security/risks/webview-unsafe-file-inclusion) · [cleartext](https://developer.android.com/privacy-and-security/risks/cleartext-communications) · [deep links](https://developer.android.com/privacy-and-security/risks/unsafe-use-of-deeplinks) · [log disclosure](https://developer.android.com/privacy-and-security/risks/log-info-disclosure) · [debuggable](https://developer.android.com/privacy-and-security/risks/android-debuggable) · [backups](https://developer.android.com/privacy-and-security/risks/backup-best-practices) · [Keystore](https://developer.android.com/privacy-and-security/keystore)
- Identity and data: [Credential Manager](https://developer.android.com/identity/credential-manager) · [Google Sign-In migration](https://developer.android.com/identity/sign-in/legacy-gsi-migration) · [AndroidX Security releases](https://developer.android.com/jetpack/androidx/releases/security) · [Auto Backup](https://developer.android.com/identity/data/autobackup) · [App Links verification](https://developer.android.com/training/app-links/verify-applinks) · [photo picker](https://developer.android.com/training/data-storage/shared/photopicker) · [declare data use](https://developer.android.com/privacy-and-security/declare-data-use) · [Play Integrity](https://developer.android.com/google/play/integrity/overview)
- Platform and tools: [network security config](https://developer.android.com/privacy-and-security/security-config) · [app optimisation](https://developer.android.com/topic/performance/app-optimization/enable-app-optimization) · [adb](https://developer.android.com/tools/adb) · [boot completion](https://source.android.com/docs/core/perf/boot-times) · [Android 17 changes for targeting apps](https://developer.android.com/about/versions/17/behavior-changes-17) · [Android 17 changes for all apps](https://developer.android.com/about/versions/17/behavior-changes-all) · [target API requirement](https://developer.android.com/google/play/requirements/target-sdk) · [developer verification](https://developer.android.com/developer-verification) · [emulator command line](https://developer.android.com/studio/run/emulator-commandline) · [emulator networking](https://developer.android.com/studio/run/emulator-networking-address) · [testing fundamentals](https://developer.android.com/training/testing/fundamentals) · [App Startup](https://developer.android.com/topic/libraries/app-startup) · [Compose fonts](https://developer.android.com/develop/ui/compose/text/fonts) · [downloadable fonts](https://developer.android.com/develop/ui/views/text-and-emoji/downloadable-fonts) · [Kotlin releases](https://kotlinlang.org/docs/releases.html)
- Google Play and Firebase: [eMudhra CA guide](https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca) · [privacy and auto-init](https://firebase.google.com/support/privacy) · [FCM auto-init](https://firebase.google.com/docs/cloud-messaging/android/client) · [Performance opt-in](https://firebase.google.com/docs/perf-mon/disable-sdk?platform=android) · [account deletion](https://support.google.com/googleplay/android-developer/answer/13327111) · [advertising ID](https://support.google.com/googleplay/android-developer/answer/6048248) · [API keys](https://firebase.google.com/docs/projects/api-keys) · [Analytics data collection](https://firebase.google.com/docs/analytics/android/configure-data-collection) · [Crashlytics opt-in](https://firebase.google.com/docs/crashlytics/android/customize-crash-reports) · [consent mode for apps](https://developers.google.com/tag-platform/security/guides/app-consent) · [App Check quotas](https://firebase.google.com/docs/app-check)
