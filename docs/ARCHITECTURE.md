# Architecture

## Runtime boundaries

- The web client is a Next.js PWA hosted by Vercel.
- The Android client is a separate Kotlin/Jetpack Compose application.
- Both clients use Firebase Authentication and the same house-scoped Firestore data.
- Firebase Admin and secrets stay in authenticated Next.js route handlers.
- GitHub Actions schedules server-side reminders; Vercel provides a daily fallback.

## Native Android runtime

Android launches `com.findmucker.casa.MainActivity`. Compose renders every screen in
the application process. The APK has no TWA, browser helper, Custom Tab, WebView, or
production-origin launcher.

`CasaApplication` initializes the public Firebase client configuration.
`FirebaseCasaRepository` owns authentication, household onboarding, real-time
listeners, and mutations. `CasaViewModel` exposes immutable screen state and removes
Firestore listeners when the session or ViewModel ends. Compose screens contain no
direct Firebase calls.

The Android and web UIs can evolve independently, but stored document fields remain
compatible. Every cross-client schema change must be implemented and tested in both.

## Data ownership

User profiles live at `users/{uid}`. Household data belongs under
`houses/{houseId}` and its subcollections. A signed-in user can access a house only
when their UID is present in `memberUids`. Joining via `invites/{code}` appends the
member and then assigns `houseId` to the user profile, matching the web flow.

Public event access uses a share document rather than exposing arbitrary house IDs.
Weather preferences remain private under `users/{uid}/preferences/weather`.
Firestore rules, not either client, are the security boundary.

## Client data flow

On Android, `CasaViewModel` restores the Firebase session and emits one of four
states: loading, signed out, needs a house, or ready. The ready state starts one
real-time listener for each native collection. Snapshots are mapped to shared
`HouseItem` models and flow into Compose through `StateFlow`.

On web, `HouseIdContext`, `useCollection`, and `CollectionDataContext` provide the
equivalent house scoping and real-time updates.

## Notifications

Web FCM tokens continue to receive server-scheduled reminders. Native Android push
delivery requires an Android Firebase app registration and a dedicated FCM service;
until that release is configured, the native UI does not claim browser notification
delegation. Server-side scheduling and Firestore delivery deduplication are unchanged.

Operational details are in [CRON_SETUP.md](CRON_SETUP.md). Android build and device
operations are in [ANDROID.md](ANDROID.md).

## Change guidelines

- Keep Firebase Admin and secrets out of both clients.
- Preserve house scoping for every collection and query.
- Keep Android Firebase access in the repository layer and UI state in ViewModels.
- Treat the Firestore document shape as a cross-client contract.
- Cover pure state transitions with unit tests and run Android lint on each change.
- Route-handler changes must follow the installed Next.js documentation under
  `node_modules/next/dist/docs`.
