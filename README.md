# A Nossa Casinha

A Nossa Casinha is an **Android-only** household app for couples and families.

The previous Next.js/PWA client has been retired. The product is maintained as a native Kotlin + Jetpack Compose application in `android/`, backed by Firebase Authentication, Firestore and Firebase Cloud Messaging.

## Product direction

- Android is the only user-facing client.
- There is no supported web/PWA version.
- Firebase remains the source of persisted household data.
- Historical Firestore fields are kept where needed for backwards-compatible reads; old web UI code is not kept in the active repository tree.
- Vercel is retained only as a **headless authenticated FCM sender** used by the Android app. It serves no product pages; `/` intentionally returns 404.

## Main features

- Início dashboard
- Compras
- Coisinhas
- Projetos
- Rotinas
- Finanças
- Calendário
- Eventos
- Tempo
- Search, house management, invites, neighbours and direct messages
- Simple member profiles with basic animal avatars
- Native notifications and local habit reminders
- Native Android event sharing as text, without public web links

## Android stack

- Kotlin
- Jetpack Compose + Material 3
- Firebase Auth
- Cloud Firestore
- Firebase Cloud Messaging
- Credential Manager for Google sign-in
- Open-Meteo for weather
- Minimum Android API 23

## Repository layout

```text
casa-app/
├── android/                       # Native Android application
├── app/api/send-notification/    # Headless authenticated FCM endpoint only
├── lib/firebase-admin.ts         # Server-only Firebase Admin helper
├── scripts/
│   ├── build-android.mjs          # Cross-platform Gradle launcher
│   └── verify-android.mjs         # Android architecture/config guards
├── docs/                          # Product and Android documentation
├── firestore.rules               # Firebase security rules
├── firebase.json                  # Firebase configuration
├── .github/workflows/android.yml  # Build + private beta delivery
└── package.json                   # Android CI + headless endpoint build tooling
```

There are deliberately no dashboard pages, PWA manifest/service worker, browser components or public event pages.

## Local Android development

Prerequisites: JDK 17 and Android SDK 36.

```bash
npm ci
npm run android:verify
npm run android:check
npm run android:build
```

The debug APK is generated at:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

See `docs/ANDROID.md` for signing, Firebase App Distribution and release details.

## Firebase

The Android client connects directly to the existing Firebase project. Keep these backend resources intact when changing or cleaning the repository:

- Authentication users/providers
- Firestore collections and documents
- Firestore security rules
- FCM registration and delivery infrastructure
- Firebase Android application registration
- Firebase App Distribution tester group and signing configuration

Removing the retired web client must never imply deleting Firebase data.

## Headless notification endpoint

Direct member messages need trusted server credentials to send FCM. The Android app therefore calls the authenticated `/api/send-notification` endpoint. The endpoint verifies the caller's Firebase ID token and household membership before sending to another member's registered Android token.

This server endpoint is infrastructure, not a web client. The Vercel root intentionally has no page and returns 404.

## Releases

`master` is the release branch. Android-relevant pushes trigger `.github/workflows/android.yml`.

The workflow:

1. verifies the Android architecture and Firebase identity;
2. runs Android unit tests and lint;
3. builds a debug APK artifact;
4. for eligible pushes to `master`, builds the stable signed beta;
5. distributes that beta to the private Firebase App Distribution group when the `android-testers` environment is enabled.

The signed beta uses stable signing and monotonically increasing version codes so it can update the existing tester installation.

## Historical code

The Git history and `CHANGELOG.md` retain the previous web/PWA implementation for reference. The active repository tree intentionally does not contain or deploy that client.
