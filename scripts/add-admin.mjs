import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

function loadDotEnv(dotenvPath = path.resolve(process.cwd(), ".env")) {
  if (!fs.existsSync(dotenvPath)) return;

  for (const line of fs.readFileSync(dotenvPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (!match) continue;

    const [, key, rawValue] = match;
    let value = rawValue;
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadDotEnv();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const inputArg = process.argv[2];

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY. Set these in your environment or in .env."
  );
  process.exit(1);
}

if (!inputArg) {
  console.error("Usage: node scripts/add-admin.mjs <user-id|email>");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

let userId = inputArg;
if (inputArg.includes("@")) {
  const { data, error } = await supabase.auth.admin.listUsers({ email: inputArg });

  if (error) {
    console.error("Error finding user by email:", error.message);
    process.exit(1);
  }
  if (!data?.users?.length) {
    console.error(`No user found for email ${inputArg}`);
    process.exit(1);
  }
  if (data.users.length > 1) {
    console.warn(`Multiple users found for email ${inputArg}; using the first match.`);
  }
  userId = data.users[0].id;
  console.log(`Resolved email ${inputArg} to user ID ${userId}`);
}

const existing = await supabase
  .from("user_roles")
  .select("id")
  .eq("user_id", userId)
  .eq("role", "admin")
  .maybeSingle();

if (existing.error) {
  console.error("Error checking existing admin role:", existing.error.message);
  process.exit(1);
}

if (existing.data) {
  console.log(`User ${userId} already has admin access.`);
  process.exit(0);
}

const result = await supabase
  .from("user_roles")
  .insert([{ user_id: userId, role: "admin" }])
  .select()
  .maybeSingle();

if (result.error) {
  console.error("Error adding admin role:", result.error.message);
  process.exit(1);
}

console.log(`Admin role granted for user ${userId}.`);
