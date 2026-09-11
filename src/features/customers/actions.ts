"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

const FRAUD_STORE_KEY = "fraud_profiles_store";

export interface AdminCustomer {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: string;
  status: "active" | "blocked";
  is_blocked: boolean;
  blacklist_reason?: string;
  created_at: string;
  order_count: number;
  total_spent: number;
  last_ip_address?: string | null;
}

interface FraudProfile {
  id: string;
  identifier_type: "phone" | "email" | "ip" | "address";
  identifier_value: string;
  risk_score: number;
  cancellation_count: number;
  rejected_delivery_count: number;
  return_abuse_count: number;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  notes?: string;
  updated_at: string;
}

async function getStoredFraudProfiles(): Promise<FraudProfile[]> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("store_settings")
      .select("value")
      .eq("key", FRAUD_STORE_KEY)
      .single();
    if (data && Array.isArray(data.value)) {
      return data.value as FraudProfile[];
    }
  } catch {}
  return [];
}

async function saveStoredFraudProfiles(profiles: FraudProfile[]) {
  try {
    const supabase = createAdminClient();
    await supabase.from("store_settings").upsert(
      {
        key: FRAUD_STORE_KEY,
        value: profiles as any,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "key" }
    );
  } catch {}
}

export async function getAdminCustomers(): Promise<AdminCustomer[]> {
  const supabase = createAdminClient();

  // 1. Fetch profiles with orders
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      phone,
      role,
      created_at,
      orders (
        id,
        total,
        status,
        shipping_address_snapshot
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to fetch customers from profiles:", error);
    return [];
  }

  // 2. Fetch fraud blacklist store to synchronize block status
  const fraudProfiles = await getStoredFraudProfiles();
  const blacklistedValues = new Map<string, string>();
  for (const fp of fraudProfiles) {
    if (fp.is_blacklisted && fp.identifier_value) {
      blacklistedValues.set(fp.identifier_value.trim().toLowerCase(), fp.blacklist_reason || "Blacklisted in Fraud Engine");
      const digitsOnly = fp.identifier_value.replace(/\D/g, "");
      if (digitsOnly) {
        blacklistedValues.set(digitsOnly, fp.blacklist_reason || "Blacklisted in Fraud Engine");
      }
    }
  }

  return (profiles || []).map((p: any) => {
    const orders = p.orders || [];
    const totalSpent = orders.reduce((sum: number, o: any) => sum + Number(o.total || 0), 0);
    const lastOrderWithIp = orders.find((o: any) => o.shipping_address_snapshot?.ip_address);
    const lastIp = lastOrderWithIp?.shipping_address_snapshot?.ip_address || null;

    const cleanEmail = (p.email || "").trim().toLowerCase();
    const cleanPhone = (p.phone || "").replace(/\D/g, "");

    const isEmailBlacklisted = cleanEmail && blacklistedValues.has(cleanEmail);
    const isPhoneBlacklisted = cleanPhone && blacklistedValues.has(cleanPhone);

    const isBlocked =
      Boolean(p.is_blocked) ||
      p.status === "blocked" ||
      Boolean(isEmailBlacklisted) ||
      Boolean(isPhoneBlacklisted);

    const blacklistReason =
      (isEmailBlacklisted ? blacklistedValues.get(cleanEmail) : null) ||
      (isPhoneBlacklisted ? blacklistedValues.get(cleanPhone) : null) ||
      (isBlocked ? "Customer account blocked by Administrator" : undefined);

    return {
      id: p.id,
      email: p.email || "",
      full_name: p.full_name || "",
      phone: p.phone || null,
      role: p.role || "customer",
      status: isBlocked ? "blocked" : "active",
      is_blocked: isBlocked,
      blacklist_reason: blacklistReason,
      created_at: p.created_at,
      order_count: orders.length,
      total_spent: totalSpent,
      last_ip_address: lastIp,
    };
  });
}

/**
 * Admin action: Set a new password for any customer account
 */
export async function adminSetCustomerPassword(userId: string, newPassword: string) {
  if (!userId) {
    return { success: false, error: "Customer ID is required." };
  }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: "Password must be at least 6 characters long." };
  }

  try {
    const supabase = createAdminClient();

    // Update Supabase Auth user password
    const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
      password: newPassword,
    });

    if (authError) {
      console.error("Auth admin password update error:", authError);
      return { success: false, error: authError.message || "Failed to update password." };
    }

    // Update updated_at on profiles table
    try {
      await supabase
        .from("profiles")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", userId);
    } catch {}

    revalidatePath("/admin/customers");
    return { success: true, message: "Password updated successfully." };
  } catch (err: any) {
    console.error("adminSetCustomerPassword exception:", err);
    return { success: false, error: err.message || "An unexpected error occurred." };
  }
}

/**
 * Admin action: Block customer and automatically push to Fraud Blacklist
 */
