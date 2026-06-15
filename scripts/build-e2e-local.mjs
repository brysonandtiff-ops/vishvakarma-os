import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  VITE_SUPABASE_URL: "",
  VITE_SUPABASE_ANON_KEY: "",
  VITE_E2E_ALLOW_LOCAL_ACCESS: "true",
};

const build = spawnSync("pnpm", ["exec", "vite", "build", "--mode", "e2e-local"], {
  env,
  stdio: "inherit",
  shell: true,
});
process.exit(build.status ?? 1);
