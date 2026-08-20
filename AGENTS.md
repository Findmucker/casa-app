# Casinha agent guidance

This repository is an **Android-only** product.

- User-facing code lives under `android/` and is native Kotlin/Jetpack Compose.
- Do not reintroduce Next.js, React, PWA, WebView, TWA, Custom Tabs or browser-hosted product UI.
- Keep Firebase access in the Android repository layer and UI/session state in ViewModels.
- Preserve Firestore compatibility when changing persisted models; historical fields may remain even when no longer surfaced.
- Run `npm run android:verify` and `npm run android:check` for Android changes.
- Keep the stable beta package/signing/update path intact.