export async function adminBlockCustomer(customerId: string, reason?: string) {
  if (!customerId) {
    return { success: false, error: "Customer ID is required." };
  }

  const blockReason = reason?.trim() || "Customer blocked by Admin from Customer Directory";

  try {
    const supabase = createAdminClient();

    // 1. Get customer details
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, phone, full_name")
      .eq("id", customerId)
      .maybeSingle();

    if (!profile) {
      return { success: false, error: "Customer profile not found." };
    }

    // 2. Update profile status in profiles table
    try {
      await supabase
        .from("profiles")
        .update({
          is_blocked: true,
          status: "blocked",
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerId);
    } catch (e) {
      console.warn("Could not update is_blocked/status on profiles table:", e);
    }

    // 3. Add to Fraud Blacklist store (phone & email)
    const fraudProfiles = await getStoredFraudProfiles();
    const cleanPhone = (profile.phone || "").replace(/\D/g, "");
    const cleanEmail = (profile.email || "").trim().toLowerCase();

    // Add/update phone in blacklist
    if (cleanPhone) {
      const existingPhoneIdx = fraudProfiles.findIndex(
        (fp) => fp.identifier_value.replace(/\D/g, "") === cleanPhone
      );
      if (existingPhoneIdx >= 0) {
        fraudProfiles[existingPhoneIdx].is_blacklisted = true;
        fraudProfiles[existingPhoneIdx].risk_score = 100;
        fraudProfiles[existingPhoneIdx].blacklist_reason = blockReason;
        fraudProfiles[existingPhoneIdx].updated_at = new Date().toISOString();
      } else {
        fraudProfiles.unshift({
          id: `fp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          identifier_type: "phone",
          identifier_value: cleanPhone,
          risk_score: 100,
          cancellation_count: 5,
          rejected_delivery_count: 3,
          return_abuse_count: 2,
          is_blacklisted: true,
          blacklist_reason: blockReason,
          notes: `Auto-added from Customer Directory (${profile.full_name || profile.email})`,
          updated_at: new Date().toISOString(),
        });
      }
    }

    // Add/update email in blacklist
    if (cleanEmail) {
      const existingEmailIdx = fraudProfiles.findIndex(
        (fp) => fp.identifier_value.trim().toLowerCase() === cleanEmail
      );
      if (existingEmailIdx >= 0) {
        fraudProfiles[existingEmailIdx].is_blacklisted = true;
        fraudProfiles[existingEmailIdx].risk_score = 100;
        fraudProfiles[existingEmailIdx].blacklist_reason = blockReason;
        fraudProfiles[existingEmailIdx].updated_at = new Date().toISOString();
      } else {
        fraudProfiles.unshift({
          id: `fp-${Date.now()}-${Math.floor(Math.random() * 1000) + 1}`,
          identifier_type: "email",
          identifier_value: cleanEmail,
          risk_score: 100,
          cancellation_count: 5,
          rejected_delivery_count: 3,
          return_abuse_count: 2,
          is_blacklisted: true,
          blacklist_reason: blockReason,
          notes: `Auto-added from Customer Directory (${profile.full_name || profile.phone})`,
          updated_at: new Date().toISOString(),
        });
      }
    }

    await saveStoredFraudProfiles(fraudProfiles);

    // 4. Also insert into customer_blacklist table if table exists
    try {
      if (cleanPhone) {
        await supabase.from("customer_blacklist").upsert(
          {
            phone: cleanPhone,
            reason: blockReason,
            created_at: new Date().toISOString(),
          },
          { onConflict: "phone" }
        );
      }
    } catch {}

    revalidatePath("/admin/customers");
    revalidatePath("/admin/orders/fraud");
    revalidatePath("/admin/orders");

    return {
      success: true,
      message: "Customer blocked and automatically added to Fraud Blacklist.",
    };
  } catch (err: any) {
    console.error("adminBlockCustomer exception:", err);
    return { success: false, error: err.message || "Failed to block customer." };
  }
}

/**
 * Admin action: Unblock customer and remove from Fraud Blacklist
 */
export async function adminUnblockCustomer(customerId: string) {
  if (!customerId) {
    return { success: false, error: "Customer ID is required." };
  }

  try {
    const supabase = createAdminClient();

    // 1. Get customer details
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, email, phone")
      .eq("id", customerId)
      .maybeSingle();

    if (!profile) {
      return { success: false, error: "Customer profile not found." };
    }

    // 2. Update profile status in profiles table
    try {
      await supabase
        .from("profiles")
        .update({
          is_blocked: false,
          status: "active",
          updated_at: new Date().toISOString(),
        })
        .eq("id", customerId);
    } catch (e) {
      console.warn("Could not update is_blocked/status on profiles table:", e);
    }

    // 3. Remove/unblock from Fraud Blacklist store
    const fraudProfiles = await getStoredFraudProfiles();
    const cleanPhone = (profile.phone || "").replace(/\D/g, "");
    const cleanEmail = (profile.email || "").trim().toLowerCase();

    for (const fp of fraudProfiles) {
      const matchPhone = cleanPhone && fp.identifier_value.replace(/\D/g, "") === cleanPhone;
      const matchEmail = cleanEmail && fp.identifier_value.trim().toLowerCase() === cleanEmail;
      if (matchPhone || matchEmail) {
        fp.is_blacklisted = false;
        fp.risk_score = 15;
      }
    }

    await saveStoredFraudProfiles(fraudProfiles);

    // 4. Remove from customer_blacklist table if table exists
    try {
      if (cleanPhone) {
        await supabase.from("customer_blacklist").delete().eq("phone", cleanPhone);
      }
    } catch {}

    revalidatePath("/admin/customers");
    revalidatePath("/admin/orders/fraud");
    revalidatePath("/admin/orders");

    return {
      success: true,
      message: "Customer unblocked and removed from Fraud Blacklist.",
    };
  } catch (err: any) {
    console.error("adminUnblockCustomer exception:", err);
    return { success: false, error: err.message || "Failed to unblock customer." };
  }
}
