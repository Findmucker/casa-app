# Native Android app

Casinha for Android is a dedicated Kotlin application built with Jetpack Compose.
It does not open the web product in Chrome, Brave, a Custom Tab, or a WebView.
Firebase Authentication and Firestore are called directly from the Android process.

## Configuration

| Setting | Value |
|---|---|
| Package ID | `com.findmucker.casa` |
| Version | `2.0.1-native` (`versionCode` 3) |
| Minimum Android | API 23 (Android 6.0) |
| Compile/target API | 36 |
| Language and UI | Kotlin 2.1, Jetpack Compose and Material 3 |
| Data and messaging | Firebase Auth, Firestore and Cloud Messaging |
| Firebase Android app ID | `1:776757654663:android:723d4443cad6dd283ff422` |
| Private beta | Firebase App Distribution group `casinha-testers` |
| Beta version range | CI-generated `versionCode` `100000+` |

The hand-maintained Android project is under `android/`. `MainActivity` owns the
foreground UI and `FirebaseCasaRepository` preserves the existing web data model:
`users/{uid}`, `houses/{houseId}`, invites, and house subcollections.

## What is native

- email/password authentication;
- Google account selection through Android Credential Manager;
- household creation and invite-code joining;
- the same nine primary destinations, in the same order as the web client: Início,
  Compras, Coisinhas, Projetos, Rotinas, Finanças, Calendário, Eventos, and Tempo;
- compact search/house/profile header, swipe navigation, and a horizontally scrollable
  native bottom bar;
- real-time Firestore data for the four household lists, habit checks, expenses,
  income, savings goals, events, friends, profile activity, avatar, and inventory;
- native create/update/delete flows for the household lists, finances, savings, and
  events, including the richer fields already stored by the web client;
- native search, history, invites, members, friends, messages, profile, help, house
  rename, and sign-out surfaces;
- activity-based profile achievements plus existing avatar and equipment controls,
  without XP, levels, progressive titles, or point-based loot boxes;
- calendar aggregation and Open-Meteo forecast rendered inside the Android process;
- native FCM delivery, system notification channels, direct routing to the matching
  tab, and local 10-minute habit reminders during each configured two-hour window.

The Android shell deliberately follows the established Casinha visual system: compact
rose header, pale pink/purple background, translucent cards, the original labels and
emojis, and the same information hierarchy. It is a separate implementation, not a
different product skin.

The PWA remains available separately. Installing the PWA and the APK may show two
launcher icons; use the APK labelled **Casinha** for the native client and remove the
PWA from the browser when it is no longer wanted.

## Private beta with Firebase App Distribution

Firebase App Distribution is the normal private testing channel. It sends a signed,
non-debuggable beta APK over the internet/Wi-Fi to the Firebase group
`casinha-testers`. Tester membership is managed in Firebase; do not put names,
addresses, invitation links, or other tester information in source control.

This channel is intentionally not the same as Google Play:

- Firebase sends an invitation for the first release and a notification email for
  each later build distributed to the group;
- testers use Firebase App Tester, or the tester web page, to download the build;
- Android asks the tester to confirm every install or update;
- App Distribution does not silently install or automatically update the app;
- the GitHub Actions debug APK remains a developer fallback, not the tester channel.

### Current rollout status

The workflow is prepared but private delivery is not active yet. The WIF identity
still needs repository authorization and the `android-testers` environment variable
`ANDROID_DISTRIBUTION_ENABLED` must remain `false` until the WIF setup, signing
certificate, Firebase group, and first end-to-end device test are ready. While the
flag is not `true`, the workflow reports a clear skip and preserves the verified
debug artifact. A partially configured secret set, or a missing public fingerprint,
fails instead of publishing an unverifiable build.

### One-time operator setup

1. In Firebase App Distribution, create the private group with alias
   `casinha-testers` and add testers there. Keep tester details only in Firebase.
2. Generate one long-lived beta signing key. Keep the recoverable local source copy
   under `.local-signing/` on the trusted maintainer machine; that entire directory
   and all common keystore extensions are ignored by Git. Back it up securely and
   never commit it. Losing or rotating this key prevents an APK from updating the
   existing beta installation.
3. Register that certificate's SHA-1 and SHA-256 for the Firebase Android app so
   Google sign-in works in the beta. Commit only its public SHA-256 fingerprint to
   `android/CASINHA_BETA_CERT_SHA256`; the verifier and release job use that file to
   reject an APK signed by any unexpected key. A certificate fingerprint identifies
   a public certificate and is not a signing secret.
4. Configure the protected GitHub Environment `android-testers`. Leave its variable
   `ANDROID_DISTRIBUTION_ENABLED` set to `false` while setup is incomplete. Store the
   private beta material only in these four environment secrets, without documenting
   their values:
   - `ANDROID_TESTER_KEYSTORE_BASE64`
   - `ANDROID_TESTER_STORE_PASSWORD`
   - `ANDROID_TESTER_KEY_ALIAS`
   - `ANDROID_TESTER_KEY_PASSWORD`
