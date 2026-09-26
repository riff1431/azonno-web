import { createAdminClient } from "@/lib/supabase/admin";
import { encrypt, decrypt, maskSecret } from "./encryption";

export interface SettingItem {
  id?: string;
  group?: string;
  key: string;
  value: string;
  type?: string;
}

export interface ModuleSettingItem {
  moduleKey: string;
  settingKey: string;
  settingValue: string;
  valueType?: "string" | "number" | "boolean" | "json" | "secret";
  isSecret?: boolean;
  environment?: string;
}

// In-memory cache for ultra-fast server-side lookups with TTL
interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}
const cache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 60 * 1000; // 1 minute default cache

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache<T>(key: string, data: T, ttlMs = CACHE_TTL_MS) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateSettingsCache(prefix?: string) {
  if (!prefix) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
    }
  }
}

/**
 * Read a setting from the public.settings table.
 */
export async function getSetting<T = string>(
  group: string,
  key: string,
  defaultValue?: T
): Promise<T> {
  const cacheKey = `setting:${group}:${key}`;
  const cached = getCached<T>(cacheKey);
  if (cached !== null) return cached;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("value, type")
      .eq("group", group)
      .eq("key", key)
      .single();

    if (!data) return defaultValue as T;

    let parsed: any = data.value;
    if (data.type === "boolean") parsed = data.value === "true";
    if (data.type === "number") parsed = Number(data.value);
    if (data.type === "json") {
      try {
        parsed = JSON.parse(data.value);
      } catch {
        parsed = defaultValue;
      }
    }

    setCache(cacheKey, parsed);
    return parsed as T;
  } catch {
    return defaultValue as T;
  }
}

/**
 * Get all settings for a specific group.
 */
export async function getSettingsByGroup(group: string): Promise<Record<string, any>> {
  const cacheKey = `group:${group}`;
  const cached = getCached<Record<string, any>>(cacheKey);
  if (cached !== null) return cached;

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("settings")
      .select("key, value, type")
      .eq("group", group);

    const result: Record<string, any> = {};
    if (data) {
      for (const item of data) {
        let val: any = item.value;
        if (item.type === "boolean") val = item.value === "true";
        if (item.type === "number") val = Number(item.value);
        if (item.type === "json") {
          try {
            val = JSON.parse(item.value);
          } catch {
            val = item.value;
          }
        }
        result[item.key] = val;
      }
    }
    setCache(cacheKey, result);
    return result;
  } catch {
    return {};
  }
}

/**
 * Update multiple settings in public.settings.
 */
export async function updateGroupSettings(
  group: string,
  settings: Record<string, any>,
  updatedBy?: string
) {
  const supabase = createAdminClient();

  const updates = Object.entries(settings).map(([key, val]) => {
    let type = "string";
    let stringVal = String(val);

    if (typeof val === "boolean") {
      type = "boolean";
      stringVal = val ? "true" : "false";
    } else if (typeof val === "number") {
      type = "number";
      stringVal = String(val);
    } else if (typeof val === "object" && val !== null) {
      type = "json";
      stringVal = JSON.stringify(val);
    }

    return {
      group,
      key,
      value: stringVal,
      type,
      updated_at: new Date().toISOString(),
    };
  });

  for (const update of updates) {
    await supabase.from("settings").upsert(update, { onConflict: "group,key" });
  }

  // Audit log
  try {
    await supabase.from("activity_logs").insert({
      user_id: updatedBy || null,
      action: "update_settings",
      entity_type: "settings",
      entity_id: group,
      metadata: { group, keys: Object.keys(settings) },
    });
  } catch {}

  invalidateSettingsCache(`group:${group}`);
  invalidateSettingsCache(`setting:${group}`);
}

/**
 * Check if a system module is enabled.
 */
export async function isModuleEnabled(moduleKey: string): Promise<boolean> {
  const cacheKey = `module_enabled:${moduleKey}`;
  const cached = getCached<boolean>(cacheKey);
  if (cached !== null) return cached;

  const defaultEnabledKeys = ["cod", "bkash", "nagad", "sslcommerz"];

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("system_modules")
      .select("is_enabled")
      .eq("key", moduleKey)
      .single();

    let enabled: boolean;
    if (data && typeof data.is_enabled === "boolean") {
      enabled = data.is_enabled;
    } else {
      enabled = defaultEnabledKeys.includes(moduleKey);
    }

    setCache(cacheKey, enabled);
    return enabled;
  } catch {
    const fallback = defaultEnabledKeys.includes(moduleKey);
    return fallback;
  }
}

