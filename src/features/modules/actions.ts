"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import { invalidateSettingsCache } from "@/lib/settings/config-service";

export interface SystemModule {
  id: string;
  key: string;
  name: string;
  category: string;
  description: string;
  icon: string;
  is_enabled: boolean;
  is_core: boolean;
  status: string;
  version: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export async function getSystemModules(): Promise<SystemModule[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("system_modules")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error || !data) {
    return [];
  }
  return data;
}

export async function toggleModuleStatus(
  key: string,
  isEnabled: boolean,
  userId?: string
) {
  const supabase = createAdminClient();

  // Check if core
  const { data: mod } = await supabase
    .from("system_modules")
    .select("is_core, name")
    .eq("key", key)
    .single();

  if (mod?.is_core && !isEnabled) {
    return { error: "Core modules cannot be disabled." };
  }

  const newStatus = isEnabled ? "active" : "inactive";

  const { error } = await supabase
    .from("system_modules")
    .update({
      is_enabled: isEnabled,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("key", key);

  if (error) {
    return { error: error.message };
  }

  // Record audit log
  try {
    await supabase.from("activity_logs").insert({
      user_id: userId || null,
      action: isEnabled ? "enable_module" : "disable_module",
      entity_type: "system_modules",
      entity_id: key,
      metadata: { moduleKey: key, moduleName: mod?.name, isEnabled },
    });
  } catch {}

  invalidateSettingsCache();
  revalidatePath("/checkout");
  revalidatePath("/admin/settings/modules");
  revalidatePath("/admin/settings/features");
  revalidatePath("/admin/payments");
  revalidatePath(`/admin/payments/${key}`);
  revalidatePath("/admin");

  return { success: true };
}

export async function getIntegrationLogs(moduleKey?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from("integration_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (moduleKey) {
    query = query.eq("module_key", moduleKey);
  }

  const { data } = await query;
  return data || [];
}

export async function logIntegrationEvent(input: {
  provider: string;
  moduleKey: string;
  event: string;
  requestId?: string;
  status: "success" | "error";
  message?: string;
  metadata?: Record<string, any>;
}) {
  const supabase = createAdminClient();
  try {
    await supabase.from("integration_logs").insert({
      provider: input.provider,
      module_key: input.moduleKey,
      event: input.event,
      request_id: input.requestId || `req-${Date.now()}`,
      status: input.status,
      message: input.message || null,
      metadata: input.metadata || {},
    });
  } catch {}
}
