import assert from "node:assert/strict";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fromRoot = (...segments) => join(repositoryRoot, ...segments);
const readText = (...segments) => readFileSync(fromRoot(...segments), "utf8");

const appGradle = readText("android", "app", "build.gradle");
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

assert.match(appGradle, /applicationId ['"]com\.findmucker\.casa['"]/);
assert.match(appGradle, /minSdk 23/);
assert.match(appGradle, /targetSdk 36/);
assert.match(appGradle, /versionCode [1-9]\d*/);
assert.match(appGradle, /versionName ['"]\d+\.\d+\.\d+(?:-[a-z0-9.-]+)?['"]/i);
assert.match(appGradle, /org\.jetbrains\.kotlin\.plugin\.compose/);
assert.match(appGradle, /androidx\.compose\.material3:material3/);
assert.match(appGradle, /com\.google\.firebase:firebase-auth/);
assert.match(appGradle, /com\.google\.firebase:firebase-firestore/);

assert.match(manifest, /android:name="\.CasaApplication"/);
assert.match(manifest, /android:name="\.MainActivity"/);
assert.match(manifest, /android\.permission\.INTERNET/);
assert.match(manifest, /android\.intent\.category\.LAUNCHER/);
assert.match(mainActivity, /setContent\s*\{/);
assert.match(mainActivity, /CasaApp\(\)/);
assert.match(repository, /FirebaseAuth\.getInstance\(\)/);
assert.match(repository, /FirebaseFirestore\.getInstance\(\)/);
assert.match(repository, /CredentialManager\.create/);

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
assert.doesNotMatch(androidSource, /androidbrowserhelper/i);
assert.doesNotMatch(androidSource, /TrustedWebActivity/i);
assert.doesNotMatch(androidSource, /CustomTabs?/i);
assert.doesNotMatch(androidSource, /WebView/i);
assert.doesNotMatch(androidSource, /bubblewrap/i);

const signingFiles = readdirSync(fromRoot("android"), { recursive: true })
  .map(String)
  .filter((path) => /\.(?:jks|keystore|p12)$/i.test(path));
assert.deepEqual(signingFiles, [], "Signing keys must never be committed.");

const versionName = appGradle.match(/versionName ['"]([^'"]+)['"]/)?.[1];
const versionCode = appGradle.match(/versionCode (\d+)/)?.[1];
console.log(
  `Native Android configuration verified: com.findmucker.casa ${versionName} (${versionCode})`,
);
