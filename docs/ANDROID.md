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

## Download and install a debug APK

1. Open GitHub Actions and select **Android APK**.
2. Open a successful run for the desired commit.
3. Download and extract `casinha-android-debug-<commit>`.
4. Transfer `app-debug.apk` to the phone and open it, or install by USB:

   ```bash
   adb install -r android/app/build/outputs/apk/debug/app-debug.apk
   ```

The debug artifact is retained for 14 days and is not suitable for Play Store release.

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
The local debug certificate installed on the Samsung is already registered; CI and
Google Play builds use different certificates and must be registered separately.
Print the debug certificate with:

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
- [Jetpack Compose setup](https://developer.android.com/develop/ui/compose/setup)
- [Android app signing](https://developer.android.com/studio/publish/app-signing)

## Release process

1. Create a focused GitHub issue before changing the Android client.
2. Increment `versionCode` for every artifact that can reach Google Play and update
   `versionName` for user-visible releases.
3. Keep implementation, tests/CI, and docs in focused commits linked to their issues.
4. Run the native verification, tests, lint, and debug build.
5. Generate a signed Android App Bundle using a protected upload key.
6. Test through the Play internal track before promotion.

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

## Troubleshooting

### Google says the app is not configured

Add the installed APK certificate SHA-1/SHA-256 to the Android app in Firebase, verify
the package ID, and rebuild. A debug APK and a Play-installed build normally use
different certificates.

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
