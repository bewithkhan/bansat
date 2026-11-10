<a id="appd"></a>
## Appendix D — Stack & project-type profiles

Use these with Part 3. Each profile lists what changes from the web reference stack. A project can match several profiles; a mobile app for a wearable, for example, uses D3 and D4.

These profiles are about the kind of project. For the framework or platform it's built on, the 24 stack profiles in `stacks/` say what changes from the reference: from Laravel, Django and Spring Boot to Flutter, Lovable and Supabase (`stacks/README.md` lists them). On a stack with no profile, the same rules apply: enforce access in the data layer where the database has no RLS (5.4), and treat controllers and route handlers like Server Actions, re-checking authorisation in each one.

### D1 Web app (Next.js + Supabase): the reference

Parts 3–7 as written.

### D2 Progressive web app (PWA)

- **Caching:**
  - The service worker caches static assets only.
  - If personal data must work offline, keep it in IndexedDB scoped to the user.
  - Clear Cache Storage and IndexedDB on sign-out, and version every cache.
- **Background location doesn't exist on the web.** Tracking stops, or becomes unreliable, when the screen locks or the tab is hidden. If driver or worker tracking must continue in the background, use a native or wrapped app with the OS background-location permission, plus a DPIA (9.14).
- **Web push:** ask only after a user action that explains the value. On iOS (16.4+), web push works only for PWAs added to the Home Screen.
- **Updates:** when a new service worker is waiting, show "Update available — refresh".
- **Mandatory states:** S4 (offline) and S12 (queued, syncing, conflict).

### D3 Mobile app (Flutter, React Native, native)

- **No secrets in the binary:** anything you ship can be extracted. Ship only the publishable key; access is enforced by RLS or Security Rules, and privileged work runs on your server or in edge/cloud functions.
- **Local storage:**
  - Keep tokens in the Keychain or Keystore (e.g. `flutter_secure_storage`).
  - Encrypt local databases that hold C2/C3 data (e.g. SQLCipher).
  - Exclude sensitive files from device and cloud backups.
- **SDK inventory:** derive it from `pubspec.yaml` or `package.json`. It feeds iOS privacy manifests and the App Store privacy label (9.25), the Google Play Data safety form and the cookie/SDK register (9.8). Cross-app tracking requires App Tracking Transparency.
- **Permissions:**
  - Request each one at the moment of use, with a clear purpose string (e.g. `NSLocationWhenInUseUsageDescription`, `NSMicrophoneUsageDescription`, `NSBluetoothAlwaysUsageDescription`).
  - Design the "denied" state as well.
- **Firebase backends:**
  - Security Rules are your RLS: never ship test-mode rules, and test the rules with the emulator in CI.
  - Choose the Firestore location (e.g. `europe-west2`, London) at creation; it can't be changed later.
- **Store rules:** in-app account deletion (both stores; Google also needs a web link), age-rating questionnaires, and push permission kept separate from marketing consent.
- **Crash reporting:** no personal data in custom keys or logs, and declare it in the store labels.
- **Extra states:** OS permission denied, update required, and deep links to deleted content (S11).

### D4 Wearables, BLE & connected devices

