# Android

Casinha is a native Kotlin + Jetpack Compose application. Android is the only supported user-facing client.

## Requirements

- JDK 17
- Android SDK 36
- Node.js 20+ for repository verification/release tooling

## Local verification

```bash
npm ci
npm run android:verify
npm run android:check
npm run android:build
```

The debug APK is created at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

## Runtime identity

- application ID: `com.findmucker.casa`
- Firebase Android app: registered native Android identity in project `casa-66668`
- Firebase Auth and Firestore are accessed directly from the native app
- no WebView, TWA, Custom Tab or browser-origin runtime is permitted

## Profile and avatar contract

The Android profile is intentionally simple. Its live product state is limited to user identity fields plus one basic animal avatar.

- name, email and birth date remain normal profile data;
- the avatar is one of the small built-in animal choices;
- the selected animal is stored in `users/{uid}.avatar` and mirrored in `houses/{houseId}.members[].avatar`;
- XP, levels, RPG stats, achievements, inventory, loot and equipment are not part of the live Android product state;
- the client must not open listeners on the legacy `gamification` collection or update it when household activities are completed.

For compatibility, an existing user whose profile does not yet contain a basic animal may perform one one-time read of the historical `gamification/{name}.avatar.animal` value. The mapped animal is then copied into normal profile data. Historical gamification documents are intentionally left untouched and are not used as ongoing runtime state.

## Private beta distribution

`.github/workflows/android.yml` builds and distributes the private Android beta.

For eligible Android-relevant pushes to `master`, the workflow:

1. verifies native configuration;
2. runs unit tests and Android lint;
3. builds a debug APK artifact;
4. checks the `android-testers` environment;
5. builds a signed, non-debuggable beta with a higher version code;
6. verifies package, version and signing certificate;
7. authenticates to Google through GitHub OIDC / Workload Identity Federation;
8. sends the beta to the Firebase App Distribution group `casinha-testers`.

Private distribution is controlled by the `ANDROID_DISTRIBUTION_ENABLED` environment variable and protected signing secrets. Tester identities stay in Firebase and are not committed to this repository.

## Signing and update contract

The beta uses one stable signing identity. Do not replace that key casually: Android only installs a new APK over an existing installation when package identity and signing identity are compatible.

The workflow assigns monotonically increasing tester `versionCode` values in the `100000+` range. This allows a new tester build to update an older tester build.

The public expected certificate SHA-256 is stored in:

```text
android/CASINHA_BETA_CERT_SHA256
```

The private keystore and passwords must never be committed.

## Installing/updating on a phone

For Firebase App Distribution testers:

1. accept the tester invitation with the authorized Google account;
2. open Firebase App Tester;
3. select Casinha;
4. install/update the newest build;
5. confirm Android's installation prompt.

Do not uninstall first unless moving from an older APK signed with a different certificate. Firebase/Firestore data is account-backed and remains on the backend.

## Notifications and reminders

`CasinhaMessagingService` handles FCM messages and notification routing. Habit reminders can also be scheduled locally on Android.

Keep notification actions mapped to native destinations; notification taps must never open a retired web client.

## Release safety

Before changing release infrastructure:

- preserve package `com.findmucker.casa`;
- preserve stable tester signing;
- preserve monotonic version codes;
- keep WIF/OIDC scoped to this repository/environment;
- do not expose private APK URLs or signing material in logs/artifacts;
- keep Firebase data and security rules intact;
- do not reintroduce legacy gamification as live Android state without an explicit product decision.
