# React Native and Expo

> **Group:** Mobile · **Covers:** React Native 0.88 with Expo SDK 58 (React 19.3, Expo Router), for iOS 16.4+ and Android 7+ · **Checked:** 2026-11-05 against the official docs

D3 sets the mobile rules, and this profile says how to meet them with Expo, and with bare React Native where it
differs. Expo SDK 58 targets React Native 0.88 and Android API 36, and needs Xcode 26.4+
([versions](https://docs.expo.dev/versions/latest/)). The Expo docs now call EAS **Expo Services** (Build, Updates,
Workflows and Hosting); the CLI is still `eas`.

## Access and the isolation test

- **The app is a client.** Access is enforced by the backend: RLS (5.4) for Supabase, Security Rules for Firebase, or
  the 7.2 checks in your own API.
- **Every screen is a deep link.** Expo Router makes every route deep-linkable automatically
  ([Expo Router](https://docs.expo.dev/router/introduction/)). `Stack.Protected` guards run on the client only, and
  Expo says they don't stand in for checks on the server
  ([protected routes](https://docs.expo.dev/router/advanced/protected/)). Each screen loads its data as though opened
  cold, and shows S7 or S11 from the backend's answer.
- **Isolation test:** run the backend's own test in CI (the 5.4 SQL test, or the Firebase profile's rules test). Then
  prove the app's data layer gets the same answer, with Jest (`jest-expo`) against a local stack. supabase-js returns
  errors rather than throwing ([sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword)), so
  check the sign-in and read A's own rows first, or a failed sign-in passes the test anonymously:

```ts
/** @jest-environment node */
// __tests__/isolation.test.ts — local Supabase stack (supabase start), synthetic users from seed.sql (5.5)
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.LOCAL_SUPABASE_URL!, process.env.LOCAL_SUPABASE_PUBLISHABLE_KEY!);
const [ORG_A, ORG_B] = ['00000000-0000-0000-0000-0000000000a0', '00000000-0000-0000-0000-0000000000b0'];
test("user A can't read or change org B's tasks", async () => {
  const { error } = await sb.auth.signInWithPassword({ email: 'a@test.local', password: process.env.SEED_PASSWORD! });
  expect(error).toBeNull();
  const own = await sb.from('tasks').select('id').eq('organization_id', ORG_A);
  expect(own.data?.length).toBeGreaterThan(0);                     // control: A sees A's own tasks
  const read = await sb.from('tasks').select('id').eq('organization_id', ORG_B);
  expect(read.data).toEqual([]);                                   // RLS hides the rows
  const write = await sb.from('tasks').update({ title: 'x' }).eq('organization_id', ORG_B).select();
  expect(write.data).toEqual([]);                                  // and no row changed
});
```

- Add a Maestro flow that signs in as user A, calls `openLink` with the URL of B's task, and asserts the S11 text.

## Authentication

- **Tokens** go in `expo-secure-store`: the Keychain on iOS, and Shared Preferences encrypted with a Keystore key on
  Android ([SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/)). AsyncStorage is unencrypted and not
  for tokens ([React Native security](https://reactnative.dev/docs/security)). That guide still suggests Encrypted
  Shared Preferences, whose library Google deprecated in 2025
  ([AndroidX](https://developer.android.com/jetpack/androidx/releases/security)).
- **Supabase:** its Expo guide defaults to AsyncStorage. Use the guide's SecureStore variant, `LargeSecureStore`. It
  keeps an AES-256 key in SecureStore and the encrypted session in AsyncStorage, because SecureStore values over about
  2048 bytes can fail ([Supabase guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native)).
- **SecureStore traps:** `keychainAccessible` defaults to `WHEN_UNLOCKED`. Choose `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (or
  `AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` for background refresh) so that items don't migrate to another device
  ([Apple](https://developer.apple.com/documentation/security/restricting-keychain-item-accessibility)). iOS entries
  can survive an uninstall, so clear stale tokens on a fresh install. `requireAuthentication` items become unreadable
  when biometrics change (SecureStore page).
- **OAuth:** use the system browser (`expo-web-browser`, `expo-auth-session`) with PKCE, never a WebView. Custom-scheme
  redirects can be hijacked, which is why PKCE matters (React Native security page).
- **Sign-out** deletes SecureStore entries, caches and offline data, and the backend revokes the session (7.1).

## Secrets

- D3 applies. `EXPO_PUBLIC_*` values are inlined into the bundle as plain text that anyone can read from the built
  app ([environment variables](https://docs.expo.dev/guides/environment-variables/)). Most of the app
  config, `extra` included, is readable at runtime through `Constants.expoConfig`. Check what ships with
  `npx expo config --type public` ([app config](https://docs.expo.dev/workflow/configuration/)).
- An Expo Services variable with **secret** visibility protects build jobs only (an `NPM_TOKEN`, for example). Anything
  you embed in the app is public ([EAS variables](https://docs.expo.dev/eas/environment-variables/)).
- `react-native-config` and `react-native-dotenv` aren't secret stores. Put a function in front of any third-party
  key (React Native security page).

## CSRF and XSS

- **CSRF** needs a cookie that's attached automatically. Authenticate API calls with bearer tokens. If the app shares a
  cookie-session web backend, that backend's profile applies.
- **WebViews (`react-native-webview`)** start permissive: `javaScriptEnabled` defaults to `true`, and `originWhitelist`
  to any `http` or `https` origin. Set `originWhitelist` to your own origins, block the rest in
  `onShouldStartLoadWithRequest` (Android skips it on the first load), and leave `allowFileAccess`,
  `allowUniversalAccessFromFileURLs` and `webviewDebuggingEnabled` off
  ([WebView reference](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md)).
  With `onMessage`, any frame can post. `event.nativeEvent.url` is the sending frame's URL on iOS and its origin on
  current Android WebViews, but the top-level page on older ones, where an iframe passes your check
  ([Android](https://github.com/react-native-webview/react-native-webview/blob/v14.0.1/android/src/main/java/com/reactnativecommunity/webview/RNCWebView.java),
  [iOS](https://github.com/react-native-webview/react-native-webview/blob/v14.0.1/apple/RNCWebViewImpl.m) source).
  Compare origins, keep untrusted iframes out of pages that use `onMessage`, and validate every message.
- **XSS:** React Native's `Text` doesn't parse HTML. The surface is WebViews and HTML-rendering libraries, so sanitise
  on the server first (T-04).
- **Deep links:** prefer Android App Links and iOS Universal Links, set up in app config
  ([linking](https://docs.expo.dev/linking/overview/)), over the custom `scheme`, which any app can register. Never put
  tokens or personal data in a link, and validate every parameter (React Native security page).

## Fonts and assets

- **Embed fonts at build time** with the `expo-font` config plugin, the method Expo recommends, or install an
  `@expo-google-fonts/*` package ([fonts](https://docs.expo.dev/develop/user-interface/fonts/)). `useFonts` also accepts
  a remote URL, the escape hatch that sends users' IP addresses to the font host. Don't use it.
- Load images with `require('./assets/…')`. A remote image from a third-party host leaks the IP address too, so serve
  images from your own storage (9.9).
- OTA updates download JavaScript and assets from your update server. Add it to the 9.9 allowlist.

## Consent

- **Firebase:** the JS SDK has no Analytics or Crashlytics for mobile apps, so those come from React Native Firebase
  ([Expo Firebase guide](https://docs.expo.dev/guides/using-firebase/)). In `firebase.json`, set
  `analytics_auto_collection_enabled`, every `analytics_default_allow_*` (consent mode, written to both platforms),
  `crashlytics_auto_collection_enabled`, `messaging_auto_init_enabled` and `perf_auto_collection_enabled` to `false`
  ([RNFB keys](https://github.com/invertase/react-native-firebase/blob/v27.1.0/packages/app/firebase-schema.json)). After
  the choice, call `setConsent` and `setAnalyticsCollectionEnabled`, and start what the user agreed to
  ([RNFB Analytics](https://github.com/invertase/react-native-firebase/blob/main/docs/analytics/usage/index.mdx),
  [consent mode](https://developers.google.com/tag-platform/security/guides/app-consent)).
- **Other SDKs:** initialise them in an effect that waits for the stored choice, never at module top level in
  `app/_layout.tsx`.
- **ATT:** use `expo-tracking-transparency` and set `userTrackingPermission`. On Android the module adds the `AD_ID`
  permission ([tracking transparency](https://docs.expo.dev/versions/latest/sdk/tracking-transparency/)); block it with
  `android.blockedPermissions` if you don't use the advertising ID
  ([permissions](https://docs.expo.dev/guides/permissions/)). From iOS 27.2, five EU countries show a full-page sheet
  that uses `NSUserTrackingMarkdownUsageDescription`, which `userTrackingPermission` doesn't set: add it under
  `ios.infoPlist` ([Apple](https://developer.apple.com/documentation/bundleresources/information-property-list/nsusertrackingmarkdownusagedescription)).
  ATT covers cross-app tracking only; analytics still follows 9.8.
- **Permissions (D3):** ask at the moment of use, set purpose strings through each module's config-plugin options or
  `ios.infoPlist`, and block the ones you don't use (permissions page).
- **Privacy manifest:** declare reasons under `ios.privacyManifests`. Apple doesn't parse every `PrivacyInfo` file in
  static CocoaPods dependencies, so copy those reasons into your app's manifest
  ([Apple privacy](https://docs.expo.dev/guides/apple-privacy/)).

## Logging

- `console.*` calls stay in release bundles. Strip them with `babel-plugin-transform-remove-console`
  ([performance](https://reactnative.dev/docs/performance)), and log through one wrapper with levels.
- The React Native guide warns against sending tokens and personal data to Sentry or Crashlytics (security page). Use
  opaque IDs and scrub breadcrumbs (7.5).
- Export an `ErrorBoundary` from routes to catch render errors, and show S3 with a reference ID
  ([error handling](https://docs.expo.dev/router/error-handling/)).

## Testing

- Unit and component tests: Jest with the `jest-expo` preset ([unit testing](https://docs.expo.dev/develop/unit-testing/))
  and React Native Testing Library ([testing](https://reactnative.dev/docs/testing-overview)). E2E: Maestro, locally or
  on Expo Workflows ([E2E](https://docs.expo.dev/eas/workflows/examples/e2e-tests/)). Test security features in
  development builds, because Expo Go lacks some of them (SecureStore page).
- **No-third-party test (9.9):** capture an Android emulator's DNS lookups from a fresh install, with consent
  rejected, using its `-tcpdump` option ([emulator](https://developer.android.com/studio/run/emulator-commandline)):

```bash
# tests/privacy/no-third-party-android.sh — fails if the app contacts a host outside allowed-hosts.txt
emulator -avd ci -no-window -no-snapshot -wipe-data -tcpdump cap.pcap &   # -wipe-data: no consent left from a past run
adb wait-for-device shell 'while [ "$(getprop sys.boot_completed)" != 1 ]; do sleep 1; done'  # "device" comes before boot ends
adb install app-release.apk && maestro test .maestro/reject-consent.yaml   # fresh install, taps "Reject all"
adb emu kill; sleep 3
tshark -r cap.pcap -Y 'dns.flags.response == 0' -T fields -e dns.qry.name | sort -u > hosts.txt
grep -qxF api.example.com hosts.txt || { echo 'No lookup of your API host: the capture missed DNS'; exit 1; }
if grep -vxF -f allowed-hosts.txt hosts.txt; then echo 'Third-party hosts contacted before consent'; exit 1; fi
```

- adb reports `device` before Android has finished booting ([adb](https://developer.android.com/tools/adb)), hence the
  boot wait; the API-host check stops an empty capture from passing. Seed `allowed-hosts.txt` from a baseline run
  without your app, then add your API, backend and update hosts. Review the baseline by hand: on a Google Play image it
  holds hosts Play services contacts by itself, and as the check matches names, not apps, each one also hides your own
  SDKs' calls to it.
- On iOS, run the same flow on a test device with the App Privacy Report on, export it, and keep `networkActivity`
  entries for your `bundleID` whose `timeStamp` is after the fresh install, since the report holds seven days
  ([app activity](https://developer.apple.com/documentation/network/inspecting-app-activity-data)).

## Deployment

- **OTA updates:** turn on end-to-end code signing for Expo Update, which needs the Production or Enterprise plan, and
  keep the private key out of the repo. Signing stops anyone between you and the device, CDNs and cloud providers
  included, from altering an update ([code signing](https://docs.expo.dev/eas-update/code-signing/)).
- **Metro through `@react-native-community/cli`:** CVE-2025-11953 (critical; on CISA's exploited list since
  5 February 2026) let anyone on the network run commands through the dev server, which binds to external interfaces
  by default. Check `npm ls @react-native-community/cli-server-api`, use 18.0.1, 19.1.2, 20.0.0 or later, and don't run
  the dev server on untrusted networks ([GHSA-399j-vxmf-hjvr](https://github.com/advisories/GHSA-399j-vxmf-hjvr),
  [KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog?field_cve=CVE-2025-11953)).
- **eMudhra CA (October 2026):** iOS apps using Firestore through React Native Firebase trusted a compromised CA. Use
  27.1.0 (Firebase Apple SDK 13.1.1, Swift Package Manager) or 26.4.1 (12.19.3, CocoaPods), then rebuild, republish
  and prompt users to update ([Firebase](https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca),
  [RNFB changelog](https://github.com/invertase/react-native-firebase/blob/v26.4.1/CHANGELOG.md)).
- **Backups:** `expo-secure-store` excludes itself from Android Auto Backup unless you ship your own rules. If you do,
  exclude the `SecureStore` shared-preferences file yourself (SecureStore page).
- **Stores (D3):** build the SDK inventory from the lockfile, including native modules. It feeds the privacy manifest
  and label, the Data safety form and account deletion. The data region is the backend's.

## Limits

- No CSP outside WebViews; Expo Router's web output follows the web rules (7.4).
- Libraries add native permissions and data collection silently, so review each one before you add it (T-12).
- Security features in Expo Go (biometric `requireAuthentication`, links) behave differently from your build: sign off
  on a development or preview build.

## Sources

- React Native: [security](https://reactnative.dev/docs/security) · [performance](https://reactnative.dev/docs/performance) · [testing](https://reactnative.dev/docs/testing-overview) · [versions](https://reactnative.dev/versions)
- Expo: [SDK versions](https://docs.expo.dev/versions/latest/) · [Expo Router](https://docs.expo.dev/router/introduction/) · [protected routes](https://docs.expo.dev/router/advanced/protected/) · [error handling](https://docs.expo.dev/router/error-handling/) · [SecureStore](https://docs.expo.dev/versions/latest/sdk/securestore/) · [environment variables](https://docs.expo.dev/guides/environment-variables/) · [Expo Services variables](https://docs.expo.dev/eas/environment-variables/) · [app config](https://docs.expo.dev/workflow/configuration/) · [linking](https://docs.expo.dev/linking/overview/) · [fonts](https://docs.expo.dev/develop/user-interface/fonts/) · [Firebase](https://docs.expo.dev/guides/using-firebase/) · [tracking transparency](https://docs.expo.dev/versions/latest/sdk/tracking-transparency/) · [permissions](https://docs.expo.dev/guides/permissions/) · [Apple privacy](https://docs.expo.dev/guides/apple-privacy/) · [unit testing](https://docs.expo.dev/develop/unit-testing/) · [E2E with Maestro](https://docs.expo.dev/eas/workflows/examples/e2e-tests/) · [update code signing](https://docs.expo.dev/eas-update/code-signing/)
- Libraries: [react-native-webview reference](https://github.com/react-native-webview/react-native-webview/blob/master/docs/Reference.md) · [its Android messaging](https://github.com/react-native-webview/react-native-webview/blob/v14.0.1/android/src/main/java/com/reactnativecommunity/webview/RNCWebView.java) · [its iOS messaging](https://github.com/react-native-webview/react-native-webview/blob/v14.0.1/apple/RNCWebViewImpl.m) · [RNFB firebase.json keys](https://github.com/invertase/react-native-firebase/blob/v27.1.0/packages/app/firebase-schema.json) · [RNFB changelog](https://github.com/invertase/react-native-firebase/blob/v26.4.1/CHANGELOG.md) · [supabase-js sign-in](https://supabase.com/docs/reference/javascript/auth-signinwithpassword) · [React Native Firebase Analytics](https://github.com/invertase/react-native-firebase/blob/main/docs/analytics/usage/index.mdx) · [Supabase Expo guide](https://supabase.com/docs/guides/getting-started/tutorials/with-expo-react-native) · [GHSA-399j-vxmf-hjvr](https://github.com/advisories/GHSA-399j-vxmf-hjvr) · [CISA KEV](https://www.cisa.gov/known-exploited-vulnerabilities-catalog?field_cve=CVE-2025-11953) · [eMudhra CA guide](https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca)
- Platforms: [adb](https://developer.android.com/tools/adb) · [boot completion](https://source.android.com/docs/core/perf/boot-times) · [keychain accessibility](https://developer.apple.com/documentation/security/restricting-keychain-item-accessibility) · [ATT full-page sheet key](https://developer.apple.com/documentation/bundleresources/information-property-list/nsusertrackingmarkdownusagedescription) · [inspecting app activity](https://developer.apple.com/documentation/network/inspecting-app-activity-data) · [AndroidX Security](https://developer.android.com/jetpack/androidx/releases/security) · [emulator command line](https://developer.android.com/studio/run/emulator-commandline) · [consent mode for apps](https://developers.google.com/tag-platform/security/guides/app-consent)
