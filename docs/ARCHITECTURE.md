# Architecture

## Product boundary

Casinha is a native Android application. There is no supported web/PWA runtime.

`com.findmucker.casa.MainActivity` owns the foreground window and Jetpack Compose renders the complete product inside the Android process. The application must not introduce TWA, WebView, browser-helper, Custom Tab or browser-hosted product UI.

## Application layers

- `CasaApplication` initializes Firebase for the registered Android application.
- `FirebaseCasaRepository` owns Firebase Authentication, Firestore listeners and mutations.
- `CasaViewModel` owns session/domain state and exposes it to Compose.
- Compose screens render state and invoke ViewModel actions; they do not own Firebase access.
- Weather is loaded directly from Open-Meteo by the native client.

## Data ownership

Firebase remains production infrastructure after the web client retirement.

- `users/{uid}` stores user/profile state.
- `houses/{houseId}` and its subcollections store household data.
- `invites/{code}` supports household joining.
- `fcm_tokens` supports native push delivery.
- historical `gamification` fields may remain for compatible reads, but the active profile UI is intentionally simple.

Firestore rules are the security boundary. Removing the retired web client does not authorize deleting or weakening persisted data/rules.

## Main native flows

`CasaViewModel` restores the Firebase session and represents loading, signed-out, house-setup and ready states. Ready sessions subscribe to house-scoped lists, habits, finances, events, friends and member/profile data using real-time Firestore listeners.

The user-facing destinations are:

1. Início
2. Compras
3. Coisinhas
4. Projetos
5. Rotinas
6. Finanças
7. Calendário
8. Eventos
9. Tempo

Search, house management, invites, neighbours, direct messaging and profiles are native overlays/surfaces around those destinations.

## Profiles

Profiles are deliberately lightweight. The current product exposes essential account/member information and a small selection of basic animal avatars. XP, levels, RPG stats, achievements, loot, equipment and inventory are not active product surfaces.

Historical data may remain stored to avoid destructive migrations.

## Notifications

`CasinhaMessagingService` registers Android FCM tokens, creates system notifications and routes notification taps to the relevant native destination.

Habit reminders also use Android-native scheduling. Remote FCM and local scheduling should remain idempotent and respect completed habit checks.

## Build and distribution

`.github/workflows/android.yml` is the release pipeline.

It verifies Android configuration, runs unit tests and lint, builds a debug APK, and for eligible `master` pushes can build a stable signed beta and distribute it to the private Firebase App Distribution group.

The beta contract is important:

- package ID stays `com.findmucker.casa`;
- the tester signing certificate stays stable;
- version codes increase monotonically;
- signing secrets stay in the protected `android-testers` GitHub environment;
- GitHub authenticates to Google using short-lived OIDC/WIF credentials;
- private signed APKs are distributed through Firebase, not published as public repository artifacts.

## Change guidelines

- Android is the only product client.
- Do not reintroduce a web/PWA client without an explicit product decision.
- Keep Firebase access in the repository layer and state in ViewModels.
- Preserve Firestore compatibility and user data.
- Do not remove historical fields merely because they are no longer visible.
- Keep signing/version identity stable.
- Run `npm run android:verify` and `npm run android:check` for Android changes.