5. Authorize the repository's GitHub OIDC identity to impersonate the dedicated,
   least-privilege distribution service account through the WIF provider configured
   in `.github/workflows/android.yml`. WIF issues a short-lived credential; do not
   create or store a service-account JSON key or `FIREBASE_TOKEN`. Before enabling
   delivery, the provider condition must require immutable repository ID
   `1226468580`, `refs/heads/master`, and environment `android-testers`; grant
   `roles/iam.workloadIdentityUser` only from that principal set to the dedicated
   service account. The account itself receives only
   `roles/firebaseappdistro.admin`, never Firebase Admin, Editor, or Owner.
6. When every prerequisite is ready, enable the variable and run **Android APK**
   manually from `master` with `distribute` selected. Confirm the workflow, first
   invitation, APK signer, Google login, and installation on both test devices before
   leaving automatic delivery enabled.

### Delivery rules

- An Android-relevant push to `master` automatically runs the verified beta delivery
  job when `ANDROID_DISTRIBUTION_ENABLED=true`.
- A maintainer can start a new manual workflow run only from `master`, with the
  boolean `distribute` input enabled. Re-running an existing Actions run does not
  redistribute its build; this prevents duplicate release emails and reused version
  codes.
- Pull requests build, test, and retain a debug APK but never reach testers.
- Every beta runs native tests and lint, uses the stable beta certificate, verifies
  package `com.findmucker.casa`, signer, non-debuggable mode, and expected version,
  then distributes release notes to `casinha-testers`.
- CI assigns `versionCode = 100000 + github.run_number` and a `beta.<run>` version
  label. This monotonically increasing range lets a newer beta update an older one;
  it must not be reused by lower-priority local artifacts. A failed distribution job
  must be retried as a new manual workflow run, not by re-running an older attempt,
  because Android will reject an older or reused version code after a newer beta.

### First beta installation

1. Connect the phone to Wi-Fi or mobile data and open the Firebase invitation email.
2. Accept the invitation with the Google account that will be used in Firebase App
   Tester. Install App Tester when prompted and allow it to install apps from that
   source if Android asks.
3. If an older native Casinha APK is already installed with another certificate,
   uninstall that native app once. This removes its local session, preferences, and
   permissions, but not the shared house data stored in Firebase. The browser PWA is
   a separate installation and can also be removed if it causes a duplicate icon.
4. In App Tester, download Casinha and confirm the Android installation prompt.
5. Open the app, sign in, confirm the expected house and beta version, allow
   notifications, and run the device checklist below.

### Later beta updates

For each distributed build, Firebase sends a new release email. Open App Tester,
choose the new build, and confirm the Android update. Because the package name and
beta certificate remain stable and the version code increases, it installs over the
existing beta without USB, without another uninstall, and without resetting local
app state. An `INSTALL_FAILED_UPDATE_INCOMPATIBLE` error indicates a certificate
mismatch and should stop the release for investigation; repeated uninstalling is not
the normal update process.

## Download and install a debug APK (developer fallback)

1. Open GitHub Actions and select **Android APK**.
2. Open a successful run for the desired commit.
3. Download and extract `casinha-android-debug-<commit>`.
4. Transfer `app-debug.apk` to the phone and open it, or install by USB:

   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

The debug artifact is retained for 14 days. Its ephemeral debug signature is not a
stable tester update path and it is not suitable for Play Store release.

## Build locally

Install JDK 17 or 21 and Android SDK Platform 36 with Build Tools 36.0.0. Set
`JAVA_HOME` and `ANDROID_HOME`, then run from the repository root:

```bash
npm run android:verify
npm run android:check
npm run android:build
```

The APK is written to `android/app/build/outputs/apk/debug/app-debug.apk`.

`android:verify` is an architectural guard: it checks the package, native entry
point, Compose/Firebase dependencies, messaging services, all nine navigation
destinations and supporting surfaces, and rejects Bubblewrap, TWA, Custom Tab,
WebView, browser-helper code, and reintroduction of XP/level UI.

## Native notifications and reminders

Android requests the operating-system notification permission after the first
successful login. `CasinhaMessagingService` registers the device FCM token under
`fcm_tokens/{uid}`, renders data-only messages with native notification channels, and
routes a tap to Início, Compras, Rotinas, Calendário, or Eventos according to its tag.

`HabitReminderScheduler` mirrors each enabled habit reminder with `AlarmManager`.
Before displaying a reminder, the receiver checks the shared `habit_checks`
collection. An incomplete habit repeats every 10 minutes for up to two hours; a
completed habit is skipped for the rest of that day. The server scheduler and its
delivery leases remain the cross-device fallback.

## Firebase setup

The current public Firebase project identifiers are initialized in
`CasaApplication.kt`; no secret or administrator credential is embedded. Firestore
security rules remain the enforcement boundary.

Google sign-in uses the registered Android Firebase application for package
`com.findmucker.casa`. Add the SHA-1 and SHA-256 fingerprints of every signing
certificate and keep the web OAuth client ID passed to Credential Manager current.
Local debug, stable App Distribution beta, and future Google Play builds may use
different certificates and must each be registered separately. Print a local debug
certificate with:

