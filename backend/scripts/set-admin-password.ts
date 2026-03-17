/**
 * One-time: set or create operator (admin) in Supabase Auth.
 * Uses env vars only (no credentials in code).
 *
 * Usage (from backend folder):
 *   .env에 SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD 설정 후:
 *   npx tsx scripts/set-admin-password.ts
 *
 * - 계정이 있으면 비밀번호만 변경.
 * - 없으면 admin 역할로 새로 생성.
 */
import { createClient } from "@supabase/supabase-js";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, "..", ".env") });

const url = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase();
const newPassword = process.env.ADMIN_PASSWORD ?? "";

if (!url || !serviceRoleKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

if (!email || !newPassword) {
  console.error("Set ADMIN_EMAIL and ADMIN_PASSWORD in .env (never commit .env)");
  process.exit(1);
}

if (newPassword.length < 8) {
  console.error("ADMIN_PASSWORD must be at least 8 characters");
  process.exit(1);
}

const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } });

async function main() {
  const { data: { users }, error: listError } = await admin.auth.admin.listUsers({ perPage: 1000 });
  if (listError) {
    console.error("List users failed:", listError.message);
    process.exit(1);
  }
  const user = users?.find((u) => u.email?.toLowerCase() === email);
  if (user) {
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, { password: newPassword });
    if (updateError) {
      console.error("Update password failed:", updateError.message);
      process.exit(1);
    }
    console.log(`Password for ${email} has been set successfully.`);
    return;
  }
  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email,
    password: newPassword,
    email_confirm: true,
    app_metadata: { role: "admin" },
  });
  if (createError) {
    console.error("Create admin failed:", createError.message);
    process.exit(1);
  }
  console.log(`Admin created: ${createData.user?.email}. You can sign in at /login.`);
}

main();
