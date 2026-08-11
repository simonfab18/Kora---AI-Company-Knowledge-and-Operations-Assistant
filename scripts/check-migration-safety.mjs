import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const migrationsDir = path.join(root, "supabase", "migrations");
const rollbacksDir = path.join(root, "supabase", "rollbacks");
const configPath = path.join(root, "supabase", "config.toml");
const protectedCutoff = "20260731144716";

function fail(message) {
  console.error(`Migration safety check failed: ${message}`);
  process.exitCode = 1;
}

function timestampOf(file) {
  return file.match(/^(\d{14})_.*\.sql$/)?.[1] ?? null;
}

const migrations = (await readdir(migrationsDir)).filter((file) => file.endsWith(".sql")).sort();
const timestamps = migrations.map(timestampOf);

if (!existsSync(configPath)) {
  fail("supabase/config.toml is missing. Link/configure the Supabase project before adding migrations.");
}

const invalidNames = migrations.filter((file, index) => !timestamps[index]);
if (invalidNames.length) {
  fail(`invalid migration filenames: ${invalidNames.join(", ")}`);
}

const duplicateTimestamps = timestamps.filter((timestamp, index) => timestamp && timestamps.indexOf(timestamp) !== index);
if (duplicateTimestamps.length) {
  fail(`duplicate migration timestamps: ${Array.from(new Set(duplicateTimestamps)).join(", ")}`);
}

for (let index = 1; index < migrations.length; index += 1) {
  if (migrations[index] < migrations[index - 1]) {
    fail(`migration order is unstable around ${migrations[index - 1]} and ${migrations[index]}`);
  }
}

for (const migration of migrations) {
  const timestamp = timestampOf(migration);
  if (!timestamp || timestamp < protectedCutoff) continue;
  const rollback = path.join(rollbacksDir, migration);
  if (!existsSync(rollback)) {
    fail(`rollback file is required for protected migration ${migration}`);
  }
}

const config = await readFile(configPath, "utf8");
if (!config.includes('project_id = "gcunbxduzixilquodcow"')) {
  fail("supabase/config.toml is not linked to the expected project ref.");
}

if (!process.exitCode) {
  console.log(`Migration safety check passed for ${migrations.length} migrations.`);
}
