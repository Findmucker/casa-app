import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fromRoot = (...segments) => join(repositoryRoot, ...segments);
const readText = (...segments) => readFileSync(fromRoot(...segments), "utf8");

const appGradle = readText("android", "app", "build.gradle");
const androidWorkflow = readText(".github", "workflows", "android.yml");
const betaCertSha256 = readText("android", "CASINHA_BETA_CERT_SHA256").trim();
const gitignore = readText(".gitignore");
const packageJson = JSON.parse(readText("package.json"));
const packageLock = JSON.parse(readText("package-lock.json"));
const manifest = readText("android", "app", "src", "main", "AndroidManifest.xml");
const mainActivity = readText(
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "findmucker",
  "casa",
  "MainActivity.kt",
);
const repository = readText(
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "findmucker",
  "casa",
  "FirebaseCasaRepository.kt",
);
const firebaseApplication = readText(
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "findmucker",
  "casa",
  "CasaApplication.kt",
);
const dashboardScreen = readText(
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "findmucker",
  "casa",
  "DashboardScreen.kt",
);
const overlayScreens = readText(
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "findmucker",
  "casa",
  "OverlayScreens.kt",
);
const sessionModels = readText(
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "findmucker",
  "casa",
  "SessionModels.kt",
);
const notificationRouting = readText(
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "findmucker",
  "casa",
  "NotificationRouting.kt",
);
const composeSourceDirectory = fromRoot(
  "android",
  "app",
  "src",
  "main",
  "java",
  "com",
  "findmucker",
  "casa",
);
const nativeComposeUi = readdirSync(composeSourceDirectory, { withFileTypes: true })
  .filter((entry) => entry.isFile() && entry.name.endsWith(".kt"))
  .map((entry) => readFileSync(join(composeSourceDirectory, entry.name), "utf8"))
  .filter((source) => /@Composable\b/.test(source))
  .join("\n");

