import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const androidDirectory = join(repositoryRoot, "android");
const wrapper = join(
  androidDirectory,
  process.platform === "win32" ? "gradlew.bat" : "gradlew",
);

const result = spawnSync(wrapper, ["--no-daemon", "assembleDebug"], {
  cwd: androidDirectory,
  shell: process.platform === "win32",
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