- **Minimise at the source:** collect only the metrics a feature uses. Raw audio, ECG and continuous vitals are C3.
- **Device states** (add them to the state matrix): pairing, connected, disconnected or out of range, syncing, low battery, firmware updating, Bluetooth permission denied, sensor error.
- **Permissions:**
  - Android 12+: `BLUETOOTH_SCAN` (flagged `neverForLocation` if you don't derive location) and `BLUETOOTH_CONNECT`.
  - iOS: `NSBluetoothAlwaysUsageDescription`.
- **Security:**
  - LE Secure Connections pairing and encrypted sensitive payloads.
  - Signed firmware updates and no default passwords.
  - A published vulnerability disclosure policy (UK PSTI, 9.13).
- **Vendor clouds:**
  - Map exactly where device data goes. Many white-label devices send data to the manufacturer's cloud, often outside the UK/EU.
  - Each such flow needs a DPA, a transfer mechanism (9.17) and a line in the privacy notice. Where the SDK allows a direct device-to-app connection, consider bypassing the vendor cloud.
- **Monitoring other people** (family, carers):
  - The monitored adult gives their own informed consent; a child is told in age-appropriate terms.
  - Sharing is easy to pause or stop, with limits on location precision and history.
  - Recordings may also capture **bystanders**: be transparent with them, and keep only what the feature needs.
- **Selling the hardware:** product compliance goes beyond data. For example: radio equipment conformity (UKCA/CE marking), a PSTI statement of compliance, WEEE and battery obligations. Get product-compliance advice before importing.
- **Health claims:** see the medical device check (9.13). ECG, SpO₂ or "health alert" features marketed for health purposes need particular care.

### D5 Admin panels, CRMs & internal tools (schools, clinics, small businesses)

- **Roles:**
  - Your client is usually the **controller** and you are their **processor**. Sign a DPA with them (9.2), act only on their instructions, and help them meet their duties.
  - **If you're established in the UK or EU, UK/EU GDPR processor duties apply to you even when the client and its users are abroad** (Art. 3(1)).
- **Access:**
  - Least-privilege roles, with MFA for staff.
  - Audit logs for viewing and exporting records.
  - Session timeouts on shared computers.
- **Exports are the biggest leak:** limit CSV/PDF exports to specific roles, log them, and never email attachments that contain personal data.
- **Children's records (pupils):**
  - Parents and guardians see only their own children; staff see only the classes they teach.
  - No pupil data in analytics, and minimal data on fee and finance screens.
- **HR and health records:** separate tables, restricted roles.
- **Local law:** check the client's country. For example, Pakistan had no comprehensive data protection law as of March 2026 (the Personal Data Protection Bill 2023 was not yet passed), though PECA 2016 and the constitutional right to privacy (Art. 14) apply. Build to this blueprint's standard regardless, and agree the hosting region in the DPA.

### D6 Research prototypes & participant data (academic)

- **Ethics approval** comes before collecting any participant data, with a participant information sheet and consent form.
- **Ethics consent is separate from the GDPR lawful basis.** UK universities commonly rely on public task plus Art. 9(2)(j) research safeguards; confirm with the university's DPO.
- **Data management plan:**
  - Use university-approved storage.
  - Pseudonymise at collection, and keep the keys separate.
  - Retain data as the protocol says, and share only through approved repositories or agreements.
- **Vulnerable participants** (e.g. disabled or older people): expect a DPIA and provide accessible consent materials.
- **Sensors that capture people** (cameras, microphones, radar, Wi-Fi sensing) are monitoring:
  - Tell bystanders.
  - Prefer on-device processing and non-identifying sensing.
- **Prototype → product:** research data can't simply be reused for a commercial product. A product needs its own lawful basis, consent where required, and the new-project track.

### D7 Websites, landing pages & waitlists

- **Minimum set:**
  - self-hosted fonts and assets;
  - no analytics or pixels before consent (or UK-exempt analytics with an opt-out);
  - waitlist consent wording and a timestamp (9.11);
  - a privacy notice and company details;
  - the ICO fee if you process personal data electronically.
- **Charities and religious organisations:**
  - Membership, attendance and donation data can reveal **religious beliefs**, which is special category data: collect less and restrict access.
  - Registered charities can use the UK **charity soft opt-in** for supporters (9.11).
  - Keep Gift Aid declarations for as long as HMRC requires.

### D8 AI agents & clinical or decision-support prototypes

- **Data:** synthetic or properly anonymised only, until Parts 8, 9.13, 9.21 and 9.22 are complete.
- **Medical devices:** triage, diagnosis or clinical decision-support software is likely to be a **medical device** (9.13). In the EU, AI in medical devices falls under the AI Act's high-risk rules for regulated products (Annex I), deferred to 2 Aug 2028 by the Digital Omnibus on AI.
- **Design:** human in the loop; log decisions and model versions; evals that include safety-critical cases.

### D9 Hardware or embedded projects with no personal data

- **Which parts apply:** Parts 3, 4, 11 and 12 (architecture, decisions, plan, debugging).
- **When Part 9 switches on:** as soon as a camera, microphone or sensor can capture people, the project processes personal data.

*End of blueprint. Keep it current: an out-of-date blueprint is worse than none.*
