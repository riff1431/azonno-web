"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string;
  status: string;
  lastLogin: string;
  createdAt: string;
}

const ROLE_PERMISSIONS: Record<string, string> = {
  admin: "Full Access (All Modules, Settings, Finance & Blacklist)",
  superadmin: "Full Access (All Modules, Settings, Finance & Blacklist)",
  moderator: "Catalog, Reviews, Customer Q&A, and Order Processing",
  catalog_manager: "Products, Categories, Brands, Inventory & Media Library",
  logistics_coordinator: "Orders, Shipping Booking (SteadFast / Pathao), SMS Dispatch",
  support: "Customer Accounts, Order Tracking & RMA Returns",
};

export async function getTeamUsers(): Promise<TeamMember[]> {
  const supabase = createAdminClient();

  // Fetch all profiles from Supabase
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, role, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error || !profiles || profiles.length === 0) {
    // Fallback default team
    return [
      {
        id: "u1",
        name: "Master Admin",
        email: "admin@blushbudget.com",
        role: "admin",
        permissions: ROLE_PERMISSIONS.admin,
        status: "Active",
        lastLogin: "Just now",
        createdAt: new Date().toISOString(),
      },
      {
        id: "u2",
        name: "Catalog Manager",
        email: "moderator@blushbudget.com",
        role: "moderator",
        permissions: ROLE_PERMISSIONS.moderator,
        status: "Active",
        lastLogin: "2 hours ago",
        createdAt: new Date().toISOString(),
      },
    ];
  }

  return profiles.map((p) => {
    const roleKey = (p.role || "staff").toLowerCase();
    const permissions =
      ROLE_PERMISSIONS[roleKey] ||
      (roleKey === "admin" ? ROLE_PERMISSIONS.admin : "Standard Storefront Access");

    return {
      id: p.id,
      name: p.full_name || p.email?.split("@")[0] || "Staff Member",
      email: p.email || "staff@blushbudget.com",
      role: p.role || "staff",
      permissions,
      status: "Active",
      lastLogin: p.updated_at ? new Date(p.updated_at).toLocaleDateString() : "Active",
      createdAt: p.created_at,
    };
  });
}

export async function updateStaffRole(userId: string, newRole: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase
      .from("profiles")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", userId);

    if (error) throw error;
    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function addStaffMember(data: {
  email: string;
  fullName: string;
  role: string;
  phone?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createAdminClient();

    // Check if user already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", data.email.trim())
      .single();

    if (existing) {
      // Just update role
      await supabase
        .from("profiles")
        .update({
          full_name: data.fullName.trim(),
          role: data.role,
          phone: data.phone || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      // Create user via admin auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email.trim(),
        email_confirm: true,
        user_metadata: {
          full_name: data.fullName.trim(),
        },
      });

      if (authError) {
        // If auth user already exists in auth.users, try upserting profile
        const { error: profError } = await supabase.from("profiles").upsert({
          email: data.email.trim(),
          full_name: data.fullName.trim(),
          role: data.role,
          phone: data.phone || null,
          updated_at: new Date().toISOString(),
        });
        if (profError) throw profError;
      } else if (authData.user) {
        await supabase.from("profiles").upsert({
          id: authData.user.id,
          email: data.email.trim(),
          full_name: data.fullName.trim(),
          role: data.role,
          phone: data.phone || null,
          updated_at: new Date().toISOString(),
        });
      }
    }

    revalidatePath("/admin/users");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
