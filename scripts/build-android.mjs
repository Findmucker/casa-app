import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = dirname(dirname(fileURLToPath(import.meta.url)));
const androidDirectory = join(repositoryRoot, "android");
const isWindows = process.platform === "win32";
const wrapper = join(
  androidDirectory,
  isWindows ? "gradlew.bat" : "gradlew",
);
const command = isWindows ? wrapper : "sh";
const gradleTasks = process.argv.slice(2);
const args = isWindows
  ? ["--no-daemon", ...(gradleTasks.length > 0 ? gradleTasks : ["assembleDebug"])]
  : [wrapper, "--no-daemon", ...(gradleTasks.length > 0 ? gradleTasks : ["assembleDebug"])];

const result = spawnSync(command, args, {
  cwd: androidDirectory,
  shell: isWindows,
  stdio: "inherit",
});

if (result.error) {
  console.error(result.error.message);
}

process.exit(result.status ?? 1);
