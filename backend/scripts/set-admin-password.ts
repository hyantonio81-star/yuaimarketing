/**
 * One-time: set password for an existing Supabase Auth user by email.
 * Usage (from backend folder): npx tsx scripts/set-admin-password.ts
 * Requires: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env
 */
import { createClient } from "@supabase/supabase-js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env") });

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = "admin@yuanto.com";
const newPassword = "david1";

if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

async function main() {
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error("List users failed:", listError.message);
    process.exit(1);
  }
  const user = users?.find((u) => u.email === email);
  if (!user) {
    console.error(`User ${email} not found in Supabase Auth.`);
    process.exit(1);
  }
  const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
  if (updateError) {
    console.error("Update password failed:", updateError.message);
    process.exit(1);
  }
  console.log(`Password for ${email} has been set successfully.`);
}

main();
