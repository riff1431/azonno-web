import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const envFile = fs.readFileSync(".env.local", "utf-8");
const env = Object.fromEntries(
  envFile
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const idx = l.indexOf("=");
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim().replace(/^["']|["']$/g, "")];
    })
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

async function inspectTables() {
  const { data: settings } = await supabase.from("store_settings").select("key, value");
  console.log("=== ALL STORE_SETTINGS KEYS ===");
  for (const s of settings || []) {
    console.log(`Key: ${s.key} | Type: ${typeof s.value} | IsArray: ${Array.isArray(s.value)} | Length/Size: ${Array.isArray(s.value) ? s.value.length : typeof s.value === 'object' ? Object.keys(s.value || {}).length : 1}`);
  }
}

inspectTables().catch(console.error);
