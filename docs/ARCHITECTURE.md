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
events, friends, and profile customization/activity. Snapshots are mapped to native
domain models and flow into Compose through `StateFlow`; weather is loaded from
Open-Meteo.

On web, `HouseIdContext`, `useCollection`, and `CollectionDataContext` provide the
equivalent house scoping and real-time updates.

## Progression boundary

XP, points, levels, progressive titles, and automatic loot boxes are not active
product concepts. Both clients may read legacy gamification documents because those
documents also contain activity counters, avatar configuration, inventory, and
equipped cosmetics. They do not display or increment historical progression fields,
and they do not derive rewards from them. This is intentionally non-destructive so a
future progression design starts with product decisions instead of a data migration.

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

## Android build and distribution boundary

The Android runtime does not embed Firebase App Distribution. Distribution is an
external GitHub Actions operation: the existing **Android APK** workflow verifies
pull requests and builds a debug artifact, while its `tester-update` job can create a
signed, non-debuggable beta for the private Firebase group `casinha-testers`.
The signed beta itself is never uploaded as a public GitHub artifact, and Firebase
download URLs are redacted from public workflow logs.

The beta keeps application ID `com.findmucker.casa`, uses one stable tester signing
certificate, and receives a monotonic CI `versionCode` in the `100000+` range. The
stable identity is what lets a later beta install over the previous beta. Moving from
an older APK signed by another certificate requires one uninstall on each test
device; subsequent beta updates do not. Firebase delivers the build over Wi-Fi and
emails the invited testers, but Firebase App Tester and Android still require a
human-confirmed install. Play Internal Testing remains the future boundary for
Play-managed installation and real automatic updates.

Private delivery is master-only: an Android-relevant push to `master` is automatic
after enablement, and `workflow_dispatch` can deliberately distribute only when run
from `master` with its `distribute` input. Pull-request code never reaches testers.
An Actions re-run is also excluded so it cannot reuse a beta version code or send a
duplicate release notification; deliberate redistribution starts a new manual run.
The protected GitHub Environment `android-testers` owns the enable flag, encoded JKS,
and its three access values. `ANDROID_DISTRIBUTION_ENABLED` currently remains
`false` because the WIF repository authorization and first end-to-end device test are
still pending.

GitHub authenticates to Google through Workload Identity Federation and short-lived
OIDC credentials; there is no service-account JSON key or long-lived Firebase token
in the repository or GitHub secrets. The workflow verifies package, signer,
version, and non-debuggable mode before upload. Its expected public certificate
SHA-256 is deliberately versioned in `android/CASINHA_BETA_CERT_SHA256`; it is an
auditable identity, not secret key material. Tester identities remain in Firebase,
not source control. The signing key's recoverable maintainer copy lives only under
the ignored `.local-signing/` directory on a trusted machine, with a secure backup;
the workflow reconstructs its temporary copy from protected environment secrets and
deletes it from the runner.
The external WIF provider must require repository ID `1226468580`, master ref, and
the `android-testers` environment. Only that principal set may impersonate the
dedicated service account, whose project role is limited to
`roles/firebaseappdistro.admin`.

## Change guidelines

- Keep Firebase Admin and secrets out of both clients.
- Preserve house scoping for every collection and query.
- Keep Android Firebase access in the repository layer and UI state in ViewModels.
- Treat the Firestore document shape as a cross-client contract.
- Treat the nine-tab order and visual identity as cross-client product contracts.
- Do not reactivate legacy progression fields without an approved cross-client
  product design and migration plan.
- Cover pure state transitions with unit tests and run Android lint on each change.
- Keep tester PII in Firebase, private signing material in the protected
  `android-testers` environment, and local signing backups under ignored
  `.local-signing/` only. Keep only the public certificate SHA-256 in Git.
- Never replace the stable beta signing key or lower its version-code sequence; both
  are part of the installed-app update contract.
- Route-handler changes must follow the installed Next.js documentation under
  `node_modules/next/dist/docs`.
