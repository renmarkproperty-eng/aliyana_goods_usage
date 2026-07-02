// Usage: node scripts/reset-password.mjs <username> <newPassword>
import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";
import { hash } from "bcryptjs";

// load .env.local manually
for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
  const m = line.match(/^\s*([\w.]+)\s*=\s*(.*)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}

const username = process.argv[2];
const newPassword = process.argv[3];
if (!username || !newPassword) {
  console.error("Usage: node scripts/reset-password.mjs <username> <newPassword>");
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const hashed = await hash(newPassword, 10);
const { data, error } = await supabase
  .from("users")
  .update({ password: hashed })
  .eq("username", username)
  .select("id,username");

if (error) {
  console.error("UPDATE error:", error.message);
  process.exit(1);
}
if (!data || data.length === 0) {
  console.error(`No user with username "${username}"`);
  process.exit(1);
}
console.log("Password updated for:", data);
