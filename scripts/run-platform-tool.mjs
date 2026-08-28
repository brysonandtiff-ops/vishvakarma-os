import { spawnSync } from "node:child_process";

const [tool, ...args] = process.argv.slice(2);

if (!tool) {
  console.error("Missing tool argument.");
  process.exit(2);
}

const isAndroid =
  Boolean(process.env.ANDROID_ROOT) ||
  Boolean(process.env.ANDROID_DATA) ||
  Boolean(process.env.TERMUX_VERSION) ||
  (process.env.PREFIX || "").toLowerCase().includes("com.termux");

if (isAndroid) {
  console.log(`${tool} skipped: Termux Android environment`);
  process.exit(0);
}

const pnpmEntry = process.env.npm_execpath;

if (!pnpmEntry) {
  console.error("npm_execpath unavailable.");
  process.exit(1);
}

const result = spawnSync(
  process.execPath,
  [pnpmEntry, "exec", tool, ...args],
  {
    stdio: "inherit",
    shell: false,
    env: process.env
  }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
