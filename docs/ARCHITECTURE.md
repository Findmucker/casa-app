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

The Android and web implementations can evolve independently, but the product shell
and stored document fields remain compatible. The nine destinations, compact header,
bottom-navigation order, labels, emojis, and Casinha visual tokens are cross-client
product contracts. Every schema or navigation change must be implemented and tested
in both.

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
states: loading, signed out, needs a house, or ready. The ready state starts scoped
real-time listeners for the four household collections, habit checks, finances,
events, friends, and gamification. Snapshots are mapped to native domain models and
flow into Compose through `StateFlow`; weather is loaded from Open-Meteo.

On web, `HouseIdContext`, `useCollection`, and `CollectionDataContext` provide the
equivalent house scoping and real-time updates.

## Notifications

Web and Android FCM tokens receive the same data-only server messages. On Android,
`CasinhaMessagingService` stores the device token with `platform: android`, creates a
native system notification, and publishes a one-shot navigation target consumed by
the Compose dashboard. Notification tags map to the relevant native destination, so
opening a notification never delegates to a browser.

Android also mirrors configured habit times through `AlarmManager`. The broadcast
receiver checks `habit_checks` before each alert, repeats incomplete habits every 10
minutes inside a two-hour window, and schedules the next eligible day afterwards.
Server-side scheduling and Firestore delivery deduplication remain the cross-device
fallback and source of remote reminders.

Operational details are in [CRON_SETUP.md](CRON_SETUP.md). Android build and device
operations are in [ANDROID.md](ANDROID.md).

## Change guidelines

- Keep Firebase Admin and secrets out of both clients.
- Preserve house scoping for every collection and query.
- Keep Android Firebase access in the repository layer and UI state in ViewModels.
- Treat the Firestore document shape as a cross-client contract.
- Treat the nine-tab order and visual identity as cross-client product contracts.
- Cover pure state transitions with unit tests and run Android lint on each change.
- Route-handler changes must follow the installed Next.js documentation under
  `node_modules/next/dist/docs`.
