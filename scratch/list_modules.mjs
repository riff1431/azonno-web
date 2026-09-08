import { createClient } from "@supabase/supabase-js";
import fs from "fs";

const env = fs.readFileSync(".env.local", "utf8");
const getEnv = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"));
  return m ? m[1].replace(/["']/g, "").trim() : "";
};

const url = getEnv("NEXT_PUBLIC_SUPABASE_URL");
const key = getEnv("SUPABASE_SERVICE_ROLE_KEY");
const supabase = createClient(url, key);

async function run() {
  const { data, error } = await supabase
    .from("system_modules")
    .select("key, name, category, is_enabled, is_core, status, sort_order")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("DB Error:", error);
    return;
  }

  console.log(`=== TOTAL SYSTEM MODULES IN DB: ${data.length} ===`);
  console.table(data);
}

run();
