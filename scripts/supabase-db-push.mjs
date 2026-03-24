/**
 * Runs `supabase db push` against remote Postgres (no `supabase login` required).
 * Uses --db-url from SUPABASE_DATABASE_URL, or Session pooler (IPv4-friendly):
 *   postgres.<ref>:PASSWORD@aws-0-<region>.pooler.supabase.com:5432
 * Direct db.<ref>.supabase.co is often IPv6-only → set SUPABASE_DB_DIRECT=1 to force it.
 *
 * Optional: `supabase link` runs only if SUPABASE_ACCESS_TOKEN is set.
 *
 * Usage: `npm run supabase:db-push`
 * Optional: SUPABASE_DB_PUSH_INCLUDE_ALL=1 → --include-all
 */
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { spawnSync } from "child_process";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const envPath = join(root, "backend", ".env");

function loadDotEnv(path) {
  const out = {};
  if (!existsSync(path)) return out;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

const fileEnv = loadDotEnv(envPath);
const env = { ...fileEnv, ...process.env };

function projectRefFromUrl(url) {
  if (!url) return null;
  const m = String(url).match(/https?:\/\/([^.]+)\.supabase\.co/i);
  return m ? m[1] : null;
}

const ref = env.SUPABASE_PROJECT_REF || projectRefFromUrl(env.SUPABASE_URL);
const password = env.SUPABASE_DB_PASSWORD;

if (!ref) {
  console.error(
    "[supabase-db-push] Set SUPABASE_URL (https://<ref>.supabase.co) or SUPABASE_PROJECT_REF in backend/.env"
  );
  process.exit(1);
}
if (!password) {
  console.error(
    "[supabase-db-push] Missing SUPABASE_DB_PASSWORD (not API keys).\n" +
      "  → Dashboard → Project Settings → Database → Database password\n" +
      "  backend/.env: SUPABASE_DB_PASSWORD=..."
  );
  process.exit(1);
}

const region = env.SUPABASE_POOLER_REGION || "us-east-1"; // override in backend/.env if push fails (tenant not found)
const directUrl = `postgresql://postgres:${encodeURIComponent(password)}@db.${ref}.supabase.co:5432/postgres`;
const poolerSessionUrl = `postgresql://postgres.${ref}:${encodeURIComponent(password)}@aws-0-${region}.pooler.supabase.com:5432/postgres`;

const dbUrl =
  env.SUPABASE_DATABASE_URL?.trim() ||
  (env.SUPABASE_DB_DIRECT === "1" || env.SUPABASE_DB_DIRECT === "true" ? directUrl : poolerSessionUrl);

function run(label, args) {
  console.log(`[supabase-db-push] ${label}`);
  const r = spawnSync("npx", args, {
    cwd: root,
    stdio: "inherit",
    env,
    shell: process.platform === "win32",
  });
  if (r.error) {
    console.error(r.error);
    process.exit(1);
  }
  if (r.status !== 0 && r.status != null) process.exit(r.status);
}

if (env.SUPABASE_ACCESS_TOKEN) {
  run("link (optional)", ["supabase", "link", "--project-ref", ref, "-p", password, "--yes"]);
}

console.log(
  `[supabase-db-push] Using ${env.SUPABASE_DATABASE_URL?.trim() ? "SUPABASE_DATABASE_URL" : env.SUPABASE_DB_DIRECT === "1" || env.SUPABASE_DB_DIRECT === "true" ? "direct db host" : `session pooler (aws-0-${region})`}`
);

const pushArgs = ["supabase", "db", "push", "--db-url", dbUrl, "--yes"];
if (env.SUPABASE_DB_PUSH_INCLUDE_ALL === "1" || env.SUPABASE_DB_PUSH_INCLUDE_ALL === "true") {
  pushArgs.push("--include-all");
}
run("db push", pushArgs);

console.log("[supabase-db-push] Done.");
