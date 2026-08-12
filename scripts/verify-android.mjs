import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const fromRoot = (...segments) => join(repositoryRoot, ...segments);
const readText = (...segments) => readFileSync(fromRoot(...segments), "utf8");

const twaManifest = JSON.parse(readText("android", "twa-manifest.json"));
const webManifest = JSON.parse(readText("public", "manifest.json"));
const androidGradle = readText("android", "app", "build.gradle");
const androidManifest = readText(
  "android",
  "app",
  "src",
  "main",
  "AndroidManifest.xml",
);

assert.equal(twaManifest.packageId, "com.findmucker.casa");
assert.equal(twaManifest.host, "casa-app-zeta.vercel.app");
assert.equal(twaManifest.webManifestUrl, `https://${twaManifest.host}/manifest.json`);
assert.equal(twaManifest.enableNotifications, true);
assert.equal(twaManifest.fallbackType, "customtabs");
assert.equal(twaManifest.appVersionCode > 0, true);
assert.match(twaManifest.appVersion, /^\d+\.\d+\.\d+$/);

assert.equal(webManifest.id, "/");
assert.equal(webManifest.start_url, twaManifest.startUrl);
assert.equal(webManifest.scope, "/");
assert.equal(webManifest.display, twaManifest.display);
assert.equal(
  webManifest.icons.some((icon) => icon.sizes === "512x512" && icon.purpose.includes("maskable")),
  true,
);

assert.equal(androidGradle.includes(`applicationId "${twaManifest.packageId}"`), true);
assert.equal(androidGradle.includes(`versionCode ${twaManifest.appVersionCode}`), true);
assert.equal(androidGradle.includes(`versionName "${twaManifest.appVersion}"`), true);
assert.equal(androidManifest.includes('android:autoVerify="true"'), true);
assert.equal(androidManifest.includes("DelegationService"), true);

assert.equal(
  existsSync(fromRoot("android", twaManifest.signingKey.path)),
  false,
  "Signing keys must not be committed inside the Android project.",
);

console.log(
  `Android configuration verified: ${twaManifest.packageId} ${twaManifest.appVersion} (${twaManifest.appVersionCode})`,
);