```bash
keytool -list -v -alias androiddebugkey \
  -keystore "$HOME/.android/debug.keystore" -storepass android -keypass android
```

After changing the registered certificates, download the refreshed Firebase Android
configuration or update the equivalent programmatic options. Never commit private
keys, keystores, service-account JSON, or passwords.

Official references:

- [Firebase Authentication on Android](https://firebase.google.com/docs/auth/android/start)
- [Google sign-in with Credential Manager](https://firebase.google.com/docs/auth/android/google-signin)
- [Distribute Android apps with Firebase App Distribution](https://firebase.google.com/docs/app-distribution/android/distribute-cli)
- [Set up an Android App Distribution tester](https://firebase.google.com/docs/app-distribution/get-set-up-as-a-tester?platform=android)
- [Workload Identity Federation for deployment pipelines](https://cloud.google.com/iam/docs/workload-identity-federation-with-deployment-pipelines)
- [Jetpack Compose setup](https://developer.android.com/develop/ui/compose/setup)
- [Android app signing](https://developer.android.com/studio/publish/app-signing)

## Release process

1. Create a focused GitHub issue before changing the Android client.
2. Update the checked-in base `versionName` for user-visible releases. CI reserves
   monotonically increasing build codes; private betas use the `100000+` range.
3. Keep implementation, tests/CI, and docs in focused commits linked to their issues.
4. Run the native verification, tests, lint, and debug build.
5. Merge Android changes to `master`; when private distribution is enabled, the
   workflow sends the signed beta automatically. For a deliberate later delivery,
   start a new manual workflow run from `master` with `distribute` enabled; do not
   use **Re-run jobs** on an existing run.
6. Install the beta on both registered test devices, complete the checklist, and
   record the tested version and outcome in the issue.

### Future Google Play Internal Testing

Firebase App Distribution is appropriate for the current private beta, but it still
requires a tester to accept Android's install confirmation for each release. Google
Play Internal Testing remains the next release step for Play-managed installation
and real automatic updates. That migration requires a protected upload key, Play App
Signing, an Android App Bundle, Play certificate fingerprints registered in Firebase,
and a version-code plan above every relevant installed build. If the Play signing
certificate is not compatible with the beta certificate, testers will need one
explicit uninstall/reinstall during that later migration; document and schedule it
rather than presenting it as a routine update.

Official reference: [Set up an internal test](https://support.google.com/googleplay/android-developer/answer/9845334).

## Device test checklist

- [ ] `adb shell am start -n com.findmucker.casa/.MainActivity` opens the app itself.
- [ ] The foreground package is `com.findmucker.casa`, not a browser.
- [ ] Existing email/password login reaches the correct house.
- [ ] Google login shows the native Android account chooser and reaches the same house.
- [ ] Creating or joining a house writes compatible Firestore documents.
- [ ] Each dashboard collection loads and updates in real time.
- [ ] The bottom bar shows all nine tabs in the documented order and supports swipe.
- [ ] Search, house menu, profile, history, invite, members, friends, messages, and
      help all open without leaving `com.findmucker.casa`.
- [ ] Profile and member cards contain no XP, points, level, progressive title, or
      point-based loot-box controls; avatar and existing inventory still work.
- [ ] Add, complete/status/check, and delete actions persist after relaunch.
- [ ] Finance, calendar, events, and weather show the existing shared-house data.
- [ ] The Android notification permission is granted and an FCM token exists for the
      signed-in user with `platform: android`.
- [ ] A notification appears with Casinha branding and tapping it opens the matching
      native tab without launching a browser.
- [ ] A configured habit reminder stops after the habit is checked for that day.
- [ ] Compare login, dashboard, cards, spacing, colors, labels, and emojis with the web
      client at the same 720 px viewport.
- [ ] Back and system navigation do not open a browser.
- [ ] The app information screen shows the expected beta version and an update installs
      over the previous beta without an uninstall.

## Troubleshooting

### Google says the app is not configured

Add the installed APK certificate SHA-1/SHA-256 to the Android app in Firebase, verify
the package ID, and rebuild. A debug APK and a Play-installed build normally use
different certificates.

### A beta update will not install

Confirm that the new APK has a higher `versionCode` and the same SHA-256 signing
certificate as the installed beta. The CI signer check is authoritative. Do not
replace the stable key or ask testers to uninstall for normal updates; restore the
correct signing configuration and rebuild.

### Gradle cannot find API 36

Install `platforms;android-36` and `build-tools;36.0.0` using Android Studio or
`sdkmanager`, then check that `ANDROID_HOME` points to that SDK.

### There are two Casinha icons

One is the old browser-installed PWA. Long-press it, open app information, and
uninstall it. The dedicated APK is package `com.findmucker.casa`.

### Notifications do not appear

Open Android Settings → Apps → Casinha → Notifications and allow notifications. Then
open Casinha while signed in so the FCM token and local habit alarms are refreshed.
Samsung battery restrictions can delay alarms; allow background activity for Casinha
when reliable habit reminders are required.
