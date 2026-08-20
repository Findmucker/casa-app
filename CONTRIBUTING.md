# Contributing to A Nossa Casinha

Casinha is maintained as a native Android application.

## Setup

Prerequisites:

- JDK 17
- Android SDK 36
- Node.js 20+ for repository verification/release tooling

```bash
git clone https://github.com/Findmucker/casa-app.git
cd casa-app
npm ci
npm run android:verify
npm run android:check
npm run android:build
```

## Workflow

1. Create a short-lived branch from `master`.
2. Make focused changes under `android/` or the supporting Firebase/build tooling.
3. Preserve Firestore compatibility and existing user data.
4. Run `npm run android:verify` and `npm run android:check`.
5. Use Conventional Commits.
6. Merge only changes intended for the Android product.

## Architecture rules

- The app is native Kotlin/Jetpack Compose.
- Do not add Next.js, React, PWA, WebView, TWA or Custom Tab product surfaces.
- Firebase Auth/Firestore access belongs in the repository layer.
- UI/session state belongs in ViewModels.
- Keep package `com.findmucker.casa` and the registered Firebase Android identity intact.
- Keep Android version codes monotonic for tester/release builds.
- Never commit signing keys, passwords or `android/local.properties`.

## Backend compatibility

Firebase remains production infrastructure even though the web client was retired. Do not delete collections or historical fields just because an old UI no longer uses them. Data migrations must be deliberate and backwards-safe.

## Release verification

Android-related pushes to `master` run `.github/workflows/android.yml`. The workflow verifies configuration, tests/lints the app, builds an APK and can distribute a signed beta through Firebase App Distribution.

See `docs/ANDROID.md` for tester distribution and signing details.
