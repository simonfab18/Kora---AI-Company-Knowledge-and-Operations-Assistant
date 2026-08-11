import { execFileSync } from "node:child_process";

execFileSync(process.execPath, ["scripts/guard-production-db-push.mjs"], { stdio: "inherit" });
execFileSync("npx", ["supabase", "db", "push"], { stdio: "inherit", shell: process.platform === "win32" });
