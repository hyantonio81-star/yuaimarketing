/**
 * One-time seed: create admin (and optionally extra user) in Supabase Auth.
 *
 * Usage (from backend folder):
 *   .env에 최소 SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD 설정 후:
 *   npm run seed-users
 *
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
const adminEmail = process.env.SEED_ADMIN_EMAIL;
const adminPassword = process.env.SEED_ADMIN_PASSWORD;
const userEmail = process.env.SEED_USER_EMAIL;
const userPassword = process.env.SEED_USER_PASSWORD;

if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env.");
  process.exit(1);
}

if (!adminEmail || !adminPassword) {
  console.error("Set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in .env");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

async function main() {
  const toCreate: { email: string; password: string; role: string }[] = [
    { email: adminEmail, password: adminPassword, role: "admin" },
  ];
  if (userEmail && userPassword) {
    toCreate.push({ email: userEmail, password: userPassword, role: "user" });
  }

  for (const { email, password, role } of toCreate) {
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role },
    });
    if (error) {
      if (error.message.includes("already been registered")) {
        console.log(`User ${email} already exists, skipping.`);
        continue;
      }
      console.error(`Failed to create ${email}:`, error.message);
      process.exit(1);
    }
    console.log(`Created ${role}: ${email}`);
  }
  console.log("Seed done.");
}

main();
