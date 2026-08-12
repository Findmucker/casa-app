# Android App

The Android edition of A Nossa Casinha is a Trusted Web Activity (TWA). The package
opens the production PWA at `https://casa-app-zeta.vercel.app` in a supported
Android browser, preserving Firebase Auth, Firestore, web push, browser storage,
and the server-backed Next.js route handlers.

## Current configuration

| Setting | Value |
|---|---|
| Package ID | `com.findmucker.casa` |
| App version | `1.0.0` (`versionCode` 1) |
| Minimum Android version | API 23 (Android 6.0) |
| Compile/target API | 36 |
| Production origin | `https://casa-app-zeta.vercel.app` |
| Generator | Bubblewrap CLI 1.24.1 |
| Browser fallback | Chrome Custom Tab |

The source of truth is [../android/twa-manifest.json](../android/twa-manifest.json).
The remaining files under `android/` are generated Android Gradle project files.

## Download and test the debug APK

This is the fastest path and does not require Android Studio:

1. Open the repository's **Actions** tab and select **Android APK**.
2. Open the latest successful run for the relevant branch or pull request.
3. Download the `casinha-android-debug-<commit>` artifact.
4. Extract the ZIP and copy `app-debug.apk` to an Android device.
5. Open the APK. Android may ask to allow installs from the browser or file manager;
   grant that temporary permission and complete installation.
6. Launch **Casinha**, sign in, and test navigation, data sync, Google sign-in,
   notifications, invite links, and shared event links.

The artifact is retained for 14 days. It is debug-signed and must not be uploaded
to Google Play. A visible browser bar is expected until the debug certificate is
included in the deployed Digital Asset Links response; all app features remain
testable in that safe fallback mode.

## Build locally

Install these prerequisites:

- Node.js 20 or newer.
- JDK 17.
- Android SDK Platform 36 and Build Tools 36.0.0 (Android Studio can install both).
- A supported Android browser such as Chrome 72 or newer.
- Optional: Android Platform Tools (`adb`) for USB installation and logs.

Then run:

```bash
npm run android:verify
npm run android:build
```

The APK is written to:

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

With USB debugging enabled, install or replace it with:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

## Change Android configuration

1. Edit `android/twa-manifest.json`.
2. Increment `appVersionCode` for every build that may be uploaded to Play. Update
   `appVersion` when the user-visible Android shell changes.
3. Regenerate the project:

   ```bash
   npm run android:update
   ```

4. Review every generated file. Bubblewrap regeneration replaces generated Android
   files and must not be run over uncommitted manual changes.
5. Run `npm run android:verify` and the normal web quality gates.
6. Build the APK locally or let the **Android APK** workflow build it.

The generator is pinned in `package.json`; changing it is a dependency upgrade and
should have its own issue, commit, and clean Android build.

## Digital Asset Links and full-screen verification

A TWA removes browser UI only after Android verifies that the signed app and the
website belong to the same publisher. The app already declares the production web
origin. The website publishes the reverse association at:

```text
https://casa-app-zeta.vercel.app/.well-known/assetlinks.json
```

Set the Vercel environment variable below to a comma- or newline-separated list of
SHA-256 certificate fingerprints:

```env
ANDROID_SHA256_CERT_FINGERPRINTS=AA:BB:...:FF,11:22:...:99
```

Include every certificate used to install a trusted build:

- the local upload certificate for directly installed release APKs;
- the **App signing key certificate** from Play Console for Play-installed builds;
- optionally a developer debug certificate while testing.

Retrieve a local certificate fingerprint with JDK `keytool`:

```bash
keytool -printcert -jarfile path/to/app.apk
```

After changing the Vercel variable, redeploy and confirm that the endpoint returns
`com.findmucker.casa` plus the expected fingerprints. Never publish private keys,
keystores, aliases with passwords, or Play service-account JSON.

For temporary full-screen debugging without deploying a debug fingerprint, Chrome's
documented development override can be enabled on a USB-connected test device. Use
it only on a development device and remove the override afterwards:

```bash
adb shell "echo '_ --disable-digital-asset-link-verification-for-url=\"https://casa-app-zeta.vercel.app\"' > /data/local/tmp/chrome-command-line"
```

Chrome must have **Enable command line on non-rooted devices** enabled in
`chrome://flags`, and Chrome must be force-stopped before relaunching the app.

## Production signing and Play release

Use [Google Play App Signing](https://developer.android.com/studio/publish/app-signing)
and keep the upload key separate from the Play-managed app signing key.

1. Create or select the Play Console application for `com.findmucker.casa`.
   Package IDs cannot be changed after publication.
2. Generate an upload key outside the repository and back it up securely.
3. In Android Studio, choose **Build → Generate Signed Bundle / APK → Android App
   Bundle** and select the upload key.
4. Upload the generated `.aab` to the Play internal testing track first.
5. Copy both SHA-256 fingerprints shown under **Play Console → Setup → App
   integrity** into `ANDROID_SHA256_CERT_FINGERPRINTS` and redeploy Vercel.
6. Install the internal-test build from Play and verify that it opens full-screen,
   deep links stay in the app, notifications arrive, and Google sign-in completes.
7. Promote the tested bundle through the desired Play tracks.

Signing files are ignored by Git. Do not weaken the ignore rules or add signing
values to Gradle files, workflow YAML, documentation, or issue comments.

## Release checklist

- [ ] Android issue exists and the change has its own focused commit.
- [ ] `appVersionCode` is greater than every previously uploaded code.
- [ ] `npm run android:verify` passes.
- [ ] Web typecheck, lint, tests, and production build pass.
- [ ] **Android APK** workflow passes and its artifact installs.
- [ ] Email/password and Google sign-in are tested.
- [ ] Firestore reads/writes and household real-time sync are tested.
- [ ] Push permission, delivery, and notification routing are tested.
- [ ] Invite and public event deep links are tested.
- [ ] Digital Asset Links contains the certificate used by the installed build.
- [ ] No signing key or generated binary is staged in Git.

## Troubleshooting

### Browser bar is visible

The certificate fingerprint does not match the deployed Digital Asset Links response,
or the response has not propagated. Compare the APK fingerprint with the endpoint.
Chrome logs verification details under `OriginVerifier` and `digital_asset_links`.

### Gradle cannot find API 36

Install `platforms;android-36` and `build-tools;36.0.0` with Android Studio's SDK
Manager or `sdkmanager`, then rebuild.

### Notifications are disabled

On Android 13+, grant the app/browser notification permission. In Casinha, open
**Ajuda** to inspect the permission and FCM registration status. Notification state
belongs to the browser profile used by the TWA.

### Web changes do not appear

Confirm the production Vercel deployment completed, then fully close and reopen the
app. The APK is a shell around the production origin; routine web releases do not
require a new Android binary.

Official background material:

- [Trusted Web Activity overview](https://developer.chrome.com/docs/android/trusted-web-activity/)
- [Bubblewrap quick start](https://developer.chrome.com/docs/android/trusted-web-activity/quick-start/)
- [Android signing](https://developer.android.com/studio/publish/app-signing)
