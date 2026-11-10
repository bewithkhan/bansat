# Swift (iOS)

> **Group:** Mobile · **Covers:** Swift 6.4 with Xcode 27 (27.2) and the iOS 27 SDK. App Store uploads need Xcode 26 or later · **Checked:** 2026-11-05 against the official docs

D3 sets the mobile rules, and this profile says how to meet them natively on iOS. Changed in 2025–2026: apps built with
the iOS 27 SDK must adopt the UIScene life cycle or they won't launch
([TN3187](https://developer.apple.com/documentation/technotes/tn3187-migrating-to-the-uikit-scene-based-life-cycle)).
From iOS 27.2, the App Tracking Transparency (ATT) prompt is a full-page sheet in five EU countries. The age-rating
system changed too, and its new questions were due by 31 January 2026
([requirements](https://developer.apple.com/news/upcoming-requirements/)).

## Access and the isolation test

- **The app is a client.** Access is enforced by the backend: RLS (5.4) for Supabase, Security Rules for Firebase, or
  the 7.2 checks in your own API. Hidden buttons are layer 3 (convenience only).
- **App Attest** (`DCAppAttestService`) lets your server check that a request comes from a genuine copy of your app,
  because a tampered app can lie about checks it runs on itself
  ([App Attest](https://developer.apple.com/documentation/devicecheck/establishing-your-app-s-integrity)). It slows
  scripted abuse. It isn't authorisation.
- **Links reach any screen you route to**, so each screen loads its data as though opened cold, and shows S7 or S11
  from the backend's answer.
- **Isolation test:** run the backend's own test in CI (the 5.4 SQL test, or the Firebase profile's rules test), then
  prove the app's API client gets the same answer with Swift Testing
  ([Swift Testing](https://developer.apple.com/documentation/testing)):

```swift
// AppTests/IsolationTests.swift — local stack seeded with synthetic users A and B (5.5); never production
import Testing
@testable import MyApp

@Test func userACannotReadOrChangeUserBsTask() async throws {
  let api = try await APIClient.signedIn(as: .userA)            // test helper against the local stack
  #expect(try await api.task(id: Seed.taskOfA) != nil)          // control: proves the sign-in worked
  #expect(try await api.task(id: Seed.taskOfB) == nil)          // RLS or rules hide it
  await #expect(throws: APIError.accessDenied) {                // map 0 rows, 403 or permission-denied here
    try await api.renameTask(id: Seed.taskOfB, to: "x")
  }
}
```

## Authentication

- **OAuth and SSO:** use `ASWebAuthenticationSession`, which returns the callback only to the session that started it
  ([docs](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession)), with PKCE.
  Never sign people in inside a `WKWebView`.
- **Sign in with Apple (guideline 4.8):** if a third-party or social login sets up the primary account, also offer an
  equivalent login that limits data to name and email, lets people hide their email, and doesn't track without
  consent. The guideline lists exceptions ([guidelines](https://developer.apple.com/app-store/review/guidelines/)).
- **Passkeys:** `ASAuthorizationPlatformPublicKeyCredentialProvider`. Registration and assertion fail without an
  associated domain using the `webcredentials` service
  ([passkeys](https://developer.apple.com/documentation/authenticationservices/supporting-passkeys)).
- **Tokens** go in the Keychain (D3), with the most restrictive `kSecAttrAccessible` value that works. Items ending in
  `ThisDeviceOnly` aren't migrated to another device, and `SecAccessControlCreateWithFlags` can require biometrics
  ([Keychain](https://developer.apple.com/documentation/security/restricting-keychain-item-accessibility)).
- **Sign-out** deletes the Keychain items, caches and local stores, and the backend revokes the session (7.1).
- **Account deletion (5.1.1(v)):** start it in the app. With Sign in with Apple, revoke the user's tokens through its
  REST API ([deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)).
- **Age (9.12):** the Declared Age Range API returns an age range the person or their parent shares, and you stay
  responsible for legal compliance ([Declared Age Range](https://developer.apple.com/documentation/declaredagerange)).

## Secrets

- D3 applies. Info.plist configures the bundle and ships inside it
  ([Info.plist](https://developer.apple.com/documentation/bundleresources/information-property-list)), along with any
  `.xcconfig` value you reference from it, assets and Swift string literals. None of them are secret.
- The Firebase `GoogleService-Info.plist` key is public by design. Restrict it to Firebase APIs
  ([API keys](https://firebase.google.com/docs/projects/api-keys)).
- To prove "this is my app" to your server, use App Attest rather than an embedded key. Everything privileged runs on
  the server.

## CSRF and XSS

- **CSRF** needs a cookie that's attached automatically. Authenticate API calls with bearer tokens. If the app shares a
  cookie-session web backend, that backend's profile applies.
- **`WKWebView` runs JavaScript by default** (`allowsContentJavaScript` is `true`): switch it off in
  `WKWebpagePreferences` for content that doesn't need it
  ([docs](https://developer.apple.com/documentation/webkit/wkwebpagepreferences/allowscontentjavascript)). List up to
  10 domains under the `WKAppBoundDomains` Info.plist key: web views then refuse script injection, cookie access and
  message handlers unless they set `limitsNavigationsToAppBoundDomains`, which keeps them on those domains
  ([docs](https://developer.apple.com/documentation/webkit/wkwebviewconfiguration/limitsnavigationstoappbounddomains),
  [WebKit](https://webkit.org/blog/10882/app-bound-domains/)). Only the top frame is checked, so third-party iframes
  still load: check `frameInfo` (below). In `decidePolicyFor` allow only your hosts, and open everything else in Safari.
- **Bridges:** in a `WKScriptMessageHandler`, check `message.frameInfo`, the frame that sent the message
  ([docs](https://developer.apple.com/documentation/webkit/wkscriptmessage/frameinfo)), before acting. Treat the body
  as untrusted input.
- **ATS** requires HTTPS with TLS 1.2 or later. Exceptions such as `NSAllowsArbitraryLoads` weaken the app, and some
  need justification at App Review
  ([ATS](https://developer.apple.com/documentation/security/preventing-insecure-network-connections)).
- **Deep links:** use Universal Links (associated domain `applinks:` and an `apple-app-site-association` file)
  ([associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains)). Custom URL
  schemes are an attack vector, and another app can register the same one: validate every parameter, drop malformed
  URLs, and never let a link delete content or reveal personal data
  ([URL schemes](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app)).

## Fonts and assets

- Add font files to the target and list them under `UIAppFonts` ("Fonts provided by application")
  ([custom fonts](https://developer.apple.com/documentation/uikit/adding-a-custom-font-to-your-app)).
- Keep images in the asset catalogue. An `AsyncImage` or `URLSession` load from a third-party host, such as stock
  photos or Gravatar, sends that host the user's IP address. Serve images from your own storage (9.9).

## Consent

- **Start SDKs after the choice.** Initialise analytics, replay and ad SDKs from a consent store, not in `App.init` or
  `application(_:didFinishLaunchingWithOptions:)`.
- **Firebase:** set `FIREBASE_ANALYTICS_COLLECTION_ENABLED` and `FirebaseCrashlyticsCollectionEnabled` to `NO` in
  Info.plist, then call `setAnalyticsCollectionEnabled(true)` and `setCrashlyticsCollectionEnabled(true)` after consent
  ([Analytics](https://firebase.google.com/docs/analytics/ios/configure-data-collection),
  [Crashlytics](https://firebase.google.com/docs/crashlytics/ios/customize-crash-reports)). Cloud Messaging and
  Performance Monitoring start themselves too: set `FirebaseMessagingAutoInitEnabled` and
  `firebase_performance_collection_enabled` to `NO` until consent ([privacy](https://firebase.google.com/support/privacy),
  [FCM](https://firebase.google.com/docs/cloud-messaging/ios/client), [Performance](https://firebase.google.com/docs/perf-mon/disable-sdk)).
  Default Google's consent mode to denied with the `GOOGLE_ANALYTICS_DEFAULT_ALLOW_*` keys, and update it with
  `setConsent` ([consent mode](https://developers.google.com/tag-platform/security/guides/app-consent)).
- **ATT:** call `ATTrackingManager.requestTrackingAuthorization()` while the app is active, with
  `NSUserTrackingUsageDescription`. In France, Germany, Italy, Poland and Romania the system shows a full-page sheet,
  which uses `NSUserTrackingMarkdownUsageDescription` (iOS 27.2+)
  ([key](https://developer.apple.com/documentation/bundleresources/information-property-list/nsusertrackingmarkdownusagedescription)).
  In the EU you may ask again after a year. The system skips the prompt when tracking is restricted or switched off in
  Settings ([ATT](https://developer.apple.com/documentation/apptrackingtransparency/attrackingmanager/requesttrackingauthorization%28completionhandler%3A%29)).
  ATT covers cross-app tracking only; analytics still follows 9.8.
- **Permissions (D3):** request each one at the moment of use, with a purpose string such as
  `NSCameraUsageDescription`, and design the denied state.
- **Privacy manifest (`PrivacyInfo.xcprivacy`):** set `NSPrivacyTracking`, `NSPrivacyCollectedDataTypes` and
  `NSPrivacyAccessedAPITypes`. List tracking hosts in `NSPrivacyTrackingDomains`: without ATT permission, requests to
  them fail ([privacy manifest](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files)). SDKs
  on Apple's list must ship a manifest, and a signature too when you use them as binary dependencies
  ([SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/)).

## Logging

- **`os.Logger` redacts dynamic strings and objects by default, but not integers, floats or Booleans**
  ([logging](https://developer.apple.com/documentation/os/generating-log-messages-from-your-code)). Mark personal
  numbers `privacy: .private`, use `.private(mask: .hash)` when you need to correlate entries, and never mark personal
  data `.public`.
- Crash reports carry an opaque user ID, with no personal data in custom keys or logs (D3, 7.5).

## Testing

- Swift Testing for unit and integration tests, XCTest UI tests for flows and OS permission-denied states (D3), all
  run with `xcodebuild test` in CI.
- **No-third-party test (9.9).** On a test device, turn on the App Privacy Report, install the build fresh, reject
  consent, use the app, then export the report as NDJSON
  ([app activity](https://developer.apple.com/documentation/network/inspecting-app-activity-data)):

```bash
# tests/privacy/check-app-privacy-report.sh <report.ndjson> <install time, UTC, 2026-11-05T09:00:00Z>
# fails on any domain outside allowed-hosts.txt; the report holds seven days, so keep only entries after the install
jq -r --arg since "$2" 'select(.type == "networkActivity" and .bundleID == "com.example.app" and .timeStamp >= $since)
  | .domain' "$1" | sort -u > hosts.txt
grep -qxF api.example.com hosts.txt || { echo 'No contact with your API host: wrong report or time?'; exit 1; }
if grep -vxF -f allowed-hosts.txt hosts.txt; then echo 'Third-party domains contacted before consent'; exit 1; fi
```

- Run it for every release candidate, from a fresh install. Also test that, with ATT denied, requests to your
  `NSPrivacyTrackingDomains` fail.

## Deployment

- **Requirements:** App Store Connect accepts builds made with Xcode 26 or later against an iOS 26 SDK, for iOS 13 or
  later (requirements page). Xcode 27 ships Swift 6.4
  ([Xcode 27](https://developer.apple.com/documentation/xcode-release-notes/xcode-27-release-notes)). Adopt the UIScene
  life cycle before you move to the iOS 27 SDK (TN3187).
- **Files at rest:** the default protection class is "complete until first user authentication". Write C2 and C3 files
  with `.completeFileProtection`
  ([file protection](https://developer.apple.com/documentation/uikit/encrypting-your-app-s-files)),
  and set `isExcludedFromBackup` on files that mustn't reach iCloud backups
  ([backups](https://developer.apple.com/documentation/foundation/optimizing-your-app-s-data-for-icloud-backup)).
- **eMudhra CA (October 2026):** FirebaseFirestore up to 13.1.0 trusted a compromised CA through roots compiled into
  the app. Use 13.1.1 or later (or 12.19.3, the only fix on CocoaPods), republish, and prompt users to update
  ([Firebase](https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca)).
- **Store (D3):** build the SDK inventory from `Package.resolved` (and `Podfile.lock`, if any). It feeds the privacy
  label and manifest, alongside account deletion, the updated age rating and a review account with the lowest role
  and synthetic data (7.1). The data region is the backend's.

## Limits

- No CSP outside `WKWebView`; there, the allowlists above stand in for one.
- `NSPrivacyTrackingDomains` blocks only the domains you list. It isn't a firewall, so the 9.9 test still matters.
- The App Privacy Report runs on a device and is manual, so it can't gate every pull request. Between releases, run
  the UI tests behind a recording proxy on a staging network.
- App Attest isn't supported on every device. Check `isSupported`, and decide what your server accepts from devices
  that can't attest (App Attest page).

## Sources

- Apple platform: [TN3187 UIScene](https://developer.apple.com/documentation/technotes/tn3187-migrating-to-the-uikit-scene-based-life-cycle) · [upcoming requirements](https://developer.apple.com/news/upcoming-requirements/) · [Xcode 27 release notes](https://developer.apple.com/documentation/xcode-release-notes/xcode-27-release-notes) · [Swift Testing](https://developer.apple.com/documentation/testing) · [App Attest](https://developer.apple.com/documentation/devicecheck/establishing-your-app-s-integrity) · [Info.plist](https://developer.apple.com/documentation/bundleresources/information-property-list)
- Identity: [ASWebAuthenticationSession](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession) · [passkeys](https://developer.apple.com/documentation/authenticationservices/supporting-passkeys) · [keychain accessibility](https://developer.apple.com/documentation/security/restricting-keychain-item-accessibility) · [Declared Age Range](https://developer.apple.com/documentation/declaredagerange) · [App Review guidelines](https://developer.apple.com/app-store/review/guidelines/) · [5.1.1(v) account deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion)
- Web content and links: [allowsContentJavaScript](https://developer.apple.com/documentation/webkit/wkwebpagepreferences/allowscontentjavascript) · [app-bound domains](https://developer.apple.com/documentation/webkit/wkwebviewconfiguration/limitsnavigationstoappbounddomains) · [WebKit on app-bound domains](https://webkit.org/blog/10882/app-bound-domains/) · [WKScriptMessage frameInfo](https://developer.apple.com/documentation/webkit/wkscriptmessage/frameinfo) · [ATS](https://developer.apple.com/documentation/security/preventing-insecure-network-connections) · [associated domains](https://developer.apple.com/documentation/xcode/supporting-associated-domains) · [custom URL schemes](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app)
- Privacy: [ATT request](https://developer.apple.com/documentation/apptrackingtransparency/attrackingmanager/requesttrackingauthorization%28completionhandler%3A%29) · [privacy manifest files](https://developer.apple.com/documentation/bundleresources/privacy-manifest-files) · [third-party SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/) · [inspecting app activity](https://developer.apple.com/documentation/network/inspecting-app-activity-data) · [logging](https://developer.apple.com/documentation/os/generating-log-messages-from-your-code) · [file protection](https://developer.apple.com/documentation/uikit/encrypting-your-app-s-files) · [iCloud backup](https://developer.apple.com/documentation/foundation/optimizing-your-app-s-data-for-icloud-backup) · [custom fonts](https://developer.apple.com/documentation/uikit/adding-a-custom-font-to-your-app)
- Firebase and Google: [eMudhra CA guide](https://firebase.google.com/support/guides/compromised-emudhra-intermediate-ca) · [privacy and auto-init](https://firebase.google.com/support/privacy) · [FCM auto-init](https://firebase.google.com/docs/cloud-messaging/ios/client) · [Performance opt-in](https://firebase.google.com/docs/perf-mon/disable-sdk) · [API keys](https://firebase.google.com/docs/projects/api-keys) · [Analytics data collection](https://firebase.google.com/docs/analytics/ios/configure-data-collection) · [Crashlytics opt-in](https://firebase.google.com/docs/crashlytics/ios/customize-crash-reports) · [consent mode for apps](https://developers.google.com/tag-platform/security/guides/app-consent)