assert.match(appGradle, /applicationId ['"]com\.findmucker\.casa['"]/);
assert.match(appGradle, /minSdk 23/);
assert.match(appGradle, /targetSdk 36/);
assert.match(appGradle, /def casinhaBaseVersionCode = [1-9]\d*/);
assert.match(
  appGradle,
  /def casinhaBaseVersionName = ['"]\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?['"]/i,
);
assert.match(appGradle, /environmentVariable\(['"]CASINHA_VERSION_CODE['"]\)/);
assert.match(appGradle, /environmentVariable\(['"]CASINHA_BUILD_LABEL['"]\)/);
assert.match(appGradle, /versionCode casinhaVersionCode/);
assert.match(appGradle, /versionName casinhaVersionName/);
assert.match(appGradle, /betaSigningConfigured/);
assert.match(appGradle, /environmentVariable\(['"]CASINHA_BETA_STORE_FILE['"]\)/);
assert.match(appGradle, /environmentVariable\(['"]CASINHA_BETA_STORE_PASSWORD['"]\)/);
assert.match(appGradle, /environmentVariable\(['"]CASINHA_BETA_KEY_ALIAS['"]\)/);
assert.match(appGradle, /environmentVariable\(['"]CASINHA_BETA_KEY_PASSWORD['"]\)/);
assert.match(appGradle, /beta\s*\{[\s\S]*?initWith release/);
assert.match(appGradle, /beta\s*\{[\s\S]*?debuggable false/);
assert.doesNotMatch(appGradle, /applicationIdSuffix/);
assert.match(appGradle, /org\.jetbrains\.kotlin\.plugin\.compose/);
assert.match(appGradle, /androidx\.compose\.material3:material3/);
assert.match(appGradle, /com\.google\.firebase:firebase-auth/);
assert.match(appGradle, /com\.google\.firebase:firebase-firestore/);
assert.match(appGradle, /com\.google\.firebase:firebase-messaging/);

assert.match(manifest, /android:name="\.CasaApplication"/);
assert.match(manifest, /android:name="\.MainActivity"/);
assert.match(manifest, /android\.permission\.INTERNET/);
assert.match(manifest, /android\.permission\.POST_NOTIFICATIONS/);
assert.match(manifest, /android\.intent\.category\.LAUNCHER/);
assert.match(manifest, /android:name="\.CasinhaMessagingService"/);
assert.match(manifest, /android:name="\.HabitReminderReceiver"/);
assert.match(mainActivity, /setContent\s*\{/);
assert.match(mainActivity, /CasaApp\(\)/);
assert.match(repository, /FirebaseAuth\.getInstance\(\)/);
assert.match(repository, /FirebaseFirestore\.getInstance\(\)/);
assert.match(repository, /CredentialManager\.create/);
for (const collection of [
  "shopping",
  "priorities_small",
  "priorities_big",
  "habits",
  "habit_checks",
  "expenses",
  "income",
  "savings_goals",
  "events",
  "friends",
]) {
  assert.match(repository + sessionModels, new RegExp(`[\"']${collection}[\"']`));
}
assert.doesNotMatch(
  repository,
  /["']gamification["']|GamificationProfile|LootSlot|InventoryItem|equipItem|unequipItem|observeGamification/,
  "The core Android repository must not read, write, or listen to legacy gamification data.",
);
assert.doesNotMatch(
  sessionModels,
  /GamificationProfile|LootSlot|InventoryItem|AvatarConfig|memberGamification|gamification\s*:/,
  "Live Android session state must not carry legacy gamification models.",
);

const dashboardTabBlock = dashboardScreen.match(
  /enum class DashboardTab[\s\S]*?\{([\s\S]*?)\n\}/,
)?.[1];
assert.ok(dashboardTabBlock, "DashboardTab must remain declared in the native shell.");
assert.deepEqual(
  [...dashboardTabBlock.matchAll(/^[ \t]*[A-Z_]+\(\"([^\"]+)\",\s*\"([^\"]+)\"\)/gm)].map(
    ([, label, emoji]) => `${emoji} ${label}`,
  ),
  [
    "✨ Início",
    "🛒 Compras",
    "🪄 Coisinhas",
    "🏡 Projetos",
    "🧘 Rotinas",
    "💰 Finanças",
    "🗓️ Calendário",
    "🎉 Eventos",
    "🌤️ Tempo",
  ],
  "The native bottom navigation must keep the current Android product structure.",
);
for (const surface of [
  "SEARCH",
  "PROFILE",
  "HISTORY",
  "INVITE",
  "MEMBERS",
  "FRIENDS",
  "MESSAGE",
  "HELP",
]) {
  assert.match(overlayScreens, new RegExp(`\\b${surface}\\b`));
}
assert.match(
  firebaseApplication,
  /1:776757654663:android:723d4443cad6dd283ff422/,
  "The native client must use its registered Firebase Android application ID.",
);
assert.doesNotMatch(firebaseApplication, /:web:/);
assert.match(notificationRouting, /habit-.*DashboardTab\.HABITS/s);
assert.match(notificationRouting, /urgent-shopping.*DashboardTab\.SHOPPING/s);
assert.match(notificationRouting, /new-event.*DashboardTab\.EVENTS/s);

assert.doesNotMatch(
  nativeComposeUi,
  /\bXP\b|\bpoints?\b|\bpontos?\b|\bpts\b|N[ií]vel|\bLevel\b|\bNv\./iu,
  "Native Compose surfaces must not reintroduce points, XP, or level UI.",
);
assert.doesNotMatch(
  nativeComposeUi,
  /\b(?:levelForPoints|pendingLootBoxes|openLootBox|profileTitle|InventoryItem|LootSlot|CasinhaLoot)\b/,
  "Legacy progression, inventory, and equipment helpers must stay out of the native product UI.",
);

assert.match(
  androidWorkflow,
  /ORG_GRADLE_PROJECT_CASINHA_VERSION_CODE=\$\(\(1000 \+ GITHUB_RUN_NUMBER\)\)/,
);
assert.match(
  androidWorkflow,
  /ORG_GRADLE_PROJECT_CASINHA_BUILD_LABEL:\s*test\.\$\{\{ github\.run_number \}\}/,
);
assert.match(
  androidWorkflow,
  /github\.event_name == 'push' && github\.ref == 'refs\/heads\/master'/,
);
assert.match(
  androidWorkflow,
  /github\.event_name == 'workflow_dispatch' && github\.ref == 'refs\/heads\/master' && inputs\.distribute/,
);
assert.match(androidWorkflow, /github\.run_attempt == 1/);
assert.match(androidWorkflow, /github\.repository_id == '1226468580'/);
assert.match(
  androidWorkflow,
  /github\.run_attempt > 1 \|\| \(github\.event_name == 'workflow_dispatch' && !inputs\.distribute\)/,
);
assert.match(
  androidWorkflow,
  /cancel-in-progress: \$\{\{ github\.run_attempt == 1 && \(github\.event_name != 'workflow_dispatch' \|\| inputs\.distribute\) \}\}/,
);
assert.match(androidWorkflow, /environment: android-testers/);
assert.match(androidWorkflow, /needs: debug-apk/);
assert.match(androidWorkflow, /id-token: write/);
assert.match(androidWorkflow, /vars\.ANDROID_DISTRIBUTION_ENABLED/);
assert.match(androidWorkflow, /secrets\.ANDROID_TESTER_KEYSTORE_BASE64/);
assert.match(androidWorkflow, /android\/CASINHA_BETA_CERT_SHA256/);
assert.match(androidWorkflow, /testBetaUnitTest lintBeta assembleBeta/);
assert.match(androidWorkflow, /build\/outputs\/apk\/beta\/app-beta\.apk/);
assert.doesNotMatch(androidWorkflow, /name: casinha-android-beta-/);
assert.match(androidWorkflow, /apksigner.*verify --verbose --print-certs/);
assert.match(androidWorkflow, /package_name.*com\.findmucker\.casa/s);
assert.match(androidWorkflow, /application-debuggable/);
assert.match(androidWorkflow, /google-github-actions\/auth@v3/);
assert.match(
  androidWorkflow,
  /workload_identity_provider: projects\/776757654663\/locations\/global\/workloadIdentityPools\/github-actions\/providers\/github-casa-app/,
);
assert.match(
  androidWorkflow,
  /service_account: github-android-distribution@casa-66668\.iam\.gserviceaccount\.com/,
);
assert.match(
  androidWorkflow,
  /--app 1:776757654663:android:723d4443cad6dd283ff422/,
);
assert.match(androidWorkflow, /--groups casinha-testers/);
assert.equal(packageJson.devDependencies["firebase-tools"], "15.24.0");
assert.equal(
  packageLock.packages[""].devDependencies["firebase-tools"],
  "15.24.0",
);
assert.equal(
  packageLock.packages["node_modules/firebase-tools"].version,
  "15.24.0",
);
assert.match(androidWorkflow, /- "package-lock\.json"/);
assert.match(androidWorkflow, /npm ci --ignore-scripts --omit=optional/);
assert.match(androidWorkflow, /npx --no-install firebase appdistribution:distribute/);
assert.match(androidWorkflow, /> "\$distribution_log" 2>&1/);
assert.match(androidWorkflow, /<redacted-url>/);
assert.doesNotMatch(androidWorkflow, /workflow_run:|pull_request_target:/);
assert.doesNotMatch(androidWorkflow, /FIREBASE_TOKEN|credentials_json/);
assert.deepEqual(
  androidWorkflow.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi),
  ["github-android-distribution@casa-66668.iam.gserviceaccount.com"],
  "Tester addresses must stay in Firebase, never in the workflow.",
);
assert.doesNotMatch(androidWorkflow, /--testers(?:-file)?|FIREBASE_TESTERS/);
assert.match(gitignore, /gha-creds-\*\.json/);
assert.match(gitignore, /^\*\.jks$/m);
assert.match(gitignore, /^\*\.keystore$/m);
assert.match(gitignore, /^\*\.p12$/m);
assert.match(gitignore, /^\/\.local-signing\/$/m);
assert.match(
  betaCertSha256,
  /^(?:[A-F0-9]{2}:){31}[A-F0-9]{2}$/,
  "The public beta signing fingerprint must be a colon-delimited SHA-256 value.",
);

assert.equal(existsSync(fromRoot("android", "twa-manifest.json")), false);

const textExtensions = new Set([".gradle", ".java", ".json", ".kt", ".kts", ".xml"]);
const sourceFiles = [];
function collectTextFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "build" || entry.name === ".gradle") continue;
    const path = join(directory, entry.name);
    if (entry.isDirectory()) collectTextFiles(path);
    else if (textExtensions.has(extname(entry.name))) sourceFiles.push(path);
  }
}
collectTextFiles(fromRoot("android"));
const androidSource = sourceFiles.map((path) => readFileSync(path, "utf8")).join("\n");
assert.doesNotMatch(androidSource, /firebase-appdistribution(?:-api)?:/i);
assert.doesNotMatch(androidSource, /androidbrowserhelper/i);
assert.doesNotMatch(androidSource, /TrustedWebActivity/i);
assert.doesNotMatch(androidSource, /CustomTabs?/i);
assert.doesNotMatch(androidSource, /WebView/i);
assert.doesNotMatch(androidSource, /bubblewrap/i);

const signingFiles = readdirSync(fromRoot("android"), { recursive: true })
  .map(String)
  .filter((path) => /\.(?:jks|keystore|p12)$/i.test(path));
assert.deepEqual(signingFiles, [], "Signing keys must never be committed.");

const baseVersionName = appGradle.match(
  /def casinhaBaseVersionName = ['"]([^'"]+)['"]/,
)?.[1];
const baseVersionCode = Number(
  appGradle.match(/def casinhaBaseVersionCode = (\d+)/)?.[1],
);
const configuredVersionCode = Number(
  process.env.CASINHA_VERSION_CODE ??
    process.env.ORG_GRADLE_PROJECT_CASINHA_VERSION_CODE ??
    baseVersionCode,
);
const buildLabel =
  process.env.CASINHA_BUILD_LABEL ??
  process.env.ORG_GRADLE_PROJECT_CASINHA_BUILD_LABEL;
assert.ok(baseVersionName, "A base Android version name must be declared.");
assert.ok(
  Number.isInteger(configuredVersionCode) &&
    configuredVersionCode >= baseVersionCode &&
    configuredVersionCode <= 2100000000,
  "The effective Android version code must be monotonic and no lower than the base.",
);
assert.ok(
  !buildLabel || /^[A-Za-z0-9.-]+$/.test(buildLabel),
  "The CI build label contains invalid Android version-name characters.",
);
const versionName = buildLabel ? `${baseVersionName}.${buildLabel}` : baseVersionName;
console.log(
  `Native Android configuration verified: com.findmucker.casa ${versionName} (${configuredVersionCode})`,
);