/**
 * Get all module settings for a given moduleKey.
 * Secret values are masked for client safety unless explicitly requested with includeSecrets = true.
 */
export async function getModuleSettings(
  moduleKey: string,
  environment = "all",
  includeSecrets = false
): Promise<Record<string, any>> {
  const cacheKey = `module_settings:${moduleKey}:${environment}:${includeSecrets}`;
  const cached = getCached<Record<string, any>>(cacheKey);
  if (cached !== null) return cached;

  try {
    const supabase = createAdminClient();
    let query = supabase
      .from("module_settings")
      .select("setting_key, setting_value, value_type, is_secret, environment")
      .eq("module_key", moduleKey);

    if (environment !== "all") {
      query = query.in("environment", ["all", environment]);
    }

    const { data } = await query.order("updated_at", { ascending: true });
    const result: Record<string, any> = {};

    if (data) {
      // First pass: detect if there is an explicit environment setting (e.g. 'live' or 'sandbox')
      const envRow = data.find((r) => r.setting_key === "environment");
      const targetEnv = envRow ? String(envRow.setting_value) : environment;

      // Sort so fallback/sandbox settings are processed first, and targetEnv / 'all' override them
      const sorted = [...data].sort((a, b) => {
        const getScore = (env: string) => {
          if (env === targetEnv) return 3;
          if (env === "all") return 2;
          return 1;
        };
        return getScore(a.environment) - getScore(b.environment);
      });

      for (const row of sorted) {
        let val: any = row.setting_value;

        if (row.is_secret) {
          if (includeSecrets) {
            try {
              val = decrypt(row.setting_value);
            } catch {
              val = row.setting_value;
            }
          } else {
            val = maskSecret(row.setting_value ? "existing_secret_mask" : "");
          }
        } else if (row.value_type === "boolean") {
          val = row.setting_value === "true";
        } else if (row.value_type === "number") {
          val = Number(row.setting_value);
        } else if (row.value_type === "json") {
          try {
            val = JSON.parse(row.setting_value);
          } catch {
            val = row.setting_value;
          }
        }

        result[row.setting_key] = val;
      }
    }

    setCache(cacheKey, result);
    return result;
  } catch {
    return {};
  }
}

/**
 * Save settings for a specific module, encrypting secrets server-side.
 */
export async function saveModuleSettings(
  moduleKey: string,
  settings: Record<string, { value: any; isSecret?: boolean; valueType?: string }>,
  environment = "all",
  updatedBy?: string
) {
  const supabase = createAdminClient();

  for (const [settingKey, config] of Object.entries(settings)) {
    // If it's a secret and contains a mask, do not overwrite existing saved secret
    if (config.isSecret && typeof config.value === "string" && config.value.startsWith("••••")) {
      continue;
    }

    let rawVal = String(config.value ?? "");
    let valueType = config.valueType || "string";
    const isSecret = !!config.isSecret;

    if (isSecret && rawVal) {
      rawVal = encrypt(rawVal);
      valueType = "secret";
    } else if (typeof config.value === "boolean") {
      valueType = "boolean";
      rawVal = config.value ? "true" : "false";
    } else if (typeof config.value === "number") {
      valueType = "number";
      rawVal = String(config.value);
    } else if (typeof config.value === "object" && config.value !== null) {
      valueType = "json";
      rawVal = JSON.stringify(config.value);
    }

    await supabase.from("module_settings").upsert(
      {
        module_key: moduleKey,
        setting_key: settingKey,
        setting_value: rawVal,
        value_type: valueType,
        is_secret: isSecret,
        environment,
        updated_at: new Date().toISOString(),
        updated_by: updatedBy || null,
      },
      { onConflict: "module_key,setting_key,environment" }
    );
  }

  // Audit log
  try {
    await supabase.from("activity_logs").insert({
      user_id: updatedBy || null,
      action: "update_module_settings",
      entity_type: "module_settings",
      entity_id: moduleKey,
      metadata: {
        moduleKey,
        environment,
        updatedKeys: Object.keys(settings),
      },
    });
  } catch {}

  invalidateSettingsCache(`module_settings:${moduleKey}`);
}
